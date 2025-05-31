'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUtensils, FaUsers, FaChartBar, FaCog, FaUserTie } from 'react-icons/fa';
import ProductManagement from '@/components/admin/ProductManagement';
import UserManagement from '@/components/admin/UserManagement';
import Statistics from '@/components/admin/Statistics';
import Settings from '@/components/admin/Settings';
import WaiterManagement from '@/components/admin/WaiterManagement';

const sections = [
  { id: 'products', label: 'Productos', icon: FaUtensils },
  { id: 'waiters', label: 'Mozos', icon: FaUserTie },
  { id: 'users', label: 'Usuarios', icon: FaUsers },
  { id: 'statistics', label: 'Estadísticas', icon: FaChartBar },
  { id: 'settings', label: 'Configuración', icon: FaCog }
];

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('products');

  const renderSection = () => {
    switch (activeSection) {
      case 'products':
        return <ProductManagement />;
      case 'waiters':
        return <WaiterManagement />;
      case 'users':
        return <UserManagement />;
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>
        
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <section.icon />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 