import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UpdateUserData } from '../services/userService';
// Importar Supabase si se usa para subir la foto o actualizar datos
// import { supabase } from '../lib/supabase';
// Importar useAuthStore si se necesita para obtener datos iniciales o actualizar el estado global
// import { useAuthStore } from '../store/authStore';

interface EditProfileProps {
  initialUser: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    photoUrl: string;
  };
  onSave: (userData: UpdateUserData, photoFile: File | null) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const EditProfile: React.FC<EditProfileProps> = ({ 
  initialUser, 
  onSave, 
  onCancel,
  isLoading = false,
  error = null 
}) => {
  const [nombre, setNombre] = useState(initialUser.nombre);
  const [apellido, setApellido] = useState(initialUser.apellido);
  const [email, setEmail] = useState(initialUser.email);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(initialUser.photoUrl || null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Opcional: Usar useEffect si necesitas cargar datos del usuario de forma asíncrona al montar el componente
  // useEffect(() => {
  //   if (!initialUser) {
  //     // Lógica para cargar el usuario si no se pasa como prop inicial
  //     // Por ejemplo, obtenerlo de useAuthStore o una API
  //   }
  // }, [initialUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    // Validaciones
    if (!nombre.trim()) {
      setLocalError('El nombre es requerido');
      return;
    }

    if (!apellido.trim()) {
      setLocalError('El apellido es requerido');
      return;
    }

    if (isLoading) {
      console.log('Ya hay una operación en curso');
      return;
    }

    console.log('Iniciando guardado de perfil...', {
      id: initialUser.id,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      tieneNuevaFoto: !!photoFile
    });

    try {
      await onSave({ 
        id: initialUser.id,
        nombre: nombre.trim(), 
        apellido: apellido.trim()
      }, photoFile);
      console.log('Guardado completado exitosamente');
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      setLocalError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Perfil</h2>
      
      {localError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {localError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          {previewPhotoUrl ? (
            <div className="relative">
              <img
                src={previewPhotoUrl}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover"
              />
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </label>
            </div>
          ) : (
            <label
              htmlFor="photo-upload"
              className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </label>
          )}
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile; 