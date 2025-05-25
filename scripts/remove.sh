#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

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

# Function to show help message
show_help() {
    echo "Usage: ./cleanup.sh"
    echo ""
    echo "This script will delete all AWS resources created by the deploy.sh script in the reverse order:"
    echo "1. CloudWatch Live stack"
    echo "2. Shared Resources stack"
    echo "3. WAF stack"
    echo "4. S3 buckets used for templates"
    echo ""
}

# Global variables
STAGE=""
WAF_REGION="us-east-1"
APP_REGION="ap-southeast-2"

# Function to set AWS region
function set_region() {
    local region=$1
    aws configure set region "$region"
}

# Function to select deployment stage
select_stage() {
    local stage
    
    echo "Select environment to clean up (dev/staging/prod) [dev] (Defaults to dev in 5 seconds)"
    read -t 5 stage || true
    
    # If input is empty (due to timeout or just pressing Enter), default to dev
    if [ -z "$stage" ]; then
        echo "Defaulting to dev environment"
        stage="dev"
    fi

    case $stage in
        dev|staging|prod)
            export STAGE=$stage
            log_success "Selected stage: $STAGE"
            ;;
        *)
            log_error "Invalid stage. Defaulting to dev."
            export STAGE=dev
            ;;
    esac
}

# Function to delete a CloudFormation stack and wait for completion
delete_stack() {
    local stack_name=$1
    local region=$2
    
    log_info "Deleting stack $stack_name in region $region..."
    
    # Set AWS region
    aws configure set region "$region"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$stack_name" >/dev/null 2>&1; then
        # Delete the stack
        aws cloudformation delete-stack --stack-name "$stack_name"
        
        log_info "Waiting for stack $stack_name to be deleted..."
        
        # Wait for stack deletion
        aws cloudformation wait stack-delete-complete --stack-name "$stack_name" || {
            log_error "Failed to delete stack $stack_name. Check AWS console for details."
            return 1
        }
        
        log_success "Stack $stack_name successfully deleted"
        return 0
    else
        log_info "Stack $stack_name does not exist in region $region. Skipping."
        return 0
    fi
}

# Function to delete S3 buckets matching a pattern
delete_s3_buckets() {
    local pattern=$1
    local region=$2
    
    # Set AWS region
    aws configure set region "$region"
    
    log_info "Looking for S3 buckets matching pattern: $pattern"
    
    # List buckets that match the pattern
    local buckets=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '$pattern')].Name" --output text)
    
    if [ -z "$buckets" ]; then
        log_info "No S3 buckets found matching pattern $pattern"
        return 0
    fi
    
    log_warning "Found the following S3 buckets to delete: $buckets"
    
    for bucket in $buckets; do
        log_info "Emptying bucket $bucket..."
        aws s3 rm "s3://$bucket" --recursive || log_warning "Error emptying bucket $bucket"
        
        log_info "Deleting bucket $bucket..."
        aws s3api delete-bucket --bucket "$bucket" || log_warning "Error deleting bucket $bucket"
        
        if [ $? -eq 0 ]; then
            log_success "Bucket $bucket successfully deleted"
        else
            log_warning "Failed to delete bucket $bucket. It might not be empty or you may not have sufficient permissions."
        fi
    done
    
    return 0
}

# Function to delete DynamoDB tables matching a pattern
delete_dynamodb_tables() {
    local pattern=$1
    local region=$2
    
    # Set AWS region
    aws configure set region "$region"
    
    log_info "Looking for DynamoDB tables matching pattern: $pattern"
    
    # List tables that match the pattern
    local tables=$(aws dynamodb list-tables --query "TableNames[?contains(@, '$pattern')]" --output text)
    
    if [ -z "$tables" ]; then
        log_info "No DynamoDB tables found matching pattern $pattern"
        return 0
    fi
    
    log_warning "Found the following DynamoDB tables to delete: $tables"
    
    for table in $tables; do
        log_info "Deleting table $table..."
        aws dynamodb delete-table --table-name "$table" || log_warning "Error deleting table $table"
        
        if [ $? -eq 0 ]; then
            log_success "Table $table successfully deleted"
        else
            log_warning "Failed to delete table $table. Check AWS console for details."
        fi
    done
    
    return 0
}

# Function to delete Cognito User Pools matching a pattern
delete_cognito_user_pools() {
    local pattern=$1
    local region=$2
    
    # Set AWS region
    aws configure set region "$region"
    
    log_info "Looking for Cognito User Pools matching pattern: $pattern"
    
    # List user pools that match the pattern
    local pools=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?contains(Name, '$pattern')].Id" --output text)
    
    if [ -z "$pools" ]; then
        log_info "No Cognito User Pools found matching pattern $pattern"
        return 0
    fi
    
    log_warning "Found the following Cognito User Pools to delete: $pools"
    
    for pool_id in $pools; do
        log_info "Deleting User Pool $pool_id..."
        aws cognito-idp delete-user-pool --user-pool-id "$pool_id" || log_warning "Error deleting User Pool $pool_id"
        
        if [ $? -eq 0 ]; then
            log_success "User Pool $pool_id successfully deleted"
        else
            log_warning "Failed to delete User Pool $pool_id. Check AWS console for details."
        fi
    done
    
    return 0
}

