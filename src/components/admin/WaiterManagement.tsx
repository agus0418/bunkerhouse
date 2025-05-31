import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Waiter, WaiterShift, WaiterTable, WaiterNote } from '@/types/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaUserPlus, FaStar, FaCheck, FaTimes, FaClock, FaTable, FaStickyNote, FaChartLine, FaUserTie, FaFilter, FaSearch, FaUsers, FaMoneyBillWave, FaChartBar, FaQrcode, FaDownload, FaExclamationTriangle, FaTrophy, FaGraduationCap } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function WaiterManagement() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, 'info' | 'shifts' | 'tables' | 'notes' | 'performance'>>({});
  const [newWaiter, setNewWaiter] = useState({
    name: '',
    photo: '',
    dni: '',
    isActive: true
  });
  const [newShift, setNewShift] = useState<Partial<WaiterShift>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    status: 'scheduled'
  });
  const [newNote, setNewNote] = useState<Partial<WaiterNote>>({
    type: 'general',
    content: '',
    date: new Date().toISOString()
  });
  const [noteFilter, setNoteFilter] = useState<'all' | 'performance' | 'incident' | 'achievement' | 'training' | 'general' | 'punctuality'>('all');
  const [noteSearch, setNoteSearch] = useState('');
  const [editingNote, setEditingNote] = useState<WaiterNote | null>(null);
  const [newTable, setNewTable] = useState<Partial<WaiterTable>>({
    tableNumber: 0,
    customerCount: 0,
    startTime: new Date().toISOString(),
    status: 'active'
  });
  const [showQR, setShowQR] = useState<string | null>(null);

  useEffect(() => {
    const waitersRef = collection(db, 'waiters');
    const q = query(waitersRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const waitersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Waiter[];

      // Deduplicate waiters by ID
      const uniqueWaiters = Array.from(new Map(waitersData.map(waiter => [waiter.id, waiter])).values());

      // Ensure notes array exists and is sorted by date descending for unique waiters
      const processedWaiters = uniqueWaiters.map(waiter => ({
        ...waiter,
        notes: waiter.notes ? waiter.notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []
      }));

      // Sort unique waiters by name (or another preferred field if necessary)
      processedWaiters.sort((a, b) => a.name.localeCompare(b.name));

      console.log("Mozos únicos antes de setear estado:", processedWaiters); // Log the data here

      setWaiters(processedWaiters); // Set the processed and unique data
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching waiters: ", error);
      setIsLoading(false);
      // Optionally show an error message to the user
      // toast.error("Error al cargar mozos.");
    });

    // Cleanup function to unsubscribe the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const handleEdit = (waiter: Waiter) => {
    setEditingWaiter(waiter);
  };

  const handleSave = async (waiter: Waiter) => {
    try {
      if (!waiter.dni || waiter.dni.length < 7) {
        toast.error('El DNI debe tener al menos 7 caracteres');
        return;
      }

      const waiterRef = doc(db, 'waiters', waiter.id);
      await updateDoc(waiterRef, {
        name: waiter.name,
        photo: waiter.photo,
        dni: waiter.dni,
        isActive: waiter.isActive
      });
      setEditingWaiter(null);
      toast.success('Mozo actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar mozo:', error);
      toast.error('Error al actualizar mozo');
    }
  };

  const handleDelete = async (waiterId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este mozo? Esta acción no se puede deshacer.')) {
      try {
        const batch = writeBatch(db);
        const waiterRef = doc(db, 'waiters', waiterId);

        // Eliminar turnos
        const shiftsRef = collection(db, 'waiters', waiterId, 'shifts');
        const shiftsSnapshot = await getDocs(shiftsRef);
        shiftsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Eliminar notas
        const notesRef = collection(db, 'waiters', waiterId, 'notes');
        const notesSnapshot = await getDocs(notesRef);
        notesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Eliminar mesas asignadas
        const tablesRef = collection(db, 'waiters', waiterId, 'tables');
        const tablesSnapshot = await getDocs(tablesRef);
        tablesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Eliminar el mozo
        batch.delete(waiterRef);

        // Ejecutar todas las eliminaciones en una sola transacción
        await batch.commit();
        
        toast.success('Mozo y todos sus datos relacionados eliminados exitosamente');
      } catch (error) {
        console.error('Error al eliminar mozo:', error);
        toast.error('Error al eliminar mozo. Por favor, intente nuevamente.');
      }
    }
  };

  const handleAdd = async () => {
    try {
      if (!newWaiter.dni || newWaiter.dni.length < 7) {
        toast.error('El DNI debe tener al menos 7 caracteres');
        return;
      }

      const newId = Date.now().toString();
      const waiterRef = doc(db, 'waiters', newId);
      await setDoc(waiterRef, {
        ...newWaiter,
        ratings: [],
        averageRating: 0,
        totalTips: 0,
        performance: {
          averageServiceTime: 0,
          totalTablesServed: 0,
          totalTips: 0,
          bestShift: 'N/A',
          bestDay: 'N/A',
          monthlyRanking: 0,
          totalLikes: 0,
          highlightedReviews: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setNewWaiter({ name: '', photo: '', dni: '', isActive: true });
      setShowAddForm(false);
      toast.success('Mozo agregado exitosamente');
    } catch (error) {
      console.error('Error al agregar mozo:', error);
      toast.error('Error al agregar mozo');
    }
  };

  const toggleActive = async (waiter: Waiter) => {
    try {
      const waiterRef = doc(db, 'waiters', waiter.id);
      await updateDoc(waiterRef, {
        isActive: !waiter.isActive
      });
    } catch (error) {
      console.error('Error al cambiar estado del mozo:', error);
    }
  };

  const handleAddShift = async (waiterId: string) => {
    try {
      const shiftRef = collection(db, 'waiters', waiterId, 'shifts');
      await addDoc(shiftRef, {
        waiterId,
        date: newShift.date || new Date().toISOString().split('T')[0],
        startTime: newShift.startTime || '09:00',
        endTime: newShift.endTime || '17:00',
        status: newShift.status || 'scheduled',
        notes: newShift.notes || '',
      });
      setNewShift({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        status: 'scheduled',
        notes: '',
      });
      toast.success('Turno agregado exitosamente');
    } catch (error) {
      console.error('Error al agregar turno:', error);
      toast.error('Error al agregar turno');
    }
  };

  const handleAddNote = async (waiterId: string) => {
    try {
      const noteRef = collection(db, 'waiters', waiterId, 'notes');
      await addDoc(noteRef, {
        type: newNote.type || 'general',
        content: newNote.content || '',
        date: new Date().toISOString(),
        createdBy: 'admin' // TODO: Usar el ID del usuario actual
      });
      setNewNote({ type: 'general', content: '', date: new Date().toISOString() });
      toast.success('Nota agregada exitosamente');
    } catch (error) {
      console.error('Error al agregar nota:', error);
      toast.error('Error al agregar nota');
    }
  };

  const handleEditNote = async (waiterId: string, note: WaiterNote) => {
    try {
      const noteRef = doc(db, 'waiters', waiterId, 'notes', note.id);
      await updateDoc(noteRef, {
        content: note.content,
        type: note.type
      });
      setEditingNote(null);
      toast.success('Nota actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar nota:', error);
      toast.error('Error al actualizar nota');
    }
  };

  const handleDeleteNote = async (waiterId: string, noteId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
      try {
        await deleteDoc(doc(db, 'waiters', waiterId, 'notes', noteId));
        toast.success('Nota eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar nota:', error);
        toast.error('Error al eliminar nota');
      }
    }
  };

  const handleAssignTable = async (waiterId: string) => {
    try {
      const tableRef = collection(db, 'waiters', waiterId, 'tables');
      await addDoc(tableRef, {
        tableNumber: newTable.tableNumber || 0,
        customerCount: newTable.customerCount || 0,
        startTime: new Date().toISOString(),
        status: 'active',
        totalAmount: 0,
        tipAmount: 0
      });
      setNewTable({
        tableNumber: 0,
        customerCount: 0,
        startTime: new Date().toISOString(),
        status: 'active'
      });
      toast.success('Mesa asignada exitosamente');
    } catch (error) {
      console.error('Error al asignar mesa:', error);
      toast.error('Error al asignar mesa');
    }
  };

  const handleCompleteTable = async (waiterId: string, tableId: string, totalAmount: number, tipAmount: number) => {
    try {
      const tableRef = doc(db, 'waiters', waiterId, 'tables', tableId);
      await updateDoc(tableRef, {
        status: 'completed',
        endTime: new Date().toISOString(),
        totalAmount,
        tipAmount
      });
      toast.success('Mesa completada exitosamente');
    } catch (error) {
      console.error('Error al completar mesa:', error);
      toast.error('Error al completar mesa');
    }
  };

  const handleShowQR = (waiter: Waiter) => {
    setShowQR(waiter.id);
  };

  const handleCloseQR = () => {
    setShowQR(null);
  };

  const handleDownloadQR = (waiterId: string) => {
    const canvas = document.createElement('canvas');
    const svg = document.querySelector(`#qr-${waiterId} svg`);
    if (svg instanceof SVGElement) { // Type assertion for SVGElement
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
    } else {
      console.error('SVG element not found for QR code download');
      toast.error('Error al descargar el QR');
    }
  };

  const handleTabChange = (waiterId: string, tab: 'info' | 'shifts' | 'tables' | 'notes' | 'performance') => {
    setActiveTabs(prev => ({
      ...prev,
      [waiterId]: tab
    }));
  };

  const renderWaiterDetails = (waiter: Waiter, tab: 'info' | 'shifts' | 'tables' | 'notes' | 'performance') => {
    switch (tab) {
      case 'info':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  {waiter.photo ? (
                    <Image
                      src={waiter.photo}
                      alt={waiter.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-gray-400">{waiter.name ? waiter.name[0] : ''}</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-white truncate">{waiter.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400">
                    <FaStar className="text-yellow-400" />
                    <span>{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-sm">({waiter.ratings?.length || 0} valoraciones)</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleShowQR(waiter)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Ver QR"
                >
                  <FaQrcode className="w-5 h-5"/>
                </button>
                <button
                  onClick={() => toggleActive(waiter)}
                  className={`p-2 rounded-full ${
                    waiter.isActive
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } transition-colors`}
                  title={waiter.isActive ? 'Desactivar' : 'Activar'}
                >
                  {waiter.isActive ? <FaCheck className="w-5 h-5"/> : <FaTimes className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            {/* Resumen de Notas */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Resumen de Notas</h4>
                <button
                  onClick={() => handleTabChange(waiter.id, 'notes')}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Ver todas las notas
                </button>
              </div>
              
              {/* Contadores de Notas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-blue-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => handleTabChange(waiter.id, 'notes')}>
                  <FaChartLine className="text-blue-400 w-6 h-6 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Desempeño</h5>
                  <p className="text-white text-xl font-bold">
                    {waiter.notes?.filter(n => n.type === 'performance').length || 0}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-red-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => handleTabChange(waiter.id, 'notes')}>
                  <FaExclamationTriangle className="text-red-400 w-6 h-6 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Incidencias</h5>
                  <p className="text-white text-xl font-bold">
                    {waiter.notes?.filter(n => n.type === 'incident').length || 0}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-yellow-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => handleTabChange(waiter.id, 'notes')}>
                  <FaTrophy className="text-yellow-400 w-6 h-6 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Logros</h5>
                  <p className="text-white text-xl font-bold">
                    {waiter.notes?.filter(n => n.type === 'achievement').length || 0}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-green-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => handleTabChange(waiter.id, 'notes')}>
                  <FaClock className="text-green-400 w-6 h-6 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Puntualidad</h5>
                  <p className="text-white text-xl font-bold">
                    {waiter.notes?.filter(n => n.type === 'punctuality').length || 0}
                  </p>
                </div>
              </div>

              {/* Notas Recientes */}
              <div className="mt-6">
                <h5 className="text-md font-semibold text-white mb-4">Notas Recientes</h5>
                <div className="space-y-3">
                  {waiter.notes?.slice(0, 3).map(note => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors ${
                        note.type === 'achievement' ? 'border-l-4 border-yellow-400' :
                        note.type === 'incident' ? 'border-l-4 border-red-400' :
                        note.type === 'performance' ? 'border-l-4 border-blue-400' :
                        note.type === 'training' ? 'border-l-4 border-green-400' :
                        note.type === 'punctuality' ? 'border-l-4 border-green-400' :
                        'border-l-4 border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            note.type === 'performance' ? 'bg-blue-600' :
                            note.type === 'incident' ? 'bg-red-600' :
                            note.type === 'achievement' ? 'bg-yellow-600' :
                            note.type === 'training' ? 'bg-green-600' :
                            note.type === 'punctuality' ? 'bg-green-600' :
                            'bg-gray-600'
                          }`}>
                            {note.type === 'performance' ? 'Desempeño' :
                             note.type === 'incident' ? 'Incidencia' :
                             note.type === 'achievement' ? 'Logro' :
                             note.type === 'training' ? 'Capacitación' :
                             note.type === 'punctuality' ? 'Puntualidad' :
                             'General'}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingNote(note)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Editar nota"
                          >
                            <FaEdit className="w-4 h-4"/>
                          </button>
                          <button
                            onClick={() => handleDeleteNote(waiter.id, note.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Eliminar nota"
                          >
                            <FaTrash className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                      <p className="text-white text-sm line-clamp-2">{note.content}</p>
                    </motion.div>
                  ))}
                  {waiter.notes && waiter.notes.length === 0 && (
                    <p className="text-gray-400 text-center">No hay notas para este mozo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'shifts':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Turnos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waiter.shifts?.map(shift => (
                <div key={shift.id} className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-white">{new Date(shift.date).toLocaleDateString()}</p>
                  <p className="text-gray-400">{shift.startTime} - {shift.endTime}</p>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    shift.status === 'completed' ? 'bg-green-600' :
                    shift.status === 'in-progress' ? 'bg-blue-600' :
                    shift.status === 'absent' ? 'bg-red-600' : 'bg-gray-600'
                  }`}>
                    {shift.status}
                  </span>
                  {shift.notes && <p className="text-gray-400 text-sm mt-2">Notas: {shift.notes}</p>}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-4">
              <h5 className="text-md font-semibold text-white">Agregar Nuevo Turno</h5>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                  className="bg-gray-700 text-white rounded-lg px-4 py-2"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2"
                  />
                  <input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Notas (opcional)</label>
                <textarea
                  value={newShift.notes}
                  onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2" rows={2}
                  placeholder="Notas sobre el turno..."
                />
              </div>
              <button
                onClick={() => handleAddShift(waiter.id)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Agregar Turno
              </button>
            </div>
          </div>
        );

      case 'tables':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Mesas Asignadas</h4>
            
            {/* Mesas activas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waiter.currentTables?.filter(table => table.status === 'active').map(table => (
                <div key={table.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-lg font-semibold text-white">Mesa {table.tableNumber}</h5>
                      <p className="text-gray-400">
                        Inicio: {new Date(table.startTime).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-400">
                        <FaUsers className="inline mr-2" />
                        {table.customerCount} personas
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const total = prompt('Ingrese el monto total de la mesa:');
                        const tip = prompt('Ingrese la propina:');
                        if (total !== null && tip !== null) { // Check for null instead of just truthiness
                           handleCompleteTable(waiter.id, table.id, Number(total), Number(tip));
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Completar Mesa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Historial de mesas */}
            <div className="mt-6">
              <h5 className="text-md font-semibold text-white mb-4">Historial de Mesas</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waiter.currentTables?.filter(table => table.status === 'completed').map(table => (
                  <div key={table.id} className="bg-gray-700 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-white">Mesa {table.tableNumber}</h5>
                    <p className="text-gray-400">
                      {new Date(table.startTime).toLocaleTimeString()} - 
                      {table.endTime ? new Date(table.endTime).toLocaleTimeString() : 'En curso'}
                    </p>
                    <p className="text-gray-400">
                      <FaUsers className="inline mr-2" />
                      {table.customerCount} personas
                    </p>
                    <p className="text-green-400">
                      <FaMoneyBillWave className="inline mr-2" />
                      ${table.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-yellow-400">
                      <FaStar className="inline mr-2" />
                      Propina: ${table.tipAmount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Asignar nueva mesa */}
            <div className="mt-6 space-y-4">
              <h5 className="text-md font-semibold text-white">Asignar Nueva Mesa</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Número de Mesa</label>
                  <input
                    type="number"
                    value={newTable.tableNumber || ''} // Use empty string for 0 to avoid browser issues
                    onChange={(e) => setNewTable({ ...newTable, tableNumber: Number(e.target.value) })} // Ensure it's a number
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Cantidad de Personas</label>
                  <input
                    type="number"
                    value={newTable.customerCount || ''} // Use empty string for 0
                    onChange={(e) => setNewTable({ ...newTable, customerCount: Number(e.target.value) })} // Ensure it's a number
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                    min="1"
                  />
                </div>
              </div>
              <button
                onClick={() => handleAssignTable(waiter.id)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Asignar Mesa
              </button>
            </div>
          </div>
        );

      case 'notes':
        const filteredNotes = waiter.notes?.filter(note => {
          const matchesFilter = noteFilter === 'all' || note.type === noteFilter;
          const matchesSearch = note.content.toLowerCase().includes(noteSearch.toLowerCase());
          return matchesFilter && matchesSearch;
        });

        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Notas y Comentarios</h4>
            
            {/* Filtros y búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2"
                    placeholder="Buscar en notas..."
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              <select
                value={noteFilter}
                onChange={(e) => setNoteFilter(e.target.value as 'all' | WaiterNote['type'])}
                className="bg-gray-700 text-white rounded-lg px-4 py-2"
              >
                <option value="all">Todas las notas</option>
                <option value="performance">Desempeño</option>
                <option value="incident">Incidencias</option>
                <option value="achievement">Logros</option>
                <option value="punctuality">Puntualidad</option>
                <option value="general">Generales</option>
              </select>
            </div>

            {/* Lista de notas */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {filteredNotes?.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gray-800/50 rounded-lg p-4 ${
                    note.type === 'achievement' ? 'border-l-4 border-yellow-400' :
                    note.type === 'incident' ? 'border-l-4 border-red-400' :
                    note.type === 'performance' ? 'border-l-4 border-blue-400' :
                    note.type === 'training' ? 'border-l-4 border-green-400' :
                    note.type === 'punctuality' ? 'border-l-4 border-green-400' :
                    'border-l-4 border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded text-sm ${
                        note.type === 'performance' ? 'bg-blue-600' :
                        note.type === 'incident' ? 'bg-red-600' :
                        note.type === 'achievement' ? 'bg-yellow-600' :
                        note.type === 'training' ? 'bg-green-600' :
                        note.type === 'punctuality' ? 'bg-green-600' :
                        'bg-gray-600'
                      }`}>
                        {note.type === 'performance' ? 'Desempeño' :
                         note.type === 'incident' ? 'Incidencia' :
                         note.type === 'achievement' ? 'Logro' :
                         note.type === 'training' ? 'Capacitación' :
                         note.type === 'punctuality' ? 'Puntualidad' :
                         'General'}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(note.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Editar nota"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(waiter.id, note.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar nota"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {editingNote?.id === note.id ? (
                    <div className="space-y-2">
                      <select
                        value={editingNote.type}
                        onChange={(e) => setEditingNote({ ...editingNote, type: e.target.value as WaiterNote['type'] })}
                        className="w-full bg-gray-600 text-white rounded-lg px-4 py-2"
                      >
                        <option value="general">General</option>
                        <option value="performance">Desempeño</option>
                        <option value="incident">Incidencia</option>
                        <option value="achievement">Logro</option>
                        <option value="punctuality">Puntualidad</option>
                      </select>
                      <textarea
                        value={editingNote.content}
                        onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                        className="w-full bg-gray-600 text-white rounded-lg px-4 py-2"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditNote(waiter.id, editingNote)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white whitespace-pre-wrap">{note.content}</p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Formulario para nueva nota */}
            <div className="mt-4 space-y-4">
              <h5 className="text-md font-semibold text-white">Agregar Nueva Nota</h5>
              <select
                value={newNote.type}
                onChange={(e) => setNewNote({ ...newNote, type: e.target.value as WaiterNote['type'] })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              >
                <option value="general">General</option>
                <option value="performance">Desempeño</option>
                <option value="incident">Incidencia</option>
                <option value="achievement">Logro</option>
                <option value="punctuality">Puntualidad</option>
              </select>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                rows={4}
                placeholder="Escribe tu nota aquí..."
              />
              <button
                onClick={() => handleAddNote(waiter.id)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Agregar Nota
              </button>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Rendimiento</h4>
            
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock className="text-blue-400" />
                  <h5 className="text-gray-400">Tiempo Promedio de Servicio</h5>
                </div>
                <p className="text-white text-2xl">{(waiter.performance?.averageServiceTime || 0).toFixed(1)} min</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaTable className="text-green-400" />
                  <h5 className="text-gray-400">Total de Mesas Atendidas</h5>
                </div>
                <p className="text-white text-2xl">{waiter.performance?.totalTablesServed || 0}</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaMoneyBillWave className="text-yellow-400" />
                  <h5 className="text-gray-400">Total de Propinas</h5>
                </div>
                <p className="text-white text-2xl">${(waiter.performance?.totalTips || 0).toFixed(2)}</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaChartBar className="text-purple-400" />
                  <h5 className="text-gray-400">Mejor Turno</h5>
                </div>
                <p className="text-white text-2xl">{waiter.performance?.bestShift || 'N/A'}</p>
              </div>
            </div>

            {/* Estadísticas detalladas */}
            <div className="mt-6">
              <h5 className="text-md font-semibold text-white mb-4">Estadísticas Detalladas</h5>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="space-y-2">
                  <p className="text-gray-400">
                    <span className="text-white">Mejor día:</span> {waiter.performance?.bestDay || 'N/A'}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-white">Promedio de propinas por mesa:</span> 
                    ${((waiter.performance?.totalTips || 0) / (waiter.performance?.totalTablesServed || 1)).toFixed(2)}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-white">Eficiencia de servicio:</span>
                    {waiter.performance?.averageServiceTime ? 
                      `${Math.round(100 - ((waiter.performance.averageServiceTime || 0) / 60) * 100)}%` :
                      'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null; // Should not happen with defined tabs
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
        <h2 className="text-2xl font-bold text-white">Gestión de Mozos</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaUserPlus />
          <span>Agregar Mozo</span>
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 rounded-lg p-6 overflow-hidden"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Nuevo Mozo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newWaiter.name}
                  onChange={(e) => setNewWaiter({ ...newWaiter, name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del mozo"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">DNI</label>
                <input
                  type="text"
                  value={newWaiter.dni}
                  onChange={(e) => setNewWaiter({ ...newWaiter, dni: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de DNI"
                  maxLength={8}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">URL de la foto</label>
                <input
                  type="text"
                  value={newWaiter.photo}
                  onChange={(e) => setNewWaiter({ ...newWaiter, photo: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/images/waiters/waiter.jpg"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {waiters.map((waiter) => {
          console.log("Processing waiter in map:", waiter.id, waiter.name); // Log here
          return (
            <motion.div
              key={waiter.id}
              whileHover={{ scale: 1.02 }}
              className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
            >
              {editingWaiter?.id === waiter.id ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Editar Mozo</h3>
                  <div>
                    <label className="block text-gray-400 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={editingWaiter.name}
                      onChange={(e) => setEditingWaiter({ ...editingWaiter, name: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">DNI</label>
                    <input
                      type="text"
                      value={editingWaiter.dni}
                      onChange={(e) => setEditingWaiter({ ...editingWaiter, dni: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="DNI"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">URL de la foto</label>
                    <input
                      type="text"
                      value={editingWaiter.photo}
                      onChange={(e) => setEditingWaiter({ ...editingWaiter, photo: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="URL de la foto"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleSave(editingWaiter)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingWaiter(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="waiter-card-content">
                  {/* Waiter Info and Tabs */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {waiter.photo ? (
                            <Image
                              src={waiter.photo}
                              alt={waiter.name}
                              fill
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl font-bold text-gray-400">{waiter.name ? waiter.name[0] : ''}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-xl font-semibold text-white truncate">{waiter.name}</h3>
                          <div className="flex items-center gap-2 text-gray-400">
                            <FaStar className="text-yellow-400" />
                            <span>{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                            <span className="text-sm">({waiter.ratings?.length || 0} valoraciones)</span>
                          </div>
                        </div>
                      </div>
                      {/* Active/Inactive Toggle Button */}
                      <button
                        onClick={() => toggleActive(waiter)}
                        className={`p-2 rounded-full ${
                          waiter.isActive
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        } transition-colors`}
                        title={waiter.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {waiter.isActive ? <FaCheck className="w-5 h-5"/> : <FaTimes className="w-5 h-5"/>}
                      </button>
                    </div>

                     {/* Tabs */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTabChange(waiter.id, 'info')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          activeTabs[waiter.id] === 'info' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <FaUserTie />
                        <span>Info</span>
                      </button>
                      <button
                        onClick={() => handleTabChange(waiter.id, 'shifts')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          activeTabs[waiter.id] === 'shifts' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <FaClock />
                        <span>Turnos</span>
                      </button>
                      <button
                        onClick={() => handleTabChange(waiter.id, 'tables')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          activeTabs[waiter.id] === 'tables' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <FaTable />
                        <span>Mesas</span>
                      </button>
                      <button
                        onClick={() => handleTabChange(waiter.id, 'notes')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          activeTabs[waiter.id] === 'notes' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <FaStickyNote />
                        <span>Notas</span>
                      </button>
                      <button
                        onClick={() => handleTabChange(waiter.id, 'performance')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          activeTabs[waiter.id] === 'performance' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <FaChartLine />
                        <span>Rendimiento</span>
                      </button>
                    </div>

                     {/* Render Active Tab Details */}
                    {renderWaiterDetails(waiter, activeTabs[waiter.id] || 'info')}
                  </div>

                  {/* Actions: Edit, Delete, QR */}
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(waiter)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <FaEdit className="w-5 h-5"/>
                      </button>
                      <button
                        onClick={() => handleDelete(waiter.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <FaTrash className="w-5 h-5"/>
                      </button>
                    </div>
                    {/* QR Button */}
                    <div className="flex gap-2">
                       <button
                         onClick={() => handleShowQR(waiter)}
                         className="p-2 text-gray-400 hover:text-white transition-colors"
                         title="Ver QR"
                       >
                         <FaQrcode className="w-5 h-5"/>
                       </button>
                    </div>
                  </div>

                  {/* Hidden QR code for download */}
                  <div className="hidden">
                    <QRCodeSVG
                      id={`qr-${waiter.id}`}
                      value={`${window.location.origin}/rate-waiters/${waiter.id}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                </div>
              )}

            </motion.div>
          );
        })}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCloseQR}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-700 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseQR}
                className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none"
                title="Cerrar"
              >
                &times;
              </button>
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-xl font-bold text-white mb-2">Código QR de {waiters.find(w => w.id === showQR)?.name}</h3>
                <div className="bg-white p-4 rounded-lg">
                   <QRCodeSVG
                     value={`${window.location.origin}/rate-waiters/${showQR}`}
                     size={256}
                     level="H"
                     includeMargin={false}
                   />
                </div>
                
                <button
                  onClick={() => handleDownloadQR(showQR || '')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <FaDownload />
                  Descargar QR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}