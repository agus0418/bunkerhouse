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
  price: number;
  image: string;
  category: string;
  type: 'COMIDAS' | 'BEBIDAS';
  description?: string;
  variations: Variation[];
  ratings: ProductRating[];
  averageRating: number;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'COMIDAS' | 'BEBIDAS';
  description?: string;
}

export interface ProductRating {
  id: number;
  userId: string;
  rating: number;
  comment?: string;
  date: string;
  userName: string;
}

export interface Waiter {
  id: string;
  name: string;
  photo: string;
  email?: string;
  phone?: string;
  dni: string;
  isActive: boolean;
  ratings: WaiterRating[];
  averageRating: number;
  categoryRatings: {
    attention: number;
    friendliness: number;
    speed: number;
    knowledge: number;
  };
  achievements: WaiterAchievement[];
  shifts?: WaiterShift[];
  currentTables?: WaiterTable[];
  notes?: WaiterNote[];
  performance?: {
    averageServiceTime: number;
    totalTablesServed: number;
    totalTips: number;
    bestShift: string;
    bestDay: string;
    monthlyRanking?: number;
    totalLikes?: number;
    highlightedReviews?: number;
  };
  createdAt: string;
  updatedAt: string;
  totalTips: number;
}

export interface WaiterRating {
  id: number;
  userId: string;
  rating: number;
  comment?: string;
  date: string;
  userName: string;
  customerName: string; // Nuevo campo
  tableNumber: number;
  categories: {
    attention: number;
    friendliness: number;
    speed: number;
    knowledge: number;
  };
  tip: number;
  isHighlighted: boolean;
  likes: number;
  photos: string[];
}

export interface WaiterAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  date: string;
  type: 'monthly' | 'special' | 'milestone';
}

export interface WaiterShift {
  id: string;
  waiterId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'absent';
  notes?: string;
}

export interface WaiterTable {
  id: string;
  waiterId: string;
  tableNumber: number;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed';
  customerCount: number;
  totalAmount: number;
  tipAmount: number;
}

export interface WaiterNote {
  id: string;
  type: 'desempeño' | 'incidente' | 'logro' | 'entrenamiento' | 'general' | 'puntualidad';
  content: string;
  date: string;
  createdBy: string;
}

export interface Settings {
  restaurantName: string;
  enableRatings: boolean;
  enableWaiterRatings: boolean;
  requireTableNumber: boolean;
  darkMode: boolean;
  updatedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
  lastLogin?: string;
  createdBy?: string; // ID del usuario que lo creó
  permissions?: {
    canManageUsers: boolean;
    canManageProducts: boolean;
    canManageWaiters: boolean;
    canViewStatistics: boolean;
    canManageSettings: boolean;
    canManageCategories: boolean;
  };
} 