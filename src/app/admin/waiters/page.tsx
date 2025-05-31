'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Waiter } from '@/types/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaEdit, FaTrash, FaQrcode, FaSearch, FaDownload, FaPlus } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import WaiterForm from '@/components/WaiterForm';
import Image from 'next/image';

const WaitersPage = () => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [selectedWaiterForQR, setSelectedWaiterForQR] = useState<Waiter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'top' | 'recent'>('all');
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    const waitersRef = collection(db, 'waiters');
    const q = query(waitersRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const waitersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Waiter[];
      
      setWaiters(waitersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading waiters:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenForm = (waiter?: Waiter) => {
    setSelectedWaiter(waiter || null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedWaiter(null);
  };

  const handleDeleteWaiter = async (waiterId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este mozo?')) {
      try {
        await deleteDoc(doc(db, 'waiters', waiterId));
      } catch (error) {
        console.error('Error deleting waiter:', error);
      }
    }
  };

  const handleDownloadQR = (waiterId: string) => {
    const canvas = document.createElement('canvas');
    const svg = document.querySelector(`#qr-${waiterId} svg`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `qr-mozo-${waiterId}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const handleShowQR = (waiter: Waiter) => {
    setSelectedWaiterForQR(waiter);
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
    setSelectedWaiterForQR(null);
  };

  const filteredWaiters = waiters.filter(waiter => {
    const matchesSearch = waiter.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = waiter.averageRating >= minRating;
    if (!matchesSearch || !matchesRating) return false;

    switch (filter) {
      case 'top':
        return (waiter.averageRating || 0) >= 4;
      case 'recent':
        return (waiter.ratings || []).length > 0;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Mozos</h1>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Buscar mozo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 pl-10 bg-black/40 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-white text-black'
                    : 'bg-black/40 text-white hover:bg-black/60'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('top')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'top'
                    ? 'bg-white text-black'
                    : 'bg-black/40 text-white hover:bg-black/60'
                }`}
              >
                Mejor Valorados
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'recent'
                    ? 'bg-white text-black'
                    : 'bg-black/40 text-white hover:bg-black/60'
                }`}
              >
                Recientes
              </button>
            </div>

            <div className="w-48">
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Todas las valoraciones</option>
                <option value={4}>4+ estrellas</option>
                <option value={3}>3+ estrellas</option>
                <option value={2}>2+ estrellas</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenForm()}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Agregar Mozo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWaiters.map((waiter) => (
              <motion.div
                key={waiter.id}
                whileHover={{ scale: 1.02 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
              >
                <div className="flex items-center gap-4 mb-4">
                  {waiter.photo ? (
                    <img
                      src={waiter.photo}
                      alt={waiter.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-2xl text-gray-400">{waiter.name[0]}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-white">{waiter.name}</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FaStar className="text-yellow-400" />
                      <span>{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                      <span className="text-sm">({waiter.ratings?.length || 0} valoraciones)</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-400">
                      Propinas totales: ${(waiter.totalTips || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {(waiter.ratings || [])
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 2)
                    .map((rating, index) => (
                      <div key={index} className="bg-black/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-400">Mesa {rating.tableNumber}</span>
                          <div className="flex items-center gap-1">
                            <FaStar className="text-yellow-400 text-sm" />
                            <span className="text-sm text-gray-400">{rating.rating}</span>
                          </div>
                        </div>
                        {rating.tip > 0 && (
                          <div className="text-sm text-green-400 mb-1">
                            Propina: ${rating.tip.toFixed(2)}
                          </div>
                        )}
                        {rating.comment && (
                          <p className="text-sm text-gray-300 line-clamp-2">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenForm(waiter)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteWaiter(waiter.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowQR(waiter)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Ver QR"
                    >
                      <FaQrcode />
                    </button>
                    <button
                      onClick={() => handleDownloadQR(waiter.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Descargar QR"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>

                <div className="hidden">
                  <QRCodeSVG
                    id={`qr-${waiter.id}`}
                    value={`${window.location.origin}/rate-waiters/${waiter.id}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedWaiter ? 'Editar Mozo' : 'Agregar Mozo'}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQRModal && selectedWaiterForQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Código QR - {selectedWaiterForQR.name}</h2>
                <button
                  onClick={handleCloseQR}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/rate-waiters/${selectedWaiterForQR.id}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <button
                  onClick={() => handleDownloadQR(selectedWaiterForQR.id)}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <FaDownload />
                  Descargar QR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-800"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedWaiter ? 'Editar Mozo' : 'Agregar Mozo'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <WaiterForm
              waiter={selectedWaiter}
              onClose={handleCloseForm}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WaitersPage; 