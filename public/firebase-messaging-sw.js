/* eslint-disable no-undef */
// Background/closed-tab FCM handler. Must live at /firebase-messaging-sw.js
// so the Firebase SDK can find it. Config must match FIREBASE_WEB_CONFIG.
// Compat CDN version tracks the installed `firebase` package (12.16.0).
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyBvYx54QkWTXVepwlhgha9K0eK5q4Oq83Y",
  authDomain: "e-commerce-a1343.firebaseapp.com",
  projectId: "e-commerce-a1343",
  storageBucket: "e-commerce-a1343.firebasestorage.app",
  messagingSenderId: "232609413862",
  appId: "1:232609413862:web:5c62bcc2f37a46bbb4d927",
  measurementId: "G-V0ZLV8W6SS",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    payload.notification?.title || payload.data?.type || "ShipIt Notification"
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.payload || "You have a new update.",
    data: payload.data,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