# Function to delete CloudFront distributions matching a pattern
delete_cloudfront_distributions() {
    local pattern=$1
    
    log_info "Looking for CloudFront distributions matching pattern: $pattern"
    
    # List distributions that match the pattern
    local distributions=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Comment, '$pattern')].{Id:Id,Etag:ETag}" --output json)
    
    # Check if distribution list is empty, null, or "[]"
    if [ "$distributions" == "[]" ] || [ -z "$distributions" ] || [ "$distributions" == "null" ]; then
        log_info "No CloudFront distributions found matching pattern $pattern"
        return 0
    fi
    
    # Check if Items is null in the response
    if [ "$(echo "$distributions" | jq 'length')" -eq 0 ]; then
        log_info "No CloudFront distributions found matching pattern $pattern"
        return 0
    fi
    
    log_warning "Found CloudFront distributions matching pattern $pattern. Disabling and deleting..."
    
    # Extract distribution IDs and ETags
    local ids=$(echo "$distributions" | jq -r '.[] | .Id' 2>/dev/null)
    
    for id in $ids; do
        # Get current distribution config and ETag
        local dist_config=$(aws cloudfront get-distribution-config --id "$id")
        local etag=$(echo "$dist_config" | jq -r '.ETag')
        
        # Check if distribution is already disabled
        local enabled=$(echo "$dist_config" | jq -r '.DistributionConfig.Enabled')
        
        if [ "$enabled" == "true" ]; then
            log_info "Disabling distribution $id..."
            
            # Create a new config with Enabled set to false
            local new_config=$(echo "$dist_config" | jq '.DistributionConfig.Enabled = false')
            
            # Update the distribution config
            aws cloudfront update-distribution --id "$id" --distribution-config "$(echo "$new_config" | jq '.DistributionConfig')" --if-match "$etag" || {
                log_warning "Failed to disable distribution $id. Skipping deletion."
                continue
            }
            
            log_info "Waiting for distribution $id to be deployed..."
            aws cloudfront wait distribution-deployed --id "$id" || log_warning "Timed out waiting for distribution $id to be deployed"
        fi
        
        # Get the updated ETag
        dist_config=$(aws cloudfront get-distribution-config --id "$id")
        etag=$(echo "$dist_config" | jq -r '.ETag')
        
        log_info "Deleting distribution $id..."
        aws cloudfront delete-distribution --id "$id" --if-match "$etag" || log_warning "Failed to delete distribution $id"
        
        if [ $? -eq 0 ]; then
            log_success "Distribution $id successfully deleted"
        else
            log_warning "Failed to delete distribution $id. It might still be enabled or in use."
        fi
    done
    
    return 0
}

# Main function to clean up all resources
cleanup_all_resources() {
    log_warning "This script will delete ALL resources for the $STAGE environment!"
    log_warning "This includes CloudFormation stacks, S3 buckets, DynamoDB tables, Cognito User Pools, and CloudFront distributions."
    echo ""
    
    # Step 1: Delete CloudWatch Live resources first
    log_info "STEP 1: Deleting CloudWatch Live resources..."
    
    # Delete CloudWatch Live CloudFormation stack
    delete_stack "nlmonorepo-cwl-${STAGE}" "$APP_REGION"
    
    # Delete related resources that might not be part of the stack
    delete_s3_buckets "nl-mono-repo-cwl-" "$APP_REGION"
    delete_dynamodb_tables "nl-mono-repo-cwl-" "$APP_REGION"
    delete_cognito_user_pools "nl-mono-repo-cwl-" "$APP_REGION"
    delete_cloudfront_distributions "nl-mono-repo-cwl-"
    
    # Step 2: Delete Shared Resources
    log_info "STEP 2: Deleting Shared Resources..."
    
    # Delete Shared Resources CloudFormation stack
    delete_stack "nlmonorepo-shared-${STAGE}" "$APP_REGION"
    
    # Delete related resources that might not be part of the stack
    delete_s3_buckets "nl-mono-repo-shared-" "$APP_REGION"
    delete_dynamodb_tables "nl-mono-repo-shared-" "$APP_REGION"
    delete_cognito_user_pools "nl-mono-repo-shared-" "$APP_REGION"
    
    # Step 3: Delete WAF Resources
    log_info "STEP 3: Deleting WAF Resources..."
    
    # Delete WAF CloudFormation stack
    delete_stack "nlmonorepo-waf-${STAGE}" "$WAF_REGION"
    
    # Delete related resources that might not be part of the stack
    delete_s3_buckets "nl-waf-${STAGE}" "$WAF_REGION"
    
    # Delete template buckets
    log_info "STEP 4: Deleting template buckets..."
    delete_s3_buckets "nl-mono-repo-waf-templates-${STAGE}" "$WAF_REGION"
    delete_s3_buckets "nl-mono-repo-shared-templates-${STAGE}" "$APP_REGION"
    delete_s3_buckets "nl-mono-repo-cwl-templates-${STAGE}" "$APP_REGION"
    delete_s3_buckets "nl-mono-repo-generic-templates-${STAGE}" "$APP_REGION"
    
    log_success "Cleanup completed successfully!"
}

# Main function
main() {
    # Check for AWS CLI
    if ! command -v aws >/dev/null 2>&1; then
        log_error "AWS CLI is not installed. Please install it before running this script."
        exit 1
    fi
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS CLI is not configured. Please run 'aws configure' to set up your credentials."
        exit 1
    fi
    
    # Select environment to clean up
    select_stage
    
    # Clean up all resources
    cleanup_all_resources
}

# Run the main function
main
