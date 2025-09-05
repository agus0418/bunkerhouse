'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Waiter, WaiterRating } from '@/types/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaUserTie, FaChevronDown, FaChevronUp, FaCheck, FaCalendarAlt, FaHistory, FaThumbsUp, FaCamera, FaTrophy, FaMedal, FaAward } from 'react-icons/fa';
import Image from 'next/image';
import RatingStars from '@/components/RatingStars';
import { toast } from 'react-hot-toast';

export default function RateWaitersPage() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWaiterId, setExpandedWaiterId] = useState<string | null>(null);
  // Estado para el formulario de valoración dentro de cada tarjeta
  const [ratingsData, setRatingsData] = useState<Record<string, { rating: number; categoryRatings: { attention: number; friendliness: number; speed: number; knowledge: number }; comment: string; tableNumber: string; tip: string; customerName: string; selectedPhotos: string[]; isSubmitting: boolean; submitted: boolean; error: string }>>({});

  useEffect(() => {
    const waitersRef = collection(db, 'waiters');
    const q = query(waitersRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const waitersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Waiter[];
      
      // Filtrar solo mozos activos y asegurar estructura inicial para ratingsData
      const activeWaiters = waitersData.filter(waiter => waiter.isActive);
      setWaiters(activeWaiters);
      
      // Inicializar ratingsData para mozos activos si no existen
      const initialRatingsData: Record<string, any> = {};
      activeWaiters.forEach(waiter => {
        if (!ratingsData[waiter.id]) {
          initialRatingsData[waiter.id] = {
            rating: 0,
            categoryRatings: { attention: 0, friendliness: 0, speed: 0, knowledge: 0 },
            comment: '',
            tableNumber: '',
            tip: '',
            customerName: '',
            selectedPhotos: [],
            isSubmitting: false,
            submitted: false,
            error: '',
          };
        } else {
          // Mantener estado existente si ya estaba ahí
          initialRatingsData[waiter.id] = ratingsData[waiter.id];
        }
      });
      setRatingsData(initialRatingsData);

      setIsLoading(false);
    }, (error) => {
      console.error('Error loading waiters:', error);
      setIsLoading(false);
      toast.error('Error al cargar mozos.');
    });

    return () => unsubscribe();
  }, []);

  const handleToggleExpand = (waiterId: string) => {
    setExpandedWaiterId(prevId => (prevId === waiterId ? null : waiterId));
  };

  const handleRatingChange = (waiterId: string, value: number) => {
    setRatingsData(prev => ({
      ...prev,
      [waiterId]: { ...prev[waiterId], rating: value }
    }));
  };

  const handleCategoryRatingChange = (waiterId: string, category: keyof typeof ratingsData[string]['categoryRatings'], value: number) => {
    setRatingsData(prev => ({
      ...prev,
      [waiterId]: {
        ...prev[waiterId],
        categoryRatings: { ...prev[waiterId].categoryRatings, [category]: value }
      }
    }));
  };

  const handleInputChange = (waiterId: string, field: keyof typeof ratingsData[string], value: string | string[]) => {
    setRatingsData(prev => ({
      ...prev,
      [waiterId]: { ...prev[waiterId], [field]: value }
    }));
  };

  const handlePhotoUpload = (waiterId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`El archivo ${file.name} no es un tipo de imagen válido.`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`El archivo ${file.name} excede el tamaño máximo permitido (5MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      // Aquí deberías implementar la subida a Firebase Storage y obtener las URLs
      // Por ahora, usaremos URLs temporales de blob
      const newPhotos = validFiles.map(file => URL.createObjectURL(file));
      setRatingsData(prev => ({
        ...prev,
        [waiterId]: { ...prev[waiterId], selectedPhotos: [...prev[waiterId].selectedPhotos, ...newPhotos] }
      }));
      toast('Simulación de subida de foto. La funcionalidad real requiere Firebase Storage.');
    }
  };

  const handleSubmitRating = async (waiterId: string) => {
    const ratingData = ratingsData[waiterId];
    if (!ratingData) return;

    // Validaciones
    if (!ratingData.tableNumber || parseInt(ratingData.tableNumber) <= 0) {
      toast.error('Por favor, ingresa un número de mesa válido.');
      return;
    }

    if (ratingData.rating === 0) {
      toast.error('Por favor, selecciona una calificación general.');
      return;
    }

    if (ratingData.categoryRatings.attention === 0 || ratingData.categoryRatings.friendliness === 0 || ratingData.categoryRatings.speed === 0) {
      toast.error('Por favor, completa todas las calificaciones por categoría.');
      return;
    }

    setRatingsData(prev => ({ ...prev, [waiterId]: { ...prev[waiterId], isSubmitting: true, error: '' } }));

    try {
      const newRating: WaiterRating = {
        id: Date.now(), // O usar un UUID
        userId: 'anonymous',
        rating: ratingData.rating,
        comment: ratingData.comment,
        date: new Date().toISOString(),
        userName: 'Anónimo',
        customerName: ratingData.customerName || 'Anónimo',
        tableNumber: parseInt(ratingData.tableNumber),
        categories: ratingData.categoryRatings,
        tip: ratingData.tip ? parseFloat(ratingData.tip) : 0,
        isHighlighted: false,
        likes: 0,
        photos: ratingData.selectedPhotos || [], // Usar las URLs temporales o de Storage
      };

      const waiterRef = doc(db, 'waiters', waiterId);
      const waiterDoc = await getDoc(waiterRef);

      if (!waiterDoc.exists()) {
        throw new Error('Mozo no encontrado en la base de datos.');
      }

      const currentWaiterData = waiterDoc.data() as Waiter;
      const currentRatings = currentWaiterData.ratings || [];
      const newAverageRating = (currentRatings.reduce((acc, curr) => acc + curr.rating, 0) + newRating.rating) / (currentRatings.length + 1);

      await updateDoc(waiterRef, {
        ratings: arrayUnion(newRating),
        averageRating: newAverageRating,
        totalTips: (currentWaiterData.totalTips || 0) + (newRating.tip || 0) // Asegurarse de sumar la propina
      });

      setRatingsData(prev => ({ ...prev, [waiterId]: { ...prev[waiterId], submitted: true, isSubmitting: false } }));
      toast.success('¡Valoración enviada con éxito!');

      // Opcional: Cerrar el desplegable después de enviar
      // setExpandedWaiterId(null);

    } catch (error) {
      console.error('Error submitting rating:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setRatingsData(prev => ({ ...prev, [waiterId]: { ...prev[waiterId], error: `Error al enviar la valoración: ${errorMessage}`, isSubmitting: false } }));
      toast.error(`Error al enviar la valoración: ${errorMessage}`);
    }
  };

  const renderCategoryRatings = (waiterId: string) => {
    const ratingData = ratingsData[waiterId];
    if (!ratingData) return null;

    return (
      <div className="space-y-3 mt-4">
        <h4 className="text-md font-semibold text-white">Calificación por Categorías</h4>
        <div>
          <label className="block text-gray-400 mb-1">Atención</label>
          <RatingStars
            rating={ratingData.categoryRatings.attention}
            onRatingChange={(value) => handleCategoryRatingChange(waiterId, 'attention', value)}
          />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">Amabilidad</label>
          <RatingStars
            rating={ratingData.categoryRatings.friendliness}
            onRatingChange={(value) => handleCategoryRatingChange(waiterId, 'friendliness', value)}
          />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">Rapidez</label>
          <RatingStars
            rating={ratingData.categoryRatings.speed}
            onRatingChange={(value) => handleCategoryRatingChange(waiterId, 'speed', value)}
          />
        </div>
        {/* Conocimiento - hacerlo opcional si no es siempre relevante */}
        {/* <div>
          <label className="block text-gray-400 mb-1">Conocimiento</label>
          <RatingStars
            rating={ratingData.categoryRatings.knowledge}
            onRatingChange={(value) => handleCategoryRatingChange(waiterId, 'knowledge', value)}
          />
        </div> */}
      </div>
    );
  };

  const renderAchievements = (waiter: Waiter) => {
    if (!waiter.achievements || waiter.achievements.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-md font-semibold text-white mb-2">Logros</h4>
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

  const renderRatingHistory = (waiter: Waiter) => {
    const [showHistory, setShowHistory] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const filteredRatings = waiter.ratings?.filter(rating => {
      const ratingDate = new Date(rating.date).toISOString().split('T')[0];
      return ratingDate === selectedDate;
    }) || [];

    return (
      <div className="mt-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
        >
          <FaHistory />
          <span>{showHistory ? 'Ocultar' : 'Mostrar'} Historial de Valoraciones</span>
          {showHistory ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <FaCalendarAlt />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
                {filteredRatings.map((rating) => (
                  <motion.div
                    key={rating.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`bg-gray-800/50 rounded-lg p-3 ${rating.isHighlighted ? 'border-2 border-yellow-400' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <RatingStars rating={rating.rating} readonly size={16} />
                        <span className="text-sm text-gray-400">
                          Mesa {rating.tableNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {new Date(rating.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{rating.comment}</p>
                    )}
                    {/* Mostrar propina si existe */}
                    {rating.tip > 0 && (
                      <p className="text-green-400 text-sm">Propina: ${rating.tip.toFixed(2)}</p>
                    )}
                    {rating.photos && rating.photos.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {rating.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                {filteredRatings.length === 0 && (
                  <p className="text-gray-400 text-sm text-center">No hay calificaciones para esta fecha.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-12">Valorar Mozos</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {waiters.map((waiter) => (
            <motion.div
              key={waiter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
              onClick={() => handleToggleExpand(waiter.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {waiter.photo ? (
                      <Image
                        src={waiter.photo}
                        alt={waiter.name}
                        fill
                        className="rounded-full object-cover border-2 border-gray-700"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                        <FaUserTie className="text-3xl text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">{waiter.name}</h2>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FaStar className="text-yellow-400" />
                      <span>{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                      <span className="text-sm">({waiter.ratings?.length || 0} valoraciones)</span>
                    </div>
                  </div>
                </div>
                {/* Icono de expandir/colapsar */}
                <div>
                  {expandedWaiterId === waiter.id ? (
                    <FaChevronUp className="text-gray-400 text-xl" />
                  ) : (
                    <FaChevronDown className="text-gray-400 text-xl" />
                  )}
                </div>
              </div>
              
              {/* Contenido expandible */}
              <AnimatePresence>
                {expandedWaiterId === waiter.id && ratingsData[waiter.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 border-t border-gray-700 pt-6 overflow-hidden"
                  >
                    {ratingsData[waiter.id].submitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaCheck className="text-xl text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">¡Gracias por tu valoración!</h3>
                        <p className="text-gray-300 text-sm">Tu opinión es muy importante.</p>
                      </motion.div>
                    ) : (
                      <form onSubmit={(e) => { e.preventDefault(); handleSubmitRating(waiter.id); }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tu Nombre (opcional)
                          </label>
                          <input
                            type="text"
                            value={ratingsData[waiter.id].customerName}
                            onChange={(e) => handleInputChange(waiter.id, 'customerName', e.target.value)}
                            className="w-full px-4 py-2 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
                            placeholder="Ingresa tu nombre"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Número de Mesa
                          </label>
                          <input
                            type="text"
                            value={ratingsData[waiter.id].tableNumber}
                            onChange={(e) => handleInputChange(waiter.id, 'tableNumber', e.target.value)}
                            className="w-full px-4 py-2 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
                            required
                            placeholder="Ej: 12"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Calificación General
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingChange(waiter.id, star)}
                                className={`text-2xl transition-colors ${
                                  star <= ratingsData[waiter.id].rating ? 'text-yellow-400' : 'text-gray-400'
                                }`}
                              >
                                <FaStar />
                              </button>
                            ))}
                          </div>
                        </div>

                        {renderCategoryRatings(waiter.id)}

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Propina (opcional)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                            <input
                              type="number"
                              value={ratingsData[waiter.id].tip}
                              onChange={(e) => handleInputChange(waiter.id, 'tip', e.target.value)}
                              className="w-full px-4 py-2 pl-8 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Comentario (opcional)
                          </label>
                          <textarea
                            value={ratingsData[waiter.id].comment}
                            onChange={(e) => handleInputChange(waiter.id, 'comment', e.target.value)}
                            className="w-full px-4 py-2 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
                            rows={3}
                            placeholder="Comparte tus comentarios..."
                          />
                        </div>

                        {/* Carga de fotos (simulada) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Fotos (opcional)</label>
                          <input 
                            type="file" 
                            accept="image/jpeg, image/png, image/webp" 
                            multiple
                            onChange={(e) => handlePhotoUpload(waiter.id, e)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {ratingsData[waiter.id].selectedPhotos.length > 0 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto">
                              {ratingsData[waiter.id].selectedPhotos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Preview ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {ratingsData[waiter.id].error && (
                          <p className="text-red-500 text-sm">{ratingsData[waiter.id].error}</p>
                        )}

                        <button
                          type="submit"
                          disabled={ratingsData[waiter.id].isSubmitting || !ratingsData[waiter.id].rating || !ratingsData[waiter.id].tableNumber || ratingsData[waiter.id].categoryRatings.attention === 0 || ratingsData[waiter.id].categoryRatings.friendliness === 0 || ratingsData[waiter.id].categoryRatings.speed === 0}
                          className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                            ratingsData[waiter.id].isSubmitting
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : (ratingsData[waiter.id].rating && ratingsData[waiter.id].tableNumber && ratingsData[waiter.id].categoryRatings.attention !== 0 && ratingsData[waiter.id].categoryRatings.friendliness !== 0 && ratingsData[waiter.id].categoryRatings.speed !== 0)
                                ? 'bg-white text-black hover:bg-gray-200'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {ratingsData[waiter.id].isSubmitting ? 'Enviando...' : 'Enviar Valoración'}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {renderAchievements(waiter)}

              {renderRatingHistory(waiter)}

            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 