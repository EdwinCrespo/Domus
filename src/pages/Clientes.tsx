import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { userService, UserData } from '../services/userService';
import { imageService } from '../services/imageService';
import { clienteService, Cliente } from '../services/clienteService';
import { 
  Plus, 
  Search, 
  Users, 
  Edit, 
  Trash2,
  Building,
  FileText,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  BarChart3,
  TrendingUp,
  Eye,
  MoreHorizontal,
  UserCheck,
  Clock,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import DataTable from '../components/ui/DataTable';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { ClienteDialog } from '../components/dialogs/ClienteDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

const Clientes = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const queryClient = useQueryClient();

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const data = await userService.getUserData(user.id);
          setUserData(data);
        } catch (err) {
          console.error('Error al cargar datos del usuario:', err);
        }
      }
    };

    loadUserData();
  }, [user?.id]);

  // Cargar imagen del usuario
  useEffect(() => {
    const loadUserImage = async () => {
      if (!user?.id) return;

      try {
        const imageUrl = await imageService.getUserImageUrl(user.id);
        setUserImageUrl(imageUrl);
      } catch (err) {
        console.error('Error al cargar la imagen del usuario:', err);
        setUserImageUrl(null);
      }
    };

    loadUserImage();
  }, [user?.id]);

  // Usar TanStack Query para obtener los clientes
  const { 
    data: clientes = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['clientes', user?.id],
    queryFn: async () => {
      return await clienteService.getClientes(user?.id || '');
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar clientes basado en la búsqueda
  const filteredClientes = React.useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    
    const searchLower = searchTerm.toLowerCase();
    return clientes.filter((cliente) => 
      cliente.nombre.toLowerCase().includes(searchLower) ||
      cliente.razonSocial.toLowerCase().includes(searchLower) ||
      cliente.ruc.toLowerCase().includes(searchLower)
    );
  }, [clientes, searchTerm]);

  // Estadísticas calculadas
  const clientStats = React.useMemo(() => {
    const totalClients = clientes.length;
    const activeClients = clientes.filter(c => c.estado === 1).length;
    const recentClients = clientes.filter(c => {
      const createdDate = new Date(c.fechaCreacion);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return createdDate > monthAgo;
    }).length;
    const completedProfiles = clientes.filter(c => 
      c.nombre && c.razonSocial && c.ruc
    ).length;
    
    return {
      totalClients,
      activeClients,
      recentClients,
      completedProfiles
    };
  }, [clientes]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
    }
  };

  const handleSaveCliente = async (cliente: {
    nombre: string;
    razonSocial: string;
    ruc: string;
    usuarioId: string;
    estado: number;
  }) => {
    try {
      if (clienteToEdit?.id) {
        const { usuarioId, ...updateData } = cliente;
        await clienteService.updateCliente(clienteToEdit.id, updateData);
      } else {
        await clienteService.createCliente(cliente);
      }
      await refetch();
      toast.success(clienteToEdit ? 'Cliente actualizado' : 'Cliente creado exitosamente');
    } catch (error) {
      console.error('Error al guardar el cliente:', error);
      toast.error('Error al guardar el cliente');
      throw error;
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteToEdit(cliente);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (cliente: Cliente) => {
    setClienteToDelete(cliente);
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete?.id) return;
    
    try {
      await clienteService.deleteCliente(clienteToDelete.id);
      await refetch();
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      toast.error('Error al eliminar el cliente');
    } finally {
      setClienteToDelete(null);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', defaultVisible: false },
    { 
      key: 'nombre', 
      label: 'Información del Cliente', 
      defaultVisible: true,
      render: (item: Cliente) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {item.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.nombre}</p>
            <p className="text-sm text-gray-500">{item.razonSocial}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'ruc', 
      label: 'RUC', 
      defaultVisible: true,
      render: (item: Cliente) => (
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{item.ruc}</span>
        </div>
      )
    },
    { 
      key: 'estado', 
      label: 'Estado', 
      defaultVisible: true,
      render: (item: Cliente) => (
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
          item.estado === 1 
            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
            item.estado === 1 ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          {item.estado === 1 ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    { 
      key: 'fechaCreacion', 
      label: 'Fecha de Registro', 
      defaultVisible: true,
      render: (item: Cliente) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {new Date(item.fechaCreacion).toLocaleDateString('es-ES')}
          </span>
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      defaultVisible: true,
      render: (item: Cliente) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(item)}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleDelete(item)}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50">
            <div className="flex justify-between items-center">
              <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-12 w-40" />
            </div>
                </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/80 rounded-2xl p-6 border border-white/50">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>

          {/* Table skeleton */}
          <div className="bg-white/80 rounded-2xl p-6 border border-white/50">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar clientes</h3>
          <p className="text-gray-600 mb-6">Ha ocurrido un problema al cargar la información. Por favor, intenta nuevamente.</p>
          <Button 
            onClick={() => refetch()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">Gestión de Clientes</h1>
                    <p className="text-blue-100 text-lg">
                      Administra tu cartera de clientes empresariales
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex space-x-3">
          <Button
                  className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/5 rounded-full"></div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="w-8 h-8" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-200" />
              </div>
              <h3 className="text-blue-100 font-semibold mb-2">Total Clientes</h3>
              <p className="text-3xl font-bold">{clientStats.totalClients}</p>
              <p className="text-blue-200 text-sm mt-2">Registrados</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserCheck className="w-8 h-8" />
                </div>
                <BarChart3 className="w-5 h-5 text-emerald-200" />
              </div>
              <h3 className="text-emerald-100 font-semibold mb-2">Clientes Activos</h3>
              <p className="text-3xl font-bold">{clientStats.activeClients}</p>
              <p className="text-emerald-200 text-sm mt-2">En estado activo</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Clock className="w-8 h-8" />
                </div>
                <Eye className="w-5 h-5 text-orange-200" />
              </div>
              <h3 className="text-orange-100 font-semibold mb-2">Nuevos Este Mes</h3>
              <p className="text-3xl font-bold">{clientStats.recentClients}</p>
              <p className="text-orange-200 text-sm mt-2">Últimos 30 días</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Star className="w-8 h-8" />
                </div>
                <TrendingUp className="w-5 h-5 text-purple-200" />
              </div>
              <h3 className="text-purple-100 font-semibold mb-2">Perfiles Completos</h3>
              <p className="text-3xl font-bold">{clientStats.completedProfiles}</p>
              <p className="text-purple-200 text-sm mt-2">Datos completos</p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Buscar:</span>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Clients Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Directorio de Clientes</h2>
                  <p className="text-gray-600">
                    {filteredClientes.length} de {clientes.length} clientes
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {filteredClientes.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes disponibles</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {searchTerm 
                    ? "No se encontraron clientes que coincidan con tu búsqueda."
                    : "Comienza agregando tu primer cliente al directorio."
                  }
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>
            ) : viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredClientes}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          searchPlaceholder="Buscar clientes..."
                showDefaultActions={false}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClientes.map((cliente) => (
                  <div key={cliente.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {cliente.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {cliente.nombre}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{cliente.razonSocial}</p>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>RUC: {cliente.ruc}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Registrado: {new Date(cliente.fechaCreacion).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          cliente.estado === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cliente.estado === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleDelete(cliente)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <ClienteDialog
          isOpen={isAddDialogOpen || !!clienteToEdit}
          onClose={() => {
            setIsAddDialogOpen(false);
            setClienteToEdit(null);
          }}
          onSave={handleSaveCliente}
          cliente={clienteToEdit || undefined}
          usuarioId={user?.id || ''}
        />

        <ConfirmDialog
          isOpen={!!clienteToDelete}
          onClose={() => setClienteToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Cliente"
          description={`¿Estás seguro de que deseas eliminar el cliente "${clienteToDelete?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default Clientes; 