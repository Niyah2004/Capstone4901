// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAy0J20Mo9pP2bnTQUfYh3aFUv4ULAMbys",
  authDomain: "habitat-83361.firebaseapp.com",
  projectId: "habitat-83361",
  storageBucket: "habitat-83361.firebasestorage.app",
  messagingSenderId: "462231856065",
  appId: "1:462231856065:web:33428c00dc68f50e8ac540",
  measurementId: "G-YMFVLKEB1D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);