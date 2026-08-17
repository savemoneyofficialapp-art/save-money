const webpush = require("web-push");
const User = require("../models/User"); // আপনার ইউজার মডেল পাথ

webpush.setVapidDetails(
  "mailto:support@yourdomain.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (userIdOrEmail, title, body, url = "/") => {
  try {
    // আইডি বা ইমেইল দিয়ে ইউজার খুঁজুন
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
      // ইউজার সাবস্ক্রিপশন বাতিল করলে ডাটাবেস থেকে মুছে দিন
      await User.updateOne({ email: userIdOrEmail }, { $set: { pushSubscription: null } });
    }
  }
};

module.exports = sendPushNotification;

