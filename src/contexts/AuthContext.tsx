import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db as firestore } from '../lib/firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string, n: string) => Promise<void>;
  logout: () => Promise<void>;
  setGlobalError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p).then(() => {});
  
  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    
    // Minimal profile creation
    await setDoc(doc(firestore, 'users', uid, 'profile', 'profile'), {
      name: name || 'Agente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    await setDoc(doc(firestore, 'users', uid, 'system', 'settings'), {
      meetingMode: false,
      greetingsEnabled: true,
      accent: '#D4AF37',
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const logout = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setGlobalError }}>
      {globalError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-red-900 text-white px-6 py-3 rounded border border-red-500 font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="hover:text-zinc-400 transition-colors">
            [ FECHAR ]
          </button>
        </div>
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
};