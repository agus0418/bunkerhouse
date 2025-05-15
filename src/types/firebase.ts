import { Timestamp } from 'firebase/firestore';

export interface FirebaseProduct {
  id_firebase: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  type: string;
  variations: FirebaseVariation[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirebaseVariation {
  id_firebase: string;
  name: string;
  price: number;
  tags?: string[];
}

export interface FirebaseCategories {
  BEBIDAS: string[];
  COMIDAS: string[];
}

export interface Variation {
  id: number;
  name: string;
  price: number;
  tags?: string[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  category: string;
  type: string;
  variations: Variation[];
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'COMIDAS' | 'BEBIDAS';
  description?: string;
} 