import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { userService, UserData } from '../services/userService'
import { imageService } from '../services/imageService'
import { VentasChart } from '../components/VentasChart'
import { VentasAreaChart } from '../components/VentasAreaChart'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'
import { Line, Pie, Bar } from 'react-chartjs-2'

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const Dashboard = () => {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)
  const [ventasData, setVentasData] = useState<any>(null)
  const [inventarioData, setInventarioData] = useState<any>(null)
  const [categoriasData, setCategoriasData] = useState<any>(null)

  // Datos para el gráfico de ventas del último mes
  const ventasMensualesData = {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    datasets: [
      {
        label: 'Ventas Totales',
        data: [0, 0, 0, 0], // Se actualizará con datos reales
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  }

  // Datos para el gráfico de distribución por categorías
  const categoriasChartData = {
    labels: ['Categoría 1', 'Categoría 2', 'Categoría 3', 'Categoría 4'],
    datasets: [
      {
        data: [0, 0, 0, 0], // Se actualizará con datos reales
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
        ],
      },
    ],
  }

  // Datos para el gráfico de estadísticas generales
  const estadisticasData = {
    labels: ['Productos', 'Clientes', 'Ventas', 'Compras'],
    datasets: [
      {
        label: 'Estadísticas del Sistema',
        data: [0, 0, 0, 0], // Se actualizará con datos reales
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  }

  // Datos de ejemplo para el gráfico de ventas
  const ventasMensuales = [
    { mes: 'Enero', ventas: 1500 },
    { mes: 'Febrero', ventas: 2300 },
    { mes: 'Marzo', ventas: 1800 },
    { mes: 'Abril', ventas: 2900 },
    { mes: 'Mayo', ventas: 2100 },
    { mes: 'Junio', ventas: 2400 },
  ]

  // Datos de ejemplo para el gráfico de área de ventas
  const ventasDiarias = Array.from({ length: 90 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (89 - i))
    return {
      fecha: date.toISOString().split('T')[0],
      ventas: Math.floor(Math.random() * 1000) + 500,
      devoluciones: Math.floor(Math.random() * 200)
    }
  })

  useEffect(() => {
    // Verificar la sesión actual
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error al verificar la sesión:', error)
        navigate('/login')
        return
      }

      if (!session) {
        navigate('/login')
        return
      }

      // Solo actualizar el usuario si no existe o si es diferente
      if (session.user && (!user || session.user.id !== user.id)) {
        console.log('Actualizando usuario desde checkSession:', session.user.id);
        setUser(session.user)
      }
    }

    checkSession()

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Solo actualizar si el usuario es diferente
        if (!user || session.user.id !== user.id) {
          console.log('Actualizando usuario desde onAuthStateChange:', session.user.id);
          setUser(session.user)
        }
      } else {
        setUser(null)
        navigate('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, user, setUser])

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const data = await userService.getUserData(user.id)
          setUserData(data)
        } catch (err) {
          console.error('Error al cargar datos del usuario:', err)
        }
      }
    }

    loadUserData()
  }, [user?.id])

  // Cargar imagen del usuario
  useEffect(() => {
    const loadUserImage = async () => {
      if (!user?.id) {
        console.log('No hay ID de usuario para cargar la imagen')
        return
      }

      try {
        const imageUrl = await imageService.getUserImageUrl(user.id)
        setUserImageUrl(imageUrl)
      } catch (err) {
        console.error('Error al cargar la imagen del usuario:', err)
        setUserImageUrl(null)
      }
    }

    loadUserImage()
  }, [user?.id])

  // Cargar datos de ventas
  useEffect(() => {
    const cargarDatosVentas = async () => {
      if (!user?.id) return

      try {
        // Aquí iría la llamada a tu API para obtener los datos de ventas
        // Por ahora usamos datos de ejemplo
        const ventasPorSemana = [1500, 2300, 1800, 2900]
        setVentasData(ventasPorSemana)
      } catch (error) {
        console.error('Error al cargar datos de ventas:', error)
      }
    }

    cargarDatosVentas()
  }, [user?.id])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Dashboard de Gestión
          </h1>
          <p className="text-gray-600">
            Vista general de tu sistema de inventario y ventas
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Nuevo gráfico de área de ventas */}
          <VentasAreaChart data={ventasDiarias} />

          {/* Gráfico de barras de ventas mensuales */}
          <VentasChart data={ventasMensuales} />

          {/* Gráficos existentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Ventas del Último Mes</h2>
              <Line 
                data={ventasMensualesData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Tendencia de Ventas'
                    }
                  }
                }}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Productos por Categoría</h2>
              <Pie 
                data={categoriasChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right',
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 