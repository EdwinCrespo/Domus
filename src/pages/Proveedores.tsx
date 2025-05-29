import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { userService, UserData } from '../services/userService';
import { imageService } from '../services/imageService';
import { proveedorService, Proveedor } from '../services/proveedorService';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DataTable from '../components/ui/DataTable';
import { Button } from '../components/ui/button';
import { AddProveedorDialog } from '../components/proveedores/AddProveedorDialog';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

const Proveedores = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);
  const [proveedorToEdit, setProveedorToEdit] = useState<Proveedor | null>(null);
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'ID', defaultVisible: false },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'contacto', label: 'Contacto', defaultVisible: true },
    { key: 'email', label: 'Email', defaultVisible: true },
    { key: 'direccion', label: 'Dirección', defaultVisible: true },
  ];

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
      if (!user?.id) {
        console.log('No hay ID de usuario para cargar la imagen');
        return;
      }

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

  // Usar TanStack Query para obtener los proveedores
  const { 
    data: proveedores = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['proveedores', user?.id],
    queryFn: () => proveedorService.getProveedores(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar proveedores basado en la búsqueda
  const filteredProveedores = React.useMemo(() => {
    if (!searchTerm.trim()) return proveedores;
    
    const searchLower = searchTerm.toLowerCase();
    return proveedores.filter((proveedor) => 
      proveedor.nombre.toLowerCase().includes(searchLower) ||
      (proveedor.contacto?.toLowerCase().includes(searchLower) ?? false) ||
      (proveedor.email?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [proveedores, searchTerm]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setProveedorToEdit(proveedor);
  };

  const handleDelete = (proveedor: Proveedor) => {
    setProveedorToDelete(proveedor);
  };

  const handleConfirmDelete = async () => {
    if (!proveedorToDelete) return;

    try {
      await proveedorService.deleteProveedor(proveedorToDelete.id);
      if (user?.id) {
        await refetch();
      }
    } catch (error) {
      console.error('Error al eliminar el proveedor:', error);
      toast.error('Error al eliminar el proveedor');
    } finally {
      setProveedorToDelete(null);
    }
  };

  const handleCreateProveedor = async (proveedor: Omit<Proveedor, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => {
    try {
      await proveedorService.createProveedor(proveedor);
      // Invalidar el caché de proveedores
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Proveedor creado exitosamente');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error al crear el proveedor:', error);
      toast.error('Error al crear el proveedor');
    }
  };

  const handleUpdateProveedor = async (id: number, proveedor: Partial<Proveedor>) => {
    try {
      await proveedorService.updateProveedor(id, proveedor);
      // Invalidar el caché de proveedores
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Proveedor actualizado exitosamente');
      setIsEditDialogOpen(false);
      setSelectedProveedor(null);
    } catch (error) {
      console.error('Error al actualizar el proveedor:', error);
      toast.error('Error al actualizar el proveedor');
    }
  };

  const handleDeleteProveedor = async (id: number) => {
    try {
      await proveedorService.deleteProveedor(id);
      // Invalidar el caché de proveedores
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Proveedor eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el proveedor:', error);
      toast.error('Error al eliminar el proveedor');
    }
  };

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
                <div className="grid grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
                {/* Rows skeleton */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4">
                    {[...Array(5)].map((_, j) => (
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
          <p>Error al cargar los proveedores. Por favor, intente nuevamente.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Proveedor
          </Button>
        </div>

        {/* Tabla de datos */}
        <DataTable
          columns={columns}
          data={filteredProveedores}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          searchPlaceholder="Buscar proveedores..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Diálogo para agregar/editar proveedor */}
        <AddProveedorDialog
          isOpen={isAddDialogOpen || !!proveedorToEdit}
          onClose={() => {
            setIsAddDialogOpen(false);
            setProveedorToEdit(null);
          }}
          onSuccess={() => {
            if (user?.id) {
              refetch();
            }
          }}
          proveedorId={proveedorToEdit?.id}
          onProveedorCreated={handleCreateProveedor}
          onProveedorUpdated={handleUpdateProveedor}
        />

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          isOpen={!!proveedorToDelete}
          onClose={() => setProveedorToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Proveedor"
          description={`¿Estás seguro de que deseas eliminar el proveedor "${proveedorToDelete?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default Proveedores; 