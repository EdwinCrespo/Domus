import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

export interface Proveedor {
  id: number;
  usuarioId: string;
  nombre: string;
  contacto?: string;
  direccion?: string;
  email?: string;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  estado: number;
}

class ProveedorService {
  private async getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  async getProveedores(usuarioId: string): Promise<Proveedor[]> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/proveedores/${usuarioId}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Error al obtener proveedores');
    }

    return response.json();
  }

  async getProveedor(id: number): Promise<Proveedor> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/proveedores/detalle/${id}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Error al obtener el proveedor');
    }

    return response.json();
  }

  async createProveedor(proveedor: Omit<Proveedor, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Proveedor> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/proveedores`, {
      method: 'POST',
      headers,
      body: JSON.stringify(proveedor)
    });

    if (!response.ok) {
      throw new Error('Error al crear el proveedor');
    }

    return response.json();
  }

  async updateProveedor(id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(proveedor)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el proveedor');
    }

    return response.json();
  }

  async deleteProveedor(id: number): Promise<void> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el proveedor');
    }
  }
}

export const proveedorService = new ProveedorService(); 