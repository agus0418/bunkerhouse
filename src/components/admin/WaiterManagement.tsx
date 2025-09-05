import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, addDoc, getDocs, writeBatch, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Waiter, WaiterShift, WaiterTable, WaiterNote } from '@/types/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaUserPlus, FaStar, FaCheck, FaTimes, FaClock, FaTable, FaStickyNote, FaChartLine, FaUserTie, FaSearch, FaUsers, FaMoneyBillWave, FaChartBar, FaQrcode, FaDownload, FaExclamationTriangle, FaTrophy } from 'react-icons/fa';
import RatingStars from '@/components/RatingStars';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function WaiterManagement() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTabs, setActiveTabs] = useState<{[key: string]: 'info' | 'shifts' | 'tables' | 'notes' | 'desempeño'}>({});
  const [activeNotesTab, setActiveNotesTab] = useState<'admin' | 'ratings'>('admin');
  const [ratingSort, setRatingSort] = useState<'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc'>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const ratingsPerPage = 5;
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
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [currentWaiterId, setCurrentWaiterId] = useState<string | null>(null);
  const [noteFilter, setNoteFilter] = useState<'all' | 'desempeño' | 'incidente' | 'logro' | 'entrenamiento' | 'general' | 'puntualidad'>('all');
  const [noteSearch, setNoteSearch] = useState('');
  const [editingNote, setEditingNote] = useState<WaiterNote | null>(null);
  const [newTable, setNewTable] = useState<Partial<WaiterTable>>({
    tableNumber: 0,
    customerCount: 0,
    startTime: new Date().toISOString(),
    status: 'active'
  });
  const [showQR, setShowQR] = useState<string | null>(null);

  // New state to manage collapsible state
  const [collapsedState, setCollapsedState] = useState<{[key: string]: boolean}>({});

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
        notes: waiter.notes ? [...waiter.notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []
      }));

      // Sort unique waiters by name (or another preferred field if necessary)
      processedWaiters.sort((a, b) => a.name.localeCompare(b.name));

      console.log("Mozos únicos antes de setear estado:", processedWaiters); // Log here

      setWaiters(processedWaiters); // Set the processed and unique data

      // Initialize collapsedState for all waiters to be true (collapsed)
      setCollapsedState(processedWaiters.reduce((acc, waiter) => {
        acc[waiter.id] = true; // Set to true to make them collapsed by default
        return acc;
      }, {} as {[key: string]: boolean}));

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

        // Notas ahora están en el documento principal, no se necesita eliminar subcolección
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
        notes: [], // Inicializar array de notas
        averageRating: 0,
        totalTips: 0,
        desempeño: {
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

  const handleOpenAddNoteForm = (waiterId: string) => {
    setCurrentWaiterId(waiterId);
    setShowAddNoteForm(true);
  };

  const handleCloseAddNoteForm = () => {
    setShowAddNoteForm(false);
    setCurrentWaiterId(null);
    setNewNote({ type: 'general', content: '', date: new Date().toISOString() });
  };

  const handleAddNote = async () => {
    if (!currentWaiterId) return;
    
    try {
      if (!newNote.content) {
        toast.error('El contenido de la nota no puede estar vacío');
        return;
      }
      
      const newNoteData = {
        id: Date.now().toString(), // ID único
        type: newNote.type || 'general',
        content: newNote.content || '',
        date: new Date().toISOString(),
        createdBy: 'admin'
      };

      const waiterRef = doc(db, 'waiters', currentWaiterId);
      await updateDoc(waiterRef, {
        notes: arrayUnion(newNoteData)
      });
      
      // Firestore actualizará el estado automáticamente a través de onSnapshot
      
      setNewNote({ type: 'general', content: '', date: new Date().toISOString() });
      setShowAddNoteForm(false);
      setCurrentWaiterId(null);
      toast.success('Nota agregada exitosamente');
    } catch (error) {
      console.error('Error al agregar nota:', error);
      toast.error('Error al agregar nota');
    }
  };

  const handleEditNote = async (waiterId: string, note: WaiterNote) => {
    try {
      const waiterRef = doc(db, 'waiters', waiterId);
      const currentNotes = [...(waiters.find(w => w.id === waiterId)?.notes || [])];
      const updatedNotes = currentNotes.map(n =>
        n.id === note.id ? { ...n, content: note.content, type: note.type } : n
      );
      
      await updateDoc(waiterRef, { notes: updatedNotes });
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
        const waiterRef = doc(db, 'waiters', waiterId);
        const currentNotes = [...(waiters.find(w => w.id === waiterId)?.notes || [])];
        const updatedNotes = currentNotes.filter(n => n.id !== noteId);
        await updateDoc(waiterRef, { notes: updatedNotes });
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

  const handleTabChange = (waiterId: string, tab: 'info' | 'shifts' | 'tables' | 'notes' | 'desempeño') => {
    setActiveTabs(prev => ({ ...prev, [waiterId]: tab }));
  };

  const renderWaiterDetails = (waiter: Waiter, tab: 'info' | 'shifts' | 'tables' | 'notes' | 'desempeño') => {
    switch (tab) {
      case 'info':
        return (
          <div className="space-y-6">
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
              
              {/* Contadores de Notas y Calificaciones */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-2 border-l-4 border-blue-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => { handleTabChange(waiter.id, 'notes'); setActiveNotesTab('admin'); }}>
                  <FaChartLine className="text-blue-400 w-5 h-5 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Desempeño</h5>
                  <p className="text-white text-lg font-bold">
                    {waiter.notes?.filter(n => n.type === 'desempeño').length || 0}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border-l-4 border-red-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => { handleTabChange(waiter.id, 'notes'); setActiveNotesTab('admin'); }}>
                  <FaExclamationTriangle className="text-red-400 w-5 h-5 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Incidencias</h5>
                  <p className="text-white text-lg font-bold">
                    {waiter.notes?.filter(n => n.type === 'incidente').length || 0}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border-l-4 border-green-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => { handleTabChange(waiter.id, 'notes'); setActiveNotesTab('admin'); }}>
                  <FaClock className="text-green-400 w-5 h-5 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Puntualidad</h5>
                  <p className="text-white text-lg font-bold">
                    {waiter.notes?.filter(n => n.type === 'puntualidad').length || 0}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border-l-4 border-purple-400 hover:bg-gray-800 transition-colors cursor-pointer flex flex-col items-center text-center" onClick={() => { handleTabChange(waiter.id, 'notes'); setActiveNotesTab('ratings'); }}>
                  <FaStar className="text-purple-400 w-5 h-5 mb-1" />
                  <h5 className="text-gray-400 text-xs font-semibold uppercase">Calificaciones</h5>
                  <p className="text-white text-lg font-bold">
                    {waiter.ratings?.length || 0}
                  </p>
                </div>
              </div>

              
              {/* Resumen de Calificaciones */}
              <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-md font-semibold text-white">Resumen de Calificaciones</h5>
                  <button
                    onClick={() => { handleTabChange(waiter.id, 'notes'); setActiveNotesTab('ratings'); }}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Ver todas
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center">
                    <RatingStars rating={waiter.averageRating || 0} />
                  </div>
                  <span className="text-white font-semibold">{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400 text-sm">({waiter.ratings?.length || 0} calificaciones)</span>
                </div>
                
                {/* Distribución de calificaciones */}
                <div className="grid grid-cols-5 text-center text-sm text-gray-400 gap-2 mb-3">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star}>
                      <div className="flex justify-center items-center gap-1 mb-1">
                        <span>{star}</span><FaStar className="text-yellow-400 w-3 h-3" />
                      </div>
                      <p className="text-white font-semibold">{waiter.ratings?.filter(r => Math.floor(r.rating) === star).length || 0}</p>
                      <p className="text-xs">{waiter.ratings?.length ? `${Math.round((waiter.ratings.filter(r => Math.floor(r.rating) === star).length / waiter.ratings.length) * 100)}%` : '0%'}</p>
                    </div>
                  ))}
                </div>
                
                {/* Estadísticas adicionales */}
                <div className="flex justify-between text-gray-400 text-sm mt-4">
                  <p><span className="text-white font-semibold">Total propinas:</span> ${waiter.totalTips?.toFixed(2) || '0.00'}</p>
                  <p><span className="text-white font-semibold">Última calificación:</span> {waiter.ratings?.length ? new Date(waiter.ratings[0].date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              
              {/* Notas Recientes */}
              <div>
                <h6 className="text-md font-semibold text-gray-300 mb-2 flex justify-between">
                  <span>Notas Recientes (Admin)</span>
                  <button
                    onClick={() => { handleTabChange(waiter.id, 'notes'); setActiveNotesTab('admin'); }}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Ver todas
                  </button>
                </h6>
                <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
                  {waiter.notes
                    ?.filter(note => note.createdBy === 'admin')
                    .slice(0, 3)
                    .map(note => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors ${
                          note.type === 'logro' ? 'border-l-4 border-yellow-400' :
                          note.type === 'incidente' ? 'border-l-4 border-red-400' :
                          note.type === 'desempeño' ? 'border-l-4 border-blue-400' :
                          note.type === 'entrenamiento' ? 'border-l-4 border-green-400' :
                          note.type === 'puntualidad' ? 'border-l-4 border-green-400' :
                          'border-l-4 border-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-gray-300">{new Date(note.date).toLocaleDateString()}</span>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            note.type === 'logro' ? 'bg-yellow-600' :
                            note.type === 'incidente' ? 'bg-red-600' :
                            note.type === 'desempeño' ? 'bg-blue-600' :
                            note.type === 'entrenamiento' ? 'bg-green-600' :
                            note.type === 'puntualidad' ? 'bg-green-600' :
                            'bg-gray-600'
                          }`}>
                            {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">{note.content}</p>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Customer Ratings */}

              <div className="mt-6">

                <div>
                  <h6 className="text-sm font-semibold text-gray-300 mb-2 flex justify-between">
                    <span>Calificaciones de Clientes</span>
                    <button
                      onClick={() => { handleTabChange(waiter.id, 'notes'); setActiveNotesTab('ratings'); }}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Ver todas
                    </button>
                  </h6>
                  <div className="space-y-3">
                    {waiter.ratings
                      ?.slice(0, 3)
                      .map(rating => (
                        <motion.div
                          key={rating.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gray-800/50 rounded-md p-2 hover:bg-gray-800 transition-colors border-l-4 border-purple-400 text-sm"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-1 py-0.5 rounded text-xs font-semibold bg-purple-600">
                                Mesa {rating.tableNumber}
                              </span>
                              <span className="text-gray-400 text-xs">
                                {new Date(rating.date).toLocaleDateString()}
                              </span>
                            </div>
                             {/* Display user name */}
                            <span className="text-gray-300 text-xs font-semibold">{rating.userName}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <RatingStars rating={Number(rating.rating)} size={16} />
                            <span className="text-gray-300 text-xs">{Number(rating.rating).toFixed(1)}/5</span>
                          </div>
                          {rating.comment && <p className="text-gray-400 text-xs">{rating.comment}</p>}
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'shifts':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Turnos</h4>
            <button
              onClick={() => handleAddShift(waiter.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Añadir Turno
            </button>
            {waiter.shifts && waiter.shifts.length > 0 ? (
              <div className="space-y-3">
                {waiter.shifts.map(shift => (
                  <div
                    key={shift.id}
                    className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors border-l-4 border-blue-400"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-300">{new Date(shift.startTime).toLocaleString()} - {new Date(shift.endTime).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-400 text-sm">Duración: {((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2)} horas</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No hay turnos registrados.</p>
            )}
          </div>
        );

      case 'tables':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Mesas Asignadas</h4>
            <button
              onClick={() => handleAssignTable(waiter.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Asignar Mesa
            </button>
            {waiter.currentTables && waiter.currentTables.length > 0 ? (
              <div className="space-y-3">
                {waiter.currentTables.map((table: WaiterTable) => (
                  <div
                    key={table.id}
                    className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors border-l-4 border-green-400"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-300">Mesa {table.tableNumber}</span>
                      <span className="text-gray-400 text-xs">Asignada: {new Date(table.startTime).toLocaleString()}</span>
                    </div>
                    {table.endTime && <p className="text-gray-400 text-sm">Completada: {new Date(table.endTime).toLocaleString()}</p>}
                    {table.totalAmount !== undefined && <p className="text-gray-400 text-sm">Total: ${table.totalAmount.toFixed(2)}</p>}
                    {table.tipAmount !== undefined && <p className="text-gray-400 text-sm">Propina: ${table.tipAmount.toFixed(2)}</p>}
                     {!table.endTime && (
                       <button
                         onClick={() => handleCompleteTable(waiter.id, table.id, table.totalAmount, table.tipAmount)}
                         className="mt-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                       >
                         Completar Mesa
                       </button>
                     )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No hay mesas asignadas.</p>
            )}
          </div>
        );

      case 'notes':
        // Use activeNotesTab to render either admin notes or ratings
        return (
            <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4">Notas</h4>

                {/* Tabs for Admin Notes and Customer Ratings */}
                <div className="flex border-b border-gray-700 mb-4">
                    <button
                        onClick={() => setActiveNotesTab('admin')}
                        className={`px-4 py-2 -mb-px text-sm font-medium focus:outline-none ${
                            activeNotesTab === 'admin' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Notas de Admin
                    </button>
                    <button
                        onClick={() => setActiveNotesTab('ratings')}
                        className={`ml-4 px-4 py-2 -mb-px text-sm font-medium focus:outline-none ${
                            activeNotesTab === 'ratings' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Calificaciones de Clientes
                    </button>
                </div>

                {activeNotesTab === 'admin' ? (
                    <>
                        {/* Botón para añadir nota */}
                        <button
                            onClick={() => handleOpenAddNoteForm(waiter.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
                        >
                            Añadir Nota
                        </button>
                        {waiter.notes && waiter.notes.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {waiter.notes
                                    .filter(note => note.createdBy === 'admin')
                                    .map(note => (
                                        <motion.div
                                            key={note.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`bg-gray-800/50 rounded-md p-2 hover:bg-gray-800 transition-colors text-sm ${
                                                note.type === 'logro' ? 'border-l-4 border-yellow-400' :
                                                note.type === 'incidente' ? 'border-l-4 border-red-400' :
                                                note.type === 'desempeño' ? 'border-l-4 border-blue-400' :
                                                note.type === 'entrenamiento' ? 'border-l-4 border-green-400' :
                                                note.type === 'puntualidad' ? 'border-l-4 border-green-400' :
                                                'border-l-4 border-gray-400'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                              <span className="text-xs font-semibold text-gray-300">{new Date(note.date).toLocaleDateString()}</span>
                                              <span className={`inline-block px-1 py-0.5 rounded text-xs font-semibold ${note.type === 'logro' ? 'bg-yellow-600' :
                                                note.type === 'incidente' ? 'bg-red-600' :
                                                note.type === 'desempeño' ? 'bg-blue-600' :
                                                note.type === 'entrenamiento' ? 'bg-green-600' :
                                                note.type === 'puntualidad' ? 'bg-green-600' :
                                                'bg-gray-600'
                                              }`}>
                                                {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                                              </span>
                                            </div>
                                            <p className="text-gray-400 text-xs">{note.content}</p>
                                            <div className="mt-1 flex gap-2">
                                                <button
                                                    onClick={() => handleEditNote(waiter.id, note)}
                                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNote(waiter.id, note.id)}
                                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No hay notas de administrador registradas.</p>
                        )}
                    </>
                ) : (
                    <>
                        {waiter.ratings && waiter.ratings.length > 0 ? (
                            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                                {waiter.ratings.map(rating => (
                                    <motion.div
                                        key={rating.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-gray-800/50 rounded-md p-3 hover:bg-gray-800 transition-colors border-l-4 border-purple-400 text-sm space-y-1"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                                 <span className="inline-block px-1 py-0.5 rounded text-xs font-semibold bg-purple-600 text-white">
                                                    Mesa {rating.tableNumber}
                                                </span>
                                                <span>{new Date(rating.date).toLocaleDateString()}</span>
                                                {/* Display customer name if available */}
                                                <span className="text-gray-300 text-xs font-semibold">
                                                   {rating.customerName ? `Cliente: ${rating.customerName}` : `por ${rating.userName}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RatingStars rating={Number(rating.rating)} size={16} />
                                                <span className="text-gray-300 text-xs">{Number(rating.rating).toFixed(1)}/5</span>
                                            </div>
                                        </div>
                                        {rating.comment && <p className="text-gray-400 text-xs">{rating.comment}</p>}
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No hay calificaciones de clientes registradas.</p>
                        )}
                    </>
                )}
            </div>
        );

      case 'desempeño':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Rendimiento</h4>
            
            {/* Resumen de Calificaciones */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h5 className="text-md font-semibold text-white mb-3">Resumen de Calificaciones</h5>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-white text-xl">{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                <span className="text-gray-400">({waiter.ratings?.length || 0} calificaciones)</span>
              </div>
              
              {waiter.ratings && waiter.ratings.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-400">
                    <span className="text-white">Última calificación:</span>{' '}
                    {waiter.ratings.length > 0
                      ? new Date(waiter.ratings[0].date).toLocaleDateString()
                      : 'N/A'}
                  </div>
                  <div className="text-gray-400">
                    <span className="text-white">Total propinas:</span>{' '}
                    ${waiter.totalTips?.toFixed(2) || '0.00'}
                  </div>
                </div>
              )}
            </div>
            
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
                <p className="text-white text-2xl">${(waiter.totalTips || 0).toFixed(2)}</p>
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
                    ${((waiter.totalTips || 0) / (waiter.performance?.totalTablesServed || 1)).toFixed(2)}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-white">Calificación promedio:</span>{' '}
                    {waiter.averageRating?.toFixed(1) || '0.0'}/5
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
        {/* Contenedor de tarjetas de mozos */}
        {waiters.map((waiter) => {
          console.log("Processing waiter in map:", waiter.id, waiter.name); // Log here
          return (
            <motion.div
              key={waiter.id}
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl transition-colors duration-300 ${!collapsedState[waiter.id] ? 'bg-black/40 backdrop-blur-sm border border-gray-800 p-6' : 'p-4 hover:bg-gray-900/20'}`}
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
                <div className={`waiter-card-content ${collapsedState[waiter.id] ? 'pb-0' : ''}`}>
                  {/* Waiter Info and Tabs */}
                  <div className={`${collapsedState[waiter.id] ? '' : 'space-y-6'}`}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        setCollapsedState(prevState => {
                          // Si el mozo actual ya está expandido, simplemente lo colapsamos
                          if (!prevState[waiter.id]) {
                            return { ...prevState, [waiter.id]: true };
                          }
                          
                          // Si está colapsado, colapsamos todos los demás y expandimos solo este
                          const newState = Object.keys(prevState).reduce((acc, key) => {
                            acc[key] = true; // Colapsar todos los mozos
                            return acc;
                          }, {} as {[key: string]: boolean});
                          
                          // Expandir solo el mozo actual
                          return { ...newState, [waiter.id]: false };
                        });
                      }}
                    >
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
                          <h3 className="text-xl font-semibold text-white truncate flex items-center gap-2">
                            {waiter.name}
                            {collapsedState[waiter.id] && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-400">
                            <FaStar className="text-yellow-400" />
                            <span>{waiter.averageRating?.toFixed(1) || '0.0'}</span>
                            <span className="text-sm">({waiter.ratings?.length || 0} valoraciones)</span>
                          </div>
                        </div>
                      </div>
                      {/* Active/Inactive Toggle Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleActive(waiter); }}
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

                    {/* Tabs - Solo se muestran cuando el mozo está expandido */}
                    {!collapsedState[waiter.id] && (
                      <div className="mt-4 flex flex-wrap gap-2 bg-gray-800/50 p-2 rounded-lg">
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
                          onClick={() => handleTabChange(waiter.id, 'desempeño')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            activeTabs[waiter.id] === 'desempeño' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          <FaChartLine />
                          <span>Rendimiento</span>
                        </button>
                      </div>
                    )}

                    {/* Collapsible Content */}
                    {!collapsedState[waiter.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        {/* Render Active Tab Details */}
                        {renderWaiterDetails(waiter, activeTabs[waiter.id] || 'info')}

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
                      </motion.div>
                    )}
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

      {/* Add Note Modal */}
      <AnimatePresence>
        {showAddNoteForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCloseAddNoteForm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseAddNoteForm}
                className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none"
                title="Cerrar"
              >
                &times;
              </button>
              <h3 className="text-xl font-bold text-white mb-4">Añadir Nota</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Tipo de Nota</label>
                  <select
                    value={newNote.type}
                    onChange={(e) => setNewNote({ ...newNote, type: e.target.value as any })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desempeño">Desempeño</option>
                    <option value="incidente">Incidencia</option>
                    <option value="puntualidad">Puntualidad</option>
                    <option value="logro">Logro</option>
                    <option value="entrenamiento">Capacitación</option>
                    <option value="general">General</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Contenido</label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Escribe el contenido de la nota aquí..."
                  ></textarea>
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={handleCloseAddNoteForm}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}