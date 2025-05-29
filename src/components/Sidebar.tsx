import React, { useEffect, useState } from 'react'
import { 
  Home, 
  Building2, 
  Settings, 
  Users, 
  FileText,
  LogOut,
  User,
  ChevronDown,
  Package,
  ClipboardList,
  Tag,
  Truck,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  History,
  PlusCircle,
  Store
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { UserData } from '../services/userService'
import EditProfile from './EditProfile'
import { userService } from '../services/userService'
import { imageService } from '../services/imageService'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'

interface SidebarProps {
  onLogout: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  submenu?: {
    icon: React.ReactNode;
    label: string;
    href: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isProductosOpen, setIsProductosOpen] = useState(false)
  const [isComprasOpen, setIsComprasOpen] = useState(false)
  const [isVentasOpen, setIsVentasOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)

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

  const menuItems: MenuItem[] = [
    { icon: <Home className="w-5 h-5" />, label: 'Inicio', href: '/dashboard' },
    {
      icon: <Building2 className="w-5 h-5" />,
      label: 'Productos',
      submenu: [
        { icon: <Package className="w-4 h-4" />, label: 'Inventario', href: '/productos/inventario' },
        { icon: <ClipboardList className="w-4 h-4" />, label: 'Gestión Productos', href: '/productos' },
        { icon: <Tag className="w-4 h-4" />, label: 'Categoría', href: '/productos/categorias' },
      ]
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      label: 'Compras',
      submenu: [
        { icon: <PlusCircle className="w-4 h-4" />, label: 'Realizar Compra', href: '/compras/nueva' },
        { icon: <Truck className="w-4 h-4" />, label: 'Proveedores', href: '/compras/proveedores' },
      ]
    },
    {
      icon: <Store className="w-5 h-5" />,
      label: 'Ventas',
      submenu: [
        { icon: <PlusCircle className="w-4 h-4" />, label: 'Realizar Venta', href: '/ventas/nueva' },
        { icon: <Users className="w-4 h-4" />, label: 'Clientes', href: '/ventas/clientes' },
      ]
    },
  
  ]

  const handleEditProfile = () => {
    setIsProfileMenuOpen(false)
    setIsEditModalOpen(true)
  }

  const handleCancelEdit = () => {
    setIsEditModalOpen(false)
  }

  const handleSaveProfile = async (updatedUser: { 
    id: string;
    nombre: string; 
    apellido: string; 
  }, photoFile: File | null) => {
    setIsLoading(true)
    setError(null)

    if (!user) {
      setError('Usuario no autenticado.')
      setIsLoading(false)
      return
    }

    try {
      let newImageUrl = userImageUrl

      if (photoFile) {
        try {
          await imageService.deleteUserImage(user.id)
          newImageUrl = await imageService.uploadUserImage(user.id, photoFile)
        } catch (err) {
          console.error('Error al procesar la imagen:', err)
          throw new Error('Error al procesar la imagen del perfil')
        }
      }

      const updatedUserData = await userService.updateUser(updatedUser)
      setUserData(updatedUserData)
      
      setIsProfileMenuOpen(false)
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('Error en el proceso de actualización:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header con foto y nombre */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-3 flex-1 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="relative">
              {userImageUrl ? (
                <img
                  src={userImageUrl}
                  alt="Foto de perfil"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-lg">
                    {userData?.nombre?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userData ? `${userData.nombre} ${userData.apellido}` : 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </button>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Menú desplegable del perfil */}
        {isProfileMenuOpen && !isCollapsed && (
          <div className="mt-2 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.label}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => {
                        if (item.label === 'Productos') {
                          setIsProductosOpen(!isProductosOpen)
                          setIsComprasOpen(false)
                          setIsVentasOpen(false)
                        } else if (item.label === 'Compras') {
                          setIsComprasOpen(!isComprasOpen)
                          setIsProductosOpen(false)
                          setIsVentasOpen(false)
                        } else if (item.label === 'Ventas') {
                          setIsVentasOpen(!isVentasOpen)
                          setIsProductosOpen(false)
                          setIsComprasOpen(false)
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        {!isCollapsed && <span className="ml-3">{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          (item.label === 'Productos' && isProductosOpen) || 
                          (item.label === 'Compras' && isComprasOpen) ||
                          (item.label === 'Ventas' && isVentasOpen) 
                            ? 'transform rotate-180' 
                            : ''
                        }`} />
                      )}
                    </button>
                    {((item.label === 'Productos' && isProductosOpen) || 
                      (item.label === 'Compras' && isComprasOpen) ||
                      (item.label === 'Ventas' && isVentasOpen)) && 
                      !isCollapsed && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.href}>
                            <button
                              onClick={() => navigate(subItem.href)}
                              className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                location.pathname === subItem.href
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {subItem.icon}
                              <span className="ml-3">{subItem.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => item.href && navigate(item.href)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer solo con botón de colapsar cuando está colapsado */}
      {isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-gray-500 hover:text-gray-700"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de Edición de Perfil */}
      {isEditModalOpen && user && userData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <EditProfile
              initialUser={{
                id: userData.id,
                email: userData.email || '',
                nombre: userData.nombre || '',
                apellido: userData.apellido || '',
                photoUrl: userImageUrl || ''
              }}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar 