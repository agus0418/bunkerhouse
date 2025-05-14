'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Category {
  id: string;
  name: string;
  type: 'COMIDAS' | 'BEBIDAS';
  description: string;
}

interface CategoriesData {
  BEBIDAS: string[];
  COMIDAS: string[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<'COMIDAS' | 'BEBIDAS'>('BEBIDAS');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BEBIDAS',
    description: ''
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Iniciando carga de categorías...');
        const categoriesRef = doc(db, 'categories', 'main');
        
        const unsubscribe = onSnapshot(categoriesRef, 
          (doc) => {
            if (doc.exists()) {
              const data = doc.data() as CategoriesData;
              console.log('Datos recibidos:', data);
              
              // Convertir los arrays de strings en objetos Category
              const categoriesData: Category[] = [
                ...data.BEBIDAS.map((name, index) => ({
                  id: `bebida-${index}`,
                  name,
                  type: 'BEBIDAS' as const,
                  description: `Categoría de ${name.toLowerCase()}`
                })),
                ...data.COMIDAS.map((name, index) => ({
                  id: `comida-${index}`,
                  name,
                  type: 'COMIDAS' as const,
                  description: `Categoría de ${name.toLowerCase()}`
                }))
              ];
              
              console.log('Categorías procesadas:', categoriesData);
              setCategories(categoriesData);
            } else {
              console.log('No se encontró el documento de categorías');
              setCategories([]);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error('Error en la suscripción:', error);
            setError('Error al cargar las categorías: ' + error.message);
            setIsLoading(false);
          }
        );

        return () => {
          console.log('Limpiando suscripción...');
          unsubscribe();
        };
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        setError('Error al conectar con la base de datos: ' + (error as Error).message);
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      type: 'BEBIDAS',
      description: ''
    });
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCategory = async () => {
    try {
      const categoriesRef = doc(db, 'categories', 'main');
      const currentData = await getDoc(categoriesRef);
      const currentCategories = currentData.data() as CategoriesData;
      
      if (selectedCategory) {
        // Actualizar categoría existente
        const updatedCategories = {
          ...currentCategories,
          [formData.type]: currentCategories[formData.type as keyof CategoriesData].map((name: string, index: number) => 
            `comida-${index}` === selectedCategory.id || `bebida-${index}` === selectedCategory.id
              ? formData.name
              : name
          )
        };
        
        await updateDoc(categoriesRef, {
          [formData.type]: updatedCategories[formData.type as keyof CategoriesData]
        });
      } else {
        // Agregar nueva categoría
        const updatedCategories = {
          ...currentCategories,
          [formData.type]: [...currentCategories[formData.type as keyof CategoriesData], formData.name]
        };
        
        await updateDoc(categoriesRef, {
          [formData.type]: updatedCategories[formData.type as keyof CategoriesData]
        });
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar la categoría:', error);
      setError('Error al guardar la categoría: ' + (error as Error).message);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const categoriesRef = doc(db, 'categories', 'main');
      const currentData = await getDoc(categoriesRef);
      const currentCategories = currentData.data() as CategoriesData;
      
      const updatedCategories = {
        ...currentCategories,
        [categoryToDelete.type]: currentCategories[categoryToDelete.type as keyof CategoriesData].filter(
          (name: string, index: number) => 
            `comida-${index}` !== categoryToDelete.id && `bebida-${index}` !== categoryToDelete.id
        )
      };
      
      await updateDoc(categoriesRef, {
        [categoryToDelete.type]: updatedCategories[categoryToDelete.type as keyof CategoriesData]
      });
      
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      setError('Error al eliminar la categoría: ' + (error as Error).message);
    }
  };

  const openDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const filteredCategories = categories.filter(category => category.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Categorías</h1>
        <button
          onClick={() => {
            setSelectedCategory(null);
            setFormData({
              name: '',
              type: 'BEBIDAS',
              description: ''
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Categoría
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('COMIDAS')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'COMIDAS'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Comidas
        </button>
        <button
          onClick={() => setActiveTab('BEBIDAS')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'BEBIDAS'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Bebidas
        </button>
      </div>

      {/* Estado de carga y error */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-400">Cargando categorías...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-white px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Lista de categorías */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-400">
              No hay categorías en esta sección
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
              >
                <div className="p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-lg font-medium text-white">{category.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium text-white bg-gray-700 rounded-full self-start sm:self-auto">
                      {category.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{category.description}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="w-full sm:flex-1 px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2 sm:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="sm:hidden ml-2">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModal}
            >
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="px-4 sm:px-6 py-4">
                <form className="space-y-4 sm:space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveCategory(); }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Nombre de la categoría"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white"
                      required
                    >
                      <option value="COMIDAS">Comidas</option>
                      <option value="BEBIDAS">Bebidas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-white placeholder-gray-400"
                      rows={3}
                      placeholder="Descripción de la categoría"
                      required
                    />
                  </div>
                </form>
              </div>
              
              <div className="px-4 sm:px-6 py-4 bg-gray-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Eliminar Categoría
                  </h3>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="px-4 sm:px-6 py-4">
                <p className="text-gray-300">
                  ¿Estás seguro de que deseas eliminar la categoría "{categoryToDelete.name}"? Esta acción no se puede deshacer.
                </p>
              </div>
              
              <div className="px-4 sm:px-6 py-4 bg-gray-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 