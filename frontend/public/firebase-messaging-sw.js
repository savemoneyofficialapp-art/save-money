// Firebase SDK ইমপোর্ট করা (CDN এর মাধ্যমে)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ধাপ ১ থেকে পাওয়া আপনার Firebase Config এখানে বসান
const firebaseConfig = {
  apiKey: "AIzaSyDqgsE1mND4pl6ZxlExPOW7zecHW3x_H94",
  authDomain: "savemoney-a2615.firebaseapp.com",
  projectId: "savemoney-a2615",
  storageBucket: "savemoney-a2615.firebasestorage.app",
  messagingSenderId: "642246363002",
  appId: "1:642246363002:web:8ae296cb0131a28c7ff8c3",
  measurementId: "G-5TRFJZZG41"
};


// Firebase ইনিশিয়ালাইজ করা
firebase.initializeApp(firebaseConfig);

// Messaging অবজেক্ট তৈরি
const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ডে নোটিফিকেশন হ্যান্ডেল করার জন্য
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] ব্যাকগ্রাউন্ড মেসেজ পাওয়া গেছে: ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/firebase-logo.png' // আপনার অ্যাপ লোগোর পাথ
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
