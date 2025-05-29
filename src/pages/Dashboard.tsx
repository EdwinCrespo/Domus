import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface VentaData {
  id: string
  fecha: string
  monto: number
  cliente: string
  productos: string
  cantidadProductos: number
  estado: string
}

interface EstadisticasData {
  totalVentas: number
  cantidadVentas: number
  promedioVenta: number
  ventasPorCategoria: { [key: string]: number }
}

interface PaginacionData {
  pagina: number
  limite: number
  total: number
  totalPaginas: number
}

interface DashboardResponse {
  ventas: VentaData[]
  estadisticas: EstadisticasData
  paginacion: PaginacionData
  fechaInicio?: string
  fechaFin?: string
}

const Dashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  // Estados para las fechas
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  
  // Estados para las ventas y estadísticas
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Estado para la paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
      }
    }
    checkAuth()
  }, [navigate])

  // Función para cargar las ventas desde el backend
  const cargarVentasDashboard = async (inicio?: string, fin?: string, pagina?: number, limite?: number) => {
    setLoading(true)
    setError('')
    
    try {
      // Obtener el token de autenticación
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay token de autenticación')
      }

      // Construir la URL con parámetros de consulta
      const params = new URLSearchParams()
      if (inicio) params.append('fechaInicio', inicio)
      if (fin) params.append('fechaFin', fin)
      if (pagina) params.append('pagina', pagina.toString())
      if (limite) params.append('limite', limite.toString())
      
      const url = `${import.meta.env.VITE_API_URL}/venta/dashboard${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: DashboardResponse = await response.json()
      setDashboardData(data)
      
    } catch (error) {
      console.error('Error al cargar ventas del dashboard:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarVentasDashboard(undefined, undefined, paginaActual, registrosPorPagina)
  }, [])

  // Recargar datos cuando cambien las fechas o la paginación
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarVentasDashboard(fechaInicio, fechaFin, paginaActual, registrosPorPagina)
    } else if (!fechaInicio && !fechaFin) {
      cargarVentasDashboard(undefined, undefined, paginaActual, registrosPorPagina)
    }
  }, [fechaInicio, fechaFin, paginaActual, registrosPorPagina])

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFechaInicio('')
    setFechaFin('')
    setPaginaActual(1)
  }

  // Cambiar página
  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
  }

  // Cambiar registros por página
  const cambiarRegistrosPorPagina = (nuevoLimite: number) => {
    setRegistrosPorPagina(nuevoLimite)
    setPaginaActual(1) // Resetear a la primera página
  }

  // Generar array de páginas para la paginación
  const generarPaginacion = () => {
    if (!dashboardData?.paginacion) return []
    
    const { pagina, totalPaginas } = dashboardData.paginacion
    const paginas = []
    
    // Siempre mostrar primera página
    paginas.push(1)
    
    // Calcular rango de páginas alrededor de la página actual
    const inicio = Math.max(2, pagina - 1)
    const fin = Math.min(totalPaginas - 1, pagina + 1)
    
    // Agregar puntos suspensivos si hay huecos
    if (inicio > 2) paginas.push('...')
    
    // Agregar páginas del rango
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i)
    }
    
    // Agregar puntos suspensivos si hay huecos
    if (fin < totalPaginas - 1) paginas.push('...')
    
    // Siempre mostrar última página si hay más de una
    if (totalPaginas > 1) paginas.push(totalPaginas)
    
    return paginas
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Ventas
          </h1>
          <p className="text-gray-600">
            Gestiona y analiza tus ventas por rango de fechas
          </p>
        </div>

        {/* Filtros de Fecha */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Filtros de Fecha
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fecha Inicio */}
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="fechaInicio"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin
              </label>
              <input
                type="date"
                id="fechaFin"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Botón para limpiar filtros */}
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Mostrar errores */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {/* Resumen de Ventas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total de Ventas
            </h3>
            <p className="text-3xl font-bold text-green-600">
              ${dashboardData?.estadisticas?.totalVentas?.toLocaleString() || '0'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {fechaInicio && fechaFin 
                ? `Del ${fechaInicio} al ${fechaFin}`
                : 'Todas las ventas'
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cantidad de Ventas
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {dashboardData?.estadisticas?.cantidadVentas || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Transacciones realizadas
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Promedio por Venta
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              ${dashboardData?.estadisticas?.promedioVenta?.toLocaleString() || '0'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Valor promedio
            </p>
          </div>
        </div>

        {/* Lista de Ventas Filtradas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Ventas Filtradas
            </h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2">Cargando ventas...</p>
              </div>
            ) : !dashboardData?.ventas || dashboardData.ventas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No se encontraron ventas en el rango de fechas seleccionado
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Productos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.ventas.map((venta) => (
                        <tr key={venta.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(venta.fecha).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {venta.cliente}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {venta.productos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              venta.estado === 'emitida' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {venta.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            ${venta.monto.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {dashboardData.paginacion && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <span className="text-sm text-gray-700 mr-2">
                        Mostrando
                      </span>
                      <select
                        value={registrosPorPagina}
                        onChange={(e) => cambiarRegistrosPorPagina(Number(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                      <span className="text-sm text-gray-700 ml-2">
                        registros por página
                      </span>
                      <span className="text-sm text-gray-500 ml-4">
                        {`Mostrando ${((paginaActual - 1) * registrosPorPagina) + 1} a ${Math.min(paginaActual * registrosPorPagina, dashboardData.paginacion.total)} de ${dashboardData.paginacion.total} registros`}
                      </span>
                    </div>

                    {dashboardData.paginacion.totalPaginas > 1 && (
                      <div className="flex items-center">
                        <button
                          onClick={() => cambiarPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                          className={`px-3 py-1 rounded-md mr-2 ${
                            paginaActual === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          Anterior
                        </button>

                        <div className="flex space-x-1">
                          {generarPaginacion().map((pagina, index) => (
                            <button
                              key={index}
                              onClick={() => typeof pagina === 'number' ? cambiarPagina(pagina) : null}
                              disabled={typeof pagina !== 'number'}
                              className={`px-3 py-1 rounded-md ${
                                typeof pagina === 'number'
                                  ? pagina === paginaActual
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                  : 'bg-white text-gray-400 cursor-default'
                              }`}
                            >
                              {pagina}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => cambiarPagina(paginaActual + 1)}
                          disabled={paginaActual === dashboardData.paginacion.totalPaginas}
                          className={`px-3 py-1 rounded-md ml-2 ${
                            paginaActual === dashboardData.paginacion.totalPaginas
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 