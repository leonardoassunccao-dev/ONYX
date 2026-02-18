import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, disableNetwork } from "firebase/firestore";

// Configuração Obrigatória
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

// Habilitar persistência offline
// Isso permite que o app funcione sem internet e sincronize depois
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistência offline falhou: Múltiplas abas abertas.');
  } else if (err.code == 'unimplemented') {
    console.warn('Browser não suporta persistência offline.');
  }
});

export { auth, db };
