'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, ProductRating } from '@/types/firebase';
import ProductCard from '@/components/ProductCard';
import { FaUtensils, FaGlassMartiniAlt, FaArrowUp, FaSearch } from 'react-icons/fa';
import Image from 'next/image';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('COMIDAS');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showScrollToComidas, setShowScrollToComidas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768); // Tailwind md breakpoint
    };
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Atajos de teclado - optimizado con useCallback
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + K para abrir búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowSearch(true);
    }
    // Escape para cerrar búsqueda
    if (e.key === 'Escape' && showSearch) {
      setShowSearch(false);
      setSearchTerm('');
    }
    // 1 para ir a comidas
    if (e.key === '1' && !showSearch) {
      handleTabClick('COMIDAS');
    }
    // 2 para ir a bebidas
    if (e.key === '2' && !showSearch) {
      handleTabClick('BEBIDAS');
    }
  }, [showSearch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Indicador de progreso de scroll - optimizado con throttling
  useEffect(() => {
    let ticking = false;
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrollPercent);
      ticking = false;
    };

    const throttledUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledUpdate, { passive: true });
    return () => window.removeEventListener('scroll', throttledUpdate);
  }, []);

  // Detectar qué sección está visible y actualizar el tab activo - optimizado
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      const comidasSection = document.getElementById('comidas');
      const bebidasSection = document.getElementById('bebidas');
      
      if (comidasSection && bebidasSection && !ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + window.innerHeight / 2;
          const comidasTop = comidasSection.offsetTop;
          const bebidasTop = bebidasSection.offsetTop;
          
          if (scrollPosition >= comidasTop && scrollPosition < bebidasTop) {
            setActiveTab('COMIDAS');
            setShowScrollToComidas(false);
          } else if (scrollPosition >= bebidasTop) {
            setActiveTab('BEBIDAS');
            setShowScrollToComidas(true);
          } else {
            setShowScrollToComidas(false);
          }
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  // Optimizar el agrupamiento de productos con useMemo
  const groupedProducts = useMemo(() => {
    return products.reduce((groups: { [key: string]: { [key: string]: Product[] } }, product) => {
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
  }, [products]);

  // Filtrar productos por término de búsqueda - optimizado con useMemo
  const filteredBySearch = useMemo(() => {
    if (searchTerm.trim() === '') return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const groupedFilteredProducts = useMemo(() => {
    return filteredBySearch.reduce((groups: { [key: string]: { [key: string]: Product[] } }, product) => {
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
  }, [filteredBySearch]);

  const filteredProducts = useMemo(() => ({
    COMIDAS: groupedFilteredProducts['COMIDAS'] || {},
    BEBIDAS: groupedFilteredProducts['BEBIDAS'] || {}
  }), [groupedFilteredProducts]);

  // Contar productos por categoría - optimizado
  const productCounts = useMemo(() => ({
    COMIDAS: Object.values(groupedFilteredProducts['COMIDAS'] || {}).reduce((acc, products) => acc + products.length, 0),
    BEBIDAS: Object.values(groupedFilteredProducts['BEBIDAS'] || {}).reduce((acc, products) => acc + products.length, 0)
  }), [groupedFilteredProducts]);

  // Obtener subcategorías populares - optimizado
  const popularCategories = useMemo(() => {
    const categories: { [key: string]: number } = {};
    Object.entries(groupedFilteredProducts).forEach(([mainCategory, subCategories]) => {
      Object.entries(subCategories).forEach(([subCategory, products]) => {
        const key = `${mainCategory}-${subCategory}`;
        categories[key] = products.length;
      });
    });
    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([key, count]) => {
        const [mainCategory, subCategory] = key.split('-');
        return { mainCategory, subCategory, count };
      });
  }, [groupedFilteredProducts]);

  const handleTabClick = useCallback((tab: 'COMIDAS' | 'BEBIDAS') => {
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
  }, [isMobileView]);

  const scrollToComidas = useCallback(() => {
    const comidasSection = document.getElementById('comidas');
    if (comidasSection) {
      const headerOffset = isMobileView ? 80 : 120;
      const elementPosition = comidasSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, [isMobileView]);

  const toggleSearch = useCallback(() => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchTerm('');
    }
  }, [showSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

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
    <main className="min-h-screen w-full bg-stone-900 relative text-white overflow-x-hidden">
      {/* Copper & Bronze Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(194, 65, 12, 0.18) 0%, rgba(194, 65, 12, 0.1) 25%, rgba(194, 65, 12, 0.04) 35%, transparent 50%)`,
          backgroundSize: "100% 100%",
        }}
      />
      {/* Hero Section Mejorado */}
      <section className="hero-section relative z-10 h-[75vh] sm:h-[85vh] md:h-[100vh] overflow-hidden w-full">
        <div className="absolute inset-0 w-full overflow-hidden">
          {/* Fondo con gradiente elegante neutro */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          
          {/* Mosaico de imágenes con efectos */}
          <div className="grid grid-cols-2 md:grid-cols-4 h-full opacity-50">
            <div
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: 'url("/images/6A4A2169.webp")',
                filter: 'blur(2px)',
              }}
            ></div>
            <div
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: 'url("/images/6A4A2176.webp")',
                filter: 'blur(2px)',
              }}
            ></div>
            <div
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700 hidden md:block"
              style={{
                backgroundImage: 'url("/images/6A4A2177.webp")',
              }}
            ></div>
            <div
              className="bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700 hidden md:block"
              style={{
                backgroundImage: 'url("/images/6A4A2178.webp")',
              }}
            ></div>
          </div>
          
          {/* Overlay con gradiente elegante */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90"></div>
          
          {/* Efectos de luz sutiles y optimizados */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white/3 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-amber-500/5 rounded-full blur-3xl opacity-40"></div>
          </div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 w-full max-w-full">
          <div className="mb-6 sm:mb-8 animate-fade-in-up w-full max-w-4xl mx-auto">
            <div className="inline-block p-3 sm:p-4 rounded-full bg-white/15 backdrop-blur-sm mb-4 sm:mb-6">
              <FaUtensils className="text-3xl sm:text-4xl text-white" />
            </div>
            
            {/* Logo Principal */}
            <div className="mb-4 sm:mb-6 flex justify-center">
              <div className="relative w-48 h-24 sm:w-56 sm:h-28 md:w-72 md:h-36 lg:w-80 lg:h-40 xl:w-96 xl:h-48 logo-container">
                <Image
                  src="/images/Logo Blanco sin fondo.png"
                  alt="Bunkerhouse Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1024px) 288px, (max-width: 1280px) 320px, 384px"
                />
              </div>
            </div>
            
            <div className="h-0.5 sm:h-1 w-24 sm:w-32 bg-gradient-to-r from-gray-400 via-white to-gray-400 mx-auto rounded-full mb-4 sm:mb-6"></div>
      
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8 w-full max-w-2xl mx-auto px-4">
            <button
              onClick={() => handleTabClick('COMIDAS')}
              className={`modern-button group w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-semibold flex items-center justify-center space-x-2 sm:space-x-3 focus:outline-none transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                activeTab === 'COMIDAS'
                  ? 'bg-white text-black shadow-2xl shadow-black/30'
                  : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
              }`}
              aria-label="Ir a sección de comidas"
            >
              <FaUtensils className="text-lg sm:text-xl group-hover:rotate-12 transition-transform duration-300" />
              <span style={{ fontFamily: "'Mileast', serif" }}>Comidas</span>
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => handleTabClick('BEBIDAS')}
              className={`modern-button group w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-semibold flex items-center justify-center space-x-2 sm:space-x-3 focus:outline-none transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                activeTab === 'BEBIDAS'
                  ? 'bg-white text-black shadow-2xl shadow-black/30'
                  : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
              }`}
              aria-label="Ir a sección de bebidas"
            >
              <FaGlassMartiniAlt className="text-lg sm:text-xl group-hover:rotate-12 transition-transform duration-300" />
              <span style={{ fontFamily: "'Mileast', serif" }}>Bebidas</span>
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
          
          {/* Indicador de scroll */}
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-2 sm:h-3 bg-white/70 rounded-full mt-1.5 sm:mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de navegación sticky con búsqueda */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-gray-800/50 transition-all duration-300 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Navegación principal */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => handleTabClick('COMIDAS')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                  activeTab === 'COMIDAS'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaUtensils className="text-sm sm:text-base" />
                <span className="hidden sm:inline">Comidas</span>
              </button>
              <button
                onClick={() => handleTabClick('BEBIDAS')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                  activeTab === 'BEBIDAS'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaGlassMartiniAlt className="text-sm sm:text-base" />
                <span className="hidden sm:inline">Bebidas</span>
              </button>
            </div>

            {/* Indicadores de progreso */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-1 w-16 rounded-full transition-all duration-300 ${
                  activeTab === 'COMIDAS' ? 'bg-white' : 'bg-gray-600'
                }`}></div>
                <span className="text-xs text-gray-400">Comidas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-1 w-16 rounded-full transition-all duration-300 ${
                  activeTab === 'BEBIDAS' ? 'bg-white' : 'bg-gray-600'
                }`}></div>
                <span className="text-xs text-gray-400">Bebidas</span>
              </div>
            </div>

            {/* Botón de búsqueda */}
            <button
              onClick={toggleSearch}
              className={`p-2 rounded-full transition-all duration-300 ${
                showSearch
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Buscar productos"
            >
              <FaSearch className="text-sm sm:text-base" />
            </button>
          </div>

          {/* Barra de búsqueda */}
          {showSearch && (
            <div className="pb-4">
              <div className="relative max-w-md mx-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar platos, bebidas..."
                  className="w-full px-4 py-2 pl-10 pr-10 bg-white/10 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  autoFocus
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-400">
                    {filteredBySearch.length} {filteredBySearch.length === 1 ? 'resultado' : 'resultados'} encontrados
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 menu-content w-full overflow-hidden">
        {searchTerm && (
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Resultados de búsqueda para "{searchTerm}"
            </h2>
            {filteredBySearch.length === 0 && (
              <div className="text-gray-400 py-8">
                <p>No se encontraron productos que coincidan con tu búsqueda.</p>
                <button
                  onClick={clearSearch}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
        )}

        {Object.entries(filteredProducts).map(([mainCategoryKey, subCategoriesObject]) => {
          const hasProducts = Object.values(subCategoriesObject).some(products => products.length > 0);
          
          if (!hasProducts) return null;
          
          return (
            (isMobileView || activeTab === mainCategoryKey || searchTerm) && (
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
                  <div key={subCategoryKey} className="mb-8 sm:mb-12 md:mb-16 p-4 sm:p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {/* Midnight Ember Background */}
                    <div
                      className="absolute inset-0 z-0"
                      style={{
                        background: "radial-gradient(ellipse at center, #3d2914 0%, #2a1810 30%, #1a0f0a 60%, #0d0806 100%)"
                      }}
                    />
                    <div className="relative z-10">
                    <div className="flex items-center justify-center mb-8">
                      <div className="flex items-center space-x-4 px-6 py-3 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-full">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-white animate-pulse"></div>
                        <h3 className="subcategory-title text-lg font-bold text-white capitalize tracking-wide">
                          {subCategoryKey}
                        </h3>
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-white to-gray-400 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:gap-8">
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
                  </div>
                );
              })}
              </section>
            )
          );
        })}
      </div>

      {/* Botón flotante para volver a comidas */}
      {showScrollToComidas && (
        <button
          onClick={scrollToComidas}
          className="fixed bottom-6 right-6 z-50 p-3 bg-white/90 backdrop-blur-sm text-black rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 group"
          aria-label="Volver a sección de comidas"
        >
          <FaUtensils className="text-lg group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Volver a Comidas
          </span>
        </button>
      )}
    </main>
  );
}
