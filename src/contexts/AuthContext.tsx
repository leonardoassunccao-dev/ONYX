import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db as firestore } from '../lib/firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { db as dexieDb } from '../db';
import { X, AlertTriangle } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  globalError: string | null;
  setGlobalError: (msg: string | null) => void;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string, n: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (globalError) {
      const t = setTimeout(() => setGlobalError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [globalError]);

  const migrateLocalData = async (uid: string) => {
    try {
      const userSettingsRef = doc(firestore, 'users', uid, 'system', 'settings');
      const settingsSnap = await getDoc(userSettingsRef);

      if (settingsSnap.exists() && settingsSnap.data().migrated) {
        return;
      }

      console.log("MIGRATING DATA...");
      const batch = writeBatch(firestore);
      
      const migrateTable = async (tableName: string, collectionName: string) => {
        const items = await (dexieDb as any).table(tableName).toArray();
        items.forEach((item: any) => {
          const docId = item.id ? item.id.toString() : doc(collection(firestore, 'users', uid, collectionName)).id;
          const docRef = doc(firestore, 'users', uid, collectionName, docId);
          const { id, ...data } = item;
          batch.set(docRef, { ...data, migratedAt: Date.now() });
        });
      };

      // Standardized Paths for Migration
      await migrateTable('profile', 'profile'); // Migrates to users/{uid}/profile (will need manual handling for docId if strictly 'profile')
      await migrateTable('settings', 'system'); // Migrates to users/{uid}/system
      await migrateTable('habits', 'habit_items');
      await migrateTable('habit_checkins', 'habit_checkins');
      await migrateTable('finance_transactions', 'finance_transactions');
      await migrateTable('fixed_expenses', 'fixed_expenses');
      await migrateTable('pacer_workouts', 'pacer_workouts');
      await migrateTable('books', 'reading_books');
      await migrateTable('reading_sessions', 'reading_sessions');
      await migrateTable('study_sessions', 'study_sessions');
      await migrateTable('work_tasks', 'work_items');
      await migrateTable('session_goals', 'goal_items');
      await migrateTable('goal_checkins', 'goal_checkins');
      await migrateTable('quotes', 'system_quotes');
      
      batch.set(userSettingsRef, { migrated: true, updatedAt: Date.now() }, { merge: true });
      await batch.commit();
      console.log("MIGRATION DONE.");
    } catch (error) {
      console.error("Migration error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await migrateLocalData(currentUser.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p).then(() => {});
  
  const register = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create profile document immediately
    await setDoc(doc(firestore, 'users', userCredential.user.uid, 'profile', 'profile'), {
      name: name,
      email: email,
      createdAt: serverTimestamp()
    }, { merge: true });
  };

  const logout = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, globalError, setGlobalError, login, register, logout }}>
      {!loading && children}
      
      {/* GLOBAL ERROR TOAST */}
      {globalError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-4 bg-[#1a0000] border border-red-800 text-red-200 px-6 py-4 rounded-md shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-[90vw]">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest">{globalError}</p>
          <button onClick={() => setGlobalError(null)} className="ml-2 text-red-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
};