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
AUTO_DELETE_FAILED_STACKS=true  # Always auto-delete failed stacks

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
    log_info "For the Secret Access Key, you'll need to paste it. If you're having trouble pasting:"
    log_info "  - Try right-clicking and selecting paste"
    log_info "  - Or use Ctrl+Shift+V instead of Ctrl+V"
    
    # Use a loop to ensure we get valid input
    while true; do
        read -p "AWS Access Key ID: " aws_access_key_id
        if [ -n "$aws_access_key_id" ]; then
            break
        fi
        log_warning "Access Key ID cannot be empty. Please try again."
    done
    
    log_info "Now enter your AWS Secret Access Key (paste with right-click or Ctrl+Shift+V):"
    while true; do
        read -sp "AWS Secret Access Key: " aws_secret_access_key
        echo
        if [ -n "$aws_secret_access_key" ]; then
            break
        fi
        log_warning "Secret Access Key cannot be empty. Please try again."
    done
    
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

# Function to check if a file exists in S3 bucket
s3_file_exists() {
    local bucket=$1
    local key=$2
    aws s3api head-object --bucket "$bucket" --key "$key" >/dev/null 2>&1
}

# Function to create templates bucket and upload templates only if not present
create_templates_bucket() {
    local bucket_name=$1
    local region=$2
    local stack_type=$3  # waf, shared, or cwl
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
        # Skipping bucket policy step due to BlockPublicPolicy restriction
        log_warning "Skipping put-bucket-policy for $bucket_name due to account BlockPublicPolicy restriction."
    fi
    log_info "Uploading nested stack templates to $bucket_name for $stack_type stack"
    
    # Upload files based on stack type
    case "$stack_type" in
        waf)
            find packages/cwl-waf/resources/ -type f -name '*.yaml' 2>/dev/null | while read -r file; do
                key="resources/${file#packages/cwl-waf/resources/}"
                # Always upload to ensure the latest version
                aws s3 cp "$file" "s3://$bucket_name/$key"
            done
            ;;
        shared)
            find packages/shared-aws-assets/resources/ -type f -name '*.yaml' | while read -r file; do
                key="resources/${file#packages/shared-aws-assets/resources/}"
                # Always upload to ensure the latest version
                aws s3 cp "$file" "s3://$bucket_name/$key"
            done
            ;;
        cwl)
            find packages/cloudwatchlive/backend/resources/ -type f -name '*.yaml' | while read -r file; do
                key="resources/${file#packages/cloudwatchlive/backend/resources/}"
                # Always upload to ensure the latest version
                aws s3 cp "$file" "s3://$bucket_name/$key"
            done
            ;;
        *)
            log_error "Unknown stack type: $stack_type"
            ;;
    esac
    log_success "Templates bucket setup complete for $stack_type stack"
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
    local region=$3
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
                # Get detailed stack events including template URLs
                aws cloudformation describe-stack-events \
                    --stack-name "$stack_name" \
                    --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceType,ResourceStatusReason,ResourceProperties]' \
                    --output json | jq -r '.[] | "Resource: \(.[0])\nType: \(.[1])\nError: \(.[2])\n---"'
                # Print the bucket name that should be present and check if it exists
                if [ -z "$region" ]; then
                    log_error "[ERROR] Region variable is empty when checking for template bucket. Skipping bucket check/creation to avoid mistakes."
                    log_error "[ERROR] This usually means the region was not passed to wait_for_stack_status. Please check all calls to this function."
                    log_error "[ERROR] stack_name: $stack_name, desired_status: $desired_status, region: '$region'"
                else
                    # Use the same bucket naming logic as in deploy_stack
                    local expected_bucket
                    case "$stack_name" in
                        *waf*)
                            expected_bucket="nlmonorepo-waf-templates-${STAGE}"
                            ;;
                        *shared*)
                            expected_bucket="nlmonorepo-shared-templates-${STAGE}"
                            ;;
                        *cwl*)
                            expected_bucket="nlmonorepo-cwl-templates-${STAGE}"
                            ;;
                        *)
                            expected_bucket="nlmonorepo-generic-templates-${STAGE}"
                            ;;
                    esac
                    # Determine stack type from stack name
                    local stack_type="generic"
                    case "$stack_name" in
                        *waf*)
                            stack_type="waf"
                            ;;
                        *shared*)
                            stack_type="shared"
                            ;;
                        *cwl*)
                            stack_type="cwl"
                            ;;
                    esac
                    
                    log_info "[DEBUG] Checking for expected bucket: $expected_bucket (region: $region)"
                    if aws s3api head-bucket --bucket "$expected_bucket" 2>/dev/null; then
                        log_info "[INFO] Expected template bucket exists: $expected_bucket"
                    else
                        log_error "[ERROR] Expected template bucket NOT FOUND: $expected_bucket. Attempting to create and upload templates."
                        create_templates_bucket "$expected_bucket" "$region" "$stack_type"
                    fi
                fi
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

