import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdPPTzjiEYglRaknM2PU9WDgoofs97UVw",
  authDomain: "whatbytestaskapp.firebaseapp.com",
  projectId: "whatbytestaskapp",
  storageBucket: "whatbytestaskapp.firebasestorage.app",
  messagingSenderId: "1060158283998",
  appId: "1:1060158283998:web:68185f159231fe4006224f",
  measurementId: "G-XJ7Y3HZYR5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);