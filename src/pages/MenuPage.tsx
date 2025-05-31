import React from 'react';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';
import { motion } from 'framer-motion';
import { ProductRating } from '@/types/firebase';

export const MenuPage: React.FC = () => {
  const handleRatingSubmit = async (productId: string, rating: any): Promise<void> => {
    const product = products.find(p => p.id === parseInt(productId, 10));

    if (product) {
      product.ratings.push(rating as ProductRating);
      const total = product.ratings.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = total / product.ratings.length;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Nuestra Carta
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const productWithCorrectedId = { 
              ...product,
              id: product.id.toString()
            };

            return (
              <motion.div
                key={productWithCorrectedId.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: products.indexOf(product) * 0.1 }}
              >
                <ProductCard
                  product={productWithCorrectedId}
                  onRatingSubmit={(rating) => handleRatingSubmit(productWithCorrectedId.id, rating)}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}; 