## Getting Started

Install dependencies:  
After cloning repo, run "yarn" from root. Lerna will go through all workspaces listed in package.json in root and install dependencies  

## Deploy Stacks

Create App in serverless.com dashboard.  
  
Run in order: 
&nbsp;"yarn build-gql" to build types in all packages that have build-gql scripts  
&nbsp;"yarn build" to run build script in packages that have it (CWL FE)  
&nbsp;"yarn deploy-waf --stage &lt;stage&gt;" to deploy WAF in us-east-1  
&nbsp;"yarn deploy-shared --stage &lt;stage&gt;"" to deploy shared DB assets  
&nbsp;"yarn deploy-cwl --stage &lt;stage&gt;"" to deploy Cloud Watch Live  
&nbsp;TODO: Script this  
    
&nbsp;Add a user to Cognito.  
&nbsp;Add that user to CWLUsersTable:  
&nbsp;{  
&nbsp;&nbsp;"userId": "&lt;userName from Cognito (is a uuid)&gt;",  
&nbsp;&nbsp;"organizationId": "",  
&nbsp;&nbsp;"PrivacyPolicy": "",  
&nbsp;&nbsp;"TermsAndConditions": "",  
&nbsp;&nbsp;"userAddedById": "",  
&nbsp;&nbsp;"userCreated": "",  
&nbsp;&nbsp;"userEmail": "&lt;A valid email (code will be sent here)&gt;",  
&nbsp;&nbsp;"userFirstName": "John",  
&nbsp;&nbsp;"userLastName": "Doe",  
&nbsp;&nbsp;"userPhone": "",  
&nbsp;&nbsp;"userProfilePicture": {  
&nbsp;&nbsp;&nbsp;"Bucket": "",  
&nbsp;&nbsp;&nbsp;"Key": ""  
&nbsp;&nbsp;},  
&nbsp;&nbsp;   "userTitle": ""  
&nbsp;}  
   
## Launch dev site  
Run:  
&nbsp;yarn dev-cwl  
  
## Remove Stacks  
&nbsp;Run in order:  
&nbsp;&nbsp;"yarn remove-cwl --stage &lt;stage&gt;" to remove Cloud Watch Live  
&nbsp;&nbsp;"yarn remove-shared --stage &lt;stage&gt;" to remove shared DB assets  
&nbsp;&nbsp;"yarn remove-waf --stage &lt;stage&gt;" to remove WAF  
&nbsp;&nbsp;TODO: Script this  
    

