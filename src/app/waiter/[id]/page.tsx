'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Waiter } from '@/types/firebase';
import { WaiterRatingComponent } from '@/components/WaiterRating';
import { motion } from 'framer-motion';
import { FaStar, FaTrophy, FaMedal, FaAward } from 'react-icons/fa';

interface WaiterProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const WaiterProfilePage: React.FC<WaiterProfilePageProps> = ({ params }) => {
  const [waiter, setWaiter] = useState<Waiter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWaiter = async () => {
      try {
        const waiterDoc = await getDoc(doc(db, 'waiters', await params.then(p => p.id)));
        if (waiterDoc.exists()) {
          setWaiter({ id: waiterDoc.id, ...waiterDoc.data() } as Waiter);
        }
      } catch (error) {
        console.error('Error al cargar el mozo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaiter();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white" />
      </div>
    );
  }

  if (!waiter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Mozo no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
        >
          <div className="flex items-center gap-6 mb-8">
            {waiter.photo ? (
              <img
                src={waiter.photo}
                alt={waiter.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-3xl text-gray-400">{waiter.name[0]}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{waiter.name}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <FaStar className="text-yellow-400" />
                <span className="text-lg">{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-sm">({waiter.ratings?.length || 0} valoraciones)</span>
              </div>
              {waiter.performance?.monthlyRanking && (
                <div className="text-yellow-400 mt-2 flex items-center gap-2">
                  <FaTrophy />
                  <span>Mozo del Mes #{waiter.performance.monthlyRanking}</span>
                </div>
              )}
            </div>
          </div>

          {waiter.achievements && waiter.achievements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Logros</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {waiter.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex-shrink-0 bg-gray-800 rounded-lg p-4 text-center min-w-[120px]"
                  >
                    {achievement.type === 'monthly' ? (
                      <FaTrophy className="text-yellow-400 text-2xl mx-auto mb-2" />
                    ) : achievement.type === 'special' ? (
                      <FaMedal className="text-blue-400 text-2xl mx-auto mb-2" />
                    ) : (
                      <FaAward className="text-purple-400 text-2xl mx-auto mb-2" />
                    )}
                    <p className="text-white text-sm">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <WaiterRatingComponent waiter={waiter} onRatingSubmit={async () => {}} />
        </motion.div>
      </div>
    </div>
  );
};

export default WaiterProfilePage; 