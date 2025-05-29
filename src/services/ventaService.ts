import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL no está definida en las variables de entorno');
}

export interface MetodoPago {
    id: number;
    nombre: string;
    descripcion?: string;
}

export interface CreateDetalleVenta {
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface CreatePago {
    metodoPagoId: number;
    monto: number;
}

export interface CreateVenta {
    usuarioId: string;
    clienteId: number;
    total: number;
    estado: string;
    detalles: CreateDetalleVenta[];
    pagos: CreatePago[];
}

export const ventaService = {
    async obtenerMetodosPago(): Promise<MetodoPago[]> {
        if (!API_URL) {
            throw new Error('URL de la API no configurada');
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('No hay sesión activa');
        }

        const response = await fetch(`${API_URL}/venta/metodo-pago`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar métodos de pago');
        }

        return response.json();
    },

    async crearVenta(venta: CreateVenta): Promise<any> {
        if (!API_URL) {
            throw new Error('URL de la API no configurada');
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('No hay sesión activa');
        }

        const response = await fetch(`${API_URL}/venta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(venta)
        });

        if (!response.ok) {
            throw new Error('Error al crear la venta');
        }

        return response.json();
    }
}; 