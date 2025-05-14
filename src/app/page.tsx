'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/firebase';
import ProductCard from '@/components/ProductCard';
import ImageCarousel from '@/components/ImageCarousel';
import { FaUtensils, FaGlassMartiniAlt } from 'react-icons/fa';
import Image from 'next/image';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('COMIDAS');

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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Agrupar productos por categoría principal y subcategoría
  const groupedProducts = products.reduce((groups: { [key: string]: { [key: string]: Product[] } }, product) => {
    const mainCategory = product.type; // COMIDAS o BEBIDAS
    const subCategory = product.category;
    
    if (!groups[mainCategory]) {
      groups[mainCategory] = {};
    }
    if (!groups[mainCategory][subCategory]) {
      groups[mainCategory][subCategory] = [];
    }
    groups[mainCategory][subCategory].push(product);
    return groups;
  }, {});

  const scrollToSection = (type: 'COMIDAS' | 'BEBIDAS') => {
    const element = document.getElementById(type.toLowerCase());
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredProducts = {
    COMIDAS: groupedProducts['COMIDAS'] || {},
    BEBIDAS: groupedProducts['BEBIDAS'] || {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Image
                src="/logo.png"
                alt="Bunker House"
                width={40}
                height={40}
                className="rounded-full"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Bunker House</h1>
            </div>
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('COMIDAS')}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                activeTab === 'COMIDAS'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white'
              }`}
            >
              <FaUtensils className="text-lg" />
              <span>Comidas</span>
            </button>
            <button
              onClick={() => setActiveTab('BEBIDAS')}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                activeTab === 'BEBIDAS'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white'
              }`}
            >
              <FaGlassMartiniAlt className="text-lg" />
              <span>Bebidas</span>
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(filteredProducts).map(([category, products]) => (
              <div key={category} className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 py-2 bg-black text-white text-lg font-semibold border border-gray-800 rounded-lg shadow-lg">
                      {category}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </main>
  );
}
