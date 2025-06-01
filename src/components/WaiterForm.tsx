import React, { useState, useEffect } from 'react';
import { Waiter } from '@/types/firebase';
import { motion } from 'framer-motion';

interface WaiterFormProps {
  waiter?: Waiter | null;
  onClose: () => void;
}

export default function WaiterForm({ waiter, onClose }: WaiterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    email: '',
    phone: '',
    totalTips: 0
  });

  useEffect(() => {
    if (waiter) {
      setFormData({
        name: waiter.name,
        photo: waiter.photo || '',
        email: waiter.email || '',
        phone: waiter.phone || '',
        totalTips: waiter.totalTips || 0
      });
    }
  }, [waiter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          {waiter ? 'Editar Mozo' : 'Nuevo Mozo'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">URL de la foto</label>
            <input
              type="text"
              value={formData.photo}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Propinas totales</label>
            <input
              type="number"
              value={formData.totalTips}
              onChange={(e) => setFormData({ ...formData, totalTips: Number(e.target.value) })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {waiter ? 'Guardar cambios' : 'Agregar mozo'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 