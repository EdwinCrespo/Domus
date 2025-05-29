import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { userService, UserData } from '../services/userService';
import { imageService } from '../services/imageService';
import { categoriaService, Categoria } from '../services/categoriaService';
import { productoService, Producto } from '../services/productoService';
import { inventarioService } from '../services/inventarioService';
import { 
  Plus, 
  Search, 
  Package, 
  Edit, 
  Trash2, 
  Filter,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  BarChart3,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Box
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import DataTable from '../components/ui/DataTable';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ProductoDialog } from '../components/dialogs/ProductoDialog';
import { RegistrarLoteDialog } from '../components/dialogs/RegistrarLoteDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

// Componente Skeleton para la tabla de productos
const ProductosSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-40" />
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        {/* Rows skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, j) => (
              <Skeleton key={j} className="h-12" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Productos = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);
  const [productoToEdit, setProductoToEdit] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const [productoToRegisterLote, setProductoToRegisterLote] = useState<Producto | null>(null);
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

  // Cargar categorías
  useEffect(() => {
    const cargarCategorias = async () => {
      if (!user?.id) return;
      try {
        const data = await categoriaService.getCategorias(user.id);
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };

    cargarCategorias();
  }, [user?.id]);

  // Usar TanStack Query para obtener los productos
  const { 
    data: productosData, 
    isLoading: isLoadingProductos,
    error: errorProductos,
    refetch: refetchProductos 
  } = useQuery({
    queryKey: ['productos', user?.id],
    queryFn: async () => {
      const productos = await productoService.getProductos(user?.id || '');
      return productos;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Usar TanStack Query para obtener las categorías
  const { 
    data: categoriasData, 
    isLoading: isLoadingCategorias,
    error: errorCategorias,
    refetch: refetchCategorias 
  } = useQuery({
    queryKey: ['categorias', user?.id],
    queryFn: async () => {
      return await categoriaService.getCategorias(user?.id || '');
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar productos basado en la búsqueda y categoría
  const filteredProductos = React.useMemo(() => {
    if (!productosData) return [];
    
    let filtered = productosData;
    
    // Filtrar por categoría
    if (selectedCategoria !== "all") {
      filtered = filtered.filter(p => p.categoriaId === parseInt(selectedCategoria));
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((producto) =>
        producto.nombre.toLowerCase().includes(searchLower) ||
        producto.sku.toLowerCase().includes(searchLower) ||
        (producto.codigoBarras?.toLowerCase().includes(searchLower) ?? false)
      );
    }
    
    return filtered;
  }, [productosData, searchTerm, selectedCategoria]);

  // Estadísticas calculadas
  const productStats = React.useMemo(() => {
    const totalProducts = productosData?.length || 0;
    const totalCategories = categorias.length;
    const lowStockProducts = productosData?.filter(p => (p as any).stock < 10).length || 0; // Asumiendo que hay stock
    const activeProducts = productosData?.filter(p => p.categoriaId !== null).length || 0;
    
    return {
      totalProducts,
      totalCategories,
      lowStockProducts,
      activeProducts
    };
  }, [productosData, categorias]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
    }
  };

  const handleSaveProducto = async (producto: Omit<Producto, 'id'>) => {
    try {
      if (productoToEdit?.id) {
        const { usuarioId, ...updateData } = producto;
        await productoService.updateProducto(productoToEdit.id, updateData);
      } else {
        await productoService.createProducto(producto);
      }
      await refetchProductos();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      throw error;
    }
  };

  const handleEdit = (producto: Producto) => {
    console.log('Editando producto:', producto);
    setProductoToEdit(producto);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (producto: Producto) => {
    setProductoToDelete(producto);
  };

  const handleConfirmDelete = async () => {
    if (!productoToDelete?.id) return;

    try {
      await productoService.deleteProducto(productoToDelete.id);
      await refetchProductos();
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      alert('Error al eliminar el producto');
    } finally {
      setProductoToDelete(null);
    }
  };

  const handleRegisterLote = (producto: Producto) => {
    setProductoToRegisterLote(producto);
  };

  const columns = [
    { key: 'id', label: 'ID', defaultVisible: false },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'sku', label: 'SKU', defaultVisible: true },
    { key: 'codigoBarras', label: 'Código de Barra', defaultVisible: true },
    { 
      key: 'categoriaId', 
      label: 'Categoría', 
      defaultVisible: true, 
      render: (item: Producto) => {
        const categoria = categorias.find(c => c.id === item.categoriaId);
        return categoria ? categoria.nombre : '-';
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      defaultVisible: true,
      render: (item: Producto) => (
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
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleRegisterLote(item)}
            title="Registrar Lote"
          >
            <Package className="h-4 w-4" />
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
            <Package className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (isLoadingProductos || isLoadingCategorias) {
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
          <ProductosSkeleton />
        </div>
      </div>
    );
  }

  if (errorProductos || errorCategorias) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Box className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar productos</h3>
          <p className="text-gray-600 mb-6">Ha ocurrido un problema al cargar la información. Por favor, intenta nuevamente.</p>
          <Button 
            onClick={() => {
              refetchProductos();
              refetchCategorias();
            }}
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
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-700 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">Gestión de Productos</h1>
                    <p className="text-blue-100 text-lg">
                      Administra tu inventario y catálogo de productos de manera eficiente
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
                  Nuevo Producto
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
                  <Package className="w-8 h-8" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-200" />
              </div>
              <h3 className="text-blue-100 font-semibold mb-2">Total Productos</h3>
              <p className="text-3xl font-bold">{productStats.totalProducts}</p>
              <p className="text-blue-200 text-sm mt-2">En catálogo</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Grid3X3 className="w-8 h-8" />
                </div>
                <BarChart3 className="w-5 h-5 text-emerald-200" />
              </div>
              <h3 className="text-emerald-100 font-semibold mb-2">Categorías</h3>
              <p className="text-3xl font-bold">{productStats.totalCategories}</p>
              <p className="text-emerald-200 text-sm mt-2">Organizadas</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <Eye className="w-5 h-5 text-orange-200" />
              </div>
              <h3 className="text-orange-100 font-semibold mb-2">Productos Activos</h3>
              <p className="text-3xl font-bold">{productStats.activeProducts}</p>
              <p className="text-orange-200 text-sm mt-2">Disponibles</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Box className="w-8 h-8" />
                </div>
                <TrendingUp className="w-5 h-5 text-purple-200" />
              </div>
              <h3 className="text-purple-100 font-semibold mb-2">Stock Bajo</h3>
              <p className="text-3xl font-bold">{productStats.lowStockProducts}</p>
              <p className="text-purple-200 text-sm mt-2">Requieren atención</p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              
              <div className="w-64">
                <Select
                  value={selectedCategoria}
                  onValueChange={setSelectedCategoria}
                >
                  <SelectTrigger className="bg-white border-gray-200 rounded-xl shadow-sm">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
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
                onClick={() => refetchProductos()}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
                  <p className="text-gray-600">
                    {filteredProductos.length} de {productosData?.length || 0} productos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {isLoadingProductos || isLoadingCategorias ? (
              <ProductosSkeleton />
            ) : errorProductos || errorCategorias ? (
              <div className="text-center py-8 text-red-500">
                <p>Error al cargar los productos</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    refetchProductos();
                    refetchCategorias();
                  }}
                >
                  Reintentar
                </Button>
              </div>
            ) : filteredProductos.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay productos disponibles</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {searchTerm 
                    ? "No se encontraron productos que coincidan con tu búsqueda."
                    : "Comienza agregando tu primer producto al directorio."
                  }
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
            ) : viewMode === 'table' ? (
              <DataTable
                columns={columns}
                data={filteredProductos}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                searchPlaceholder="Buscar productos..."
                showDefaultActions={false}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProductos.map((producto) => (
                  <div key={producto.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="absolute top-3 right-3">
                        <button className="p-2 bg-white/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{producto.nombre}</h3>
                        <p className="text-sm text-gray-500">SKU: {producto.sku}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {categorias.find(c => c.id === producto.categoriaId)?.nombre || 'Sin categoría'}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(producto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleRegisterLote(producto)}
                          >
                            <Package className="h-4 w-4" />
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
        <ProductoDialog
          isOpen={isAddDialogOpen || !!productoToEdit}
          onClose={() => {
            setIsAddDialogOpen(false);
            setProductoToEdit(null);
          }}
          onSave={handleSaveProducto}
          producto={productoToEdit || undefined}
          usuarioId={user?.id || ''}
        />

        <ConfirmDialog
          isOpen={!!productoToDelete}
          onClose={() => setProductoToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Producto"
          description={`¿Estás seguro de que deseas eliminar el producto "${productoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />

        {productoToRegisterLote && (
          <RegistrarLoteDialog
            isOpen={!!productoToRegisterLote}
            onClose={() => setProductoToRegisterLote(null)}
            producto={productoToRegisterLote}
            usuarioId={user?.id || ''}
          />
        )}
      </div>
    </div>
  );
};

export default Productos; 