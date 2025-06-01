import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Waiter } from '@/types/firebase';
import { motion } from 'framer-motion';
import { FaUtensils, FaUserTie, FaStar } from 'react-icons/fa';

export default function Statistics() {
  const [products, setProducts] = useState<Product[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const waitersRef = collection(db, 'waiters');
    
    const qProducts = query(productsRef, orderBy('name'));
    const qWaiters = query(waitersRef, orderBy('name'));

    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    });

    const unsubscribeWaiters = onSnapshot(qWaiters, (snapshot) => {
      const waitersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Waiter[];
      setWaiters(waitersData);
      setIsLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeWaiters();
    };
  }, []);

  // Calcular estadísticas
  const stats = {
    products: {
      total: products.length,
      comidas: products.filter(p => p.type === 'COMIDAS').length,
      bebidas: products.filter(p => p.type === 'BEBIDAS').length,
      categories: {
        comidas: [...new Set(products.filter(p => p.type === 'COMIDAS').map(p => p.category))].length,
        bebidas: [...new Set(products.filter(p => p.type === 'BEBIDAS').map(p => p.category))].length
      },
      totalRatings: products.reduce((sum, p) => sum + (p.ratings?.length || 0), 0),
      averageRating: products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / products.length || 0
    },
    waiters: {
      total: waiters.length,
      active: waiters.filter(w => w.isActive).length,
      totalRatings: waiters.reduce((sum, w) => sum + (w.ratings?.length || 0), 0),
      averageRating: waiters.reduce((sum, w) => sum + (w.averageRating || 0), 0) / waiters.length || 0
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Estadísticas Generales</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Productos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Total Productos</p>
              <p className="text-2xl font-bold text-white">{stats.products.total}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <FaUtensils className="text-blue-500 text-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Comidas: {stats.products.comidas} ({stats.products.categories.comidas} categorías)
            </p>
            <p className="text-sm text-gray-400">
              Bebidas: {stats.products.bebidas} ({stats.products.categories.bebidas} categorías)
            </p>
          </div>
        </motion.div>

        {/* Valoraciones de Productos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Valoraciones de Productos</p>
              <p className="text-2xl font-bold text-white">{stats.products.totalRatings}</p>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <FaStar className="text-yellow-500 text-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Promedio: {stats.products.averageRating.toFixed(1)} estrellas
            </p>
          </div>
        </motion.div>

        {/* Mozos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Total Mozos</p>
              <p className="text-2xl font-bold text-white">{stats.waiters.total}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <FaUserTie className="text-green-500 text-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Activos: {stats.waiters.active}
            </p>
          </div>
        </motion.div>

        {/* Valoraciones de Mozos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Valoraciones de Mozos</p>
              <p className="text-2xl font-bold text-white">{stats.waiters.totalRatings}</p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <FaStar className="text-purple-500 text-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Promedio: {stats.waiters.averageRating.toFixed(1)} estrellas
            </p>
          </div>
        </motion.div>
      </div>

      {/* Top 5 Productos Mejor Valorados */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Top 5 Productos Mejor Valorados</h3>
        <div className="space-y-4">
          {products
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, 5)
            .map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{product.name}</p>
                  <p className="text-sm text-gray-400">{product.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-white">{product.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400 text-sm">({product.ratings?.length || 0})</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top 5 Mozos Mejor Valorados */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Top 5 Mozos Mejor Valorados</h3>
        <div className="space-y-4">
          {waiters
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, 5)
            .map((waiter) => (
              <div key={waiter.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{waiter.name}</p>
                  <p className="text-sm text-gray-400">
                    {waiter.isActive ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-white">{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400 text-sm">({waiter.ratings?.length || 0})</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 