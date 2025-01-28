## Getting Started

Install dependencies:  
After cloning repo, run "yarn" from root. Lerna will go through all workspaces listed in package.json in root and install dependencies  

## Deploy Stacks

Create App in serverless.com dashboard.  
  
Run in order: 
&#09;"yarn build-gql" to build types in all packages that have build-gql scripts  
&#09;"yarn build" to run build script in packages that have it (CWL FE)  
&#09;"yarn deploy-waf --stage <stage>" to deploy WAF in us-east-1 
&#09;"yarn deploy-shared --stage <stage>"" to deploy shared DB assets  
&#09;"yarn deploy-cwl --stage <stage>"" to deploy Cloud Watch Live  
&#09;TODO: Script this  
    
&#09;Add a user to Cognito.  
&#09;Add that user to CWLUsersTable:  
&#09;{  
&#09;&#09;"userId": "&lt;userName from Cognito (is a uuid)&gt;",  
&#09;&#09;"organizationId": "",  
&#09;&#09;"PrivacyPolicy": "",  
&#09;&#09;"TermsAndConditions": "",  
&#09;&#09;"userAddedById": "",  
&#09;&#09;"userCreated": "",  
&#09;&#09;"userEmail": "&lt;A valid email (code will be sent here)&gt;",  
&#09;&#09;"userFirstName": "John",  
&#09;&#09;"userLastName": "Doe",  
&#09;&#09;"userPhone": "",  
&#09;&#09;"userProfilePicture": {  
&#09;&#09;&#09;"Bucket": "",  
&#09;&#09;&#09;"Key": ""  
&#09;&#09;},  
&#09;&#09;   "userTitle": ""  
&#09;}  
   
## Launch dev site  
Run:  
&#09;yarn dev-cwl  
  
## Remove Stacks  
&#09;Run in order:  
&#09;&#09;"yarn remove-cwl --stage &lt;stage&gt;" to remove Cloud Watch Live  
&#09;&#09;"yarn remove-shared --stage &lt;stage&gt;" to remove shared DB assets  
&#09;&#09;"yarn remove-waf --stage &lt;stage&gt;" to remove WAF  
&#09;&#09;TODO: Script this  
    

