'use client';

import { useState, useEffect } from 'react';
import { products as initialProducts } from '@/data/products';
import { db, storage } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, query as firestoreQuery, writeBatch, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Product, Variation } from '@/types/firebase';
import Image from 'next/image';

interface RawVariation {
  id?: string | number;
  name?: string;
  price?: number;
  tags?: string[];
}

const AVAILABLE_TAGS = [
  { id: 'vegetarian', label: 'Vegetariano', color: 'bg-green-500' },
  { id: 'new', label: 'Nuevo', color: 'bg-blue-500' },
  { id: 'featured', label: 'Destacado', color: 'bg-yellow-500' },
  { id: 'requested', label: 'Pedido', color: 'bg-purple-500' },
];

type TabType = 'COMIDAS' | 'BEBIDAS';

export default function ProductsPage() {
  const [products, setProductsState] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [isAddVariationModalOpen, setIsAddVariationModalOpen] = useState(false);
  
  const [variationFormData, setVariationFormData] = useState<Partial<Variation>>({ name: '', price: undefined, tags: [] });
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('COMIDAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [allUniqueCategories, setAllUniqueCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [allCategoriesFromDb, setAllCategoriesFromDb] = useState<{ id: string; name: string; type: 'COMIDAS' | 'BEBIDAS' }[]>([]);

  useEffect(() => {
    setIsLoading(true);
    const productsRef = collection(db, "products");
    const q = firestoreQuery(productsRef);

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty) {
        console.log("No products found in Firestore. Attempting to initialize...");
        try {
          const batch = writeBatch(db);
          initialProducts.forEach(product => {
            const { id, ...dataToSave } = product; 
            const productRef = doc(db, "products", String(id)); 
            batch.set(productRef, { ...dataToSave, isActive: true });
          });
          await batch.commit();
          console.log("Initial products loaded to Firestore.");
          const productsForState: Product[] = initialProducts.map(p => ({
            ...p,
            id: String(p.id),
            isActive: true,
            variations: (p.variations || []).map((v, index) => ({
              id: v.id || Date.now() + index, 
              name: v.name,
              price: v.price,
              tags: v.tags || []
            }))
          }));
          setProductsState(productsForState);
        } catch (e) {
          console.error("Error initializing products in Firestore: ", e);
          setError("Error al inicializar productos.");
        }
      } else {
        const prods = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id, 
            ...data,
            isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
            variations: (data.variations || []).map((v: RawVariation, index: number) => ({
              id: typeof v.id === 'number' ? v.id : (typeof v.id === 'string' && !isNaN(Number(v.id)) ? Number(v.id) : Date.now() + index),
              name: v.name || 'Nombre no disponible',
              price: typeof v.price === 'number' ? v.price : 0,
              tags: Array.isArray(v.tags) ? v.tags : []
            })),
          } as Product;
        });
        setProductsState(prods);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching products: ", err);
      setError("Error al cargar productos de Firebase.");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      setAllUniqueCategories(uniqueCategories);
    }
  }, [products]);

  useEffect(() => {
    const categoriesRef = doc(db, "categories", "main");
    const unsubscribeCategories = onSnapshot(categoriesRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("[Categories Effect] Raw data from Firestore:", data);
        const foodCats = (data.COMIDAS || []).map((categoryName: string) => ({ id: categoryName, name: categoryName, type: 'COMIDAS' as 'COMIDAS' | 'BEBIDAS' }));
        const drinkCats = (data.BEBIDAS || []).map((categoryName: string) => ({ id: categoryName, name: categoryName, type: 'BEBIDAS' as 'COMIDAS' | 'BEBIDAS' }));
        const combinedCategories = [...foodCats, ...drinkCats];
        setAllCategoriesFromDb(combinedCategories);
        console.log("[Categories Effect] Processed allCategoriesFromDb:", combinedCategories);
      } else {
        console.log("[Categories Effect] Categories document 'main' not found!");
        setAllCategoriesFromDb([]);
      }
    }, (error) => {
      console.error("[Categories Effect] Error fetching categories from DB: ", error);
      setError("Error al cargar categorías de Firebase.");
    });
    return () => unsubscribeCategories();
  }, []);

  const handleSaveProduct = async (formData: FormData) => {
    const productData: Partial<Product> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || "",
      price: parseFloat(formData.get('price') as string),
      image: formData.get('image') as string,
      category: formData.get('category') as string,
      type: formData.get('type') as TabType,
    };

    if (!productData.name || productData.price === undefined || !productData.category || !productData.type) {
      setError("Por favor, completa nombre, precio, categoría y tipo del producto.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let imageUrlToSave = productData.image;

      if (imageFile) {
        const storageRef = ref(storage, `products_images/${Date.now()}_${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload is ' + progress + '% done');
            },
            (error) => {
              console.error("Error uploading image: ", error);
              setError("Error al subir la imagen: " + error.message);
              setIsLoading(false);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File available at', downloadURL);
                imageUrlToSave = downloadURL;
                resolve();
              } catch (downloadError) {
                console.error("Error getting download URL: ", downloadError);
                setError("Error al obtener la URL de la imagen: " + (downloadError as Error).message);
                setIsLoading(false);
                reject(downloadError);
              }
            }
          );
        });
      }
      
      if (!isLoading) {
        // Esto significa que hubo un error en la subida y ya se llamó a setIsLoading(false) y return o reject
        // No deberíamos llegar aquí si hubo error, pero es una doble verificación.
        // Si la promesa fue rechazada, el error ya se manejó.
        // Si setError fue llamado, la carga se detuvo y no se debería continuar.
        // Esta lógica podría necesitar revisión para asegurar que no se intente guardar si la subida falla.
        // Por ahora, si la promesa se rechaza, el catch de abajo lo manejará.
      }

      const finalProductData = { ...productData, image: imageUrlToSave };

      if (selectedProduct && selectedProduct.id) {
        const productRef = doc(db, "products", String(selectedProduct.id));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { variations: _removedVariations, ...productDetailsToUpdate } = finalProductData;
        
        const updatePayload: Partial<Product> = { 
          ...productDetailsToUpdate,
          isActive: selectedProduct.isActive // Asegurarse de conservar el estado isActive
        };

        // Ya no es necesario eliminar `description` del payload si es undefined,
        // porque ahora siempre será un string (vacío o con contenido).
        // Firestore manejará correctamente un string vacío para actualizar el campo.

        await updateDoc(productRef, updatePayload);
        setSuccessMessage("Producto actualizado con éxito.");
      } else {
        const newProductRef = doc(collection(db, "products"));
        await setDoc(newProductRef, { ...finalProductData, id: newProductRef.id, variations: [], isActive: true });
        setSuccessMessage("Producto añadido con éxito.");
      }
      handleCloseModals();
      setImageFile(null);
    } catch (e) {
      if (!error) {
        console.error("Error saving product (Firestore or other): ", e);
        setError("Error al guardar el producto en Firestore: " + (e as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVariation = async () => {
    if (!selectedProduct) return;
    if (!variationFormData.name || variationFormData.price === undefined) {
      setError("El nombre y el precio de la variación son obligatorios.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    let updatedVariations: Variation[];
    const currentProductVariations = selectedProduct.variations || [];

    if (editingVariation) {
      updatedVariations = currentProductVariations.map(v => 
        v.id === editingVariation.id 
          ? { ...v, name: variationFormData.name!, price: variationFormData.price!, tags: variationFormData.tags || [] } 
          : v
      );
    } else {
      const newVarToAdd: Variation = {
        id: Date.now(),
        name: variationFormData.name!,
        price: variationFormData.price!,
        tags: variationFormData.tags || [],
      };
      updatedVariations = [...currentProductVariations, newVarToAdd];
    }

    try {
      console.log('[handleSaveVariation] Inside try block. Selected Product:', JSON.stringify(selectedProduct, null, 2));
      if (selectedProduct && typeof selectedProduct.id !== 'undefined' && selectedProduct.id !== null) {
        console.log('[handleSaveVariation] selectedProduct.id:', selectedProduct.id);
        console.log('[handleSaveVariation] typeof selectedProduct.id:', typeof selectedProduct.id);
        
        const idForDoc = String(selectedProduct.id);
        console.log('[handleSaveVariation] idForDoc (after String()):', idForDoc);

        if (idForDoc.trim() === "") {
            console.error("[handleSaveVariation] ID for doc is an empty or whitespace string! This will fail.");
            setError("El ID del producto es una cadena vacía o solo contiene espacios, lo cual no es válido.");
            setIsLoading(false);
            return;
        }
        const productRef = doc(db, "products", idForDoc);
        await updateDoc(productRef, { variations: updatedVariations });
        
        // Actualizar estado local
        setSelectedProduct(prevProduct => {
          if (!prevProduct) return null;
          return {
            ...prevProduct,
            variations: updatedVariations
          };
        });

        setProductsState(prevProducts => 
          prevProducts.map(p => 
            p.id === selectedProduct.id 
              ? { ...p, variations: updatedVariations } 
              : p
          )
        );

        // Mensaje de éxito
        const successMsg = editingVariation 
          ? "Variación actualizada correctamente."
          : "Variación añadida correctamente.";
        setSuccessMessage(successMsg);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        handleCloseVariationModals(); 
      } else {
        console.error("[handleSaveVariation] selectedProduct is null, or its id is null/undefined inside try block. This shouldn't happen if guards are correct.");
        setError("Error inesperado: producto no seleccionado o ID de producto inválido en el bloque try.");
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error("Error saving variation (FULL ERROR OBJECT): ", e);
      console.error("Error saving variation (MESSAGE): ", (e as Error).message);
      console.error("Error saving variation (STACK): ", (e as Error).stack);
      setError("Error al guardar la variación: " + (e as Error).message + ". Revise la consola del navegador para más detalles.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVariation = async (variationId: number) => {
    if (!selectedProduct) return;
    if (!confirm("¿Estás seguro de que quieres eliminar esta variación?")) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null); 
    try {
      const productRef = doc(db, "products", String(selectedProduct.id));
      const updatedVariations = (selectedProduct.variations || []).filter(v => v.id !== variationId);
      await updateDoc(productRef, { variations: updatedVariations });

      setSelectedProduct(prevProduct => {
        if (!prevProduct) return null;
        return {
          ...prevProduct,
          variations: updatedVariations
        };
      });

      setProductsState(prevProducts => 
        prevProducts.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, variations: updatedVariations } 
            : p
        )
      );
      
      setSuccessMessage("Variación eliminada correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (e) {
      console.error("Error deleting variation: ", e);
      setError("Error al eliminar la variación.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!productId) {
      setError("ID de producto no válido para eliminar.");
      return;
    }
    if (!confirm("¿Estás seguro de que quieres eliminar este producto y todas sus variaciones? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const productRef = doc(db, "products", productId);
      await deleteDoc(productRef); // Usar deleteDoc para eliminar el documento

      // Actualizar el estado local para remover el producto eliminado
      setProductsState(prevProducts => prevProducts.filter(p => p.id !== productId));
      
      setSuccessMessage("Producto eliminado correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Si el producto eliminado era el que estaba seleccionado para edición, limpiar el modal
      if (selectedProduct && selectedProduct.id === productId) {
        handleCloseModals();
      }

    } catch (e) {
      console.error("Error deleting product: ", e);
      setError("Error al eliminar el producto: " + (e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoriesByType = (type: TabType | undefined): string[] => {
    if (!type) return allUniqueCategories;
    return Array.from(new Set(products.filter(p => p.type === type).map(p => p.category).filter(Boolean)));
  };

  const currentDisplayCategories = activeTab ? getCategoriesByType(activeTab) : allUniqueCategories;

  const filteredProducts = products.filter(product => {
    const tabMatch = product.type === activeTab;
    const categoryMatch = !selectedCategoryFilter || product.category === selectedCategoryFilter;
    const searchMatch = !searchQuery || 
                        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = filterStatus === 'all' || 
                       (filterStatus === 'active' && product.isActive !== false) ||
                       (filterStatus === 'inactive' && product.isActive === false);
    return tabMatch && categoryMatch && searchMatch && statusMatch;
  });

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsVariationsModalOpen(false);
    handleCloseVariationModals();
    setSelectedProduct(null);
    setImageFile(null);
    setError(null);
  };

  const handleCloseVariationModals = () => {
    setIsAddVariationModalOpen(false); 
    setEditingVariation(null);
    setVariationFormData({ name: '', price: undefined, tags: [] });
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
    setIsVariationsModalOpen(false);
    handleCloseVariationModals(); 
  };

  const handleVariations = (product: Product) => {
    setSelectedProduct(product);
    setIsVariationsModalOpen(true);
    setIsEditModalOpen(false);
    handleCloseVariationModals();
  };

  const handleOpenAddVariationModal = () => {
    setEditingVariation(null); 
    setVariationFormData({ name: '', price: undefined, tags: [] }); 
    setIsAddVariationModalOpen(true);
  };

  const handleOpenEditVariationModal = (variation: Variation) => {
    setEditingVariation(variation);
    setVariationFormData({ name: variation.name, price: variation.price, tags: variation.tags || [] });
    setIsAddVariationModalOpen(true);
  };
  
  const handleTagToggle = (tagId: string) => {
    setVariationFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...(prev.tags || []), tagId],
    }));
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleToggleProductStatus = async (productId: string | number, currentStatus: boolean | undefined) => {
    // Convertir productId a string y asegurar que no sea vacío después de la conversión
    const idAsString = String(productId).trim();

    console.log('[handleToggleProductStatus] Called with productId (original):', productId, '(type:', typeof productId, ')');
    console.log('[handleToggleProductStatus] productId converted to string:', idAsString, '(type:', typeof idAsString, ')');

    if (!idAsString) { // Verifica si el string es vacío después del trim
      console.error('[handleToggleProductStatus] Invalid or empty productId after conversion:', idAsString);
      setError("ID de producto no válido o vacío. No se puede cambiar el estado.");
      return;
    }

    const newStatus = currentStatus === undefined ? false : !currentStatus;
    try {
      const productRef = doc(db, "products", idAsString); // Usar idAsString
      await updateDoc(productRef, { isActive: newStatus });
      setProductsState(prevProducts =>
        prevProducts.map(p => (String(p.id) === idAsString ? { ...p, isActive: newStatus } : p))
      );
      setSuccessMessage(`Producto ${newStatus ? 'habilitado' : 'deshabilitado'} con éxito.`);
      
      if (selectedProduct && String(selectedProduct.id) === idAsString) {
        setSelectedProduct(prev => prev ? { ...prev, isActive: newStatus } : null);
      }

    } catch (e) {
      console.error("Error toggling product status: ", e);
      const firebaseError = e as { message?: string };
      setError(`Error al cambiar estado del producto: ${firebaseError.message || 'Error desconocido'}`);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-900 min-h-screen">
      {error && (
        <div className="bg-red-900/80 backdrop-blur-sm text-red-100 p-4 rounded-lg fixed top-5 right-5 z-[100] shadow-lg max-w-md">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Error</p>
            <button onClick={() => setError(null)} className="text-red-200 hover:text-white text-2xl">&times;</button>
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-700/90 backdrop-blur-sm text-white p-4 rounded-lg fixed top-5 right-5 z-[100] shadow-lg max-w-md">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Éxito</p>
            <button onClick={() => setSuccessMessage(null)} className="text-green-100 hover:text-white text-2xl">&times;</button>
          </div>
          <p className="text-sm mt-1">{successMessage}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[120]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Gestión de Productos</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Activos ({products.filter(p => p.isActive !== false).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${filterStatus === 'inactive'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Inactivos ({products.filter(p => p.isActive === false).length})
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedProduct({
                id: '', // Indicar que es nuevo
                name: '',
                price: 0,
                category: '',
                type: 'COMIDAS',
                variations: [],
                image: '',
                description: '',
                ratings: [],
                averageRating: 0
              }); 
              setIsEditModalOpen(true);
              setIsVariationsModalOpen(false);
              handleCloseVariationModals();
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-700 mb-4">
          <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-px -mb-px" aria-label="Tabs">
            {[('COMIDAS') as TabType, ('BEBIDAS') as TabType].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-3 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-150
                  ${activeTab === tab ? 'border-gray-300 text-white' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'}`}
              >
                {tab === 'COMIDAS' ? 
                  <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 7h18M3 11h18M3 15h18M3 19h18"/></svg> :
                  <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 
                }
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
              placeholder="Buscar por nombre, descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={selectedCategoryFilter || ''}
            onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
            className="w-full py-2.5 px-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
          >
            <option value="">Todas las categorías ({activeTab})</option>
            {currentDisplayCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <p className="text-center text-gray-400 py-8">No se encontraron productos que coincidan con los filtros.</p>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-gray-800 shadow-lg rounded-lg overflow-hidden flex flex-col justify-between">
            <div className="w-full h-48 relative">
              <Image 
                src={product.image || '/placeholder-image.png'} 
                alt={product.name || 'Imagen del producto'} 
                layout="fill" 
                objectFit="cover" 
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image')}
              />
            </div>
            <div className="p-4 flex-grow">
              <h3 className="text-xl font-semibold mb-2 text-white">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-1">Categoría: {product.category}</p>
              <p className="text-gray-400 text-sm mb-1">Tipo: {product.type}</p>
              <p className="text-gray-300 text-lg font-bold mb-2">${product.price.toFixed(2)}</p>
              {product.description && <p className="text-gray-400 text-sm mb-3 h-10 overflow-y-auto">{product.description}</p>}

              <div className="mb-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {product.isActive ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-750 border-t border-gray-700">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                >
                  Editar
                </button>
                {product.variations && (
                   <button
                      onClick={() => handleVariations(product)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                    >
                      {product.variations.length > 0 ? `Ver/Editar Variaciones (${product.variations.length})` : 'Añadir Variaciones'}
                  </button>
                )}
                 <button
                  onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                  className={`w-full font-semibold py-2 px-4 rounded transition duration-150 ease-in-out ${
                    product.isActive ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {product.isActive ? 'Deshabilitar' : 'Habilitar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-gray-900/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {selectedProduct?.id ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(new FormData(e.currentTarget)); }} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Nombre</label>
                <input type="text" name="name" id="name" defaultValue={selectedProduct?.name || ''} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500" required />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">Descripción</label>
                <textarea name="description" id="description" defaultValue={selectedProduct?.description || ''} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1.5">Precio Base</label>
                  <input type="number" name="price" id="price" defaultValue={selectedProduct?.price || ''} step="0.01" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500" required placeholder="0.00"/>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">Categoría</label>
                  <select 
                    name="category" 
                    id="category" 
                    value={selectedProduct?.category || ''} 
                    onChange={(e) => setSelectedProduct(sp => sp ? {...sp, category: e.target.value} : null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                    required
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {(() => {
                      console.log("[Category Select] Filtering categories. selectedProduct.type:", selectedProduct?.type, "allCategoriesFromDb:", allCategoriesFromDb);
                      const filtered = allCategoriesFromDb.filter(cat => cat.type === (selectedProduct?.type || 'COMIDAS'));
                      console.log("[Category Select] Filtered categories for dropdown:", filtered);
                      return filtered.map((cat, idx) => <option key={`${cat.name}-${idx}`} value={cat.name}>{cat.name}</option>);
                    })()}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1.5">Tipo</label>
                <select 
                  name="type" 
                  id="type" 
                  value={selectedProduct?.type || 'COMIDAS'} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                  required 
                  onChange={(e) => {
                    // No es necesario 'if (selectedProduct)' porque ahora siempre es un objeto si el modal está abierto
                    setSelectedProduct(sp => sp ? { ...sp, type: e.target.value as TabType, category: '' } : null); // Resetea categoría
                  }}
                >
                  <option value="COMIDAS">COMIDAS</option>
                  <option value="BEBIDAS">BEBIDAS</option>
                </select>
              </div>
              <div>
                <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-300 mb-1.5">Subir Nueva Imagen (opcional)</label>
                <input 
                  type="file" 
                  name="imageUpload" 
                  id="imageUpload" 
                  accept="image/*" 
                  onChange={handleImageFileChange} 
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-gray-200 hover:file:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-gray-700 border border-gray-600 rounded-md p-1.5"
                />
                {imageFile && <p className="text-xs text-gray-400 mt-1.5">Archivo seleccionado: {imageFile.name}</p>}
                 <p className="text-xs text-gray-500 mt-1">Si no subes una nueva, se conservará la imagen actual o la URL de abajo.</p>
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-1.5">URL de Imagen Actual (o alternativa)</label>
                <input type="url" name="image" id="image" defaultValue={selectedProduct?.image || ''} placeholder="https://ejemplo.com/imagen.jpg" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500" />
              </div>
              <div className="flex justify-between items-center pt-5">
                {selectedProduct?.id && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteProduct(selectedProduct.id!)} 
                    className="px-5 py-2 text-sm font-medium text-red-500 bg-transparent hover:bg-red-900/30 rounded-lg transition-colors border border-red-500/50 hover:border-red-500"
                  >
                    Eliminar Producto
                  </button>
                )}
                <div className="flex space-x-3 ml-auto">
                  <button type="button" onClick={handleCloseModals} className="px-5 py-2 text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors shadow-md">Guardar Producto</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVariationsModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-gray-900/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white truncate" title={`Variaciones de: ${selectedProduct.name}`}>Variaciones de: {selectedProduct.name}</h2>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3.5 mb-6">
              {(selectedProduct.variations || []).map((variation) => (
                <div key={variation.id} className="p-3.5 bg-gray-700/70 rounded-md border border-gray-600/80 flex justify-between items-start gap-3">
                  <div className="flex-grow">
                    <p className="font-medium text-white">{variation.name} - <span className="text-gray-200 font-semibold"><span className="font-sans">${variation.price.toFixed(2)}</span></span></p>
                    {variation.tags && variation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {variation.tags.map(tagId => {
                          const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                          return tag ? (
                            <span key={tag.id} className={`px-2 py-0.5 text-[11px] font-semibold text-white ${tag.color} rounded-full shadow-sm`}>{tag.label}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button 
                      onClick={() => handleOpenEditVariationModal(variation)} 
                      className="p-2 text-gray-300 hover:text-white bg-gray-600 hover:bg-gray-500 rounded-md transition-colors shadow-sm"
                      title="Editar Variación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteVariation(variation.id)} 
                      className="p-2 text-red-400 hover:text-red-300 bg-red-900/40 hover:bg-red-800/60 rounded-md transition-colors shadow-sm"
                      title="Eliminar Variación"
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {(!selectedProduct.variations || selectedProduct.variations.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No hay variaciones para este producto.</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button type="button" onClick={handleCloseModals} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700 rounded-lg transition-colors">Cerrar Lista</button>
              <button onClick={handleOpenAddVariationModal} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors flex items-center justify-center shadow-md">
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Añadir Variación
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddVariationModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingVariation ? 'Editar Variación' : 'Añadir Nueva Variación'}
              </h2>
              <button onClick={handleCloseVariationModals} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveVariation(); }} className="space-y-5">
              <div>
                <label htmlFor="variationName" className="block text-sm font-medium text-gray-300 mb-1.5">Nombre de la Variación</label>
                <input 
                  type="text" 
                  name="variationName" 
                  id="variationName" 
                  value={variationFormData.name || ''} 
                  onChange={(e) => setVariationFormData({...variationFormData, name: e.target.value})} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                  required 
                />
              </div>
              <div>
                <label htmlFor="variationPrice" className="block text-sm font-medium text-gray-300 mb-1.5">Precio</label>
                <input 
                  type="number" 
                  name="variationPrice" 
                  id="variationPrice" 
                  value={variationFormData.price === undefined ? '' : variationFormData.price} 
                  onChange={(e) => setVariationFormData({...variationFormData, price: e.target.value === '' ? undefined : parseFloat(e.target.value)})} 
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                  required 
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-300 mb-2">Tags (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button 
                      type="button" 
                      key={tag.id} 
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ease-in-out shadow-sm 
                        ${(variationFormData.tags || []).includes(tag.id) 
                          ? `${tag.color} text-white ring-2 ring-offset-2 ring-offset-gray-800 ${tag.color.replace('bg-', 'ring-')}` 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-5">
                <button type="button" onClick={handleCloseVariationModals} className="px-5 py-2 text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors shadow-md">
                  {editingVariation ? 'Guardar Cambios' : 'Añadir Variación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 