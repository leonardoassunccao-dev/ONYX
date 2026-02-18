import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIwuXKnyGqMzLbnci_FjgTXvo-N66YDGk",
  authDomain: "oblian.firebaseapp.com",
  projectId: "oblian",
  storageBucket: "oblian.firebasestorage.app",
  messagingSenderId: "602066447376",
  appId: "1:602066447376:web:86062630324fc903b6ae95"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistence failed: Multiple tabs open.');
  } else if (err.code == 'unimplemented') {
    console.warn('Persistence not supported by browser.');
  }
});

export { auth, db };
