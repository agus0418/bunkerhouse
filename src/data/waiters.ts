import { Waiter } from '@/types/firebase';
import { WaiterRating } from '@/types/firebase';

// Función auxiliar para inicializar un mozo con las propiedades de valoración
const initializeWaiter = (waiter: Omit<Waiter, 'ratings' | 'averageRating'>): Waiter => ({
  ...waiter,
  ratings: [],
  averageRating: 0,
  totalTips: 0
});

export const waiters: Waiter[] = [
  initializeWaiter({
    id: '1',
    name: 'Juan Pérez',
    photo: '/images/waiters/waiter1.jpg',
    isActive: true,
    dni: '',
    categoryRatings: { attention: 0, friendliness: 0, speed: 0, knowledge: 0 },
    achievements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    performance: { 
      monthlyRanking: undefined, 
      totalTips: 0,
      averageServiceTime: 0,
      totalTablesServed: 0,
      bestShift: '',
      bestDay: '',
      totalLikes: 0,
      highlightedReviews: 0
    },
    totalTips: 0
  }),
  initializeWaiter({
    id: '2',
    name: 'María García',
    photo: '/images/waiters/waiter2.jpg',
    isActive: true,
    dni: '',
    categoryRatings: { attention: 0, friendliness: 0, speed: 0, knowledge: 0 },
    achievements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    performance: { 
      monthlyRanking: undefined, 
      totalTips: 0,
      averageServiceTime: 0,
      totalTablesServed: 0,
      bestShift: '',
      bestDay: '',
      totalLikes: 0,
      highlightedReviews: 0
    },
    totalTips: 0
  }),
  initializeWaiter({
    id: '3',
    name: 'Carlos Rodríguez',
    photo: '/images/waiters/waiter3.jpg',
    isActive: true,
    dni: '',
    categoryRatings: { attention: 0, friendliness: 0, speed: 0, knowledge: 0 },
    achievements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    performance: { 
      monthlyRanking: undefined, 
      totalTips: 0,
      averageServiceTime: 0,
      totalTablesServed: 0,
      bestShift: '',
      bestDay: '',
      totalLikes: 0,
      highlightedReviews: 0
    },
    totalTips: 0
  }),
  initializeWaiter({
    id: '4',
    name: 'Ana Martínez',
    photo: '/images/waiters/waiter4.jpg',
    isActive: true,
    dni: '',
    categoryRatings: { attention: 0, friendliness: 0, speed: 0, knowledge: 0 },
    achievements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    performance: { 
      monthlyRanking: undefined, 
      totalTips: 0,
      averageServiceTime: 0,
      totalTablesServed: 0,
      bestShift: '',
      bestDay: '',
      totalLikes: 0,
      highlightedReviews: 0
    },
    totalTips: 0
  }),
  initializeWaiter({
    id: '5',
    name: 'Luis Sánchez',
    photo: '/images/waiters/waiter5.jpg',
    isActive: true,
    dni: '',
    categoryRatings: { attention: 0, friendliness: 0, speed: 0, knowledge: 0 },
    achievements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    performance: { 
      monthlyRanking: undefined, 
      totalTips: 0,
      averageServiceTime: 0,
      totalTablesServed: 0,
      bestShift: '',
      bestDay: '',
      totalLikes: 0,
      highlightedReviews: 0
    },
    totalTips: 0
  })
];

export const addWaiterRating = (waiterId: string, rating: WaiterRating) => {
  const waiter = waiters.find(w => w.id === waiterId);
  if (waiter) {
    waiter.ratings.push(rating);
    // Calcular nuevo promedio
    const total = waiter.ratings.reduce((sum, r) => sum + r.rating, 0);
    waiter.averageRating = total / waiter.ratings.length;
  }
}; 