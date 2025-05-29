import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { userService, UserData } from '../services/userService';
import { imageService } from '../services/imageService';
import { categoriaService, Categoria } from '../services/categoriaService';
import { productoService, Producto } from '../services/productoService';
import { inventarioService } from '../services/inventarioService';
import { Plus, Search, Package, Edit, Trash2 } from 'lucide-react';
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
    data: productos = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['productos', user?.id, selectedCategoria],
    queryFn: async () => {
      const data = await productoService.getProductos(user?.id || '');
      return selectedCategoria === "all" 
        ? data 
        : data.filter(p => p.categoriaId === (selectedCategoria ? parseInt(selectedCategoria) : null));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar productos basado en la búsqueda
  const filteredProductos = React.useMemo(() => {
    if (!searchTerm.trim()) return productos;
    
    const searchLower = searchTerm.toLowerCase();
    return productos.filter((producto) => 
      producto.nombre.toLowerCase().includes(searchLower) ||
      producto.sku.toLowerCase().includes(searchLower) ||
      (producto.codigoBarras?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [productos, searchTerm]);

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
      await refetch();
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
      await refetch();
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p>Error al cargar los productos. Por favor, intente nuevamente.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => refetch()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Producto
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-4">
          <div className="w-64">
            <Select
              value={selectedCategoria}
              onValueChange={setSelectedCategoria}
            >
              <SelectTrigger className="w-full">
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
        </div>

        {/* Tabla de datos */}
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

        {/* Diálogo de agregar/editar producto */}
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

        {/* Diálogo de confirmación */}
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

        {/* Diálogo de registro de lotes */}
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