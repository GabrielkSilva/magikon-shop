import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { FirebaseConfig } from '../types';

// --- CONFIGURAÇÃO ---

// Chave do ImgBB configurada
const DEFAULT_IMGBB_API_KEY = "1fd79fbbb8b79c760bd583874990387d"; 

const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyBNj_S0MjDgSf8bogCfwuRS_CuKdxp8ISM",
  authDomain: "magikon-shop-5cfa7.firebaseapp.com",
  projectId: "magikon-shop-5cfa7",
  storageBucket: "magikon-shop-5cfa7.firebasestorage.app",
  messagingSenderId: "788573062281",
  appId: "1:788573062281:web:38e4b8f2a1b4b39cff3258",
  measurementId: "G-C7B97NY3EW"
};

const STORAGE_KEY = 'magikon_shop_config';

export const getStoredConfig = (): FirebaseConfig | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const saveConfig = (config: FirebaseConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
};

export const clearConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

// Singleton instances
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

export const isInitialized = (): boolean => {
  return !!app;
};

export const initFirebase = (): boolean => {
  if (getApps().length > 0) {
    app = getApps()[0];
    db = getFirestore(app);
    return true;
  }

  try {
    const stored = getStoredConfig();
    // Use stored config if available, otherwise use default
    const config = stored || defaultFirebaseConfig;
    
    app = initializeApp(config);
    db = getFirestore(app);
    return true;
  } catch (error) {
    console.error("Erro na inicialização do Firebase:", error);
    return false;
  }
};

// Inicializa imediatamente
initFirebase();

// --- Métodos de Serviço ---

// Coleções
export const PRODUCTS_COLLECTION = 'products';
export const CATEGORIES_COLLECTION = 'categories';

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  });
};

export const addItem = async (collectionName: string, data: any) => {
  if (!db) throw new Error("Banco de dados não conectado.");
  await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Date.now()
  });
};

export const updateItem = async (collectionName: string, id: string, data: any) => {
  if (!db) throw new Error("Banco de dados não conectado");
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now() 
  });
};

export const deleteItem = async (collectionName: string, id: string) => {
  if (!db) throw new Error("Banco de dados não conectado");
  await deleteDoc(doc(db, collectionName, id));
};

/**
 * Faz upload da imagem para o ImgBB
 */
export const uploadImage = async (file: File): Promise<string> => {
  const stored = getStoredConfig();
  const apiKey = stored?.imgbbApiKey || DEFAULT_IMGBB_API_KEY;

  if (!apiKey || apiKey === "SUA_CHAVE_IMGBB_AQUI") {
    throw new Error("Chave de API do ImgBB não configurada.");
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Falha no upload da imagem');
    }

    return data.data.url;
  } catch (error) {
    console.error("Erro no upload ImgBB:", error);
    throw new Error("Falha ao conectar com ImgBB.");
  }
};