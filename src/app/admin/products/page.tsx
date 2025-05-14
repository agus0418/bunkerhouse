'use client';

import { useState, useEffect } from 'react';
import { products as initialProducts } from '@/data/products';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface Variation {
  id: number;
  name: string;
  price: number;
  tags?: string[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  type: string;
  variations?: Variation[];
}

const AVAILABLE_TAGS = [
  { id: 'vegetariano', label: 'Vegetariano', color: 'bg-green-500' },
  { id: 'nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { id: 'destacado', label: 'Destacado', color: 'bg-yellow-500' },
  { id: 'solicitado', label: 'Solicitado', color: 'bg-purple-500' },
];

type TabType = 'COMIDAS' | 'BEBIDAS';

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [isAddVariationModalOpen, setIsAddVariationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('BEBIDAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newVariation, setNewVariation] = useState<Partial<Variation>>({
    name: '',
    price: 0,
    tags: [],
  });
  const [productsWithVariations, setProductsWithVariations] = useState<Product[]>([]);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar productos desde Firebase
  useEffect(() => {
    const productsRef = collection(db, 'products');
    
    // Suscribirse a cambios en tiempo real
    const unsubscribe = onSnapshot(productsRef, 
      (snapshot) => {
        if (snapshot.empty) {
          // Si no hay productos, cargar los iniciales
          const initialProductsWithVariations = initialProducts.map((product) => ({
            ...product,
            variations: [],
            description: product.description || '',
          }));
          
          // Guardar productos iniciales en Firebase
          initialProductsWithVariations.forEach(async (product) => {
            try {
              await setDoc(doc(db, 'products', product.id.toString()), product);
            } catch (error) {
              console.error('Error al guardar producto inicial:', error);
              setError('Error al cargar productos iniciales');
            }
          });
          
          setProductsWithVariations(initialProductsWithVariations);
        } else {
          // Cargar productos desde Firebase
          const products = snapshot.docs.map(doc => ({
            id: Number(doc.id),
            ...doc.data()
          } as Product));
          setProductsWithVariations(products);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error al cargar productos:', error);
        setError('Error al cargar productos');
        setIsLoading(false);
      }
    );

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, []);

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!selectedProduct) return;

    try {
      setError(null);
      const updatedProduct = {
        ...selectedProduct,
        ...productData,
      };

      // Actualizar en Firebase
      await updateDoc(doc(db, 'products', selectedProduct.id.toString()), {
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        image: updatedProduct.image,
        category: updatedProduct.category,
        type: updatedProduct.type,
        variations: updatedProduct.variations || []
      });

      // Actualizar estado local
      const updatedProducts = productsWithVariations.map(p =>
        p.id === selectedProduct.id ? updatedProduct : p
      );
      setProductsWithVariations(updatedProducts);
      setSelectedProduct(updatedProduct);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setError('Error al guardar el producto');
    }
  };

  const handleSaveVariation = async () => {
    if (selectedProduct && newVariation.name && newVariation.price) {
      try {
        setError(null);
        let updatedProduct: Product;
        
        if (editingVariation) {
          // Actualizar variación existente
          const updatedVariations = selectedProduct.variations?.map(v => 
            v.id === editingVariation.id 
              ? { 
                  id: v.id,
                  name: newVariation.name as string,
                  price: newVariation.price as number,
                  tags: newVariation.tags || []
                }
              : v
          ) || [];
          
          updatedProduct = {
            ...selectedProduct,
            variations: updatedVariations
          };
        } else {
          // Agregar nueva variación
          updatedProduct = {
            ...selectedProduct,
            variations: [
              ...(selectedProduct.variations || []),
              {
                id: Date.now(),
                name: newVariation.name,
                price: newVariation.price,
                tags: newVariation.tags || [],
              },
            ],
          };
        }
        
        // Actualizar en Firebase
        await updateDoc(doc(db, 'products', selectedProduct.id.toString()), {
          variations: updatedProduct.variations
        });
        
        // Actualizar estado local
        const updatedProducts = productsWithVariations.map(p => 
          p.id === selectedProduct.id ? updatedProduct : p
        );
        setProductsWithVariations(updatedProducts);
        setSelectedProduct(updatedProduct);
        
        setIsAddVariationModalOpen(false);
        setNewVariation({ name: '', price: undefined, tags: [] });
        setEditingVariation(null);
      } catch (error) {
        console.error('Error al guardar variación:', error);
        setError('Error al guardar la variación');
      }
    }
  };

  const handleDeleteVariation = async (variationId: number) => {
    if (selectedProduct) {
      try {
        setError(null);
        const updatedVariations = selectedProduct.variations?.filter(v => v.id !== variationId) || [];

        const updatedProduct = {
          ...selectedProduct,
          variations: updatedVariations
        };

        // Actualizar en Firebase
        await updateDoc(doc(db, 'products', selectedProduct.id.toString()), {
          variations: updatedVariations
        });

        // Actualizar estado local
        const updatedProducts = productsWithVariations.map(p => 
          p.id === selectedProduct.id ? updatedProduct : p
        );
        setProductsWithVariations(updatedProducts);
        setSelectedProduct(updatedProduct);
      } catch (error) {
        console.error('Error al eliminar variación:', error);
        setError('Error al eliminar la variación');
      }
    }
  };

  const filteredProducts = productsWithVariations.filter((product) => {
    const matchesType = product.type === activeTab;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesType && matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(productsWithVariations
    .filter(p => p.type === activeTab)
    .map(p => p.category)));

  const getCategoriesByType = (type: TabType) => {
    const categories = {
      BEBIDAS: [
        'VINOS TINTOS',
        'VINOS BLANCOS',
        'CHAMPAGNE',
        'CERVEZAS',
        'SIN ALCOHOL',
        'TRAGOS',
        'LIMONADAS'
      ],
      COMIDAS: [
        'FRIOS',
        'PICADAS',
        'ENTRE PANES CALIENTES',
        'BURGERS',
        'AL WOK (sin tacc)',
        'PAPAS',
        'PIZZAS',
        'DULCES'
      ]
    };
    return categories[type];
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsVariationsModalOpen(false);
    setIsAddVariationModalOpen(false);
    setSelectedProduct(null);
    setNewVariation({ name: '', price: 0, tags: [] });
    setEditingVariation(null);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
    setIsVariationsModalOpen(false);
    setIsAddVariationModalOpen(false);
  };

  const handleVariations = (product: Product) => {
    setSelectedProduct(product);
    setIsVariationsModalOpen(true);
    setIsEditModalOpen(false);
    setIsAddVariationModalOpen(false);
  };

  const handleAddVariation = () => {
    setIsAddVariationModalOpen(true);
  };

  const handleEditVariation = (variation: Variation) => {
    setEditingVariation(variation);
    setIsAddVariationModalOpen(true);
  };

  const handleTagToggle = (tagId: string) => {
    setNewVariation((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...(prev.tags || []), tagId],
    }));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Productos</h1>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsEditModalOpen(true);
              setIsVariationsModalOpen(false);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      )}

      {/* Pestañas */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('COMIDAS')}
            className={`${
              activeTab === 'COMIDAS'
                ? 'border-gray-300 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Comidas
          </button>
          <button
            onClick={() => setActiveTab('BEBIDAS')}
            className={`${
              activeTab === 'BEBIDAS'
                ? 'border-gray-300 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Bebidas
          </button>
        </nav>
      </div>

      {/* Buscador */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filtro de Categorías */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
            selectedCategory === null
              ? 'bg-gray-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Todas
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
              selectedCategory === category
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
          >
            <div className="relative aspect-w-16 aspect-h-9">
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-48"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-medium text-white">{product.name}</h3>
                <p className="text-sm text-gray-300">{product.category}</p>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Precio</span>
                {product.variations && product.variations.length > 0 ? (
                  <div className="text-right">
                    {product.variations.map((variation, index) => (
                      <div key={variation.id} className="flex items-center justify-end gap-2">
                        <span className="text-sm text-gray-300">{variation.name}</span>
                        <span className="text-lg font-semibold text-white">${variation.price}</span>
                        {variation.tags && variation.tags.length > 0 && (
                          <div className="flex gap-1">
                            {variation.tags.map((tagId) => {
                              const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
                              return tag ? (
                                <span
                                  key={tag.id}
                                  className={`px-1.5 py-0.5 text-xs font-medium text-white ${tag.color} rounded-full`}
                                >
                                  {tag.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-white">${product.price}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Tipo</span>
                <span className="px-2 py-1 text-xs font-medium text-white bg-gray-700 rounded-full">
                  {product.type}
                </span>
              </div>
              {product.description && (
                <p className="text-sm text-gray-400">{product.description}</p>
              )}
              {product.variations && product.variations.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">Variaciones</span>
                  <span className="text-sm text-gray-300">{product.variations.length}</span>
                </div>
              )}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => handleVariations(product)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Variaciones
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModals}
            >
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <button
                    onClick={handleCloseModals}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Nombre del producto"
                      defaultValue={selectedProduct?.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                    <select
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white"
                      defaultValue={selectedProduct?.type}
                      onChange={(e) => {
                        const newType = e.target.value as TabType;
                        setActiveTab(newType);
                      }}
                    >
                      <option value="COMIDAS">Comidas</option>
                      <option value="BEBIDAS">Bebidas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                    <select
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white"
                      defaultValue={selectedProduct?.category}
                    >
                      {getCategoriesByType(activeTab).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Precio</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2 text-gray-400">$</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="0.00"
                        defaultValue={selectedProduct?.price}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                    <textarea
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
                      rows={3}
                      placeholder="Descripción del producto"
                      defaultValue={selectedProduct?.description}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Imagen</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-400">
                          <label className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-white hover:bg-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500">
                            <span>Subir imagen</span>
                            <input type="file" className="sr-only" />
                          </label>
                          <p className="pl-1">o arrastrar y soltar</p>
                        </div>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF hasta 10MB</p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 bg-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Variaciones */}
      {isVariationsModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModals}
            >
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Variaciones de {selectedProduct.name}
                  </h3>
                  <button
                    onClick={handleCloseModals}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {selectedProduct.variations && selectedProduct.variations.length > 0 ? (
                    selectedProduct.variations.map((variation) => (
                      <div
                        key={variation.id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                      >
                        <div>
                          <h4 className="text-white font-medium">{variation.name}</h4>
                          <p className="text-gray-300">${variation.price}</p>
                          {variation.tags && variation.tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {variation.tags.map((tagId) => {
                                const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
                                return tag ? (
                                  <span
                                    key={tag.id}
                                    className={`px-2 py-1 text-xs font-medium text-white ${tag.color} rounded-full`}
                                  >
                                    {tag.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            onClick={() => {
                              const newName = prompt('Nuevo nombre:', variation.name);
                              if (newName) {
                                handleEditVariation(variation);
                              }
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            onClick={() => {
                              if (confirm('¿Estás seguro de que quieres eliminar esta variación?')) {
                                handleDeleteVariation(variation.id);
                              }
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No hay variaciones para este producto</p>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Agregar Variación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar/Editar Variación */}
      {isAddVariationModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModals}
            >
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    {editingVariation ? 'Editar Variación' : 'Nueva Variación'} para {selectedProduct.name}
                  </h3>
                  <button
                    onClick={handleCloseModals}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Nombre de la variación"
                      value={editingVariation ? editingVariation.name : newVariation.name}
                      onChange={(e) => {
                        if (editingVariation) {
                          setEditingVariation({ ...editingVariation, name: e.target.value });
                        } else {
                          setNewVariation({ ...newVariation, name: e.target.value });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Precio</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2 text-gray-400">$</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="0.00"
                        value={editingVariation ? editingVariation.price : (newVariation.price || '')}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : undefined;
                          if (editingVariation) {
                            setEditingVariation({ ...editingVariation, price: value || 0 });
                          } else {
                            setNewVariation({ ...newVariation, price: value });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Etiquetas</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const currentTags = editingVariation ? editingVariation.tags || [] : (newVariation.tags || []);
                            const newTags = currentTags.includes(tag.id)
                              ? currentTags.filter(id => id !== tag.id)
                              : [...currentTags, tag.id];
                            
                            if (editingVariation) {
                              setEditingVariation({ ...editingVariation, tags: newTags });
                            } else {
                              setNewVariation({ ...newVariation, tags: newTags });
                            }
                          }}
                          className={`px-3 py-1 text-sm font-medium text-white rounded-full transition-colors ${
                            (editingVariation ? (editingVariation.tags || []) : (newVariation.tags || [])).includes(tag.id)
                              ? tag.color
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 bg-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveVariation}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  {editingVariation ? 'Guardar Cambios' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 