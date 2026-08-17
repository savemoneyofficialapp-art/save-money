const webpush = require("web-push");
const User = require("../models/User");


const mongoose = require("mongoose");

const sendPushNotification = async (userIdOrEmail, title, body, url = "/") => {
  try {
    let queryConditions = [{ email: userIdOrEmail }];
    
    // যদি ইনপুটটি ভ্যালিড ObjectId হয়, তবেই কেবল _id দিয়ে খুঁজবে
    if (mongoose.Types.ObjectId.isValid(userIdOrEmail)) {
      queryConditions.push({ _id: userIdOrEmail });
    }

    const user = await User.findOne({ $or: queryConditions });

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

