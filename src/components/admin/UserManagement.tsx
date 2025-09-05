import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updatePassword, signInWithEmailAndPassword, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaUserPlus, FaUserShield, FaUser, FaCrown, FaEye, FaKey } from 'react-icons/fa';
import { User } from '@/types/firebase';
import { toast } from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'superadmin' | 'admin' | 'user',
    isActive: true,
    permissions: {
      canManageUsers: false,
      canManageProducts: true,
      canManageWaiters: true,
      canViewStatistics: true,
      canManageSettings: false,
      canManageCategories: true
    }
  });
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // Obtener usuario actual
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        }
      }
    };

    fetchCurrentUser();

    // Suscribirse a cambios en usuarios
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      setUsers(usersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Superadmin puede gestionar a todos
    if (currentUser.role === 'superadmin') return true;
    
    // Admin solo puede gestionar usuarios normales
    if (currentUser.role === 'admin' && targetUser.role === 'user') return true;
    
    return false;
  };

  const canAssignRole = (role: 'superadmin' | 'admin' | 'user') => {
    if (!currentUser) return false;
    
    // Solo superadmin puede asignar roles de admin
    if (role === 'admin' && currentUser.role !== 'superadmin') return false;
    
    // Solo superadmin puede asignar superadmin
    if (role === 'superadmin' && currentUser.role !== 'superadmin') return false;
    
    return true;
  };

  const handleEdit = (user: User) => {
    if (canManageUser(user)) {
      setEditingUser(user);
    } else {
      toast.error('No tienes permisos para editar este usuario');
    }
  };

  const handleSave = async (user: User) => {
    try {
      if (!canManageUser(user)) {
        toast.error('No tienes permisos para editar este usuario');
        return;
      }

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions
      });
      setEditingUser(null);
      toast.success('Usuario actualizado exitosamente');
    } catch (error: unknown) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete || !canManageUser(userToDelete)) {
      toast.error('No tienes permisos para eliminar este usuario');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        // 1. Eliminar el documento de Firestore
        await deleteDoc(doc(db, 'users', userId));
        
        // 2. Intentar eliminar el usuario de Firebase Authentication
        try {
          // Obtener el usuario actual de Firebase Auth
          const currentAuthUser = auth.currentUser;
          if (currentAuthUser && currentAuthUser.uid === userId) {
            // Si estamos eliminando el usuario actual
            await deleteUser(currentAuthUser);
          } else {
            // Si estamos eliminando otro usuario, necesitamos usar el Admin SDK
            // Por ahora, solo mostraremos un mensaje informativo
            toast('El usuario ha sido eliminado de la base de datos. Para eliminar completamente la cuenta, contacta al superadmin.');
          }
        } catch (authError: unknown) {
          console.error('Error al eliminar usuario de Authentication:', authError);
          // Continuamos aunque falle la eliminación en Auth, ya que al menos se eliminó de Firestore
        }

        toast.success('Usuario eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const handleAdd = async () => {
    try {
      if (!currentUser) {
        toast.error('No hay usuario autenticado');
        return;
      }

      if (!canAssignRole(newUser.role)) {
        toast.error('No tienes permisos para asignar este rol');
        return;
      }

      if (!newUser.password || newUser.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      const newId = userCredential.user.uid; // Usar el UID generado por Firebase Auth
      const userRef = doc(db, 'users', newId);
      
      // Crear objeto de usuario sin campos undefined y sin la contraseña
      const userDataWithoutPassword = newUser;
      const userData = {
        ...userDataWithoutPassword,
        id: newId,
        createdBy: currentUser?.id || null,
        lastLogin: new Date().toISOString()
      };

      await setDoc(userRef, userData);
      
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user',
        isActive: true,
        permissions: {
          canManageUsers: false,
          canManageProducts: true,
          canManageWaiters: true,
          canViewStatistics: true,
          canManageSettings: false,
          canManageCategories: true
        }
      });
      setShowAddForm(false);
      toast.success('Usuario creado exitosamente');
    } catch (error: unknown) {
      console.error('Error al agregar usuario:', error);
      // Attempt to narrow the type if it's a Firebase AuthError
      if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
        if (error.code === 'auth/email-already-in-use') {
          toast.error('El email ya está en uso');
        } else if (error.code === 'auth/invalid-email') {
          toast.error('El email no es válido');
        } else {
          toast.error('Error al crear usuario');
        }
      } else {
        toast.error('Error al crear usuario');
      }
    }
  };

  const toggleActive = async (user: User) => {
    if (!canManageUser(user)) {
      toast.error('No tienes permisos para cambiar el estado de este usuario');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isActive: !user.isActive
      });
      toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const getDefaultPermissionsForRole = (role: 'superadmin' | 'admin' | 'user') => {
    switch (role) {
      case 'superadmin':
        return {
          canManageUsers: true,
          canManageProducts: true,
          canManageWaiters: true,
          canViewStatistics: true,
          canManageSettings: true,
          canManageCategories: true
        };
      case 'admin':
        return {
          canManageUsers: true,
          canManageProducts: true,
          canManageWaiters: true,
          canViewStatistics: true,
          canManageSettings: false,
          canManageCategories: true
        };
      case 'user':
        return {
          canManageUsers: false,
          canManageProducts: true,
          canManageWaiters: true,
          canViewStatistics: true,
          canManageSettings: false,
          canManageCategories: false
        };
    }
  };

  const handleRoleChange = (role: 'superadmin' | 'admin' | 'user') => {
    const defaultPermissions = getDefaultPermissionsForRole(role);
    setNewUser(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions
    }));
  };

  const canModifyPermissions = () => {
    if (!currentUser) return false;
    return currentUser.role === 'superadmin';
  };

  const canChangePassword = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Superadmin puede cambiar la contraseña de cualquiera
    if (currentUser.role === 'superadmin') return true;
    
    // Admin puede cambiar su propia contraseña y la de usuarios normales
    if (currentUser.role === 'admin') {
      return targetUser.role === 'user' || targetUser.id === currentUser.id;
    }
    
    return false;
  };

  const handleChangePassword = async (userId: string) => {
    try {
      const userToChange = users.find(u => u.id === userId);
      if (!userToChange || !canChangePassword(userToChange)) {
        toast.error('No tienes permisos para cambiar la contraseña de este usuario');
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Obtener el usuario de Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userToChange.email,
        'temporary-password'
      );
      await updatePassword(userCredential.user, newPassword);

      setChangingPassword(null);
      setNewPassword('');
      toast.success('Contraseña actualizada exitosamente');
    } catch (error: unknown) {
      console.error('Error al cambiar contraseña:', error);
      // Attempt to narrow the type if it's a Firebase AuthError
      if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
        if (error.code === 'auth/requires-recent-login') {
          toast.error('Por favor, inicia sesión nuevamente para cambiar la contraseña.');
        } else {
           toast.error('Error al cambiar contraseña.');
        }
      } else {
        toast.error('Error al cambiar contraseña.');
      }
    }
  };

  const canResetPassword = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Superadmin puede resetear la contraseña de cualquiera
    if (currentUser.role === 'superadmin') return true;
    
    // Admin puede resetear su propia contraseña y la de usuarios normales
    if (currentUser.role === 'admin') {
      return targetUser.role === 'user' || targetUser.id === currentUser.id;
    }
    
    return false;
  };

  const handleResetPassword = async (user: User) => {
    try {
      if (!canResetPassword(user)) {
        toast.error('No tienes permisos para resetear la contraseña de este usuario');
        return;
      }

      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Se ha enviado un correo de restablecimiento a ${user.email}`);
    } catch (error: unknown) {
      console.error('Error al resetear contraseña:', error);
       // Attempt to narrow the type if it's a Firebase AuthError
       if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
          if (error.code === 'auth/user-not-found') {
            toast.error('Usuario no encontrado.');
          } else {
            toast.error('Error al resetear contraseña.');
          }
       } else {
         toast.error('Error al resetear contraseña.');
       }
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
        <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
        {currentUser?.role === 'superadmin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaUserPlus />
            <span>Agregar Usuario</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Nuevo Usuario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="Nombre del usuario"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => handleRoleChange(e.target.value as 'superadmin' | 'admin' | 'user')}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  disabled={!canAssignRole(newUser.role)}
                >
                  <option value="user">Usuario</option>
                  {currentUser?.role === 'superadmin' && (
                    <>
                      <option value="admin">Administrador</option>
                      <option value="superadmin">Super Administrador</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-gray-400 mb-2">Permisos</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canManageUsers}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        permissions: { ...newUser.permissions, canManageUsers: e.target.checked }
                      })}
                      disabled={!canModifyPermissions()}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">Gestionar Usuarios</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canManageProducts}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        permissions: { ...newUser.permissions, canManageProducts: e.target.checked }
                      })}
                      disabled={!canModifyPermissions()}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">Gestionar Productos</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canManageWaiters}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        permissions: { ...newUser.permissions, canManageWaiters: e.target.checked }
                      })}
                      disabled={!canModifyPermissions()}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">Gestionar Mozos</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canViewStatistics}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        permissions: { ...newUser.permissions, canViewStatistics: e.target.checked }
                      })}
                      disabled={!canModifyPermissions()}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">Ver Estadísticas</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canManageSettings}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        permissions: { ...newUser.permissions, canManageSettings: e.target.checked }
                      })}
                      disabled={!canModifyPermissions()}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">Gestionar Configuración</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.canManageCategories}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        permissions: { ...newUser.permissions, canManageCategories: e.target.checked }
                      })}
                      disabled={!canModifyPermissions()}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-gray-400">Gestionar Categorías</span>
                  </label>
                </div>
                {!canModifyPermissions() && (
                  <p className="text-sm text-gray-500 mt-2">
                    Los permisos se ajustan automáticamente según el rol seleccionado
                  </p>
                )}
              </div>
              <div className="flex gap-4">
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
        {users.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            {editingUser?.id === user.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                />
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                />
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'superadmin' | 'admin' | 'user' })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                  disabled={!canAssignRole(editingUser.role)}
                >
                  <option value="user">Usuario</option>
                  {currentUser?.role === 'superadmin' && (
                    <>
                      <option value="admin">Administrador</option>
                      <option value="superadmin">Super Administrador</option>
                    </>
                  )}
                </select>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSave(editingUser)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : changingPassword === user.id ? (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Cambiar Contraseña</h4>
                <div>
                  <label className="block text-gray-400 mb-2">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChangePassword(user.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setChangingPassword(null);
                      setNewPassword('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      {user.role === 'superadmin' ? (
                        <FaCrown className="text-yellow-500 text-xl" />
                      ) : user.role === 'admin' ? (
                        <FaUserShield className="text-blue-500 text-xl" />
                      ) : (
                        <FaUser className="text-gray-400 text-xl" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                      <p className="text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  {canManageUser(user) && (
                    <button
                      onClick={() => toggleActive(user)}
                      className={`p-2 rounded-full ${
                        user.isActive
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } transition-colors`}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    Rol: {
                      user.role === 'superadmin' ? 'Super Administrador' :
                      user.role === 'admin' ? 'Administrador' : 'Usuario'
                    }
                  </p>
                  {user.lastLogin && (
                    <p className="text-sm text-gray-400">
                      Último acceso: {new Date(user.lastLogin).toLocaleString()}
                    </p>
                  )}
                  {user.permissions && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium text-gray-400">Permisos:</p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        {user.permissions.canManageUsers && <li>• Gestionar Usuarios</li>}
                        {user.permissions.canManageProducts && <li>• Gestionar Productos</li>}
                        {user.permissions.canManageWaiters && <li>• Gestionar Mozos</li>}
                        {user.permissions.canViewStatistics && <li>• Ver Estadísticas</li>}
                        {user.permissions.canManageSettings && <li>• Gestionar Configuración</li>}
                        {user.permissions.canManageCategories && <li>• Gestionar Categorías</li>}
                      </ul>
                    </div>
                  )}
                </div>
                {canManageUser(user) ? (
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FaEdit />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FaTrash />
                        <span>Eliminar</span>
                      </button>
                    </div>
                    {canResetPassword(user) && (
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <FaKey />
                        <span>Enviar correo de restablecimiento de contraseña</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <FaEye />
                      <span>Modo de solo lectura</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
} 