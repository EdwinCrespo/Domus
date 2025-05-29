import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import { Button } from '../components/ui/button';
import { AddClienteDialog } from '../components/clientes/AddClienteDialog';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clienteService } from '../services/clienteService';
import { Skeleton } from '../components/ui/skeleton';

const Clientes = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<number | null>(null);
  const [clienteToEdit, setClienteToEdit] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const columns = [
    { key: 'id', label: 'ID', defaultVisible: false },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'razonSocial', label: 'Razón Social', defaultVisible: true },
    { key: 'ruc', label: 'RUC', defaultVisible: true },
  ];

  // Obtener clientes del backend
  const { 
    data: clientes = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['clientes', user?.id],
    queryFn: () => clienteService.getClientes(user?.id || ''),
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

  const handleEdit = (cliente: typeof clientes[0]) => {
    setClienteToEdit(cliente.id);
  };

  const handleDelete = (cliente: typeof clientes[0]) => {
    setClienteToDelete(cliente.id);
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      await clienteService.deleteCliente(clienteToDelete);
      await queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      toast.error('Error al eliminar el cliente');
    } finally {
      setClienteToDelete(null);
    }
  };

  const handleCreateCliente = async (cliente: {
    nombre: string;
    razonSocial: string;
    ruc: string;
    usuarioId: string;
    estado: number;
  }) => {
    try {
      await clienteService.createCliente(cliente);
      await queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado exitosamente');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error al crear el cliente:', error);
      toast.error('Error al crear el cliente');
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
          <p>Error al cargar los clientes. Por favor, intente nuevamente.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        {/* Tabla de datos */}
        <DataTable
          columns={columns}
          data={filteredClientes}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          searchPlaceholder="Buscar clientes..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Diálogo para agregar/editar cliente */}
        <AddClienteDialog
          isOpen={isAddDialogOpen || !!clienteToEdit}
          onClose={() => {
            setIsAddDialogOpen(false);
            setClienteToEdit(null);
          }}
          onSuccess={handleCreateCliente}
          clienteId={clienteToEdit || undefined}
        />

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          isOpen={!!clienteToDelete}
          onClose={() => setClienteToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Cliente"
          description="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default Clientes; 