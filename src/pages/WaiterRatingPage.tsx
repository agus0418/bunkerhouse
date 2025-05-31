import React from 'react';
import { WaiterRatingComponent } from '../components/WaiterRating';
import { waiters } from '../data/waiters';
import { motion } from 'framer-motion';

export const WaiterRatingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Valora a Nuestros Mozos
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {waiters.map((waiter, index) => (
            <motion.div
              key={waiter.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <WaiterRatingComponent
                waiter={waiter}
                onRatingSubmit={(rating) => {
                  // Aquí manejamos la nueva valoración
                  const updatedWaiter = waiters.find(w => w.id === waiter.id);
                  if (updatedWaiter) {
                    updatedWaiter.ratings.push(rating);
                    const total = updatedWaiter.ratings.reduce((sum, r) => sum + r.rating, 0);
                    updatedWaiter.averageRating = total / updatedWaiter.ratings.length;
                  }
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}; 