# Function to check if a stack is in a failed state and delete it if necessary
check_and_delete_failed_stack() {
    local stack_name=$1
    local region=$2
    set_region "$region"
    
    # Check if stack exists and get its status
    local stack_status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "STACK_NOT_FOUND")
    
    # List of stack states that require deletion before redeployment
    local failed_states=("ROLLBACK_COMPLETE" "UPDATE_ROLLBACK_COMPLETE" "DELETE_FAILED" "UPDATE_ROLLBACK_FAILED")
    
    # Check if stack is in a failed state
    local is_failed_state=false
    for state in "${failed_states[@]}"; do
        if [[ "$stack_status" == "$state" ]]; then
            is_failed_state=true
            break
        fi
    done
    
    if [[ "$is_failed_state" == true ]]; then
        log_warning "Stack $stack_name is in $stack_status state. Deleting it before redeployment."
        
        # Log the failed resources to help with debugging
        log_info "Getting detailed information about the failed stack..."
        get_stack_failure_details "$stack_name" "$region"
        
        # Delete the stack without confirmation (auto-delete is now default behavior)
        log_info "Deleting stack $stack_name..."
        
        # Delete the stack with --force flag if necessary
        if [[ "$stack_status" == "DELETE_FAILED" ]]; then
            log_warning "Using force-delete because stack is in DELETE_FAILED state"
            aws cloudformation delete-stack --stack-name "$stack_name" --retain-resources $(aws cloudformation list-stack-resources --stack-name "$stack_name" --query "StackResourceSummaries[?ResourceStatus=='DELETE_FAILED'].LogicalResourceId" --output text)
        else
            aws cloudformation delete-stack --stack-name "$stack_name"
        fi
        
        # Wait for deletion to complete
        if ! wait_for_stack_status "$stack_name" "DELETE_COMPLETE" "$region"; then
            log_error "Failed to delete stack $stack_name"
            log_warning "Attempting force delete of remaining resources..."
            # Get resources that might be stuck
            local stuck_resources=$(aws cloudformation list-stack-resources --stack-name "$stack_name" --query "StackResourceSummaries[?ResourceStatus=='DELETE_FAILED'].LogicalResourceId" --output text)
            if [ -n "$stuck_resources" ]; then
                log_warning "Found stuck resources: $stuck_resources"
                aws cloudformation delete-stack --stack-name "$stack_name" --retain-resources $stuck_resources
                wait_for_stack_status "$stack_name" "DELETE_COMPLETE" "$region"
            fi
            return 1
        fi
        
        log_success "Stack $stack_name successfully deleted and is ready for redeployment"
        return 0
    elif [[ "$stack_status" == "STACK_NOT_FOUND" ]]; then
        log_info "Stack $stack_name does not exist yet. Ready for fresh deployment."
        return 0
    else
        log_info "Stack $stack_name exists with status: $stack_status"
        return 0
    fi
}

# Function to clean up resources after a failed deployment
cleanup_after_failure() {
    local stack_name=$1
    local region=$2
    set_region "$region"
    
    log_warning "Deployment failed for stack: $stack_name. Performing cleanup..."
    
    # Check for any orphaned resources that might be left from the failed deployment
    local resource_types=("AWS::S3::Bucket" "AWS::KMS::Key" "AWS::DynamoDB::Table" "AWS::Cognito::UserPool")
    
    for resource_type in "${resource_types[@]}"; do
        log_info "Checking for orphaned resources of type: $resource_type"
        
        case "$resource_type" in
            "AWS::S3::Bucket")
                # List buckets with a name that matches our deployment pattern
                local orphaned_buckets=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, 'nlmonorepo-') && contains(Name, '-${STAGE}')].Name" --output text)
                if [ -n "$orphaned_buckets" ]; then
                    log_warning "Found potentially orphaned S3 buckets: $orphaned_buckets"
                    log_info "S3 buckets are retained for safety. You may need to manually delete them if they're not needed."
                fi
                ;;
            "AWS::KMS::Key")
                # We don't automatically clean up KMS keys due to their sensitive nature
                log_info "KMS Keys are retained for safety. You may need to manually disable and schedule them for deletion if needed."
                ;;
            "AWS::DynamoDB::Table")
                # List tables with a name that matches our deployment pattern
                local orphaned_tables=$(aws dynamodb list-tables --query "TableNames[?starts_with(@, 'nlmonorepo-') && contains(@, '-${STAGE}')]" --output text)
                if [ -n "$orphaned_tables" ]; then
                    log_warning "Found potentially orphaned DynamoDB tables: $orphaned_tables"
                    log_info "DynamoDB tables are retained for safety. You may need to manually delete them if they're not needed."
                fi
                ;;
            "AWS::Cognito::UserPool")
                # List user pools with a name that matches our deployment pattern
                local orphaned_pools=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?contains(Name, 'nl-') && contains(Name, '-${STAGE}')].Name" --output text)
                if [ -n "$orphaned_pools" ]; then
                    log_warning "Found potentially orphaned Cognito user pools: $orphaned_pools"
                    log_info "Cognito user pools are retained for safety. You may need to manually delete them if they're not needed."
                fi
                ;;
        esac
    done
    
    log_warning "Manual cleanup may be required for some resources. Check the AWS Console for details."
    
    return 0
}

