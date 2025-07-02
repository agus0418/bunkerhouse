import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/firebase';
import { FaTag, FaInfoCircle, FaStar, FaImage } from 'react-icons/fa';
import RatingStars from './RatingStars';
import ProductRatingComponent from './ProductRating';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  onRatingSubmit?: (productId: string, rating: any) => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onRatingSubmit }) => {
  const [showRating, setShowRating] = useState(false);
  const [localProduct, setLocalProduct] = useState(product);
  const [imageError, setImageError] = useState(false);

  const handleRatingSubmit = async (rating: any) => {
    console.log('Iniciando envío de valoración:', { productId: product.id, rating });
    
    if (!onRatingSubmit) {
      console.error('onRatingSubmit no está definido');
      return;
    }

    try {
      console.log('Llamando a onRatingSubmit...');
      await onRatingSubmit(product.id, rating);
      console.log('onRatingSubmit completado exitosamente');
      
      // Actualizar el producto local con la nueva valoración
      const updatedRatings = [...(localProduct.ratings || []), rating];
      const newAverageRating = updatedRatings.reduce((acc, curr) => acc + curr.rating, 0) / updatedRatings.length;
      
      console.log('Actualizando estado local:', { 
        newRatings: updatedRatings.length, 
        newAverageRating 
      });
      
      setLocalProduct({
        ...localProduct,
        ratings: updatedRatings,
        averageRating: newAverageRating
      });
      
      setShowRating(false);
    } catch (error) {
      console.error('Error en handleRatingSubmit:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="elegant-product-card rounded-xl overflow-hidden group"
    >
      <div className="relative">
        <div className="flex items-start p-4 gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-gray-800 transition-all duration-300 bg-gray-800">
            {!imageError && localProduct.image ? (
              <Image
                src={localProduct.image}
                alt={localProduct.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="80px"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                <FaImage size={24} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 tracking-wide group-hover:text-gray-200 transition-colors duration-300">
              {localProduct.name}
            </h3>
            {localProduct.description && (
              <div className="flex items-start gap-2 mb-2">
                <FaInfoCircle className="text-gray-400 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-400 line-clamp-2">
                  {localProduct.description}
                </p>
              </div>
            )}
            {localProduct.variations && localProduct.variations.length > 0 ? (
              <div className="space-y-1">
                {localProduct.variations.map((variation) => (
                  <div key={variation.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaTag className="text-gray-400 text-sm" />
                      <span className="text-sm text-gray-300">{variation.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">${variation.price}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xl font-bold text-white tracking-wider group-hover:text-gray-200 transition-colors duration-300">
                ${localProduct.price}
              </p>
            )}
          </div>
        </div>

        {/* Rating overlay */}
        <div 
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer hover:bg-white transition-colors duration-300"
          onClick={() => setShowRating(true)}
        >
          <div className="flex items-center gap-1">
            <FaStar className="text-yellow-400" size={14} />
            <span className="text-sm font-medium text-gray-700">
              {localProduct.averageRating?.toFixed(1) || '0.0'}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <span className="text-xs text-gray-500">
            {localProduct.ratings?.length || 0}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-800"
          >
            <div className="p-4">
              <ProductRatingComponent
                product={localProduct}
                onRatingSubmit={handleRatingSubmit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductCard; 