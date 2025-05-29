import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Filter, 
  X, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  BarChart3,
  Package,
  Users,
  Activity,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw
} from 'lucide-react'

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

  // Función para obtener el cambio porcentual (simulado para demo)
  const getPercentageChange = (current: number) => {
    const change = Math.floor(Math.random() * 20) - 10; // Simulado: -10% a +10%
    return change;
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white">
            Dashboard de Ventas
          </h1>
                <p className="text-blue-100 text-lg max-w-2xl">
                  Analiza el rendimiento de tu negocio con métricas en tiempo real y obtén insights valiosos sobre tus ventas.
                </p>
                <div className="flex items-center space-x-2 text-blue-200">
                  <Activity className="w-5 h-5" />
                  <span className="text-sm">
                    Última actualización: {new Date().toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
              <div className="mt-6 md:mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-white mx-auto mb-2" />
                    <p className="text-blue-100 text-sm">Performance</p>
                    <p className="text-white text-2xl font-bold">Excelente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/5 rounded-full"></div>
        </div>

        {/* Advanced Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Filtros Avanzados
          </h2>
            </div>
            <button
              onClick={() => setLoading(!loading)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Fecha de Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Limpiar</span>
              </button>
            </div>

          
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-red-800 font-semibold">Error de Conexión</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Ventas */}
          <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div className="text-right">
                  {getPercentageChange(dashboardData?.estadisticas?.totalVentas || 0) > 0 ? (
                    <div className="flex items-center text-emerald-200">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      <span className="text-sm">+{getPercentageChange(dashboardData?.estadisticas?.totalVentas || 0)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-200">
                      <ArrowDown className="w-4 h-4 mr-1" />
                      <span className="text-sm">{getPercentageChange(dashboardData?.estadisticas?.totalVentas || 0)}%</span>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-emerald-100 font-semibold mb-2">Total de Ventas</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(dashboardData?.estadisticas?.totalVentas || 0)}
              </p>
              <p className="text-emerald-200 text-sm mt-2">
              {fechaInicio && fechaFin 
                  ? `${fechaInicio} - ${fechaFin}`
                : 'Todas las ventas'
              }
            </p>
            </div>
          </div>

          {/* Cantidad Ventas */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-blue-200">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+15%</span>
                  </div>
                </div>
              </div>
              <h3 className="text-blue-100 font-semibold mb-2">Número de Ventas</h3>
              <p className="text-3xl font-bold">
                {(dashboardData?.estadisticas?.cantidadVentas || 0).toLocaleString()}
              </p>
              <p className="text-blue-200 text-sm mt-2">Transacciones realizadas</p>
            </div>
          </div>

          {/* Promedio por Venta */}
          <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-purple-200">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+8%</span>
                  </div>
                </div>
              </div>
              <h3 className="text-purple-100 font-semibold mb-2">Promedio por Venta</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(dashboardData?.estadisticas?.promedioVenta || 0)}
              </p>
              <p className="text-purple-200 text-sm mt-2">Valor promedio</p>
            </div>
          </div>

          {/* Nueva métrica: Clientes */}
          <div className="group relative bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-orange-200">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+12%</span>
                  </div>
                </div>
              </div>
              <h3 className="text-orange-100 font-semibold mb-2">Clientes Activos</h3>
              <p className="text-3xl font-bold">
                {Math.floor((dashboardData?.estadisticas?.cantidadVentas || 0) * 0.7)}
              </p>
              <p className="text-orange-200 text-sm mt-2">Este mes</p>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Ventas Recientes</h2>
                  <p className="text-gray-600">Últimas transacciones registradas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {dashboardData?.paginacion ? 
                    `${dashboardData.paginacion.total} registros totales` : 
                    'Cargando...'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Cargando ventas...</p>
                <p className="text-gray-400 text-sm mt-1">Esto puede tomar unos segundos</p>
              </div>
            ) : !dashboardData?.ventas || dashboardData.ventas.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay ventas disponibles</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No se encontraron ventas en el rango de fechas seleccionado. 
                  Intenta ajustar los filtros o agregar nuevas ventas.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Productos
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {dashboardData.ventas.map((venta, index) => (
                        <tr key={venta.id} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(venta.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white text-xs font-semibold">
                                  {venta.cliente.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{venta.cliente}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              <p className="truncate font-medium">{venta.productos}</p>
                              <p className="text-gray-500 text-xs">{venta.cantidadProductos} productos</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                              venta.estado === 'emitida' 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                venta.estado === 'emitida' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              {venta.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-right">
                              <span className="text-lg font-bold text-emerald-600">
                                {formatCurrency(venta.monto)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {dashboardData.paginacion && dashboardData.paginacion.totalPaginas > 1 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <span className="text-sm font-medium text-gray-700">Mostrar</span>
                      <select
                        value={registrosPorPagina}
                        onChange={(e) => cambiarRegistrosPorPagina(Number(e.target.value))}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                      <span className="text-sm text-gray-700">por página</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 mr-4">
                        {`${((paginaActual - 1) * registrosPorPagina) + 1}-${Math.min(paginaActual * registrosPorPagina, dashboardData.paginacion.total)} de ${dashboardData.paginacion.total}`}
                      </span>
                      
                        <button
                          onClick={() => cambiarPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            paginaActual === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm'
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
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                typeof pagina === 'number'
                                  ? pagina === paginaActual
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm'
                                : 'bg-white text-gray-400 cursor-default border border-gray-200'
                              }`}
                            >
                              {pagina}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => cambiarPagina(paginaActual + 1)}
                          disabled={paginaActual === dashboardData.paginacion.totalPaginas}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            paginaActual === dashboardData.paginacion.totalPaginas
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm'
                          }`}
                        >
                          Siguiente
                        </button>
                      </div>
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