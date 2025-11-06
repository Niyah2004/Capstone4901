import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTgUzUJyus4_v8B6raB5nSj4pzGf0HH5E",
  authDomain: "habitat-71bbc.firebaseapp.com",
  projectId: "habitat-71bbc",
  storageBucket: "habitat-71bbc.firebasestorage.app",
  messagingSenderId: "294477577859",
  appId: "1:294477577859:web:78bc9d107482fbc2be65b6",
  measurementId: "G-1QP4QXLTNB"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };

/*// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// --- Export for use across the app ---
export { app, db, auth, storage };*/