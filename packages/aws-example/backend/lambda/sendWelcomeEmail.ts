import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@aws-example.com";
const APP_URL = process.env.APP_URL || "https://aws-example.com";

interface WelcomeEmailEvent {
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userId: string;
}

export const handler = async (event: WelcomeEmailEvent) => {
  console.log("Sending welcome email to:", event.userEmail);

  const { userEmail, userFirstName, userLastName, userId } = event;

  // Generate a temporary login link (you'll need to implement proper token generation)
  const loginLink = `${APP_URL}/login?userId=${userId}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CloudWatch Live!</h1>
          </div>
          <div class="content">
            <p>Hello ${userFirstName} ${userLastName},</p>
            <p>Your account has been created successfully. Click the button below to access your account:</p>
            <div style="text-align: center;">
              <a href="${loginLink}" class="button">Access Your Account</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">${loginLink}</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The CloudWatch Live Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
    Welcome to CloudWatch Live!
    
    Hello ${userFirstName} ${userLastName},
    
    Your account has been created successfully. Click the link below to access your account:
    
    ${loginLink}
    
    If you have any questions, please don't hesitate to contact our support team.
    
    Best regards,
    The CloudWatch Live Team
    
    This is an automated message. Please do not reply to this email.
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [userEmail],
    },
    Message: {
      Subject: {
        Data: "Welcome to CloudWatch Live - Your Account is Ready!",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    const response = await ses.send(command);
    console.log("Email sent successfully:", response.MessageId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email sent successfully",
        messageId: response.MessageId,
      }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
