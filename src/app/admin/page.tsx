'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/firebase';
import Link from 'next/link';
import { FaUtensils, FaGlassMartiniAlt, FaList, FaEdit, FaTrash } from 'react-icons/fa';

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading products:', error);
      setError('Error al cargar los productos');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calcular estadísticas
  const stats = {
    totalProducts: products.length,
    comidas: products.filter(p => p.type === 'COMIDAS').length,
    bebidas: products.filter(p => p.type === 'BEBIDAS').length,
    categories: {
      comidas: [...new Set(products.filter(p => p.type === 'COMIDAS').map(p => p.category))].length,
      bebidas: [...new Set(products.filter(p => p.type === 'BEBIDAS').map(p => p.category))].length
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Panel de Administración</h1>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Productos</p>
                <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <FaList className="text-blue-500 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Comidas</p>
                <p className="text-2xl font-bold text-white">{stats.comidas}</p>
                <p className="text-sm text-gray-400">{stats.categories.comidas} categorías</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <FaUtensils className="text-green-500 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Bebidas</p>
                <p className="text-2xl font-bold text-white">{stats.bebidas}</p>
                <p className="text-sm text-gray-400">{stats.categories.bebidas} categorías</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <FaGlassMartiniAlt className="text-purple-500 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Categorías Totales</p>
                <p className="text-2xl font-bold text-white">{stats.categories.comidas + stats.categories.bebidas}</p>
                <p className="text-sm text-gray-400">entre comidas y bebidas</p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <FaList className="text-yellow-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/admin/products"
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <FaEdit className="text-blue-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Gestionar Productos</h3>
                <p className="text-gray-400 text-sm">Agregar, editar o eliminar productos</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/categories"
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <FaList className="text-green-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Gestionar Categorías</h3>
                <p className="text-gray-400 text-sm">Organizar categorías de productos</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/init"
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <FaTrash className="text-yellow-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Inicializar Base de Datos</h3>
                <p className="text-gray-400 text-sm">Restablecer datos iniciales</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 