# Function to force delete a stack that is stuck
force_delete_stack() {
    local stack_name=$1
    local region=$2
    set_region "$region"
    
    log_warning "Attempting to force delete stack: $stack_name in region: $region"
    
    # First check if the stack exists
    if ! aws cloudformation describe-stacks --stack-name "$stack_name" >/dev/null 2>&1; then
        log_info "Stack $stack_name does not exist. No deletion needed."
        return 0
    fi
    
    # Get the list of resources that are in DELETE_FAILED state
    local stuck_resources=$(aws cloudformation list-stack-resources --stack-name "$stack_name" --query "StackResourceSummaries[?ResourceStatus=='DELETE_FAILED'].LogicalResourceId" --output text)
    
    if [ -n "$stuck_resources" ]; then
        log_warning "Found resources in DELETE_FAILED state: $stuck_resources"
        log_info "Attempting to delete stack with --retain-resources option"
        
        aws cloudformation delete-stack --stack-name "$stack_name" --retain-resources $stuck_resources
        
        if wait_for_stack_status "$stack_name" "DELETE_COMPLETE" "$region"; then
            log_success "Successfully deleted stack $stack_name (retained problematic resources)"
            log_warning "The following resources were retained and may need manual cleanup: $stuck_resources"
            return 0
        else
            log_error "Stack deletion still failed even with --retain-resources option"
            return 1
        fi
    else
        log_info "No resources in DELETE_FAILED state found. Attempting normal deletion."
        
        aws cloudformation delete-stack --stack-name "$stack_name"
        
        if wait_for_stack_status "$stack_name" "DELETE_COMPLETE" "$region"; then
            log_success "Successfully deleted stack $stack_name"
            return 0
        else
            log_error "Stack deletion failed"
            return 1
        fi
    fi
}

# Function to validate a CloudFormation template before deployment
validate_template() {
    local template_file=$1
    log_info "Validating template: $template_file"
    
    # Validate template with AWS CloudFormation
    if ! aws cloudformation validate-template --template-body "file://$template_file" >/dev/null 2>&1; then
        log_error "Template validation failed for: $template_file"
        log_error "Error details:"
        aws cloudformation validate-template --template-body "file://$template_file" 2>&1 || true
        return 1
    else
        log_success "Template validation succeeded for: $template_file"
        return 0
    fi
}

# Function to verify S3 template content
verify_s3_templates() {
    local bucket_name=$1
    local region=$2
    set_region "$region"
    
    log_info "Verifying template files in S3 bucket: $bucket_name"
    
    # Define the list of template paths to check
    local template_paths=(
        "resources/S3/s3.yaml"
        "resources/KMS/KMS.yaml"
        "resources/DynamoDb/dynamoDb.yaml"
        "resources/Cognito/cognito.yaml"
        "resources/VPC/VPC.yaml"
    )
    
    for template_path in "${template_paths[@]}"; do
        if aws s3api head-object --bucket "$bucket_name" --key "$template_path" >/dev/null 2>&1; then
            log_info "Template exists in S3: $template_path"
            
            # Download the template to a temporary file
            local temp_file="/tmp/$(basename "$template_path")"
            aws s3 cp "s3://$bucket_name/$template_path" "$temp_file"
            
            # Validate the template
            if aws cloudformation validate-template --template-body "file://$temp_file" >/dev/null 2>&1; then
                log_success "Template validation succeeded for: $template_path"
            else
                log_error "Template validation failed for: $template_path"
                log_error "Error details:"
                aws cloudformation validate-template --template-body "file://$temp_file" 2>&1 || true
                
                # Upload a fixed version if the local version is valid
                local local_template="/workspaces/nl-mono-repo/packages/shared-aws-assets/resources/$(echo "$template_path" | cut -d'/' -f2-)"
                if [ -f "$local_template" ]; then
                    if aws cloudformation validate-template --template-body "file://$local_template" >/dev/null 2>&1; then
                        log_info "Local template is valid. Uploading to S3 to fix the issue."
                        aws s3 cp "$local_template" "s3://$bucket_name/$template_path"
                        log_success "Uploaded fixed template: $template_path"
                    else
                        log_error "Both S3 and local templates are invalid for: $template_path"
                    fi
                else
                    log_error "Local template not found: $local_template"
                fi
            fi
            
            # Clean up temporary file
            rm -f "$temp_file"
        else
            log_warning "Template does not exist in S3: $template_path"
        fi
    done
}

