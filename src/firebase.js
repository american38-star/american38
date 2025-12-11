// ===============================
// firebase.js — الإصدار النهائي
// بدون أي خطأ — تشغيل Analytics بأمان
// ===============================

import { initializeApp } from "firebase/app";
import {
  getAuth,
  sendPasswordResetEmail
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import {
  getAnalytics,
  isSupported
} from "firebase/analytics";

import { getFunctions } from "firebase/functions";

// -------------------------------------------
// إعدادات Firebase الخاصة بتطبيقك
// -------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDa0XdGA05G3vt-enGPBfDTD16K4OdoMik",
  authDomain: "american-54cbd.firebaseapp.com",
  projectId: "american-54cbd",
  storageBucket: "american-54cbd.appspot.com",
  messagingSenderId: "166955679884",
  appId: "1:166955679884:web:5d8701f7ed3e3f78d33ba9",
  measurementId: "G-ZL7XR4VCV3"
};

// -------------------------------------------
// تشغيل Firebase
// -------------------------------------------
const app = initializeApp(firebaseConfig);

// -------------------------------------------
// تشغيل Analytics بدون أخطاء (بيئة متصفح فقط)
// -------------------------------------------
let analytics = null;

isSupported().then((supported) => {
  if (supported) {
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn("Analytics disabled:", err);
    }
  }
});

// -------------------------------------------
// التصدير — جاهز للاستخدام
// -------------------------------------------
export const auth = getAuth(app);        // نظام تسجيل الدخول
export const db = getFirestore(app);     // Firestore قاعدة البيانات
export const storage = getStorage(app);  // تخزين الملفات
export const functions = getFunctions(app); // Functions Cloud

export { analytics };
export { sendPasswordResetEmail };
