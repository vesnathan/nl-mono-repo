#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Global variables
STAGE=""
WAF_REGION="us-east-1"
APP_REGION="ap-southeast-2"

# Function to print colored status messages
function log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get detailed stack failure information
function get_stack_failure_details() {
    local stack_name=$1
    local region=$2
    
    log_info "Getting detailed failure information for stack $stack_name in region $region"
    
    # Get the stack events with full details
    local events=$(aws cloudformation describe-stack-events \
        --stack-name "$stack_name" \
        --region "$region" \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`DELETE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason]' \
        --output text)
    
    if [ ! -z "$events" ]; then
        log_error "Stack failure details for $stack_name:"
        echo "$events" | while IFS=$'\t' read -r resource_id resource_type reason; do
            log_error "Resource: $resource_id ($resource_type)"
            log_error "Reason: $reason"
            
            # Print full error message for debugging
            if [[ "$reason" == *"S3 error"* ]]; then
                log_error "Full S3 Error Message: $reason"
                # Try to extract the bucket name using various patterns
                local bucket_name=$(echo "$reason" | grep -o 's3://[^/]\+' || \
                                  echo "$reason" | grep -o 'bucket [^:]\+' || \
                                  echo "$reason" | grep -o '[a-zA-Z0-9][a-zA-Z0-9.-]\+[a-zA-Z0-9]' || \
                                  echo "bucket name not found")
                log_error "Attempted to access bucket: $bucket_name"
            fi
        done
    fi
}

# Function to check if a command exists
function command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install AWS CLI
function install_aws_cli() {
    log_info "Installing AWS CLI..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip -q awscliv2.zip
        sudo ./aws/install
        rm -rf aws awscliv2.zip
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
        sudo installer -pkg AWSCLIV2.pkg -target /
        rm AWSCLIV2.pkg
    else
        log_error "Unsupported operating system"
        exit 1
    fi
}

# Function to configure AWS credentials
function configure_aws() {
    log_info "Please enter your AWS credentials"
    read -p "AWS Access Key ID: " aws_access_key_id
    read -sp "AWS Secret Access Key: " aws_secret_access_key
    echo
    
    # Configure default profile
    aws configure set aws_access_key_id "$aws_access_key_id"
    aws configure set aws_secret_access_key "$aws_secret_access_key"
    aws configure set region "$APP_REGION"
    aws configure set output "json"
    
    log_success "AWS credentials configured successfully"
}

# Function to set AWS region
function set_region() {
    local region=$1
    aws configure set region "$region"
}

# Function to create templates bucket and upload templates
create_templates_bucket() {
    local region=$1
    local bucket_name="nl-templates-${STAGE}-${region}"
    
    set_region "$region"
    
    # Create bucket if it doesn't exist
    if ! aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
        log_info "Creating templates bucket: $bucket_name"
        if [ "$region" = "us-east-1" ]; then
            aws s3api create-bucket --bucket "$bucket_name" \
                --acl private
        else
            aws s3api create-bucket --bucket "$bucket_name" \
                --create-bucket-configuration LocationConstraint="$region" \
                --acl private
        fi

        # Set bucket policy to allow CloudFormation access
        local account_id=$(aws sts get-caller-identity --query Account --output text)
        local policy=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFormationAccess",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "cloudformation.amazonaws.com"
                ]
            },
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${bucket_name}",
                "arn:aws:s3:::${bucket_name}/*"
            ]
        },
        {
            "Sid": "AllowCrossRegionAccess",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${bucket_name}",
                "arn:aws:s3:::${bucket_name}/*"
            ]
        },
        {
            "Sid": "AllowAccountAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::${account_id}:root"
            },
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::${bucket_name}",
                "arn:aws:s3:::${bucket_name}/*"
            ]
        }
    ]
}
EOF
)
        echo "$policy" > /tmp/bucket-policy.json
        aws s3api put-bucket-policy --bucket "$bucket_name" --policy file:///tmp/bucket-policy.json
        rm /tmp/bucket-policy.json
    fi

    # Upload templates
    log_info "Uploading nested stack templates to $bucket_name"
    
    # Upload shared resources templates
    aws s3 cp packages/shared-aws-assets/resources s3://${bucket_name}/resources --recursive --exclude "*" --include "*.yaml"
    
    # Upload CloudWatch Live templates
    aws s3 cp packages/cloudwatchlive/backend/resources s3://${bucket_name}/resources --recursive --exclude "*" --include "*.yaml"
    
    log_success "Templates bucket setup complete"
}

# Function to get stack failure reasons
get_stack_failure_reason() {
    local stack_name=$1
    local events=$(aws cloudformation describe-stack-events --stack-name "$stack_name" --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`DELETE_FAILED`].[LogicalResourceId,ResourceType,ResourceProperties,ResourceStatusReason]' --output json)
    if [ ! -z "$events" ]; then
        log_error "Stack failure details for $stack_name:"
        echo "$events" | jq -r '.[] | "Resource: \(.[0])\nType: \(.[1])\nProperties: \(.[2])\nReason: \(.[3])\n"' | while read -r line; do
            log_error "  $line"
        done
    fi
}

# Function to wait for stack status
wait_for_stack_status() {
    local stack_name=$1
    local desired_status=$2
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "STACK_NOT_FOUND")
        
        case $status in
            CREATE_COMPLETE|UPDATE_COMPLETE)
                log_success "Stack $stack_name is in $status state"
                return 0
                ;;
            *ROLLBACK_COMPLETE|*ROLLBACK_FAILED|*DELETE_FAILED)
                log_error "Stack $stack_name failed: $status"
                get_stack_failure_reason "$stack_name" "$region"
                return 1
                ;;
            *ROLLBACK_IN_PROGRESS|*DELETE_IN_PROGRESS|*UPDATE_IN_PROGRESS|*CREATE_IN_PROGRESS|*UPDATE_COMPLETE_CLEANUP_IN_PROGRESS)
                log_info "Stack $stack_name status: $status. Waiting..."
                ;;
            "$desired_status")
                log_success "Stack $stack_name reached desired status: $status"
                return 0
                ;;
            "STACK_NOT_FOUND")
                if [ "$desired_status" = "DELETE_COMPLETE" ]; then
                    log_success "Stack $stack_name does not exist"
                    return 0
                else
                    log_error "Stack $stack_name not found"
                    return 1
                fi
                ;;
        esac
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Timeout waiting for stack $stack_name to reach status $desired_status"
    return 1
}

# Function to deploy a CloudFormation stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local region=$3
    
    # Set the region for this deployment
    set_region "$region"
    log_info "Deploying to region: $region"
    
    # Set template bucket name based on region
    local bucket_name="nl-templates-${STAGE}-${region}"
    local s3_url="https://${bucket_name}.s3.${region}.amazonaws.com"
    
    # Prepare stack parameters based on stack name
    local params="ParameterKey=Stage,ParameterValue=${STAGE}"
    
    # Add stack-specific parameters
    case "$stack_name" in
        *waf*)
            # Add templates bucket parameter
            params="${params} ParameterKey=TemplatesBucketName,ParameterValue=${bucket_name}"
            ;;
        *shared*)
            # Add templates bucket parameter
            params="${params} ParameterKey=TemplatesBucketName,ParameterValue=${bucket_name}"
            ;;
        *cwl*)
            # Add templates bucket parameter
            params="${params} ParameterKey=TemplatesBucketName,ParameterValue=${bucket_name}"
            ;;
    esac

    # Log parameters being used
    log_info "Using parameters: ${params}"
    
    if aws cloudformation describe-stacks --stack-name "$stack_name" >/dev/null 2>&1; then
        log_info "Updating stack $stack_name..."
        if ! aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --capabilities CAPABILITY_NAMED_IAM \
            --parameters ${params} 2>&1 | grep -q 'No updates are to be performed'; then
            log_info "Stack $stack_name is being updated..."
        else
            log_success "Stack $stack_name is up to date, no changes needed"
            return 0
        fi
        wait_for_stack_status "$stack_name" "UPDATE_COMPLETE"
    else
        log_info "Creating stack $stack_name..."
        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --capabilities CAPABILITY_NAMED_IAM \
            --parameters ${params}
        wait_for_stack_status "$stack_name" "CREATE_COMPLETE"
    fi
}

# Function to select deployment stage
select_stage() {
    while true; do
        read -p "Select deployment stage (dev/staging/prod): " stage
        case $stage in
            dev|staging|prod)
                export STAGE=$stage
                export WAF_NAME="nl-waf-${STAGE}"
                export USER_POOL_NAME="nl-user-pool-${STAGE}"
                export DDB_PREFIX="nl-${STAGE}"
                export APP_NAME="nl-cwl-${STAGE}"
                log_success "Selected stage: $STAGE"
                return 0
                ;;
            *)
                log_error "Invalid stage. Please select dev, staging, or prod"
                ;;
        esac
    done
}

# Main deployment function
main() {
    # Check for AWS CLI
    if ! command_exists aws; then
        log_warning "AWS CLI not found. Installing..."
        install_aws_cli
    fi
    
    # Configure AWS credentials if not already configured
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        configure_aws
    fi

    # Select deployment stage and set environment variables
    select_stage
    
    # Create templates buckets in each region
    create_templates_bucket "$WAF_REGION"
    create_templates_bucket "$APP_REGION"
    
    # Deploy WAF stack in us-east-1
    log_info "Deploying WAF stack..."
    if ! deploy_stack "nl-waf-stack-${STAGE}" "packages/cwl-waf/cfn-template.yaml" "$WAF_REGION"; then
        log_error "WAF stack deployment failed"
        exit 1
    fi
    
    # Deploy Shared Resources stack in ap-southeast-2
    log_info "Deploying Shared Resources stack..."
    if ! deploy_stack "nl-shared-stack-${STAGE}" "packages/shared-aws-assets/cfn-template.yaml" "$APP_REGION"; then
        log_error "Shared Resources stack deployment failed"
        exit 1
    fi
    
    # Deploy CloudWatch Live stack in ap-southeast-2
    log_info "Deploying CloudWatch Live stack..."
    if ! deploy_stack "nl-cwl-stack-${STAGE}" "packages/cloudwatchlive/backend/cfn-template.yaml" "$APP_REGION"; then
        log_error "CloudWatch Live stack deployment failed"
        exit 1
    fi
    
    log_success "All stacks deployed successfully for stage: $STAGE!"
}

# Run the main function
main
