import { 
  addDoc as fsAddDoc, 
  setDoc as fsSetDoc, 
  deleteDoc as fsDeleteDoc, 
  updateDoc as fsUpdateDoc,
  DocumentReference, 
  CollectionReference,
  serverTimestamp
} from 'firebase/firestore';

interface SafeResult {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * Safely adds a document to a collection.
 * Includes updatedAt timestamp automatically.
 */
export const safeAddDoc = async (
  ref: CollectionReference, 
  data: any
): Promise<SafeResult> => {
  try {
    const docRef = await fsAddDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("FIRESTORE_WRITE_ERROR (addDoc)", { path: ref.path, error });
    return { success: false, error: error.message || "Falha ao criar registro." };
  }
};

/**
 * Safely sets a document (create or overwrite).
 * Usage: safeSetDoc(ref, data, { merge: true })
 */
export const safeSetDoc = async (
  ref: DocumentReference, 
  data: any, 
  options: { merge?: boolean } = {}
): Promise<SafeResult> => {
  try {
    await fsSetDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    }, options);
    return { success: true, id: ref.id };
  } catch (error: any) {
    console.error("FIRESTORE_WRITE_ERROR (setDoc)", { path: ref.path, error });
    return { success: false, error: error.message || "Falha ao salvar dados." };
  }
};

/**
 * Safely updates an existing document.
 * Fails if document does not exist. Use safeSetDoc with merge if unsure.
 */
export const safeUpdateDoc = async (
  ref: DocumentReference, 
  data: any
): Promise<SafeResult> => {
  try {
    await fsUpdateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true, id: ref.id };
  } catch (error: any) {
    console.error("FIRESTORE_WRITE_ERROR (updateDoc)", { path: ref.path, error });
    return { success: false, error: error.message || "Falha ao atualizar registro." };
  }
};

/**
 * Safely deletes a document.
 */
export const safeDeleteDoc = async (ref: DocumentReference): Promise<SafeResult> => {
  try {
    await fsDeleteDoc(ref);
    return { success: true };
  } catch (error: any) {
    console.error("FIRESTORE_WRITE_ERROR (deleteDoc)", { path: ref.path, error });
    return { success: false, error: error.message || "Falha ao remover registro." };
  }
};