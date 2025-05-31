import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/types/firebase';
import RatingStars from './RatingStars';

interface ProductRatingProps {
  product: Product;
  onRatingSubmit: (rating: any) => Promise<void>;
}

const ProductRatingComponent: React.FC<ProductRatingProps> = ({ product, onRatingSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setError(null);

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
      
      // Limpiar el formulario solo si el envío fue exitoso
      setRating(0);
      setComment('');
      setUserName('');
    } catch (error) {
      console.error('Error al enviar la valoración:', error);
      setError('Hubo un error al enviar la valoración. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-sm rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Valorar {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <RatingStars rating={product.averageRating || 0} readonly size={16} />
          <span className="text-sm text-gray-300">
            ({product.ratings?.length || 0})
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Tu valoración
          </label>
          <RatingStars
            rating={rating}
            onRatingChange={setRating}
            size={24}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="userName" className="text-sm font-medium text-gray-300">
              Nombre
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              placeholder="Tu experiencia..."
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            rating === 0 || isSubmitting
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar valoración'}
        </button>
      </form>

      {product.ratings && product.ratings.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Valoraciones recientes
          </h4>
          <div className="space-y-2">
            {product.ratings.slice(0, 2).map((rating) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-black/30 p-3 rounded-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white text-sm">
                    {rating.userName}
                  </span>
                  <RatingStars rating={rating.rating} readonly size={14} />
                </div>
                {rating.comment && (
                  <p className="text-gray-300 text-sm">{rating.comment}</p>
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
};

export default ProductRatingComponent; 