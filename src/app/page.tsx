'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, ProductRating } from '@/types/firebase';
import ProductCard from '@/components/ProductCard';
import { FaUtensils, FaGlassMartiniAlt } from 'react-icons/fa';
import Image from 'next/image';

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

  // Detectar qué sección está visible y actualizar el tab activo
  useEffect(() => {
    const handleScroll = () => {
      const comidasSection = document.getElementById('comidas');
      const bebidasSection = document.getElementById('bebidas');
      
      if (comidasSection && bebidasSection) {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        
        const comidasTop = comidasSection.offsetTop;
        const bebidasTop = bebidasSection.offsetTop;
        
        if (scrollPosition >= comidasTop && scrollPosition < bebidasTop) {
          setActiveTab('COMIDAS');
        } else if (scrollPosition >= bebidasTop) {
          setActiveTab('BEBIDAS');
        }
      }
    };

    // Throttle scroll events para mejor performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll);
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, []);

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Filtrar productos para mostrar solo los activos (isActive: true o undefined)
      const activeProducts = productsData.filter(product => product.isActive === true || product.isActive === undefined);
      
      setProducts(activeProducts);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading products:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const groupedProducts: { [key: string]: { [key: string]: Product[] } } = products.reduce((groups: { [key: string]: { [key: string]: Product[] } }, product) => {
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

  const filteredProducts: { COMIDAS: { [key: string]: Product[] }; BEBIDAS: { [key: string]: Product[] } } = {
    COMIDAS: groupedProducts['COMIDAS'] || {},
    BEBIDAS: groupedProducts['BEBIDAS'] || {}
  };

  const handleTabClick = (tab: 'COMIDAS' | 'BEBIDAS') => {
    setActiveTab(tab);
    
    // Hacer scroll directo a la categoría específica
    const element = document.getElementById(tab.toLowerCase());
    if (element) {
      // Calcular offset para un scroll más preciso
      const headerOffset = isMobileView ? 80 : 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    } else {
      // Si no encuentra el elemento, hacer scroll a la sección del menú
      const menuContent = document.querySelector('.menu-content');
      if (menuContent) {
        const headerOffset = isMobileView ? 80 : 120;
        const elementPosition = menuContent.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  };

  const handleRatingSubmit = async (productId: string, rating: ProductRating) => {
    if (!productId) {
      console.error('ID de producto no válido');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      const currentProduct = products.find(p => p.id === productId);
      
      if (!currentProduct) {
        console.error('Producto no encontrado');
        return;
      }

      const updatedRatings = [...(currentProduct.ratings || []), rating];
      const newAverageRating = updatedRatings.length > 0 
        ? updatedRatings.reduce((acc, curr) => acc + curr.rating, 0) / updatedRatings.length 
        : 0;

      await updateDoc(productRef, {
        ratings: arrayUnion(rating),
        averageRating: newAverageRating
      });

      // Actualizar el estado local
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId
            ? {
                ...product,
                ratings: updatedRatings,
                averageRating: newAverageRating
              }
            : product
        )
      );

    } catch (error) {
      console.error('Error al guardar la valoración:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al guardar la valoración: ${errorMessage}`);
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
    <main className="min-h-screen elegant-menu-bg text-white">
      {/* Hero Section Mejorado */}
      <section className="hero-section relative h-[100vh] overflow-hidden">
        <div className="absolute inset-0">
          {/* Fondo con gradiente elegante neutro */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          
          {/* Mosaico de imágenes con efectos */}
          <div className="grid grid-cols-2 md:grid-cols-4 h-full opacity-50">
            <div 
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: 'url("/images/6A4A2169.jpg")',
                filter: 'blur(3px)',
              }}
            ></div>
            <div 
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: 'url("/images/6A4A2176.jpg")',
                filter: 'blur(3px)',
              }}
            ></div>
            <div 
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: 'url("/images/6A4A2177.jpg")',
              }}
            ></div>
            <div 
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: 'url("/images/6A4A2178.jpg")',
              }}
            ></div>
          </div>
          
          {/* Overlay con gradiente elegante */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90"></div>
          
          {/* Efectos de luz sutiles y optimizados */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/3 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl opacity-40"></div>
          </div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-4">
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-block p-4 rounded-full bg-white/15 backdrop-blur-sm mb-6">
              <FaUtensils className="text-4xl text-white" />
            </div>
            
            {/* Logo Principal */}
            <div className="mb-6 flex justify-center">
              <div className="relative w-56 h-28 sm:w-72 sm:h-36 md:w-80 md:h-40 lg:w-96 lg:h-48 logo-container">
                <Image
                  src="/images/Logo Blanco sin fondo.png"
                  alt="Bunkerhouse Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, (max-width: 1024px) 384px, 448px"
                />
              </div>
            </div>
            
            <div className="h-1 w-32 bg-gradient-to-r from-gray-400 via-white to-gray-400 mx-auto rounded-full mb-6"></div>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-12 max-w-3xl font-light tracking-wide">
              Experiencia Gastronomica Unica
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8">
            <button
              onClick={() => handleTabClick('COMIDAS')}
              className={`modern-button group px-10 py-4 rounded-2xl text-lg font-semibold flex items-center space-x-3 focus:outline-none transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                activeTab === 'COMIDAS' 
                  ? 'bg-white text-black shadow-2xl shadow-black/30' 
                  : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
              }`}
              aria-label="Ir a sección de comidas"
            >
              <FaUtensils className="text-xl group-hover:rotate-12 transition-transform duration-300" />
              <span>Comidas</span>
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => handleTabClick('BEBIDAS')}
              className={`modern-button group px-10 py-4 rounded-2xl text-lg font-semibold flex items-center space-x-3 focus:outline-none transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                activeTab === 'BEBIDAS' 
                  ? 'bg-white text-black shadow-2xl shadow-black/30' 
                  : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
              }`}
              aria-label="Ir a sección de bebidas"
            >
              <FaGlassMartiniAlt className="text-xl group-hover:rotate-12 transition-transform duration-300" />
              <span>Bebidas</span>
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
          
          {/* Indicador de scroll */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 menu-content">
        {Object.entries(filteredProducts).map(([mainCategoryKey, subCategoriesObject]) => (
          (isMobileView || activeTab === mainCategoryKey) && (
            <section key={mainCategoryKey} id={mainCategoryKey.toLowerCase()} className="mb-16">
              <div className="relative mb-12">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="elegant-category-title px-8 py-4 bg-gradient-to-r from-black/90 to-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center space-x-4 group hover:scale-105 transition-all duration-500">
                    <div className="p-2 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 group-hover:from-white group-hover:to-gray-200 transition-all duration-300">
                      {mainCategoryKey === 'COMIDAS' ? 
                        <FaUtensils className="text-2xl text-white group-hover:text-black transition-colors duration-300" /> : 
                        <FaGlassMartiniAlt className="text-2xl text-white group-hover:text-black transition-colors duration-300" />
                      }
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      {mainCategoryKey}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-400 to-white animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {Object.entries(subCategoriesObject).map(([subCategoryKey, productsInSubCategory]) => {
                if (productsInSubCategory.length === 0) {
                  return null; 
                }

                return (
                  <div key={subCategoryKey} className="mb-16 p-8 rounded-3xl bg-gradient-to-br from-black/40 via-gray-900/50 to-black/40 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-center mb-8">
                      <div className="flex items-center space-x-4 px-6 py-3 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-full">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-white animate-pulse"></div>
                        <h3 className="subcategory-title text-lg font-bold text-white capitalize tracking-wide">
                          {subCategoryKey}
                        </h3>
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-white to-gray-400 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      {productsInSubCategory.map((product, index) => (
                        <div 
                          key={product.id}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <ProductCard
                            product={product}
                            onRatingSubmit={handleRatingSubmit}
                          />
                        </div>
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
