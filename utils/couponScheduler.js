import cron from "node-cron";
import { updateExpiredCoupons } from "../controllers/discountCouponController.js";

/**
 * Check and deactivate expired coupons
 * This function runs to check for coupons that have expired
 */
async function checkAndDeactivateExpiredCoupons() {
  try {
    await updateExpiredCoupons();
  } catch (error) {
    console.error("❌ Error in coupon expiration check:", error);
  }
}

/**
 * Initialize the coupon expiration scheduler
 * Runs daily at midnight to deactivate expired coupons
 */
export function initializeCouponScheduler() {
  // Run daily at midnight (00:00)
  const cronExpression = "0 0 * * *";
  const description = "daily at midnight";

  console.log("🚀 Coupon expiration scheduler initialized");
  console.log(`📅 Checking for expired coupons ${description}`);
  console.log(`⏰ Cron expression: ${cronExpression}`);

  // Schedule the cron job
  cron.schedule(cronExpression, async () => {
    console.log(
      `⏰ [${new Date().toLocaleString()}] Checking for expired coupons...`
    );
    await checkAndDeactivateExpiredCoupons();
  });

  // Also check immediately on startup
  console.log("🔍 Running initial coupon expiration check on startup...");
  checkAndDeactivateExpiredCoupons();
}
