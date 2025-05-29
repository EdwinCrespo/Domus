import { supabase } from '../lib/supabase';

export interface Cliente {
  id: number;
  nombre: string;
  razonSocial: string;
  ruc: string;
  usuarioId: string;
  estado: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

class ClienteService {
  private async getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  async getClientes(usuarioId: string): Promise<Cliente[]> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/cliente/${usuarioId}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Error al obtener clientes');
    }

    return response.json();
  }

  async getCliente(id: number): Promise<Cliente> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/cliente/detalle/${id}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Error al obtener el cliente');
    }

    return response.json();
  }

  async createCliente(cliente: {
    nombre: string;
    razonSocial: string;
    ruc: string;
    usuarioId: string;
    estado: number;
  }): Promise<Cliente> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/cliente`, {
      method: 'POST',
      headers,
      body: JSON.stringify(cliente)
    });

    if (!response.ok) {
      throw new Error('Error al crear el cliente');
    }

    return response.json();
  }

  async updateCliente(id: number, cliente: Partial<{
    nombre: string;
    razonSocial: string;
    ruc: string;
    estado: number;
  }>): Promise<Cliente> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/cliente/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(cliente)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el cliente');
    }

    return response.json();
  }

  async deleteCliente(id: number): Promise<void> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/cliente/${id}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el cliente');
    }
  }
}

export const clienteService = new ClienteService(); 