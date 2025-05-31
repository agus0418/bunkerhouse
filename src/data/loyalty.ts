import { LoyaltyProgram } from './products';

// Niveles del programa de fidelización
export const LOYALTY_LEVELS = {
  BRONZE: {
    minPoints: 0,
    benefits: [
      "Acceso a promociones básicas",
      "Newsletter mensual"
    ]
  },
  SILVER: {
    minPoints: 1000,
    benefits: [
      "Todos los beneficios BRONZE",
      "10% de descuento en cumpleaños",
      "Acceso a eventos exclusivos"
    ]
  },
  GOLD: {
    minPoints: 5000,
    benefits: [
      "Todos los beneficios SILVER",
      "15% de descuento en cumpleaños",
      "Degustación gratuita mensual",
      "Reserva prioritaria"
    ]
  },
  PLATINUM: {
    minPoints: 10000,
    benefits: [
      "Todos los beneficios GOLD",
      "20% de descuento en cumpleaños",
      "Cena privada anual con el chef",
      "Acceso VIP a eventos especiales"
    ]
  }
};

// Puntos por cada peso gastado
export const POINTS_PER_PESO = 0.1;

export const calculateLoyaltyPoints = (amount: number): number => {
  return Math.floor(amount * POINTS_PER_PESO);
};

export const calculateLoyaltyLevel = (points: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' => {
  if (points >= LOYALTY_LEVELS.PLATINUM.minPoints) return 'PLATINUM';
  if (points >= LOYALTY_LEVELS.GOLD.minPoints) return 'GOLD';
  if (points >= LOYALTY_LEVELS.SILVER.minPoints) return 'SILVER';
  return 'BRONZE';
};

export const getLoyaltyBenefits = (level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'): string[] => {
  return LOYALTY_LEVELS[level].benefits;
};

// Función para actualizar el programa de fidelización de un usuario
export const updateLoyaltyProgram = (
  program: LoyaltyProgram,
  purchaseAmount: number
): LoyaltyProgram => {
  const newPoints = program.points + calculateLoyaltyPoints(purchaseAmount);
  const newLevel = calculateLoyaltyLevel(newPoints);
  
  return {
    ...program,
    points: newPoints,
    level: newLevel,
    benefits: getLoyaltyBenefits(newLevel),
    lastPurchase: new Date().toISOString(),
    totalSpent: program.totalSpent + purchaseAmount
  };
}; 