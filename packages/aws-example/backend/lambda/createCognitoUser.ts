import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const USER_POOL_ID = process.env.USER_POOL_ID;

interface CreateCognitoUserEvent {
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userPhone?: string;
  sendWelcomeEmail: boolean;
}

interface CreateCognitoUserResponse {
  cognitoSub: string;
  username: string;
  userCreated: string;
}

export const handler = async (
  event: CreateCognitoUserEvent,
): Promise<CreateCognitoUserResponse> => {
  console.log("Creating Cognito user with event:", JSON.stringify(event));

  if (!USER_POOL_ID) {
    throw new Error("USER_POOL_ID environment variable not set");
  }

  const {
    userEmail,
    userFirstName,
    userLastName,
    userPhone,
    sendWelcomeEmail,
  } = event;

  try {
    // Create the Cognito user
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userEmail,
      UserAttributes: [
        {
          Name: "email",
          Value: userEmail,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
        {
          Name: "given_name",
          Value: userFirstName,
        },
        {
          Name: "family_name",
          Value: userLastName,
        },
        ...(userPhone
          ? [
              {
                Name: "phone_number",
                Value: userPhone,
              },
            ]
          : []),
      ],
      DesiredDeliveryMediums: ["EMAIL"],
      // If sendWelcomeEmail is false, suppress the Cognito welcome email
      // We'll send our custom welcome email via SES instead
      MessageAction: sendWelcomeEmail
        ? MessageActionType.RESEND
        : MessageActionType.SUPPRESS,
    });

    const createUserResponse = await cognito.send(createUserCommand);

    if (!createUserResponse.User?.Username) {
      throw new Error("Failed to create Cognito user - no username returned");
    }

    // Get the Cognito sub (unique identifier)
    const cognitoSub = createUserResponse.User.Attributes?.find(
      (attr) => attr.Name === "sub",
    )?.Value;

    if (!cognitoSub) {
      throw new Error("Failed to get Cognito sub from created user");
    }

    console.log(`Cognito user created with sub: ${cognitoSub}`);

    return {
      cognitoSub,
      username: createUserResponse.User.Username,
      userCreated: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error creating Cognito user:", error);

    // Provide more helpful error messages
    if (error.name === "UsernameExistsException") {
      throw new Error(`User with email ${userEmail} already exists in Cognito`);
    }

    throw error;
  }
};
