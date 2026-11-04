import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// คัดลอกค่าจากหน้า Firebase Console ของคุณมาวางตรงนี้
const firebaseConfig = {
    apiKey: "AIzaSyBMQBBAnPSYXz9PTn2F9Ypi01eXmIOL5dU",
    authDomain: "uinjob-connect.firebaseapp.com",
    projectId: "uinjob-connect",
    storageBucket: "uinjob-connect.firebasestorage.app",
    messagingSenderId: "912951813348",
    appId: "1:912951813348:web:f5ccd9d7932ff7d930f8f1",
    measurementId: "G-2J9CB2ZDZ5"
  };

const app = initializeApp(firebaseConfig);

// export เพื่อเอาไปใช้ในหน้า Login/Register
export const auth = getAuth(app);
export const db = getFirestore(app);