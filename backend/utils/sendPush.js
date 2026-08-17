const webpush = require("web-push");
const User = require("../models/User");
const mongoose = require("mongoose");

// 👇 VAPID details সঠিকভাবে সেটআপ করা হলো
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@savemoney.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (userIdOrEmail, title, body, url = "/") => {
  try {
    let queryConditions = [{ email: userIdOrEmail }];
    
    // যদি ইনপুটটি সঠিক ObjectId হয়, তবে কেবল _id দিয়ে খুঁজবে
    if (mongoose.Types.ObjectId.isValid(userIdOrEmail)) {
      queryConditions.push({ _id: userIdOrEmail });
    }

    const user = await User.findOne({ $or: queryConditions });

    if (!user) {
      console.log("Push notification error: User not found");
      return;
    }

    if (!user.pushSubscription) {
      console.log("Push notification error: User push subscription not found");
      return;
    }

    const payload = JSON.stringify({ title, body, url });
    
    await webpush.sendNotification(user.pushSubscription, payload);
    console.log("Push notification sent successfully!");
  } catch (error) {
    console.error("Error sending push notification:", error);
    
    // যদি সাবস্ক্রিপশন এক্সপায়ার্ড বা ইনভ্যালিড হয়ে যায় (Error 410), তবে ডাটাবেস থেকে রিমুভ করে দেওয়া হবে
    if (error.statusCode === 410) {
      await User.updateOne(
        { email: userIdOrEmail },
        { $set: { pushSubscription: null } }
      );
    }
  }
};

module.exports = sendPushNotification;
