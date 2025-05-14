import { Timestamp } from 'firebase/firestore';

export interface FirebaseProduct {
  id: number;
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
  id: number;
  name: string;
  price: number;
  tags: string[];
}

export interface FirebaseCategories {
  BEBIDAS: string[];
  COMIDAS: string[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  category: string;
  type: string;
  variations: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
} 