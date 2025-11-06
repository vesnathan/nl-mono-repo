import type { ResourcesConfig } from "aws-amplify";
import { getDeploymentOutput } from "./deploymentOutputs";

const DEPLOYMENT_OUTPUT = getDeploymentOutput("TSH");
const AWS_REGION = "ap-southeast-2";

// Determine the redirect sign-in URL based on environment
const getRedirectSignIn = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback for SSR
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "prod"
    ? "https://d32h8ny4vmj7kl.cloudfront.net"
    : "http://localhost:3000";
};

export const AMPLIFY_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: DEPLOYMENT_OUTPUT.awseUserPoolId,
      userPoolClientId: DEPLOYMENT_OUTPUT.awseUserPoolClientId,
      allowGuestAccess: true,
      identityPoolId: DEPLOYMENT_OUTPUT.awseIdentityPoolId,
      loginWith: {
        oauth: {
          domain: "nlmonorepo-tsh-dev.auth.ap-southeast-2.amazoncognito.com",
          scopes: [
            "email",
            "openid",
            "profile",
            "aws.cognito.signin.user.admin",
          ],
          redirectSignIn: [getRedirectSignIn()],
          redirectSignOut: [getRedirectSignIn()],
          responseType: "code",
        },
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: DEPLOYMENT_OUTPUT.awseGraphQLUrl,
      region: AWS_REGION,
      defaultAuthMode: "identityPool",
    },
  },
};
