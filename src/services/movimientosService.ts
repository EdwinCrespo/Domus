import { supabase } from '../lib/supabase'

export interface Movimiento {
  id: number
  fecha: string
  tipo: string
  cantidad: number
  usuarioId: string
  productoId: number
  createdAt: string
  updatedAt: string
}

// Interfaces para movimientos del Dashboard
export interface MovimientoEstadisticas {
  totalMovimientos: number
  totalEntradas: number
  totalSalidas: number
  totalAjustes: number
  movimientosPorTipo: { [key: string]: number }
}

export interface MovimientoPorTipo {
  tipo: string
  cantidad: number
}

export interface MovimientoPorFecha {
  fecha: string
  entradas: number
  salidas: number
  ajustes: number
}

export interface TopProducto {
  id: string
  nombre: string
  cantidad: number
  categoria: string
}

export interface MovimientosResponse {
  estadisticas: MovimientoEstadisticas
  datosGraficos: {
    movimientosPorTipo: MovimientoPorTipo[]
    movimientosPorFecha: MovimientoPorFecha[]
    topProductos: TopProducto[]
  }
  fechaInicio?: string
  fechaFin?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const movimientosService = {
  async getMovimientos(usuarioId: string, fechaInicio: string, fechaFin: string): Promise<Movimiento[]> {
    try {
      // Obtener el token de la sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      const response = await fetch(
        `${API_URL}/movimientos?usuarioId=${usuarioId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error en la respuesta:', response.status, errorText)
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error al obtener movimientos:', error)
      throw error
    }
  },

  async getMovimientosForDashboard(usuarioId: string, fechaInicio?: string, fechaFin?: string): Promise<MovimientosResponse> {
    try {
      // Obtener el token de la sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Construir la URL con parámetros de consulta
      const params = new URLSearchParams()
      params.append('usuarioId', usuarioId)
      if (fechaInicio) params.append('fechaInicio', fechaInicio)
      if (fechaFin) params.append('fechaFin', fechaFin)

      const response = await fetch(
        `${API_URL}/movimientos/dashboard?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error en la respuesta del dashboard de movimientos:', response.status, errorText)
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error al obtener movimientos para dashboard:', error)
      throw error
    }
  }
} 