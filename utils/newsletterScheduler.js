import cron from "node-cron";
import { Newsletter, NewsLetterSubscription } from "../models/Newsletter.js";
import { sendEmail } from "../config/mailer.js";
import { renderTemplate } from "../config/emailTemplates/index.js";

/**
 * Build newsletter email HTML with images
 */
// Use handlebars templates instead of building HTML here.

/**
 * Build admin completion report email
 */
// Use pre-built handlebars template for admin report. See templates/admin-report.hbs

/**
 * Send completion report to admin emails
 */
async function sendAdminCompletionReport(newsletter, stats) {
  try {
    const adminEmails = process.env.ADMIN_EMAILS;

    if (!adminEmails) {
      console.warn("⚠️  ADMIN_EMAILS not configured in environment variables");
      return;
    }

    // Split and clean admin emails
    const emailList = adminEmails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    if (emailList.length === 0) {
      console.warn("⚠️  No valid admin emails found");
      return;
    }

    const successRate =
      stats.totalSubscribers > 0
        ? ((stats.successCount / stats.totalSubscribers) * 100).toFixed(2)
        : 0;

    // We'll use the template rendering inside the mailer instead of pre-rendering here

    console.log(
      `📨 Sending completion report to ${emailList.length} admin(s)...`
    );

    // Send to each admin email
    for (const adminEmail of emailList) {
      const result = await sendEmail({
        to: adminEmail,
        subject: `✅ Newsletter Completion Report: ${newsletter.subject}`,
        template: "admin-report",
        context: {
          subject: newsletter.subject,
          sentAt: newsletter.sentAt
            ? new Date(newsletter.sentAt).toLocaleString()
            : new Date().toLocaleString(),
          totalSubscribers: stats.totalSubscribers,
          successCount: stats.successCount,
          failureCount: stats.failureCount,
          successRate,
          failureNote:
            stats.failureCount > 0
              ? `${stats.failureCount} email(s) failed to deliver.`
              : null,
          year: new Date().getFullYear(),
        },
        text: `Newsletter "${newsletter.subject}" was sent to ${stats.totalSubscribers} subscribers. Success: ${stats.successCount}, Failed: ${stats.failureCount}`,
      });

      if (result.success) {
        console.log(`✅ Admin report sent to ${adminEmail}`);
      } else {
        console.error(
          `❌ Failed to send admin report to ${adminEmail}:`,
          result.error
        );
      }
    }
  } catch (error) {
    console.error("❌ Error sending admin completion report:", error);
  }
}

/**
 * Send newsletter to all subscribers
 */
async function sendNewsletterToAllSubscribers(newsletter) {
  try {
    console.log(`📧 Starting to send newsletter: ${newsletter.subject}`);

    // Get all subscribers
    const subscribers = await NewsLetterSubscription.find({});

    if (subscribers.length === 0) {
      console.log("⚠️  No subscribers found");
      return { success: false, message: "No subscribers found" };
    }

    // Send email to all subscribers
    let successCount = 0;
    let failureCount = 0;

    for (const subscriber of subscribers) {
      // Generate unsubscribe link
      const unsubscribeUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

      // Build HTML email with images
      const result = await sendEmail({
        to: subscriber.email,
        subject: newsletter.subject,
        template: "newsletter",
        context: {
          title: newsletter.subject,
          body: newsletter.htmlContent || newsletter.content,
          images: newsletter.images,
          unsubscribeUrl,
        },
        text: newsletter.content,
      });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        console.error(
          `❌ Failed to send to ${subscriber.email}:`,
          result.error
        );
      }
    }

    // Update newsletter status
    newsletter.status = "sent";
    newsletter.sentAt = new Date();
    newsletter.recipientCount = successCount;
    await newsletter.save();

    console.log(
      `✅ Newsletter sent successfully! Success: ${successCount}, Failed: ${failureCount}`
    );

    const stats = {
      totalSubscribers: subscribers.length,
      successCount,
      failureCount,
    };

    // Send completion report to admins
    await sendAdminCompletionReport(newsletter, stats);

    return {
      success: true,
      ...stats,
    };
  } catch (error) {
    console.error("❌ Error sending newsletter:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check and send scheduled newsletters
 * This function runs every minute to check for newsletters that need to be sent
 */
async function checkAndSendScheduledNewsletters() {
  try {
    const now = new Date();

    // Find newsletters that are scheduled and due to be sent
    const scheduledNewsletters = await Newsletter.find({
      status: "scheduled",
      scheduledFor: { $lte: now },
    });

    if (scheduledNewsletters.length === 0) {
      return;
    }

    console.log(
      `📅 Found ${scheduledNewsletters.length} scheduled newsletter(s) to send`
    );

    // Send each scheduled newsletter
    for (const newsletter of scheduledNewsletters) {
      await sendNewsletterToAllSubscribers(newsletter);
    }
  } catch (error) {
    console.error("❌ Error checking scheduled newsletters:", error);
  }
}

/**
 * Initialize the newsletter scheduler with different modes
 * Modes: '5mins', 'hourly', 'daily', 'weekly'
 * Default: Check every 5 minutes
 */
export function initializeNewsletterScheduler() {
  // Get schedule mode from environment variable (default: 5mins)
  const scheduleMode = process.env.NEWSLETTER_CHECK_MODE || "5mins";

  let cronExpression;
  let description;

  switch (scheduleMode.toLowerCase()) {
    case "5mins":
      cronExpression = "*/5 * * * *"; // Every 5 minutes
      description = "every 5 minutes";
      break;

    case "hourly":
      cronExpression = "0 * * * *"; // At minute 0 of every hour
      description = "every hour";
      break;

    case "daily":
      cronExpression = "0 9 * * *"; // Every day at 9:00 AM
      description = "daily at 9:00 AM";
      break;

    case "weekly":
      cronExpression = "0 9 * * 1"; // Every Monday at 9:00 AM
      description = "weekly on Monday at 9:00 AM";
      break;

    default:
      console.warn(
        `⚠️  Unknown schedule mode: ${scheduleMode}. Using default (5 minutes)`
      );
      cronExpression = "*/5 * * * *";
      description = "every 5 minutes (default)";
  }

  console.log("🚀 Newsletter scheduler initialized");
  console.log(`📅 Schedule mode: ${scheduleMode} - Checking ${description}`);
  console.log(`⏰ Cron expression: ${cronExpression}`);

  // Schedule the cron job
  cron.schedule(cronExpression, async () => {
    console.log(
      `⏰ [${new Date().toLocaleString()}] Checking for scheduled newsletters...`
    );
    await checkAndSendScheduledNewsletters();
  });

  // Also check immediately on startup
  console.log("🔍 Running initial check on startup...");
  checkAndSendScheduledNewsletters();
}

/**
 * Export the send function for use in controllers
 */
export { sendNewsletterToAllSubscribers };
