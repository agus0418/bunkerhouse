import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaCalendarAlt, FaHistory, FaThumbsUp, FaCamera, FaTrophy, FaMedal, FaAward } from 'react-icons/fa';
import RatingStars from './RatingStars';
import { Waiter, WaiterRating, WaiterAchievement } from '@/types/firebase';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface WaiterRatingProps {
  waiter: Waiter;
  onRatingSubmit: (waiterId: string, rating: WaiterRating) => Promise<void>;
}

export const WaiterRatingComponent: React.FC<WaiterRatingProps> = ({ waiter, onRatingSubmit }) => {
  const [rating, setRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<{
    attention: number;
    friendliness: number;
    speed: number;
    knowledge: number;
  }>({
    attention: 0,
    friendliness: 0,
    speed: 0,
    knowledge: 0
  });
  const [comment, setComment] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(tableNumber) <= 0 || rating === 0) {
      toast.error('Por favor, ingresa un número de mesa válido y una calificación general.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRating: WaiterRating = {
        id: Date.now(),
        userId: 'anonymous',
        rating,
        comment,
        date: new Date().toISOString(),
        userName: 'Anónimo',
        tableNumber: parseInt(tableNumber),
        categories: {
          attention: categoryRatings.attention,
          friendliness: categoryRatings.friendliness,
          speed: categoryRatings.speed,
          knowledge: categoryRatings.knowledge
        },
        tip: 0,
        isHighlighted: false,
        likes: 0,
        photos: selectedPhotos || [],
      };

      await onRatingSubmit(waiter.id.toString(), newRating);
      setRating(0);
      setCategoryRatings({
        attention: 0,
        friendliness: 0,
        speed: 0,
        knowledge: 0
      });
      setComment('');
      setTableNumber('');
      setSelectedPhotos([]);
      toast.success('¡Valoración enviada con éxito!');
    } catch (error) {
      console.error('Error al enviar la valoración:', error);
      toast.error('Error al enviar la valoración. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Aquí implementarías la lógica para subir las fotos a Firebase Storage
      // y obtener las URLs
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setSelectedPhotos([...selectedPhotos, ...newPhotos]);
    }
  };

  const renderAchievements = () => {
    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold text-white mb-2">Logros</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {waiter.achievements?.map((achievement) => (
            <div
              key={achievement.id}
              className="flex-shrink-0 bg-gray-800 rounded-lg p-3 text-center"
            >
              {achievement.type === 'monthly' ? (
                <FaTrophy className="text-yellow-400 text-2xl mx-auto mb-2" />
              ) : achievement.type === 'special' ? (
                <FaMedal className="text-blue-400 text-2xl mx-auto mb-2" />
              ) : (
                <FaAward className="text-purple-400 text-2xl mx-auto mb-2" />
              )}
              <p className="text-white text-sm">{achievement.name}</p>
              <p className="text-gray-400 text-xs">{achievement.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCategoryRatings = () => {
    const handleCategoryChange = (category: keyof typeof categoryRatings, value: number) => {
      setCategoryRatings(prev => ({
        ...prev,
        [category]: value
      }));
    };

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-gray-400 mb-1">Atención</label>
          <RatingStars
            rating={categoryRatings.attention}
            onRatingChange={(value) => handleCategoryChange('attention', value)}
          />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">Amabilidad</label>
          <RatingStars
            rating={categoryRatings.friendliness}
            onRatingChange={(value) => handleCategoryChange('friendliness', value)}
          />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">Rapidez</label>
          <RatingStars
            rating={categoryRatings.speed}
            onRatingChange={(value) => handleCategoryChange('speed', value)}
          />
        </div>
      </div>
    );
  };

  const filteredRatings = waiter.ratings?.filter(rating => {
    const ratingDate = new Date(rating.date).toISOString().split('T')[0];
    return ratingDate === selectedDate;
  }) || [];

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {waiter.photo ? (
            <img 
              src={waiter.photo} 
              alt={waiter.name} 
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-2xl text-gray-400">{waiter.name[0]}</span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-white">{waiter.name}</h3>
            <div className="flex items-center gap-2 text-gray-400">
              <FaStar className="text-yellow-400" />
              <span>{waiter.averageRating?.toFixed(1) || '0.0'}</span>
              <span className="text-sm">({waiter.ratings?.length || 0} valoraciones)</span>
            </div>
            {waiter.performance?.monthlyRanking && (
              <div className="text-sm text-yellow-400 mt-1">
                <FaTrophy className="inline mr-1" />
                Mozo del Mes #{waiter.performance.monthlyRanking}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <FaHistory />
          <span>Historial</span>
        </button>
      </div>

      {renderAchievements()}

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-400">
                <FaCalendarAlt />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-800 text-gray-300 rounded-lg px-3 py-1.5"
                />
              </div>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {filteredRatings.map((rating) => (
                <motion.div
                  key={rating.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gray-800/50 rounded-lg p-4 ${rating.isHighlighted ? 'border-2 border-yellow-400' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={rating.rating} readonly />
                      <span className="text-sm text-gray-400">
                        Mesa {rating.tableNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <FaThumbsUp />
                        <span className="text-sm ml-1">{rating.likes || 0}</span>
                      </button>
                      <span className="text-sm text-gray-500">
                        {new Date(rating.date).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-gray-300 text-sm mb-2">{rating.comment}</p>
                  )}
                  {rating.photos && rating.photos.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {rating.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Atención:</span>
                      <RatingStars rating={Number(rating.categories.attention) || 0} readonly size={16} />
                    </div>
                    <div>
                      <span className="text-gray-400">Amabilidad:</span>
                      <RatingStars rating={Number(rating.categories.friendliness) || 0} readonly size={16} />
                    </div>
                    <div>
                      <span className="text-gray-400">Rapidez:</span>
                      <RatingStars rating={Number(rating.categories.speed) || 0} readonly size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredRatings.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay valoraciones para esta fecha
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-2">Número de Mesa</label>
          <input
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-700"
            placeholder="Ingrese el número de mesa"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Calificación General</label>
          <RatingStars
            rating={rating}
            onRatingChange={setRating}
          />
        </div>

        {renderCategoryRatings()}

        <div>
          <label className="block text-gray-400 mb-2">Comentario (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-700"
            placeholder="Escriba su comentario aquí..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Fotos (opcional)</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {selectedPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="flex-shrink-0 w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <FaCamera className="text-gray-400 text-2xl" />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !tableNumber || rating === 0}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isSubmitting || !tableNumber || rating === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-gray-200'
          }`}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Valoración'}
        </button>
      </form>
    </div>
  );
}; 