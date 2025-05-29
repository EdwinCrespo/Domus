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
  Store,
  CreditCard,
  Sparkles,
  Bell,
  Crown
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
  onClick?: () => void;
  submenu?: {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
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
  const [isMetodosPagoModalOpen, setIsMetodosPagoModalOpen] = useState(false)
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

  const handleMetodosPagoClick = () => {
    setIsMetodosPagoModalOpen(true);
  };

  const menuItems: MenuItem[] = [
    { 
      icon: <Home className="w-5 h-5" />, 
      label: 'Dashboard', 
      href: '/dashboard' 
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      label: 'Productos',
      submenu: [
        { icon: <Package className="w-4 h-4" />, label: 'Inventario', href: '/productos/inventario' },
        { icon: <ClipboardList className="w-4 h-4" />, label: 'Gestión Productos', href: '/productos' },
        { icon: <Tag className="w-4 h-4" />, label: 'Categorías', href: '/productos/categorias' },
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
    <>
      <div className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 h-screen flex flex-col transition-all duration-300 shadow-2xl ${isCollapsed ? 'w-[120px]' : 'w-72'}`}>
        
        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full flex items-center space-x-3 p-3 hover:bg-slate-700/30 rounded-xl transition-all duration-200 group"
            >
              <div className="relative">
                {userImageUrl ? (
                  <img
                    src={userImageUrl}
                    alt="Foto de perfil"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-600 group-hover:border-blue-400 transition-colors"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-slate-600 group-hover:border-blue-400 transition-colors">
                    <span className="text-white text-lg font-semibold">
                      {userData?.nombre?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
              </div>
              
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">
                        {userData ? `${userData.nombre} ${userData.apellido}` : 'Usuario'}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCollapsed(!isCollapsed);
                        }}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                      <span className="text-xs text-emerald-400">En línea</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
              {isCollapsed && (
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 bg-slate-800 border border-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && !isCollapsed && (
              <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 z-50">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <User className="w-4 h-4 mr-3 text-blue-400" />
                  Editar Perfil
                </button>
               
                <div className="border-t border-slate-700/50 my-2"></div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const hasActiveSubmenu = item.submenu?.some(subItem => location.pathname === subItem.href);
              
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
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-200 group ${
                          hasActiveSubmenu
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg transition-colors ${
                            hasActiveSubmenu ? 'bg-blue-500/20' : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                          }`}>
                            {item.icon}
                          </div>
                          {!isCollapsed && <span className="font-medium">{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                            (item.label === 'Productos' && isProductosOpen) || 
                            (item.label === 'Compras' && isComprasOpen) ||
                            (item.label === 'Ventas' && isVentasOpen) 
                              ? 'rotate-180' 
                              : ''
                          }`} />
                        )}
                      </button>
                      
                      {/* Submenu */}
                      {((item.label === 'Productos' && isProductosOpen) || 
                        (item.label === 'Compras' && isComprasOpen) ||
                        (item.label === 'Ventas' && isVentasOpen)) && 
                        !isCollapsed && (
                        <ul className="mt-2 ml-4 space-y-1 border-l-2 border-slate-700/50 pl-4">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.href || subItem.label}>
                              <button
                                onClick={() => {
                                  if (subItem.onClick) {
                                    subItem.onClick();
                                  } else if (subItem.href) {
                                    navigate(subItem.href);
                                  }
                                }}
                                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                  location.pathname === subItem.href
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                              >
                                <div className={`p-1.5 rounded-md ${
                                  location.pathname === subItem.href 
                                    ? 'bg-white/20' 
                                    : 'bg-slate-600/50'
                                }`}>
                                  {subItem.icon}
                                </div>
                                <span>{subItem.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => item.href && navigate(item.href)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                      }`}>
                        {item.icon}
                      </div>
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

         
        </nav>

        {/* Collapsed state expand button */}
        {isCollapsed && (
          <div className="p-4">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 flex items-center justify-center"
              title="Expandir menú"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Modal de Edición de Perfil */}
      {isEditModalOpen && user && userData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <h2 className="text-xl font-bold">Editar Perfil</h2>
              <p className="text-blue-100 text-sm">Actualiza tu información personal</p>
            </div>
            <div className="p-6">
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
        </div>
      )}
    </>
  )
}

export default Sidebar 