# Function to deploy a CloudFormation stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local region=$3
    set_region "$region"
    log_info "Deploying to region: $region"
    
    # Check if stack is in ROLLBACK_COMPLETE state and delete it if needed
    if ! check_and_delete_failed_stack "$stack_name" "$region"; then
        log_error "Failed to prepare stack $stack_name for deployment"
        return 1
    fi
    
    # Set template bucket name based on stack type (no region)
    local bucket_name
    case "$stack_name" in
        *waf*)
            bucket_name="nlmonorepo-waf-templates-${STAGE}"
            ;;
        *shared*)
            bucket_name="nlmonorepo-shared-templates-${STAGE}"
            ;;
        *cwl*)
            bucket_name="nlmonorepo-cwl-templates-${STAGE}"
            ;;
        *)
            bucket_name="nlmonorepo-generic-templates-${STAGE}"
            ;;
    esac
    local s3_url="https://${bucket_name}.s3.amazonaws.com"
    local params="ParameterKey=Stage,ParameterValue=${STAGE}"
    # Only add TemplatesBucketName for shared/cwl stacks
    case "$stack_name" in
        *shared*)
            params="${params} ParameterKey=TemplatesBucketName,ParameterValue=${bucket_name}"
            ;;
        *cwl*)
            params="${params} ParameterKey=TemplatesBucketName,ParameterValue=${bucket_name}"
            # Fetch KMSKeyId from shared stack output
            local kms_key_id
            kms_key_id=$(aws cloudformation describe-stacks --stack-name "nlmonorepo-shared-${STAGE}" --query "Stacks[0].Outputs[?OutputKey=='cwlKMSKey'].OutputValue" --output text)
            if [ -n "$kms_key_id" ]; then
                params="${params} ParameterKey=KMSKeyId,ParameterValue=${kms_key_id}"
            else
                log_error "Could not fetch KMSKeyId from shared stack outputs."
                exit 1
            fi
            
            # Also fetch and pass the KMS Key ARN
            local kms_key_arn
            kms_key_arn=$(aws cloudformation describe-stacks --stack-name "nlmonorepo-shared-${STAGE}" --query "Stacks[0].Outputs[?OutputKey=='cwlKMSKeyArn'].OutputValue" --output text)
            if [ -n "$kms_key_arn" ]; then
                params="${params} ParameterKey=KMSKeyArn,ParameterValue=${kms_key_arn}"
            else
                log_error "Could not fetch KMSKeyArn from shared stack outputs."
                exit 1
            fi
            ;;
    esac
    log_info "Using parameters: ${params}"
    
    # Validate the template before deployment
    if ! validate_template "$template_file"; then
        log_error "Template validation failed for: $template_file. Aborting deployment."
        return 1
    fi
    
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
        if ! wait_for_stack_status "$stack_name" "UPDATE_COMPLETE" "$region"; then
            log_error "Failed to update stack $stack_name"
            log_warning "Attempting to force delete the failed stack..."
            check_and_delete_failed_stack "$stack_name" "$region"
            cleanup_after_failure "$stack_name" "$region"
            return 1
        fi
    else
        log_info "Creating stack $stack_name..."
        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --capabilities CAPABILITY_NAMED_IAM \
            --parameters ${params}
        # Wait for stack creation to complete
        if ! wait_for_stack_status "$stack_name" "CREATE_COMPLETE" "$region"; then
            log_error "Failed to create stack $stack_name"
            log_warning "Attempting to force delete the failed stack..."
            check_and_delete_failed_stack "$stack_name" "$region"
            cleanup_after_failure "$stack_name" "$region"
            return 1
        fi
    fi
}

# Function to select deployment stage (default to dev)
select_stage() {
    local stage
    
    # Set up a timeout to automatically select dev after 5 seconds
    echo "Select deployment stage (dev/staging/prod) [dev] (Defaults to dev in 5 seconds)"
    read -t 5 stage || true
    
    # If input is empty (due to timeout or just pressing Enter), default to dev
    if [ -z "$stage" ]; then
        echo "Defaulting to dev environment"
        stage="dev"
    fi

    case $stage in
        dev|staging|prod)
            export STAGE=$stage
            export WAF_NAME="nlmonorepo-waf-${STAGE}"
            export USER_POOL_NAME="nlmonorepo-userpool-${STAGE}"
            export DDB_PREFIX="nlmonorepo-${STAGE}"
            export APP_NAME="nlmonorepo-cwl-${STAGE}"
            log_success "Selected stage: $STAGE"
            ;;
        *)
            log_error "Invalid stage. Defaulting to dev."
            export STAGE=dev
            ;;
    esac
}

