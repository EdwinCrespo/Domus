import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL no está definida en las variables de entorno');
}

export interface Producto {
  id: string;
  nombre: string;
  sku: string;
  codigoBarras: string;
  categoriaId: number | null;
  usuarioId: string;
  margenGanancia: number | null;
}

export const productoService = {
  async getProductos(usuarioId: string): Promise<Producto[]> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/producto/${usuarioId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }

    return response.json();
  },

  async createProducto(producto: Omit<Producto, 'id'>): Promise<Producto> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/producto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(producto)
    });

    if (!response.ok) {
      throw new Error('Error al crear el producto');
    }

    return response.json();
  },

  async deleteProducto(id: string): Promise<void> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/producto/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el producto');
    }
  },

  async updateProducto(id: string, producto: Omit<Producto, 'id' | 'usuarioId'>): Promise<Producto> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/producto/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(producto)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el producto');
    }

    return response.json();
  }
}; 