'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  FaExternalLinkAlt,
} from 'react-icons/fa';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Determinar si estamos en la página de login
  const isLoginPage = pathname === '/admin/login';

  const handleLogout = () => {
    // Esta función ya no se usará desde el header en la página de login,
    // pero la dejamos por si se usa en otros lugares o si el botón se reactiva.
    // La lógica de logout real (incluyendo Firebase signOut) está en ProfilePage.
    Cookies.remove('adminToken');
    router.push('/admin/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
    {
      name: 'Productos',
      href: '/admin/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Categorías',
      href: '/admin/categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      name: 'Perfil',
      href: '/admin/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: 'Ver Carta',
      href: '/',
      icon: <FaExternalLinkAlt className="w-5 h-5" />,
      target: '_blank',
    },
  ];

  // Si es la página de login, solo renderizar children
  if (isLoginPage) {
    return <main className="min-h-screen bg-gray-900">{children}</main>;
  }

  // Si no es la página de login, renderizar el layout completo con Sidebar y Header
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out 
                  ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:shadow-none`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
          <Link href="/admin" className="text-xl font-semibold text-white hover:text-gray-200">BunkerHouse</Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-2 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              target={item.target}
              rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                pathname === item.href
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Overlay para cerrar sidebar en móviles */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 md:hidden"></div>
            <div className="hidden md:flex-1"></div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout} // La función de logout aquí ahora solo borra cookie y redirige.
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
} 