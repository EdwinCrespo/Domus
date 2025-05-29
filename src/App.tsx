import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import ResetPassword from './pages/auth/ResetPassword'
import Categorias from './pages/Categorias'
import Productos from './pages/Productos'
import InventarioPage from './pages/InventarioPage'
import Proveedores from './pages/Proveedores'
import RealizarCompra from './pages/RealizarCompra'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Crear una instancia de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
})

// Componente Layout que incluye el Sidebar
const Layout = () => {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Componente para proteger rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const App = () => {
  const { user, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <Register />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        
        {/* Rutas protegidas con Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/productos/categorias" element={<Categorias />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/productos/inventario" element={<InventarioPage />} />
          <Route path="/compras/proveedores" element={<Proveedores />} />
          <Route path="/compras/nueva" element={<RealizarCompra />} />
        </Route>

        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </QueryClientProvider>
  )
}

export default App 