# Function to check CloudFormation templates for common issues
check_templates() {
    log_info "Checking CloudFormation templates for common issues..."
    
    # Check all template files
    local template_files=(
        "/workspaces/nl-mono-repo/packages/shared-aws-assets/resources/S3/s3.yaml"
        "/workspaces/nl-mono-repo/packages/shared-aws-assets/resources/KMS/KMS.yaml"
        "/workspaces/nl-mono-repo/packages/shared-aws-assets/resources/DynamoDb/dynamoDb.yaml"
        "/workspaces/nl-mono-repo/packages/shared-aws-assets/resources/Cognito/cognito.yaml"
    )
    
    for template in "${template_files[@]}"; do
        if [ -f "$template" ]; then
            log_info "Checking template: $template"
            
            # Create a backup of the original file
            cp "$template" "${template}.bak"
            
            # Fix empty Outputs sections
            if grep -q "Outputs: *{}" "$template"; then
                log_warning "Found empty Outputs section in template: $template"
                log_warning "CloudFormation does not allow null values in templates."
                
                # Generate a resource-specific output based on the template name
                local resource_name=$(basename "$template" .yaml)
                sed -i "s/Outputs: *{}/Outputs:\\n  ${resource_name}Deployed:\\n    Description: \"Indicates that the ${resource_name} resources were deployed\"\\n    Value: true/" "$template"
                
                log_success "Fixed template: $template by adding a valid output."
            fi
            
            # Fix incorrect YAML indentation (common issue)
            if grep -q "^ \{1,3\}[a-zA-Z]" "$template"; then
                log_warning "Found potential YAML indentation issues in template: $template"
                log_warning "Attempting to fix by standardizing indentation..."
                
                # This is a simple fix - for complex indentation issues, manual inspection may be needed
                sed -i 's/^ /  /g' "$template"
                
                log_success "Attempted to fix indentation issues in: $template"
            fi
        fi
    done
    
    return 0
}

# Function to display help
show_help() {
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  deploy         Deploy the complete CloudWatch Live infrastructure (default)"
    echo "  create-user    Create an admin user in an existing deployment"
    echo "  help           Show this help message"
    echo ""
    echo "This script deploys the complete CloudWatch Live infrastructure."
    echo "It will create WAF, shared resources, and CloudWatch Live stacks"
    echo "and set up an admin user in Cognito and DynamoDB."
    echo ""
    echo "Environment Variables:"
    echo "  ADMIN_EMAIL                  Admin user email (optional, will prompt if not set)"
    echo ""
    echo "Note: Failed stacks in ROLLBACK_COMPLETE state will be automatically deleted and redeployed."
    echo ""
}

# Function to check and create Cognito user pool groups
ensure_cognito_user_groups() {
    local user_pool_id=$1
    local stage=$2
    
    log_info "Checking Cognito user groups in user pool: $user_pool_id"
    
    # List of groups that should exist
    local required_groups=("SuperAdmin" "Admin" "User")
    
    # Get existing groups
    local existing_groups=$(aws cognito-idp list-groups --user-pool-id "$user_pool_id" --query "Groups[].GroupName" --output json)
    
    for group in "${required_groups[@]}"; do
        if ! echo "$existing_groups" | grep -q "\"$group\""; then
            log_warning "Group '$group' does not exist in user pool. Creating it now..."
            
            # Create the group
            aws cognito-idp create-group \
                --user-pool-id "$user_pool_id" \
                --group-name "$group" \
                --description "Auto-created $group group for nlmonorepo-${stage}"
                
            if [ $? -eq 0 ]; then
                log_success "Created group: $group"
            else
                log_error "Failed to create group: $group"
            fi
        else
            log_info "Group '$group' already exists in user pool"
        fi
    done
}

