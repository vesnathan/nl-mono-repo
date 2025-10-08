import {
  SESClient,
  VerifyEmailIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  ListIdentitiesCommand,
} from "@aws-sdk/client-ses";
import { logger } from "./logger";

export interface SESEmailVerifierOptions {
  region: string;
  emailAddress: string;
}

export class SESEmailVerifier {
  private ses: SESClient;
  private emailAddress: string;

  constructor(options: SESEmailVerifierOptions) {
    this.emailAddress = options.emailAddress;
    this.ses = new SESClient({ region: options.region });
  }

  /**
   * Check if an email address is already verified in SES
   */
  async isEmailVerified(): Promise<boolean> {
    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [this.emailAddress],
      });

      const response = await this.ses.send(command);
      const attributes = response.VerificationAttributes?.[this.emailAddress];

      if (!attributes) {
        return false;
      }

      return attributes.VerificationStatus === "Success";
    } catch (error: any) {
      logger.error(
        `Error checking email verification status: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Request email verification from SES
   */
  async requestVerification(): Promise<void> {
    try {
      const command = new VerifyEmailIdentityCommand({
        EmailAddress: this.emailAddress,
      });

      const response = await this.ses.send(command);
      logger.success(
        `✓ Verification email request sent successfully to ${this.emailAddress}`,
      );
      logger.info(
        `  AWS SES should send a verification email within a few minutes.`,
      );
      logger.info(
        `  Check your inbox (and spam folder) for an email from no-reply-aws@amazon.com`,
      );
    } catch (error: any) {
      logger.error(`Error requesting email verification: ${error.message}`);
      if (error.code === "InvalidParameterValue") {
        logger.error(
          `  The email address format may be invalid: ${this.emailAddress}`,
        );
      } else if (error.code === "LimitExceededException") {
        logger.error(
          `  AWS SES rate limit exceeded. Please wait a few minutes and try again.`,
        );
      }
      throw error;
    }
  }

  /**
   * List all verified email identities in SES
   */
  async listVerifiedEmails(): Promise<string[]> {
    try {
      const command = new ListIdentitiesCommand({
        IdentityType: "EmailAddress",
      });

      const response = await this.ses.send(command);
      const identities = response.Identities || [];

      // Filter to only verified emails
      const verifiedEmails: string[] = [];
      for (const identity of identities) {
        const attrCommand = new GetIdentityVerificationAttributesCommand({
          Identities: [identity],
        });
        const attrResponse = await this.ses.send(attrCommand);
        const status =
          attrResponse.VerificationAttributes?.[identity]?.VerificationStatus;

        if (status === "Success") {
          verifiedEmails.push(identity);
        }
      }

      return verifiedEmails;
    } catch (error: any) {
      logger.error(`Error listing verified emails: ${error.message}`);
      return [];
    }
  }

  /**
   * Ensure the email is verified, requesting verification if needed
   */
  async ensureEmailVerified(): Promise<boolean> {
    const isVerified = await this.isEmailVerified();

    if (isVerified) {
      logger.success(`✓ Email ${this.emailAddress} is already verified in SES`);
      return true;
    }

    logger.warning(
      `Email ${this.emailAddress} is not verified in SES sandbox mode`,
    );

    // Show list of currently verified emails
    const verifiedEmails = await this.listVerifiedEmails();
    if (verifiedEmails.length > 0) {
      logger.info(`Currently verified emails: ${verifiedEmails.join(", ")}`);
    }

    // Request verification
    logger.info(`Requesting verification for ${this.emailAddress}...`);
    await this.requestVerification();

    logger.warning(
      `\n⚠️  ACTION REQUIRED: Check your inbox at ${this.emailAddress}`,
    );
    logger.warning(`    Click the verification link in the email from AWS SES`);
    logger.warning(
      `\n    NOTE: SES sandbox requires BOTH the from and to addresses to be verified.`,
    );
    logger.warning(
      `    Verify recipient email addresses here: https://console.aws.amazon.com/ses/home?region=ap-southeast-2#/verified-identities\n`,
    );

    return false;
  }
}
