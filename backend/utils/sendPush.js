const webpush = require("web-push");
const User = require("../models/User");

// সিকিউরিটি বা ক্র্যাশ এড়াতে ট্রাই-ক্যাচ দিয়ে র‍্যাপ করা হলো
try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:support@yourdomain.com',
      process.env.VAPID_PUBLIC_KEY.trim(),
      process.env.VAPID_PRIVATE_KEY.trim()
    );
  }
} catch (err) {
  console.log("VAPID Setup Warning:", err.message);
}

const sendPushNotification = async (userIdOrEmail, title, body, url = "/") => {
  try {
    const user = await User.findOne({
      $or: [{ _id: userIdOrEmail }, { email: userIdOrEmail }]
    });

    if (!user || !user.pushSubscription) return;

    const payload = JSON.stringify({ title, body, url });
    await webpush.sendNotification(user.pushSubscription, payload);
    console.log("Push notification sent successfully!");
  } catch (error) {
    console.error("Error sending push notification:", error);
    if (error.statusCode === 410) {
      await User.updateOne({ email: userIdOrEmail }, { $set: { pushSubscription: null } });
    }
  }
};

module.exports = sendPushNotification;