# Function to create an admin user in Cognito and DynamoDB
create_admin_user() {
    local stage=$1
    local region="ap-southeast-2"
    # Use the fixed timestamp from the required schema instead of current time
    local current_timestamp="1733530302"
    local admin_email=${ADMIN_EMAIL:-""}
    
    log_info "Setting up admin user for stage: $stage"
    set_region "$region"
    
    # Get the user pool ID from CloudFormation output
    local user_pool_id
    user_pool_id=$(aws cloudformation describe-stacks --stack-name "nlmonorepo-shared-${stage}" --query "Stacks[0].Outputs[?OutputKey=='cwlUserPoolId'].OutputValue" --output text)
    
    if [ -z "$user_pool_id" ]; then
        log_error "Could not find Cognito User Pool ID from stack output"
        log_error "Expected output key: cwlUserPoolId"
        
        # Try to find the user pool directly
        log_info "Attempting to find user pool by name: nlmonorepo-shared-cwluserpool-${stage}"
        user_pool_id=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='nlmonorepo-shared-cwluserpool-${stage}'].Id" --output text)
        
        if [ -z "$user_pool_id" ]; then
            log_error "Could not find Cognito User Pool by name either"
            return 1
        else
            log_success "Found user pool by name: $user_pool_id"
        fi
    else
        log_info "Found Cognito User Pool ID from stack output: $user_pool_id"
    fi
    
    # Check and create required user groups
    ensure_cognito_user_groups "$user_pool_id" "$stage"
    
    # Determine which table to use
    local table_name="nlmonorepo-shared-usertable-${stage}"
    
    # Verify that the table exists
    if ! aws dynamodb describe-table --table-name "$table_name" >/dev/null 2>&1; then
        log_error "DynamoDB table $table_name does not exist. Cannot proceed with user creation."
        return 1
    else
        log_success "Found DynamoDB table: $table_name"
    fi
    
    # Use email from environment variable or ask for it
    local user_email=$admin_email
    if [ -z "$user_email" ]; then
        echo ""
        log_info "Please enter the email address for the admin user:"
        read -p "Email: " user_email
    fi
    
    if [ -z "$user_email" ]; then
        log_error "Email cannot be empty"
        return 1
    fi
    
    # Check if user already exists in Cognito
    local cognito_user_sub=""
    if aws cognito-idp admin-get-user --user-pool-id "$user_pool_id" --username "$user_email" >/dev/null 2>&1; then
        log_info "User already exists in Cognito. Getting user ID..."
        cognito_user_sub=$(aws cognito-idp admin-get-user --user-pool-id "$user_pool_id" --username "$user_email" --query "Username" --output text)
        log_info "Found existing user with ID: $cognito_user_sub"
    else
        # Use a fixed temporary password
        local temp_password="Temp1234!"
        
        # Create user in Cognito
        log_info "Creating user in Cognito User Pool..."
        cognito_user_sub=$(aws cognito-idp admin-create-user \
            --user-pool-id "$user_pool_id" \
            --username "$user_email" \
            --temporary-password "$temp_password" \
            --user-attributes Name=email,Value="$user_email" Name=email_verified,Value=true \
            --message-action SUPPRESS \
            --query "User.Username" \
            --output text)
        
        if [ -z "$cognito_user_sub" ]; then
            log_error "Failed to create user in Cognito"
            return 1
        fi
        
        log_success "Created user in Cognito with ID: $cognito_user_sub"
        
        # Set permanent password
        log_info "Setting permanent password..."
        aws cognito-idp admin-set-user-password \
            --user-pool-id "$user_pool_id" \
            --username "$user_email" \
            --password "$temp_password" \
            --permanent
        
        log_success "Set permanent password for user"
        
        # Add user to groups
        log_info "Adding user to SuperAdmin group..."
        aws cognito-idp admin-add-user-to-group \
            --user-pool-id "$user_pool_id" \
            --username "$user_email" \
            --group-name "SuperAdmin"
        
        log_success "Added user to SuperAdmin group"
        
        # Display user information
        echo ""
        log_info "User created successfully!"
        log_info "Username: $user_email"
        log_info "Password: $temp_password (predefined temporary password)"
        log_warning "Please change this password after first login for security reasons."
        echo ""
    fi
    
    # Ensure user exists in both shared and CWL tables
    ensure_user_in_both_tables "$cognito_user_sub" "$user_email" "$current_timestamp" "$stage"
    
    # Validate user creation
    validate_user_creation "$cognito_user_sub" "$stage"
    
    return 0
}

# Updated function to ensure user exists only in the shared usertable
ensure_user_in_both_tables() {
    local cognito_user_sub=$1
    local user_email=$2
    local current_timestamp=$3
    local stage=$4
    
    # Only use the shared usertable
    local table_name="nlmonorepo-shared-usertable-${stage}"
    
    # Create user in the shared table
    ensure_user_in_table "$cognito_user_sub" "$user_email" "$current_timestamp" "$table_name"
}

