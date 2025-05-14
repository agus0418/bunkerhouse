'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/firebase';
import ProductCard from '@/components/ProductCard';
import ImageCarousel from '@/components/ImageCarousel';
import { FaUtensils, FaGlassMartiniAlt } from 'react-icons/fa';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('COMIDAS');
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768); // Tailwind md breakpoint
    };
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

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

  const groupedProducts = products.reduce((groups: { [key: string]: { [key: string]: Product[] } }, product) => {
    const mainCategory = product.type;
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

  const filteredProducts = {
    COMIDAS: groupedProducts['COMIDAS'] || {},
    BEBIDAS: groupedProducts['BEBIDAS'] || {}
  };

  const handleTabClick = (tab: 'COMIDAS' | 'BEBIDAS') => {
    setActiveTab(tab);
    // Siempre intentamos hacer scroll, el comportamiento de renderizado se maneja abajo
    const element = document.getElementById(tab.toLowerCase());
    if (element) {
      // Ajustar el scroll para considerar la altura del header si es fixed
      // Como el header actual es relative, no se necesita un offset complejo por ahora.
      const headerOffset = isMobileView ? 50 : 100; // Ejemplo de offset, ajustar si es necesario
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="relative z-10">
        <ImageCarousel heightClass="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px]" />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase">
            Bunkerhouse
          </h1>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => handleTabClick('COMIDAS')}
              className={`px-8 py-3 rounded-md text-lg font-medium transition-colors duration-300 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${activeTab === 'COMIDAS' ? 'bg-white text-black focus:ring-white' : 'bg-white/20 hover:bg-white/30 text-white focus:ring-white/50'}`}
            >
              <FaUtensils />
              <span>Comidas</span>
            </button>
            <button
              onClick={() => handleTabClick('BEBIDAS')}
              className={`px-8 py-3 rounded-md text-lg font-medium transition-colors duration-300 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${activeTab === 'BEBIDAS' ? 'bg-white text-black focus:ring-white' : 'bg-white/20 hover:bg-white/30 text-white focus:ring-white/50'}`}
            >
              <FaGlassMartiniAlt />
              <span>Bebidas</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {Object.entries(filteredProducts).map(([mainCategoryKey, subCategoriesObject]) => (
          (isMobileView || activeTab === mainCategoryKey) && (
            <section key={mainCategoryKey} id={mainCategoryKey.toLowerCase()} className="mb-16">
              <div className="relative mb-10">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-6 py-3 bg-black text-3xl font-bold border-2 border-gray-700 rounded-lg shadow-xl flex items-center space-x-3">
                    {mainCategoryKey === 'COMIDAS' ? <FaUtensils className="text-2xl" /> : <FaGlassMartiniAlt className="text-2xl" />}
                    <span>{mainCategoryKey}</span>
                  </span>
                </div>
              </div>
              
              {Object.entries(subCategoriesObject).map(([subCategoryKey, productsInSubCategory]) => {
                if (productsInSubCategory.length === 0) {
                  return null; 
                }

                return (
                  <div key={subCategoryKey} className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 ml-1 capitalize border-b-2 border-gray-800 inline-block">
                      {subCategoryKey}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                      {productsInSubCategory.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )
        ))}
      </div>
    </main>
  );
}
