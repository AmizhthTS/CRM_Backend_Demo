import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import { MailTemplate } from "../models/MailTemplate.js";

// Validate required email environment variables
function validateEmailEnv() {
  const requiredEnvVars = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_FROM",
  ];
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.warn(
      `WARNING: Missing email configuration environment variables: ${missingVars.join(
        ", "
      )}`
    );
    console.warn(
      "Email functionality will not work until these are configured."
    );
    console.warn(
      "Please check your .env file and ensure all SMTP variables are set."
    );
    return false;
  }
  return true;
}

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    const isConfigValid = validateEmailEnv();

    if (!isConfigValid) {
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });
  }
  return transporter;
}

// Send email function
export async function sendEmail({ to, type, context }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.error("Email transporter not configured. Email not sent.");
    return {
      success: false,
      error: "Email configuration missing",
    };
  }

  try {
    const mailTemplate = await MailTemplate.findOne({ type: type });
    if (!mailTemplate) {
      console.error(`Email template not found for type: ${type}`);
      return {
        success: false,
        error: "Email template not found",
      };
    }

    // Compile and render the template using Handlebars
    const compiledTemplate = Handlebars.compile(mailTemplate.template);
    const finalHtml = compiledTemplate(context);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: mailTemplate.subject,
      html: finalHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Verify connection on startup (optional)
export async function verifyEmailConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log("Email connection verified successfully");
    return true;
  } catch (error) {
    console.error("Email connection verification failed:", error.message);
    return false;
  }
}
