import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Image from 'next/image';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    image: '',
    category: '',
    type: 'COMIDAS' as 'COMIDAS' | 'BEBIDAS',
    description: '',
    variations: []
  });

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
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleSave = async (product: Product) => {
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        type: product.type,
        description: product.description,
        variations: product.variations
      });
      setEditingProduct(null);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  const handleAdd = async () => {
    try {
      const productsRef = collection(db, 'products');
      const newProductRef = doc(productsRef);
      await setDoc(newProductRef, {
        ...newProduct,
        id: newProductRef.id,
        ratings: [],
        averageRating: 0
      });
      setNewProduct({
        name: '',
        price: 0,
        image: '',
        category: '',
        type: 'COMIDAS' as 'COMIDAS' | 'BEBIDAS',
        description: '',
        variations: []
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error al agregar producto:', error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gestión de Productos</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaPlus />
          <span>Agregar Producto</span>
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Nuevo Producto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Precio</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">URL de la imagen</label>
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="/images/product.jpg"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Categoría</label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="Categoría del producto"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Tipo</label>
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value as 'COMIDAS' | 'BEBIDAS' })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                >
                  <option value="COMIDAS">Comidas</option>
                  <option value="BEBIDAS">Bebidas</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Descripción</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="Descripción del producto"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            {editingProduct?.id === product.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                />
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                />
                <select
                  value={editingProduct.type}
                  onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value as 'COMIDAS' | 'BEBIDAS' })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                >
                  <option value="COMIDAS">Comidas</option>
                  <option value="BEBIDAS">Bebidas</option>
                </select>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  rows={3}
                />
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSave(editingProduct)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative w-full h-48 mb-4">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center">
                      <span className="text-2xl text-gray-400">Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                  <p className="text-gray-400">{product.category}</p>
                  <p className="text-green-400 font-semibold">${product.price}</p>
                  <p className="text-gray-400 text-sm">{product.description}</p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-sm">Tipo: {product.type}</span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">{product.ratings?.length || 0} valoraciones</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaEdit />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTrash />
                    <span>Eliminar</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
} 