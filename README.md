## Getting Started

Install dependencies: After cloning repo, run "yarn" from root. Lerna will go through all workspaces listed in package.json in root and install dependencies  

## Deploy Stacks

create App in serverless.com dashboard.  
  
Run in order: 
  "yarn build-gql" to build types in all packages that have build-gql scripts  
  "yarn build" to run build script in packages that have it (CWL FE)  
  "yarn deploy-waf --stage <stage>" to deploy WAF in us-east-1 
  "yarn deploy-shared --stage <stage>"" to deploy shared DB assets  
  "yarn deploy-cwl --stage <stage>"" to deploy Cloud Watch Live  
  TODO: Script this  
  
## Launch dev site
Run:  
  yarn dev-cwl  

## Remove Stacks
  Run in order:  
    "yarn deploy-cwl --stage <stage>"" to remove Cloud Watch Live  
    "yarn deploy-shared --stage <stage>"" to remove shared DB assets  
    "yarn deploy-waf --stage <stage>" to remove WAF  
    TODO: Script this  
    