# Function to validate user creation in the shared table
validate_user_creation() {
    local cognito_user_sub=$1
    local stage=$2
    local user_pool_id
    
    # Get the user pool ID from CloudFormation output or by name
    user_pool_id=$(aws cloudformation describe-stacks --stack-name "nlmonorepo-shared-${stage}" --query "Stacks[0].Outputs[?OutputKey=='cwlUserPoolId'].OutputValue" --output text)
    if [ -z "$user_pool_id" ]; then
        user_pool_id=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='nlmonorepo-shared-cwluserpool-${stage}'].Id" --output text)
        if [ -z "$user_pool_id" ]; then
            log_error "Could not find Cognito User Pool ID for validation"
            return 1
        fi
    fi
    
    local table_name="nlmonorepo-shared-usertable-${stage}"
    
    # Check if table exists
    if ! aws dynamodb describe-table --table-name "$table_name" >/dev/null 2>&1; then
        log_warning "Table $table_name does not exist, validation failed"
        return 1
    fi
    
    # Check if user exists in this table
    local user_data
    user_data=$(aws dynamodb get-item --table-name "$table_name" --key "{\"userId\":{\"S\":\"$cognito_user_sub\"}}" --query "Item" --output json 2>/dev/null)
    
    if [ "$user_data" = "null" ] || [ -z "$user_data" ]; then
        log_error "User NOT found in table $table_name! Attempting to create again..."
        
        # Get user email from Cognito
        local user_email
        user_email=$(aws cognito-idp admin-get-user --user-pool-id "$user_pool_id" --username "$cognito_user_sub" --query "UserAttributes[?Name=='email'].Value" --output text)            # Re-try user creation for this table specifically
        if [ -n "$user_email" ]; then
            # Use the fixed timestamp from the required schema
            local current_timestamp="1733530302"
            ensure_user_in_table "$cognito_user_sub" "$user_email" "$current_timestamp" "$table_name"
            
            # Verify it worked
            user_data=$(aws dynamodb get-item --table-name "$table_name" --key "{\"userId\":{\"S\":\"$cognito_user_sub\"}}" --query "Item" --output json 2>/dev/null)
            
            if [ -n "$user_data" ]; then
                log_success "Successfully created user in table $table_name on second attempt"
                return 0
            else
                log_error "Failed to create user in table $table_name on second attempt"
                return 1
            fi
        else
            log_error "Could not get user email from Cognito"
            return 1
        fi
    else
        log_success "User validated successfully in table $table_name"
        return 0
    fi
}

# Function to repair userGroups field for a user in a specific table
repair_user_groups() {
    local cognito_user_sub=$1
    local table_name=$2
    
    log_info "Repairing userGroups field for user $cognito_user_sub in table $table_name"
    
    # Update the item in DynamoDB
    aws dynamodb update-item \
        --table-name "$table_name" \
        --key "{\"userId\":{\"S\":\"$cognito_user_sub\"}}" \
        --update-expression "SET userGroups = :g" \
        --expression-attribute-values "{\":g\": {\"L\": [{\"S\": \"SuperAdmin\"}, {\"SS\": [\"SuperAdmin\"]}]}}" \
        --return-values ALL_NEW
    
    if [ $? -eq 0 ]; then
        log_success "Successfully repaired userGroups field in table $table_name"
        return 0
    else
        log_error "Failed to repair userGroups field in table $table_name"
        return 1
    fi
}

# Function to ensure a user exists in a specific table
ensure_user_in_table() {
    local cognito_user_sub=$1
    local user_email=$2
    local current_timestamp=$3
    local table_name=$4
    
    # Check if table exists
    if ! aws dynamodb describe-table --table-name "$table_name" >/dev/null 2>&1; then
        log_warning "Table $table_name does not exist, skipping"
        return 1
    fi
    
    # Check if user exists in this table
    local user_exists
    user_exists=$(aws dynamodb get-item --table-name "$table_name" --key "{\"userId\":{\"S\":\"$cognito_user_sub\"}}" --query "Item" --output json 2>/dev/null)
    
    if [ "$user_exists" != "null" ] && [ -n "$user_exists" ]; then
        log_info "User already exists in table $table_name"
        return 0
    else
        # Create item in DynamoDB
        log_info "Creating user entry in DynamoDB table $table_name..."
        
        # Prepare the DynamoDB item based on the provided template
        local ddb_item=$(cat <<EOF
{
  "userId": {
    "S": "$cognito_user_sub"
  },
  "organizationId": {
    "S": ""
  },
  "privacyPolicy": {
    "BOOL": true
  },
  "termsAndConditions": {
    "BOOL": true
  },
  "userAddedById": {
    "S": ""
  },
  "userCreated": {
    "S": "$current_timestamp"
  },
  "userEmail": {
    "S": "$user_email"
  },
  "userFirstName": {
    "S": "John"
  },
  "userGroups": {
    "L": [
      {
        "S": "SuperAdmin"
      },
      {
        "SS": [
          "SuperAdmin"
        ]
      }
    ]
  },
  "userLastName": {
    "S": "Doe"
  },
  "userPhone": {
    "S": "0421 569 854"
  },
  "userProfilePicture": {
    "M": {
      "Bucket": {
        "S": ""
      },
      "Key": {
        "S": ""
      }
    }
  },
  "userTitle": {
    "S": "Mr"
  }
}
EOF
)
        
        # Put item in DynamoDB
        aws dynamodb put-item \
            --table-name "$table_name" \
            --item "$ddb_item"
        
        if [ $? -eq 0 ]; then
            log_success "Created user entry in DynamoDB table $table_name"
            return 0
        else
            log_error "Failed to create user entry in DynamoDB table $table_name"
            log_error "Attempted to create item with schema:"
            echo "$ddb_item" | jq '.'
            return 1
        fi
    fi
}

