import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { app, db } from "./config";

const messaging = getMessaging(app);

// VAPID KEY - Firebase Console -> Project Settings -> Cloud Messaging bo'limidan olinadi
const VAPID_KEY = "YOUR_PUBLIC_VAPID_KEY_HERE";

export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token && userId) {
        // Foydalanuvchining fcmToken qiymatini Firestore'dagi users kolleksiyasiga saqlaymiz
        await updateDoc(doc(db, "users", userId), {
          fcmToken: token
        });
        console.log("FCM Token saqlandi:", token);
      }
    }
  } catch (error) {
    console.error("Bildirishnoma ruxsatida xatolik:", error);
  }
};

// Sayt ochilib turganda kelgan xabarlarni tutib olish
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });