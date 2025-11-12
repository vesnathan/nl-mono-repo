import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || "ap-southeast-2" });

// reCAPTCHA secret key - store in environment variable
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Test key

interface ContactFormData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  recaptchaToken?: string;
  formType?: string;
  // Quote form fields
  firstName?: string;
  lastName?: string;
  serviceType?: string;
  rentalPlatform?: string;
  isRegularBookings?: string;
  propertyAddress?: string;
  city?: string;
  postcode?: string;
  description?: string;
}

// Verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!token) {
    console.warn('No reCAPTCHA token provided');
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();
    console.log('reCAPTCHA verification result:', data);

    // Accept if score is above 0.5 (or if using test keys)
    return data.success && (data.score >= 0.5 || RECAPTCHA_SECRET_KEY.includes('Test'));
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

export const handler = async (event: any) => {
  // Handle CORS preflight
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  try {
    const body: ContactFormData = JSON.parse(event.body || "{}");

    // Verify reCAPTCHA token
    const isVerified = await verifyRecaptcha(body.recaptchaToken || '');
    if (!isVerified) {
      console.warn('reCAPTCHA verification failed');
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "reCAPTCHA verification failed. Please try again." }),
      };
    }

    // Determine if this is a contact form or quote form
    const isQuoteForm = body.formType === 'quote' || (body.firstName && body.lastName && body.serviceType);
    const subject = isQuoteForm
      ? "New Quote Request - Tommy's Law'n Order"
      : "New Contact Form Submission - Tommy's Law'n Order";

    // Build email body
    let emailBody = "";
    if (isQuoteForm) {
      emailBody = `
New Quote Request

CONTACT DETAILS:
Name: ${body.firstName} ${body.lastName}
Email: ${body.email}
Phone: ${body.phone || "Not provided"}

SERVICE DETAILS:
Service Type: ${body.serviceType}
Rental Platform: ${body.rentalPlatform}
Regular Bookings: ${body.isRegularBookings === "yes" ? "Yes - I have regular guests" : "No - occasional bookings"}

PROPERTY ADDRESS:
${body.propertyAddress}
${body.city}, ${body.postcode}
Tasmania, Australia

PROPERTY DETAILS:
${body.description}
      `.trim();
    } else {
      emailBody = `
New Contact Form Submission

Name: ${body.name}
Email: ${body.email}
Phone: ${body.phone || "Not provided"}

Message:
${body.message}
      `.trim();
    }

    // Send email via SES
    const command = new SendEmailCommand({
      Source: process.env.FROM_EMAIL || "noreply@tommyslawnorder.com.au",
      Destination: {
        ToAddresses: [process.env.TO_EMAIL || "vesnathan+tlo@gmail.com"],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: emailBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await ses.send(command);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to send email" }),
    };
  }
};
