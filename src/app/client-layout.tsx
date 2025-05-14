'use client';

import { useEffect, useState } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Esperar a que el componente esté montado
    setMounted(true);

    // Limpiar cualquier atributo que las extensiones del navegador puedan haber agregado
    const cleanup = () => {
      const body = document.body;
      if (body) {
        body.removeAttribute('cz-shortcut-listen');
      }
    };

    // Ejecutar la limpieza después de un breve retraso
    const timeoutId = setTimeout(cleanup, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // No renderizar nada hasta que el componente esté montado
  if (!mounted) {
    return null;
  }

  return (
    <div className="antialiased">
      {children}
    </div>
  );
} 