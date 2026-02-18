import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIwuXKnyGqMzLbnci_FjgTXvo-N66YDGk",
  authDomain: "oblian.firebaseapp.com",
  projectId: "oblian",
  storageBucket: "oblian.firebasestorage.app",
  messagingSenderId: "602066447376",
  appId: "1:602066447376:web:86062630324fc903b6ae95"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);