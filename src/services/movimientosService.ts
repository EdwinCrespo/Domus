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
  }
} 