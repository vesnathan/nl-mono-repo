/**
 * AppSync Pipeline Function: Create Cognito User
 * This function invokes the Lambda to create a Cognito user before storing in DynamoDB.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  const { input } = ctx.args;

  return {
    operation: "Invoke",
    payload: {
      userEmail: input.userEmail,
      userFirstName: input.userFirstName,
      userLastName: input.userLastName,
      userPhone: input.userPhone,
      sendWelcomeEmail: input.sendWelcomeEmail || false,
    },
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error creating Cognito user:", ctx.error);
    // Return error to stop pipeline execution
    util.error(ctx.error.message, "CognitoCreationFailed");
  }

  // Return the Cognito sub and timestamp to be used by next pipeline function
  return ctx.result;
}
