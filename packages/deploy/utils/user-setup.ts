import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  CreateGroupCommand,
  ListGroupsCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListExportsCommand,
} from "@aws-sdk/client-cloudformation";
import { logger } from "./logger";
import { REGEX } from "../../shared/constants/RegEx"; // Corrected import
import { CWL_COGNITO_GROUPS } from "../../cloudwatchlive/backend/constants/ClientTypes";
import { COGNITO_GROUPS as AWSE_COGNITO_GROUPS } from "../../aws-example/backend/constants/ClientTypes";
import { StackType, getStackName } from "../types";
import { OutputsManager } from "../outputs-manager";
import { getAppNameForStackType } from "../utils/stack-utils";

export type StackTypeForUser = "cwl" | "awse";

export interface UserSetupOptions {
  stage: string;
  adminEmail?: string;
  region?: string;
  stackType?: StackTypeForUser;
}

export interface UserDetails {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  userTitle: string;
  userPhone: string;
}

export class UserSetupManager {
  private cognitoClient: CognitoIdentityProviderClient;
  private dynamoClient: DynamoDBClient;
  private cloudFormationClient: CloudFormationClient;
  private region: string;
  private stackType: StackTypeForUser;

  constructor(region = "ap-southeast-2", stackType: StackTypeForUser = "cwl") {
    this.region = region;
    this.stackType = stackType;
    this.cognitoClient = new CognitoIdentityProviderClient({ region });
    this.dynamoClient = new DynamoDBClient({ region });
    this.cloudFormationClient = new CloudFormationClient({ region });
  }

  async createAdminUser(options: UserSetupOptions): Promise<void> {
    const { stage, adminEmail, stackType } = options;

    // Use the stackType from options if provided, otherwise use the instance's stackType
    if (stackType) {
      this.stackType = stackType;
    }

    logger.debug(
      `Setting up admin user for stage: ${stage}, stackType: ${this.stackType}`,
    );
    logger.debug(`Admin email received in createAdminUser: '${adminEmail}'`); // Added log

    // Get user pool ID
    const userPoolId = await this.getCognitoUserPoolId(stage);
    logger.debug(`Found Cognito User Pool ID: ${userPoolId}`);

    // Ensure required user groups exist
    await this.ensureCognitoGroups(userPoolId, stage);

    // Get user table name based on stack type
    const tableName =
      this.stackType === "awse"
        ? `nlmonorepo-awse-datatable-${stage}`
        : `nlmonorepo-cwl-datatable-${stage}`;
    await this.verifyTableExists(tableName);

    // Get admin email if not provided
    const userEmail = adminEmail || (await this.promptForEmail());
    logger.debug(`User email to be used for Cognito/DDB: '${userEmail}'`); // Added log

    // Create or get existing user
    const cognitoUserId = await this.createOrGetCognitoUser(
      userPoolId,
      userEmail,
    );

    // Create user in DynamoDb
    await this.createUserInDynamoDb(tableName, cognitoUserId, userEmail);

    // Validate user creation
    await this.validateUserCreation(userPoolId, tableName, cognitoUserId);

    logger.success("Admin user setup completed successfully!");
  }

