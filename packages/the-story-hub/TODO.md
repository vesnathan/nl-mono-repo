# The Story Hub - TODO

## OAuth User Auto-Creation
- [ ] Add PostConfirmation Lambda trigger to automatically create DynamoDB user records when users sign up via OAuth (Google, etc.)
  - Currently, OAuth users are created in Cognito but NOT automatically synced to DynamoDB
  - The `getUserProfile` resolver returns `null` if user doesn't exist in DynamoDB
  - Reference implementation: Card Counting Trainer (CCT) PostConfirmation Lambda
  - Files to create:
    - `packages/the-story-hub/backend/lambda/postConfirmation.ts`
    - `packages/deploy/templates/the-story-hub/resources/Lambda/postConfirmation.yaml`
  - Files to update:
    - `packages/deploy/templates/the-story-hub/resources/Cognito/cognito.yaml` - Add LambdaConfig with PostConfirmation trigger
