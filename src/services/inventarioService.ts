import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL no está definida en las variables de entorno');
}

export interface LoteInventario {
  id: number;
  productoId: number;
  codigoLote?: string;
  cantidad: number;
  costoUnitario: number;
  fechaEntrada: Date;
  fechaVencimiento?: Date;
}

export interface InventarioResumen {
  id: number;
  productoId: number;
  nombreProducto: string;
  stockTotal: number;
  numeroLotes: number;
  costoPromedio: number;
  precioVenta: number | null;
  ultimaEntrada: Date | null;
  proximoVencimiento: Date | null;
}

export interface Producto {
  id: number;
  nombre: string;
  codigo: string;
}

export interface InventarioSalida {
  inventarioLoteId: number;
  cantidad: number;
  tipo: string;
  descripcion: string;
}

export const inventarioService = {
  async registrarLote(usuarioId: string, lote: Omit<LoteInventario, 'id'>): Promise<LoteInventario> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/inventario-lote/${usuarioId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        productoId: lote.productoId,
        codigoLote: lote.codigoLote,
        cantidad: lote.cantidad,
        costoUnitario: lote.costoUnitario,
        fechaEntrada: lote.fechaEntrada.toISOString(),
        fechaVencimiento: lote.fechaVencimiento?.toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al registrar el lote: ${errorText}`);
    }

    const data = await response.json();
    return {
      ...data,
      fechaEntrada: new Date(data.fechaEntrada),
      fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined
    };
  },

  async getLotesByProducto(productoId: number): Promise<LoteInventario[]> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/inventario-lote/lotes/${productoId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener los lotes: ${errorText}`);
    }

    const data = await response.json();
    return data.map((lote: any) => ({
      ...lote,
      fechaEntrada: new Date(lote.fechaEntrada),
      fechaVencimiento: lote.fechaVencimiento ? new Date(lote.fechaVencimiento) : undefined
    }));
  },

  async obtenerResumenInventario(usuarioId: string): Promise<InventarioResumen[]> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/inventario-lote/resumen/${usuarioId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener el resumen del inventario: ${errorText}`);
    }

    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      id: item.productoId,
      ultimaEntrada: item.ultimaEntrada ? new Date(item.ultimaEntrada) : null,
      proximoVencimiento: item.proximoVencimiento ? new Date(item.proximoVencimiento) : null
    }));
  },

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
      const errorText = await response.text();
      throw new Error(`Error al obtener los productos: ${errorText}`);
    }

    return await response.json();
  },

  async procesarSalidas(usuarioId: string, salidas: InventarioSalida[]): Promise<void> {
    if (!API_URL) {
      throw new Error('URL de la API no configurada');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/inventario-lote/salidas/${usuarioId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(salidas)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al procesar las salidas: ${errorText}`);
    }
  }
}; 