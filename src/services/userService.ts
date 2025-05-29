import { supabase } from '../lib/supabase';

// URL del backend desde variables de entorno
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL no está definida en las variables de entorno');
}

// Usar la URL de Supabase directamente para los datos del usuario
export interface UpdateUserData {
  id: string;
  nombre: string;
  apellido: string;
}

export interface UserData {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  avatar_url?: string;
}

export const userService = {
  async getUserData(userId: string): Promise<UserData> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const url = `${API_URL}/usuarios/${userId}`;
    console.log('Obteniendo datos del usuario desde:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta:', response.status, errorText);
        throw new Error(`Error al obtener los datos: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Datos del usuario obtenidos:', data);
      return data;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      throw error;
    }
  },

  async updateUser(userData: UpdateUserData): Promise<UserData> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const url = `${API_URL}/usuarios/${userData.id}`;
    console.log('Actualizando usuario en:', url);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          nombre: userData.nombre.trim(),
          apellido: userData.apellido.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta:', response.status, errorText);
        throw new Error(`Error al actualizar los datos: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Usuario actualizado:', data);
      return data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }
}; 