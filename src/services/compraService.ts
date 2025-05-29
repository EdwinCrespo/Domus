import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL no está definida en las variables de entorno');
}

export interface DetalleCompraDto {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  codigoLote: string;
  fechaVencimiento?: string;
}

export interface CreateCompraDto {
  usuarioId: string;
  proveedorId: number;
  total: number;
  detalles: DetalleCompraDto[];
}

class CompraService {
  private async getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  async createCompra(compraData: CreateCompraDto) {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/compra`, {
      method: 'POST',
      headers,
      body: JSON.stringify(compraData)
    });

    if (!response.ok) {
      throw new Error('Error al crear la compra');
    }

    return response.json();
  }

  async getCompras(usuarioId: string) {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/compra`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Error al obtener las compras');
    }

    return response.json();
  }

  async getCompraById(id: number) {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_URL}/compra/${id}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Error al obtener la compra');
    }

    return response.json();
  }
}

export const compraService = new CompraService(); 