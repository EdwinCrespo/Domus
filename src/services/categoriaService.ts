import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL no está definida en las variables de entorno');
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  usuarioId: string;
}

export interface CreateCategoriaDto {
  nombre: string;
  descripcion: string;
  usuarioId: string;
}

export interface UpdateCategoriaDto {
  nombre: string;
  descripcion: string;
}

export const categoriaService = {
  async getCategorias(usuarioId: string): Promise<Categoria[]> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/categoria/${usuarioId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar categorías');
    }

    return response.json();
  },

  async createCategoria(categoria: CreateCategoriaDto): Promise<Categoria> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/categoria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(categoria)
    });

    if (!response.ok) {
      throw new Error('Error al crear la categoría');
    }

    return response.json();
  },

  async deleteCategoria(id: number): Promise<void> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/categoria/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la categoría');
    }
  },

  async getCategoria(id: number): Promise<Categoria> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    console.log('Obteniendo categoría con ID:', id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const url = `${API_URL}/categoria/detalle/${id}`;
    console.log('URL de la petición:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', response.status, errorText);
      throw new Error(`Error al cargar la categoría: ${errorText}`);
    }

    const data = await response.json();
    console.log('Respuesta del servidor:', data);
    
    if (!data || Array.isArray(data) && data.length === 0) {
      throw new Error('No se encontró la categoría');
    }

    return data;
  },

  async updateCategoria(id: number, categoria: UpdateCategoriaDto): Promise<Categoria> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/categoria/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(categoria)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la categoría');
    }

    return response.json();
  }
}; 