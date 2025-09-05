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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="magazine-product-card group relative"
    >
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1200"></div>
      </div>

      <div className="relative backdrop-blur-xl bg-gradient-to-br from-black/85 via-gray-900/95 to-black/85 border border-gray-600/30 group-hover:border-gray-500/50 transition-all duration-700 rounded-3xl overflow-hidden shadow-2xl">
        
        <div className="flex items-stretch min-h-[180px]">
          {/* Imagen del producto - Estilo revista */}
          <div className="relative w-48 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900">
            {!imageError && localProduct.image ? (
              <Image
                src={localProduct.image}
                alt={localProduct.name}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                sizes="192px"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <FaImage size={40} />
              </div>
            )}
            
            {/* Overlay elegante */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 group-hover:to-black/10 transition-all duration-700" />
            
            {/* Número decorativo */}
            <div className="absolute top-4 left-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-gray-800">#{Math.floor(Math.random() * 99) + 1}</span>
            </div>
          </div>

          {/* Contenido del producto - Estilo revista premium */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            
            {/* Header del producto */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="product-name text-xl font-bold text-white leading-tight tracking-wide group-hover:text-gray-100 transition-colors duration-500">
                    {localProduct.name}
                  </h3>
                  
                  {/* Línea decorativa */}
                  <div className="w-16 h-0.5 bg-gradient-to-r from-gray-400 to-transparent mt-2 group-hover:w-24 transition-all duration-500"></div>
                </div>
                
                {/* Rating badge elegante */}
                <div 
                  className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer hover:bg-white hover:shadow-lg transition-all duration-300 ml-4"
                  onClick={() => setShowRating(true)}
                >
                  <FaStar className="text-yellow-500" size={14} />
                  <span className="text-sm font-bold text-gray-800">
                    {localProduct.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({localProduct.ratings?.length || 0})
                  </span>
                </div>
              </div>
              
              {/* Descripción elegante */}
              {localProduct.description && (
                <div className="mb-4">
                  <p className="product-description text-gray-300 text-base leading-relaxed group-hover:text-gray-200 transition-colors duration-500 font-light">
                    {localProduct.description}
                  </p>
                </div>
              )}
            </div>

            {/* Sección de precios premium */}
            <div className="space-y-3">
              {localProduct.variations && localProduct.variations.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">Opciones Disponibles</div>
                  {localProduct.variations.map((variation, index) => (
                    <div key={variation.id} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gray-400 to-white"></div>
                        <span className="text-gray-300 font-medium tracking-wide">{variation.name}</span>
                      </div>
                                          <span className="product-price text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
                      ${variation.price}
                    </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">Precio</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-400 to-white"></div>
                      <span className="text-gray-400 text-sm">Precio único</span>
                    </div>
                  </div>
                  <p className="product-price text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
                    ${localProduct.price}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicador de hover elegante */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center"></div>
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
                onClose={() => setShowRating(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductCard;