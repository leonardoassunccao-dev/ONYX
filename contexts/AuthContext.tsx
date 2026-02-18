import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db as firestore } from '../lib/firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { db as dexieDb } from '../db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

      await migrateTable('profile', 'profile');
      await migrateTable('settings', 'settings');
      await migrateTable('habits', 'habits');
      await migrateTable('habit_checkins', 'habit_checkins');
      await migrateTable('finance_transactions', 'finance_transactions');
      await migrateTable('fixed_expenses', 'fixed_expenses');
      await migrateTable('pacer_workouts', 'pacer_workouts');
      await migrateTable('books', 'books');
      await migrateTable('reading_sessions', 'reading_sessions');
      await migrateTable('study_sessions', 'study_sessions');
      await migrateTable('work_tasks', 'work_tasks');
      await migrateTable('session_goals', 'session_goals');
      await migrateTable('goal_checkins', 'goal_checkins');
      await migrateTable('quotes', 'quotes');
      
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
  const register = (e: string, p: string) => createUserWithEmailAndPassword(auth, e, p).then(() => {});
  const logout = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
