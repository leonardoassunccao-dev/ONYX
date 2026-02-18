import { db } from '../db';
import { UserAccount } from '../types';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  AuthError
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch 
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDIwuXKnyGqMzLbnci_FjgTXvo-N66YDGk",
  authDomain: "oblian.firebaseapp.com",
  projectId: "oblian",
  storageBucket: "oblian.firebasestorage.app",
  messagingSenderId: "602066447376",
  appId: "1:602066447376:web:86062630324fc903b6ae95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

/**
 * Cloud Service - ONYX Link System (Real Firebase Implementation)
 * 
 * Manages Authentication via Firebase Auth.
 * Manages Synchronization via Firestore (Users/{uid}/{tableName}/{docId}).
 */
class CloudService {
  private USER_KEY = 'onyx_user_session';
  private SYNC_KEY = 'onyx_last_sync';
  
  // --- AUTHENTICATION ---

  getCurrentUser(): UserAccount | null {
    // We maintain a local mirror for synchronous access during rendering
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  async login(email: string, password: string): Promise<UserAccount> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = this.mapFirebaseUserToAccount(userCredential.user);
      this.saveSession(user);
      return user;
    } catch (error: any) {
      throw this.normalizeAuthError(error);
    }
  }

  async register(email: string, password: string): Promise<UserAccount> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = this.mapFirebaseUserToAccount(userCredential.user);
      this.saveSession(user);
      return user;
    } catch (error: any) {
      throw this.normalizeAuthError(error);
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SYNC_KEY);
  }

  private mapFirebaseUserToAccount(fbUser: FirebaseUser): UserAccount {
    return {
      id: fbUser.uid,
      email: fbUser.email || 'unknown@onyx.system',
      lastSync: parseInt(localStorage.getItem(this.SYNC_KEY) || '0')
    };
  }

  private saveSession(user: UserAccount) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private normalizeAuthError(error: AuthError): Error {
    console.error("Firebase Auth Error:", error.code, error.message);
    switch (error.code) {
      case 'auth/invalid-email': return new Error('Formato de e-mail inválido.');
      case 'auth/user-disabled': return new Error('Usuário desativado pelo sistema.');
      case 'auth/user-not-found': return new Error('Usuário não encontrado.');
      case 'auth/wrong-password': return new Error('Credenciais inválidas.');
      case 'auth/email-already-in-use': return new Error('E-mail já cadastrado no sistema.');
      case 'auth/weak-password': return new Error('Senha muito fraca (min 6 caracteres).');
      default: return new Error('Falha na autenticação do servidor.');
    }
  }

  // --- SYNCHRONIZATION ---

  async syncAll(): Promise<{ success: boolean; message: string }> {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: "Acesso negado. Usuário desconectado." };

    // Update session from Firebase instance if available
    if (auth.currentUser) {
      this.saveSession(this.mapFirebaseUserToAccount(auth.currentUser));
    }

    const lastSync = parseInt(localStorage.getItem(this.SYNC_KEY) || '0');
    const now = Date.now();

    try {
      // Iterate over all Dexie tables defined in db
      const tables = (db as any).tables.map((t: any) => t.name);

      for (const tableName of tables) {
        if (tableName === 'app_state') continue; // Skip local-only state
        await this.syncTable(tableName, user.id, lastSync);
      }

      localStorage.setItem(this.SYNC_KEY, now.toString());
      return { success: true, message: `Uplink estabelecido às ${new Date(now).toLocaleTimeString()}` };
    } catch (error) {
      console.error("Sync Failed", error);
      return { success: false, message: "Erro de conexão com servidor Onyx." };
    }
  }

  /**
   * Syncs a single table using Firestore
   * Strategy:
   * 1. PUSH: Send local items updated since last sync to Firestore.
   * 2. PULL: Get remote items updated since last sync from Firestore.
   * 3. MERGE: Apply to local DB.
   */
  private async syncTable(tableName: string, userId: string, lastSync: number) {
    const table = (db as any).table(tableName);

    // --- 1. PUSH (Local -> Cloud) ---
    const localChanges = await table
      .filter((item: any) => (item.updatedAt || 0) > lastSync)
      .toArray();

    if (localChanges.length > 0) {
      const batch = writeBatch(firestore);
      
      for (const item of localChanges) {
        // We use the ID as the document ID. If ID is number, convert to string.
        // We ensure ID exists.
        if (!item.id) continue;
        
        const docRef = doc(firestore, "users", userId, tableName, item.id.toString());
        // Sanitize undefined values for Firestore
        const cleanItem = JSON.parse(JSON.stringify(item));
        batch.set(docRef, cleanItem);
      }
      
      await batch.commit();
    }

    // --- 2. PULL (Cloud -> Local) ---
    const collectionRef = collection(firestore, "users", userId, tableName);
    const q = query(collectionRef, where("updatedAt", ">", lastSync));
    const querySnapshot = await getDocs(q);
    
    const remoteChanges: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      remoteChanges.push(data);
    });

    // --- 3. MERGE ---
    if (remoteChanges.length > 0) {
       await (db as any).transaction('rw', table, async () => {
         await table.bulkPut(remoteChanges);
       });
    }
  }
}

export const cloud = new CloudService();
