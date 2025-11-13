import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Product, ProductRating } from '@/types/firebase';
import RatingStars from './RatingStars';
import { FaTimes } from 'react-icons/fa';

interface ProductRatingProps {
  product: Product;
  onRatingSubmit: (rating: ProductRating) => Promise<void>;
  onClose: () => void;
}

const ProductRatingComponent: React.FC<ProductRatingProps> = memo(({ product, onRatingSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      const newRating = {
        id: Date.now(),
        userId: 'user-' + Date.now(),
        rating,
        comment,
        date: new Date().toISOString(),
        userName: userName || 'Anónimo'
      };

      await onRatingSubmit(newRating);
      
      // Mostrar mensaje de éxito
      setIsSuccess(true);
      
      // Limpiar el formulario solo si el envío fue exitoso
      setRating(0);
      setComment('');
      setUserName('');
      
      // Cerrar el panel después de un breve delay para mostrar el éxito
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al enviar la valoración:', error);
      setError('Hubo un error al enviar la valoración. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, userName, onRatingSubmit, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-black/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 w-full"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex-1 pr-2">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Valorar {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={product.averageRating || 0} readonly size={14} />
            <span className="text-xs sm:text-sm text-gray-300">
              ({product.ratings?.length || 0})
            </span>
          </div>
        </div>
        
        {/* Botón de cerrar elegante */}
        <button
          onClick={onClose}
          className="ml-2 sm:ml-4 p-1.5 sm:p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 text-gray-400 hover:text-white transition-all duration-300 group"
          aria-label="Cerrar panel de valoración"
        >
          <FaTimes
            size={14}
            className="transform group-hover:rotate-90 transition-transform duration-300"
          />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Tu valoración
          </label>
          <div className="flex justify-center sm:justify-start">
            <RatingStars
              rating={rating}
              onRatingChange={setRating}
              size={20}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="userName" className="text-sm font-medium text-gray-300">
              Nombre
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
              placeholder="Anónimo"
            />
          </div>

          <div>
            <label htmlFor="comment" className="text-sm font-medium text-gray-300">
              Comentario
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
              rows={2}
              placeholder="Tu experiencia..."
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs sm:text-sm mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
            {error}
          </div>
        )}

        {isSuccess && (
          <div className="text-green-400 text-xs sm:text-sm mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
            ¡Valoración enviada exitosamente! Gracias por tu opinión.
          </div>
        )}

        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors text-sm sm:text-base ${
            rating === 0 || isSubmitting
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar valoración'}
        </button>
      </form>

      {product.ratings && product.ratings.length > 0 && (
        <div className="mt-3 sm:mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Valoraciones recientes
          </h4>
          <div className="space-y-2">
            {product.ratings.slice(0, 2).map((rating, index) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
                className="bg-black/30 p-2 sm:p-3 rounded-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white text-xs sm:text-sm truncate">
                    {rating.userName}
                  </span>
                  <RatingStars rating={rating.rating} readonly size={12} />
                </div>
                {rating.comment && (
                  <p className="text-gray-300 text-xs sm:text-sm line-clamp-2">{rating.comment}</p>
                )}
                <span className="text-xs text-gray-500 mt-1 block">
                  {new Date(rating.date).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

ProductRatingComponent.displayName = 'ProductRatingComponent';
export default ProductRatingComponent;