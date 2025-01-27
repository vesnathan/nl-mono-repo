## Getting Started

Install dependencies: After cloning repo, run "yarn" from root. Lerna will go through all workspaces listed in package.json in root and install dependencies  

## Deploy assets

Run in order: 
  "yarn build-gql" to build types  
  "yarn deploy-waf" to deploy WAF
  "yarn deploy-shared" to deploy shared DB assets 
  "yarn deploy-cwl" to deploy Cloud Watch Live
  TODO: Script this

## Launch dev site
Run:  
  yarn dev-cwl  

