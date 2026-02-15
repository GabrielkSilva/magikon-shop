export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string; // Mantido para compatibilidade (será a primeira imagem)
  images?: string[]; // Novo campo para múltiplas imagens
  price?: number;
  stock?: number;
  createdAt: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string; 
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  imgbbApiKey?: string;
}