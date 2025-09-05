'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';

// Definir un tipo para los errores de Firebase que esperamos
interface FirebaseErrorType {
  code: string;
  message: string;
}

interface AdminProfile {
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingPasswordChange, setIsSubmittingPasswordChange] = useState(false);
  const [isSubmittingProfileUpdate, setIsSubmittingProfileUpdate] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const profileData: AdminProfile = {
              name: user.displayName || userData.name || 'Nombre no disponible',
              email: user.email || 'Email no disponible',
              role: userData.role || 'Rol no especificado',
            };
            setProfile(profileData);
            setFormData(prev => ({
              ...prev,
              name: profileData.name,
              email: profileData.email, 
            }));
          } else {
            setProfileError('No se encontró el perfil del usuario en la base de datos.');
          }
        } catch (error) {
          console.error("Error al cargar perfil de Firestore: ", error);
          setProfileError('Error al cargar el perfil.');
        }
      } else {
        router.push('/admin/login'); 
      }
      setIsLoadingProfile(false);
    };

    fetchUserProfile();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth.currentUser) {
      setProfileError("No hay información de perfil para actualizar o usuario no autenticado.");
      return;
    }
    setIsSubmittingProfileUpdate(true);
    setProfileError(null);

    try {
      const user = auth.currentUser;
      if (user.displayName !== formData.name) {
        await updateProfile(user, { displayName: formData.name });
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: formData.name,
      });

      setProfile(prev => prev ? { ...prev, name: formData.name } : null);
      setIsEditing(false);
      alert("Perfil actualizado correctamente.");

    } catch (error) {
      console.error("Error al actualizar perfil: ", error);
      setProfileError("Error al actualizar el perfil. Inténtalo de nuevo.");
    } finally {
      setIsSubmittingProfileUpdate(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordChangeStatus({ type: 'error', message: 'Las nuevas contraseñas no coinciden.' });
      return;
    }
    if (!formData.currentPassword || !formData.newPassword) {
        setPasswordChangeStatus({ type: 'error', message: 'Todos los campos de contraseña son obligatorios.' });
        return;
    }

    setIsSubmittingPasswordChange(true);
    const user = auth.currentUser;

    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, formData.newPassword);
        setPasswordChangeStatus({ type: 'success', message: 'Contraseña actualizada correctamente.' });
        setIsChangingPassword(false);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (e: unknown) {
        const error = e as FirebaseErrorType;
        console.error("Error al cambiar contraseña: ", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setPasswordChangeStatus({ type: 'error', message: 'La contraseña actual es incorrecta.' });
        } else if (error.code === 'auth/weak-password') {
          setPasswordChangeStatus({ type: 'error', message: 'La nueva contraseña es demasiado débil. Debe tener al menos 6 caracteres.' });
        } else {
          setPasswordChangeStatus({ type: 'error', message: 'Error al cambiar la contraseña. Inténtalo de nuevo.' });
        }
      }
    } else {
      setPasswordChangeStatus({ type: 'error', message: 'No se pudo obtener el usuario actual o su email.' });
    }
    setIsSubmittingPasswordChange(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Cookies.remove('adminToken');
      router.push('/admin/login');
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
        <p className="ml-3 text-gray-300">Cargando perfil...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900">
        <p className="text-red-400 text-center mb-4">{profileError}</p>
        <button 
          onClick={() => router.push('/admin/login')} 
          className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          Ir a Login
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">No se pudo cargar la información del perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 bg-gray-900 min-h-screen text-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Perfil de Administrador</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Cerrar Sesión
        </button>
      </div>

      <div className="bg-gray-800 shadow-xl rounded-lg border border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          {!isEditing && !isChangingPassword ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Información Personal</h3>
                <button
                  onClick={() => { setIsEditing(true); setIsChangingPassword(false); setPasswordChangeStatus(null);}}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors shadow-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Editar Perfil
                </button>
              </div>
              <dl className="space-y-4">
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 py-3 border-b border-gray-700/50">
                  <dt className="text-sm font-medium text-gray-400">Nombre</dt>
                  <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2">{profile.name}</dd>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 py-3 border-b border-gray-700/50">
                  <dt className="text-sm font-medium text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2">{profile.email}</dd>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4 py-3">
                  <dt className="text-sm font-medium text-gray-400">Rol</dt>
                  <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2">{profile.role}</dd>
                </div>
              </dl>
              <div className="mt-6 pt-4 border-t border-gray-700">
                 <button
                    onClick={() => { setIsChangingPassword(true); setIsEditing(false); setProfileError(null);}}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors shadow-sm flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Cambiar Contraseña
                  </button>
              </div>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Editar Información Personal</h3>
              <div>
                <label htmlFor="profileName" className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  id="profileName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmittingProfileUpdate}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
              <div>
                <label htmlFor="profileEmail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  id="profileEmail"
                  value={formData.email}
                  readOnly
                  disabled
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg p-2.5 text-gray-400 cursor-not-allowed placeholder-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
              {profileError && <p className="text-sm text-red-400">{profileError}</p>}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setProfileError(null); setFormData(prev => ({...prev, name: profile?.name || '', email: profile?.email || ''}));}}
                  className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProfileUpdate}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md disabled:opacity-60 flex items-center justify-center"
                >
                  {isSubmittingProfileUpdate ? (
                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Guardando...</>
                  ) : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Cambiar Contraseña</h3>
              {passwordChangeStatus && (
                <div className={`p-3.5 rounded-lg text-sm shadow ${passwordChangeStatus.type === 'success' ? 'bg-green-800/70 border border-green-700 text-green-100' : 'bg-red-800/70 border border-red-700 text-red-100'}`}>
                  {passwordChangeStatus.message}
                </div>
              )}
              <div>
                <label htmlFor="currentPassword"className="block text-sm font-medium text-gray-300 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  disabled={isSubmittingPasswordChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-sans"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  disabled={isSubmittingPasswordChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-sans"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isSubmittingPasswordChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-sans"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                 <button
                  type="button"
                  onClick={() => { setIsChangingPassword(false); setPasswordChangeStatus(null); setFormData(prev => ({...prev, currentPassword: '', newPassword: '', confirmPassword: ''})); }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPasswordChange}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md disabled:opacity-60 flex items-center justify-center"
                >
                  {isSubmittingPasswordChange ? (
                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Cambiando...</>
                  ) : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 