# Standalone function to create admin user without deploying infrastructure
create_admin_user_standalone() {
    log_info "Starting admin user creation for existing deployment"
    
    # Select deployment stage and set environment variables
    select_stage
    
    # Ask for admin email if not already provided
    if [ -z "$ADMIN_EMAIL" ]; then
        echo ""
        log_info "Please enter the email address for the admin user:"
        read -p "Email: " ADMIN_EMAIL
        
        if [ -z "$ADMIN_EMAIL" ]; then
            log_error "No admin email provided. Cannot create user."
            exit 1
        fi
    fi
    
    log_info "Creating admin user with email: $ADMIN_EMAIL for stage: $STAGE"
    
    # Call the admin user creation function
    if ! create_admin_user "$STAGE"; then
        log_error "Admin user creation failed."
        exit 1
    fi
    
    log_success "Admin user creation completed successfully!"
}

# Main deployment function
main() {
    # Handle command-line arguments
    local command=${1:-"deploy"}
    
    case "$command" in
        deploy)
            # Continue with full deployment
            ;;
        create-user)
            create_admin_user_standalone
            exit 0
            ;;
        help)
            show_help
            exit 0
            ;;
        *)
            if [ "$command" != "deploy" ]; then
                log_error "Unknown command: $command"
                show_help
                exit 1
            fi
            ;;
    esac
    
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
    
    # Ask for admin email if not already provided
    if [ -z "$ADMIN_EMAIL" ]; then
        echo ""
        log_info "Please enter the email address for the initial admin user:"
        read -p "Email: " ADMIN_EMAIL
        
        if [ -z "$ADMIN_EMAIL" ]; then
            log_warning "No admin email provided. You will be prompted again after deployment."
        else
            log_info "Admin user will be created with email: $ADMIN_EMAIL"
        fi
    fi
    
    # Display pre-deployment summary
    echo ""
    log_info "========== DEPLOYMENT SUMMARY =========="
    log_info "Stage: $STAGE"
    log_info "WAF Region: $WAF_REGION"
    log_info "App Region: $APP_REGION"
    if [ -n "$ADMIN_EMAIL" ]; then
        log_info "Admin Email: $ADMIN_EMAIL"
    else
        log_info "Admin Email: Will prompt during deployment"
    fi
    log_info "========================================"
    echo ""
    
    # Ask for confirmation
    read -p "Proceed with deployment? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Create templates buckets for each stack type (no region in name)
    create_templates_bucket "nlmonorepo-waf-templates-${STAGE}" "$WAF_REGION" "waf"
    create_templates_bucket "nlmonorepo-shared-templates-${STAGE}" "$APP_REGION" "shared"
    create_templates_bucket "nlmonorepo-cwl-templates-${STAGE}" "$APP_REGION" "cwl"
    
    # Deploy WAF in us-east-1
    log_info "Deploying WAF..."
    if ! deploy_stack "nlmonorepo-waf-${STAGE}" "packages/cwl-waf/cfn-template.yaml" "$WAF_REGION"; then
        log_error "WAF deployment failed"
        # Try force deleting the stack before exiting
        log_warning "Attempting to force delete failed WAF stack..."
        force_delete_stack "nlmonorepo-waf-${STAGE}" "$WAF_REGION"
        exit 1
    fi
    
    # Check templates for common issues before deploying
    check_templates
    
    # Verify templates in S3 bucket
    verify_s3_templates "nlmonorepo-shared-templates-${STAGE}" "$APP_REGION"
    
    # Deploy Shared Resources in ap-southeast-2
    log_info "Deploying Shared Resources..."
    if ! deploy_stack "nlmonorepo-shared-${STAGE}" "packages/shared-aws-assets/cfn-template.yaml" "$APP_REGION"; then
        log_error "Shared Resources deployment failed"
        # Try force deleting the stack before exiting
        log_warning "Attempting to force delete failed Shared Resources stack..."
        force_delete_stack "nlmonorepo-shared-${STAGE}" "$APP_REGION"
        exit 1
    fi
    
    # Deploy CloudWatch Live in ap-southeast-2
    log_info "Deploying CloudWatch Live..."
    if ! deploy_stack "nlmonorepo-cwl-${STAGE}" "packages/cloudwatchlive/backend/cfn-template.yaml" "$APP_REGION"; then
        log_error "CloudWatch Live deployment failed"
        # Try force deleting the stack before exiting
        log_warning "Attempting to force delete failed CloudWatch Live stack..."
        force_delete_stack "nlmonorepo-cwl-${STAGE}" "$APP_REGION"
        exit 1
    fi
    
    # Create admin user
    log_info "Setting up admin user..."
    if ! create_admin_user "$STAGE"; then
        log_warning "Admin user setup encountered issues. You can run './deploy.sh create-user' later to try again."
    else
        log_success "Admin user created successfully!"
    fi
    
    log_success "All stacks deployed successfully for stage: $STAGE!"
}

# Run the main function with all arguments
main "$@"
