import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { userService, UserData } from '../services/userService';
import { imageService } from '../services/imageService';
import { categoriaService, Categoria } from '../services/categoriaService';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DataTable from '../components/ui/DataTable';
import { Button } from '../components/ui/button';
import { AddCategoriaDialog } from '../components/categorias/AddCategoriaDialog';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

export interface CreateCategoriaDto {
  nombre: string;
  descripcion: string;
  usuarioId: string;
}

const Categorias = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null);
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(null);
  const queryClient = useQueryClient();

  const columns = [
    { key: 'id', label: 'ID', defaultVisible: false },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: true },
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

  // Usar TanStack Query para obtener las categorías
  const { 
    data: categorias = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['categorias', user?.id],
    queryFn: () => categoriaService.getCategorias(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar categorías basado en la búsqueda
  const filteredCategorias = React.useMemo(() => {
    if (!searchTerm.trim()) return categorias;
    
    const searchLower = searchTerm.toLowerCase();
    return categorias.filter((categoria) => 
      categoria.nombre.toLowerCase().includes(searchLower) ||
      categoria.descripcion.toLowerCase().includes(searchLower)
    );
  }, [categorias, searchTerm]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    console.log('Editando categoría:', categoria);
    setCategoriaToEdit(categoria);
  };

  const handleDelete = (categoria: Categoria) => {
    setCategoriaToDelete(categoria);
  };

  const handleConfirmDelete = async () => {
    if (!categoriaToDelete) return;

    try {
      await categoriaService.deleteCategoria(categoriaToDelete.id);
      // Invalidar el caché de categorías
      await queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoría eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      toast.error('Error al eliminar la categoría');
    } finally {
      setCategoriaToDelete(null);
    }
  };

  const handleCreateCategoria = async (categoria: CreateCategoriaDto) => {
    try {
      await categoriaService.createCategoria(categoria);
      // Invalidar el caché de categorías y forzar una nueva carga
      await queryClient.invalidateQueries({ queryKey: ['categorias'] });
      await refetch();
      toast.success('Categoría creada exitosamente');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error al crear la categoría:', error);
      toast.error('Error al crear la categoría');
      // No cerramos el diálogo si hay error
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
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
                {/* Rows skeleton */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
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
          <p>Error al cargar las categorías. Por favor, intente nuevamente.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Categoría
          </Button>
        </div>

        {/* Tabla de datos */}
        <DataTable
          columns={columns}
          data={filteredCategorias}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          searchPlaceholder="Buscar categorías..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Diálogo para agregar/editar categoría */}
        <AddCategoriaDialog
          isOpen={isAddDialogOpen || !!categoriaToEdit}
          onClose={() => {
            setIsAddDialogOpen(false);
            setCategoriaToEdit(null);
          }}
          onSuccess={handleCreateCategoria}
          categoriaId={categoriaToEdit?.id}
        />

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          isOpen={!!categoriaToDelete}
          onClose={() => setCategoriaToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Categoría"
          description={`¿Estás seguro de que deseas eliminar la categoría "${categoriaToDelete?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default Categorias; 