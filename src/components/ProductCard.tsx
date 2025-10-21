import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/firebase';
import { FaStar, FaImage } from 'react-icons/fa';
import ProductRatingComponent from './ProductRating';

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
    <div className="magazine-product-card group relative w-full safe-container" style={{ fontFamily: "'Mileast', 'Montserrat', 'Maxwell Regular', 'Bonaro Clean', 'Newry Demo', serif" }}>
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-black/85 via-gray-900/95 to-black/85 rounded-3xl overflow-hidden shadow-2xl w-full" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`, backgroundSize: '20px 20px' }}>
        <div className="flex items-stretch min-h-[180px] md:flex-row flex-col w-full">
          {/* Imagen del producto - Estilo revista */}
          <div className="relative w-full md:w-48 h-48 md:h-auto md:flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900">
            {!imageError && localProduct.image ? (
              <Image
                src={localProduct.image}
                alt={localProduct.name}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 192px"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <FaImage size={40} />
              </div>
            )}
          </div>

          {/* Contenido del producto - Estilo revista premium */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-between w-full">
            
            {/* Header del producto */}
            <div className="mb-2 sm:mb-3 md:mb-6">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 pr-2">
                  <h3 className="product-name text-lg sm:text-xl font-bold text-white leading-tight tracking-wide text-ellipsis">
                    {localProduct.name}
                  </h3>
                  
                  {/* Línea decorativa */}
                  <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-gray-400 to-transparent mt-1 sm:mt-2"></div>
                </div>
                
                {/* Rating badge elegante */}
                <div
                  className="bg-white/95 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-2 cursor-pointer ml-1 sm:ml-2 md:ml-4 flex-shrink-0"
                  onClick={() => setShowRating(true)}
                >
                  <FaStar className="text-yellow-500" size={10} />
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    {localProduct.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-xs text-gray-600 hidden sm:inline">
                    ({localProduct.ratings?.length || 0})
                  </span>
                </div>
              </div>
              
              {/* Descripción elegante */}
              {localProduct.description && (
                <div className="mb-2 sm:mb-4">
                  <p className="product-description text-gray-300 text-sm sm:text-base leading-relaxed font-light line-clamp-2">
                    {localProduct.description}
                  </p>
                </div>
              )}
            </div>

            {/* Sección de precios premium */}
            <div className="space-y-2 sm:space-y-3">
              {localProduct.variations && localProduct.variations.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2 sm:mb-3">Opciones Disponibles</div>
                  {localProduct.variations.map((variation, index) => (
                    <div key={variation.id} className="flex justify-between items-center py-1 sm:py-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gray-400 to-white"></div>
                        <span className="product-variation text-gray-300 text-sm sm:text-base text-ellipsis">{variation.name}</span>
                      </div>
                      <span className="product-price text-base sm:text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
                        ${variation.price}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between items-end">
                  <div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-400 to-white"></div>
                      <span className="text-gray-400 text-sm sm:text-base">Precio</span>
                    </div>
                  </div>
                  <p className="product-price text-lg sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider">
                    ${localProduct.price}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {showRating && (
        <div className="p-4">
          <ProductRatingComponent
            product={localProduct}
            onRatingSubmit={handleRatingSubmit}
            onClose={() => setShowRating(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ProductCard;