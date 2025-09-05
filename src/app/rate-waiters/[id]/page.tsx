'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Waiter } from '@/types/firebase';
import { motion } from 'framer-motion';
import { FaStar, FaCheck } from 'react-icons/fa';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { WaiterRatingComponent } from '@/components/WaiterRating';

const RateWaiterPage = () => {
  const params = useParams();
  const waiterId = params?.id as string;
  const [waiter, setWaiter] = useState<Waiter | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [tip, setTip] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWaiter = async () => {
      if (!waiterId) {
        setError('ID de mozo no válido');
        setLoading(false);
        return;
      }

      try {
        const waiterDoc = await getDoc(doc(db, 'waiters', waiterId));
        if (waiterDoc.exists()) {
          setWaiter({ id: waiterDoc.id, ...waiterDoc.data() } as Waiter);
        } else {
          setError('Mozo no encontrado');
        }
      } catch (error) {
        console.error('Error fetching waiter:', error);
        setError('Error al cargar los datos del mozo');
      } finally {
        setLoading(false);
      }
    };

    fetchWaiter();
  }, [waiterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiter) {
      setError('No se encontró el mozo para valorar');
      return;
    }

    // Validaciones
    if (!tableNumber || parseInt(tableNumber) <= 0) {
      setError('Por favor, ingresa un número de mesa válido');
      return;
    }

    if (rating === 0) {
      setError('Por favor, selecciona una calificación');
      return;
    }

    try {
      const newRating = {
        id: Date.now().toString(),
        rating,
        comment,
        tableNumber,
        tip: tip ? parseFloat(tip) : 0,
        date: new Date().toISOString(),
        userId: 'anonymous',
        userName: 'Cliente',
        customerName: customerName || 'Anónimo',
        categories: {
          attention: 0,
          friendliness: 0,
          speed: 0,
          knowledge: 0
        }
      };

      const waiterRef = doc(db, 'waiters', waiter.id);
      const currentRatings = waiter.ratings || [];
      const newAverageRating = (currentRatings.reduce((acc, curr) => acc + curr.rating, 0) + rating) / (currentRatings.length + 1);

      await updateDoc(waiterRef, {
        ratings: arrayUnion(newRating),
        averageRating: newAverageRating,
        totalTips: (waiter.totalTips || 0) + (tip ? parseFloat(tip) : 0)
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al enviar la valoración: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-gray-800 text-center"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-2xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">¡Gracias por tu valoración!</h1>
          <p className="text-gray-300">Tu opinión es muy importante para nosotros.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-10 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
        >
          <div className="flex items-center gap-4 mb-6">
            {waiter?.photo ? (
              <div className="relative w-16 h-16">
                <Image
                  src={waiter.photo}
                  alt={waiter.name}
                  fill
                  className="rounded-full object-cover border-2 border-gray-700"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-2xl text-gray-400">{waiter?.name[0]}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{waiter?.name}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <FaStar className="text-yellow-400" />
                <span>{waiter?.averageRating?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tu Nombre
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Mesa
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500"
                required
                placeholder="Ej: 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Calificación
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Propina (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  className="w-full px-4 py-2 pl-8 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comentario
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500"
                rows={4}
                placeholder="Cuéntanos tu experiencia..."
              />
            </div>

            <button
              type="submit"
              disabled={!rating || !tableNumber}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                rating && tableNumber
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Enviar Valoración
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RateWaiterPage; 