  private async getCognitoUserPoolId(stage: string): Promise<string> {
    try {
      // Determine stack name and output key based on stack type
      // Resolve full CloudFormation stack name using shared helper so naming is consistent
      const stackName =
        this.stackType === "awse"
          ? getStackName(StackType.AwsExample, stage)
          : getStackName(StackType.CWL, stage);
      const outputKey =
        this.stackType === "awse" ? "AWSEUserPoolId" : "CWLUserPoolId";

      // First, try to read locally-saved deployment outputs (faster and avoids AWS calls when available)
      try {
        const outputsManager = new OutputsManager();
        const localOutput = await outputsManager.getOutputValue(
          this.stackType === "awse" ? StackType.AwsExample : StackType.CWL,
          stage,
          outputKey,
        );
        if (localOutput) {
          logger.debug(
            `Found Cognito User Pool ID in local outputs for ${stackName}: ${localOutput}`,
          );
          return localOutput;
        }
      } catch (err) {
        logger.debug(
          `No local outputs available or failed to read outputs: ${(err as Error).message}`,
        );
      }

      logger.debug(
        `Resolving Cognito User Pool ID by describing stack ${stackName} (output key: ${outputKey})`,
      );

      // Try to get from CloudFormation stack outputs first
      const describeStacksResponse = await this.cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );

      const stack = describeStacksResponse.Stacks?.[0];
      if (stack?.Outputs) {
        const userPoolOutput = stack.Outputs.find(
          (output) => output.OutputKey === outputKey,
        );
        if (userPoolOutput?.OutputValue) {
          return userPoolOutput.OutputValue;
        }
      }

      // Fallback to CloudFormation exports
      const listExportsResponse = await this.cloudFormationClient.send(
        new ListExportsCommand({}),
      );

      // Build a prioritized list of possible export names so deploy utilities
      // can find the right exported value for a given appName/stage. Prefer
      // the new parameterized pattern and keep legacy fallbacks for existing installs.
      const appName = getAppNameForStackType(
        this.stackType === "awse" ? StackType.AwsExample : StackType.CWL,
      );

      const possibleExportNames: string[] = [
        // Preferred parameterized export
        `nlmonorepo-${appName}-${stage}-user-pool-id`,
        // Transitional/legacy fallbacks
        `nlmonorepo-${appName}example-${stage}-user-pool-id`,
        `nlmonorepo-${appName}-${stage}-user-pool-id`.replace("--", "-"),
        `nlmonorepo-${appName}-${stage}-user-pool-id`.replace("-example", ""),
        `AWSEUserPoolId`,
        `CWLUserPoolId`,
      ];

      const userPoolExport = listExportsResponse.Exports?.find((exp) =>
        possibleExportNames.includes(exp.Name || ""),
      );

      if (userPoolExport?.Value) return userPoolExport.Value;

      throw new Error(
        `Could not find Cognito User Pool ID for ${this.stackType} stage ${stage}`,
      );
    } catch (error) {
      logger.error(
        `Error getting Cognito User Pool ID: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  private async ensureCognitoGroups(
    userPoolId: string,
    stage: string,
  ): Promise<void> {
    logger.debug("Checking Cognito user groups...");

    // Use the single source of truth for client types based on stack type
    const requiredGroups =
      this.stackType === "awse" ? AWSE_COGNITO_GROUPS : CWL_COGNITO_GROUPS;

    try {
      const listGroupsResponse = await this.cognitoClient.send(
        new ListGroupsCommand({ UserPoolId: userPoolId }),
      );

      const existingGroups =
        listGroupsResponse.Groups?.map((group) => group.GroupName) || [];

      for (const groupName of requiredGroups) {
        if (!existingGroups.includes(groupName)) {
          logger.debug(`Creating group: ${groupName}`);
          await this.cognitoClient.send(
            new CreateGroupCommand({
              UserPoolId: userPoolId,
              GroupName: groupName,
              Description: `Auto-created ${groupName} group for nlmonorepo-${stage}`,
            }),
          );
          logger.debug(`Created group: ${groupName}`);
        } else {
          logger.debug(`Group '${groupName}' already exists`);
        }
      }
    } catch (error) {
      logger.error(
        `Error ensuring user groups: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  private async verifyTableExists(tableName: string): Promise<void> {
    try {
      await this.dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName }),
      );
      logger.debug(`Found DynamoDb table: ${tableName}`);
    } catch (error) {
      logger.error(`DynamoDb table ${tableName} does not exist`);
      throw new Error(
        `DynamoDb table ${tableName} does not exist. Cannot proceed with user creation.`,
      );
    }
  }

  private async promptForEmail(): Promise<string> {
    const adminEmailEnv = process.env.ADMIN_EMAIL;

    if (adminEmailEnv && REGEX.EMAIL.test(adminEmailEnv)) {
      // Use REGEX.EMAIL
      logger.info(
        `Using admin email from ADMIN_EMAIL environment variable: ${adminEmailEnv}`,
      );
      return adminEmailEnv;
    } else if (adminEmailEnv) {
      logger.warning(
        `ADMIN_EMAIL environment variable ('${adminEmailEnv}') is set but contains an invalid email format.`,
      );
      // Fall through to error or a different default handling if necessary
    }

    // If not provided by DeploymentManager and not valid in ENV, this is an issue.
    // For now, let's throw an error, as the primary prompt is in DeploymentManager.
    // Alternatively, could return a hardcoded default, but that hides the problem.
    const errorMessage =
      "Admin email was not provided by the deployment script and is not available or valid in ADMIN_EMAIL environment variable.";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  private async createOrGetCognitoUser(
    userPoolId: string,
    userEmail: string,
  ): Promise<string> {
    try {
      // Check if user already exists
      const getUserResponse = await this.cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: userEmail,
        }),
      );

      logger.info("User already exists in Cognito. Getting user ID...");
      return getUserResponse.Username || userEmail;
    } catch (error: any) {
      if (error.name === "UserNotFoundException") {
        // User doesn't exist, create them
        return await this.createNewCognitoUser(userPoolId, userEmail);
      }
      throw error;
    }
  }

  private async createNewCognitoUser(
    userPoolId: string,
    userEmail: string,
  ): Promise<string> {
    const tempPassword = "Temp1234!";

    try {
      logger.debug("Creating user in Cognito User Pool...");
      const createUserResponse = await this.cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: userEmail,
          TemporaryPassword: tempPassword,
          UserAttributes: [
            { Name: "email", Value: userEmail },
            { Name: "email_verified", Value: "true" },
          ],
          MessageAction: "SUPPRESS",
        }),
      );

      const cognitoUserId = createUserResponse.User?.Username;
      if (!cognitoUserId) {
        throw new Error("Failed to create user in Cognito");
      }

      logger.success(`Created user in Cognito with ID: ${cognitoUserId}`);

      // Set permanent password
      logger.debug("Setting permanent password...");
      await this.cognitoClient.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: userEmail,
          Password: tempPassword,
          Permanent: true,
        }),
      );

      logger.success("Set permanent password for user");

      // Add user to admin group (varies by stack type)
      const adminGroupName =
        this.stackType === "awse" ? "SiteAdmin" : "SuperAdmin";
      logger.debug(`Adding user to ${adminGroupName} group...`);
      await this.cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: userEmail,
          GroupName: adminGroupName,
        }),
      );

      logger.success(`Added user to ${adminGroupName} group`);

      // Display user information
      logger.info("\n========== USER CREATED ==========");
      logger.info(`Username: ${userEmail}`);
      logger.info(`Password: ${tempPassword}`);
      logger.warning(
        "Please change this password after first login for security reasons.",
      );
      logger.info("===================================\n");

      return cognitoUserId;
    } catch (error) {
      logger.error(
        `Error creating Cognito user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  private async createUserInDynamoDb(
    tableName: string,
    cognitoUserId: string,
    userEmail: string,
  ): Promise<void> {
    try {
      logger.debug(
        `Attempting to create user in DynamoDB. Table: ${tableName}, cognitoUserId: ${cognitoUserId}, userEmail: '${userEmail}'`,
      ); // Added log
      // Check if user already exists in DynamoDb
      // Use single-table PK/SK key schema used by both CWL and AWSE DataTable
      const getUserResponse = await this.dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            PK: { S: `USER#${cognitoUserId}` },
            SK: { S: `PROFILE#${cognitoUserId}` },
          },
        }),
      );

      if (getUserResponse.Item) {
        logger.info("User already exists in DynamoDb table");
        return;
      }

      // Create user in DynamoDb with schema specific to the stack type
      const currentTimestamp = new Date().toISOString();

      let userItem: any;

      if (this.stackType === "awse") {
        // AWSE schema - simpler, no organization
        userItem = {
          PK: { S: `USER#${cognitoUserId}` },
          SK: { S: `PROFILE#${cognitoUserId}` },
          userId: { S: cognitoUserId },
          userEmail: { S: userEmail },
          userTitle: { S: "Mr" },
          userFirstName: { S: "Admin" },
          userLastName: { S: "User" },
          userPhone: { S: "+61400000000" },
          privacyPolicy: { BOOL: true },
          termsAndConditions: { BOOL: true },
          userAddedById: { S: "system" },
          userCreated: { S: currentTimestamp },
          GSI1PK: { S: `USER#${cognitoUserId}` },
          GSI1SK: { S: `USER#${cognitoUserId}` },
        };
      } else {
        // CWL schema - includes organization and more fields
        userItem = {
          PK: { S: `USER#${cognitoUserId}` },
          SK: { S: `PROFILE#${cognitoUserId}` },
          userId: { S: cognitoUserId },
          organizationId: { S: "" },
          privacyPolicy: { BOOL: true },
          termsAndConditions: { BOOL: true },
          userAddedById: { S: "" },
          userCreated: { S: currentTimestamp },
          userEmail: { S: userEmail },
          userFirstName: { S: "John" },
          userLastName: { S: "Doe" },
          userPhone: { S: "0421 569 854" },
          userProfilePicture: {
            M: {
              Bucket: { S: "" },
              Key: { S: "" },
            },
          },
          userTitle: { S: "Mr" },
          userRole: { S: "System Administrator" },
          GSI1PK: { S: `ORG#${""}` },
          GSI1SK: { S: `USER#${cognitoUserId}` },
        };
      }

      logger.debug(`Creating user entry in DynamoDb table ${tableName}...`);
      logger.debug(`User item for DDB: ${JSON.stringify(userItem, null, 2)}`);
      await this.dynamoClient.send(
        new PutItemCommand({ TableName: tableName, Item: userItem }),
      );

      logger.debug(`Created user entry in DynamoDb table ${tableName}`);
    } catch (error) {
      logger.error(
        `Error creating user in DynamoDb: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  private async validateUserCreation(
    userPoolId: string,
    tableName: string,
    cognitoUserId: string,
  ): Promise<void> {
    try {
      // Validate user exists in DynamoDb
      // Use the table's PK/SK primary key to fetch the created user item
      const getUserResponse = await this.dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            PK: { S: `USER#${cognitoUserId}` },
            SK: { S: `PROFILE#${cognitoUserId}` },
          },
        }),
      );

      if (!getUserResponse.Item) {
        throw new Error(
          `User validation failed: User not found in table ${tableName} using PK/SK keys`,
        );
      }

      logger.debug(`User validated successfully in table ${tableName}`);
    } catch (error) {
      logger.error(
        `User validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
