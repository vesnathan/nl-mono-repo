/**
 * AppSync Pipeline Function: Send Welcome Email
 * This function is part of the createTSHUser pipeline and conditionally invokes
 * the Lambda function to send a welcome email to newly created users.
 */

export function request(ctx: any) {
  // Check if sendWelcomeEmail flag is set in stash
  const sendWelcomeEmail = ctx.stash.sendWelcomeEmail;

  // Only invoke if sendWelcomeEmail is true
  if (sendWelcomeEmail !== true) {
    return {
      operation: "no-op",
    };
  }

  const user = ctx.prev.result;
  return {
    operation: "Invoke",
    payload: {
      userEmail: user.userEmail,
      userFirstName: user.userFirstName,
      userLastName: user.userLastName,
      userId: user.userId,
    },
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error sending welcome email:", ctx.error);
    // Don't fail the whole mutation if email fails
  }
  return ctx.prev.result;
}
