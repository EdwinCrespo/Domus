import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { inventarioService, InventarioResumen } from '../services/inventarioService';
import DataTable, { Column } from '../components/ui/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { PlusCircle, Plus, Eye } from 'lucide-react';
import { RegistrarLoteDialog } from '../components/dialogs/RegistrarLoteDialog';
import { RegistrarMovimientoDialog } from '../components/dialogs/RegistrarMovimientoDialog';
import { Producto } from '../services/productoService';
import LotesTable from '../components/tables/LotesTable';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '../components/ui/skeleton';

// Componente Skeleton para la tabla
const TableSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-40" />
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="grid grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        {/* Rows skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-8 gap-4">
            {[...Array(8)].map((_, j) => (
              <Skeleton key={j} className="h-12" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const InventarioPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isRegistrarLoteOpen, setIsRegistrarLoteOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [isRegistrarMovimientoOpen, setIsRegistrarMovimientoOpen] = useState(false);
  const [isLotesTableOpen, setIsLotesTableOpen] = useState(false);
  const [selectedProductoForLotes, setSelectedProductoForLotes] = useState<InventarioResumen | null>(null);

  // Usar TanStack Query para obtener los datos
  const { 
    data: inventarioData, 
    isLoading, 
    error,
    refetch 
  } = useQuery<InventarioResumen[]>({
    queryKey: ['inventario', user?.id],
    queryFn: () => inventarioService.obtenerResumenInventario(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false
  });

  const columns: Column<InventarioResumen>[] = [
    { key: 'nombreProducto', label: 'Producto', defaultVisible: true },
    { 
      key: 'stockTotal', 
      label: 'Stock Total', 
      defaultVisible: true,
      type: 'number',
      render: (item: InventarioResumen) => (
        <span className={item.stockTotal <= 0 ? 'text-red-500' : ''}>
          {item.stockTotal}
        </span>
      )
    },
    { 
      key: 'numeroLotes', 
      label: 'Número de Lotes', 
      defaultVisible: true,
      type: 'number'
    },
    { 
      key: 'costoPromedio', 
      label: 'Costo Promedio', 
      defaultVisible: true,
      type: 'number',
      render: (item: InventarioResumen) => (
        <span>${item.costoPromedio.toFixed(2)}</span>
      )
    },
    { 
      key: 'precioVenta', 
      label: 'Precio de Venta', 
      defaultVisible: true,
      type: 'number',
      render: (item: InventarioResumen) => (
        <span>
          {item.precioVenta !== null ? `$${item.precioVenta.toFixed(2)}` : '-'}
        </span>
      )
    },
    { 
      key: 'ultimaEntrada', 
      label: 'Última Entrada', 
      defaultVisible: true,
      type: 'date',
      render: (item: InventarioResumen) => (
        item.ultimaEntrada ? format(item.ultimaEntrada, 'dd/MM/yyyy', { locale: es }) : '-'
      )
    },
    { 
      key: 'proximoVencimiento', 
      label: 'Próximo Vencimiento', 
      defaultVisible: true,
      type: 'date',
      render: (item: InventarioResumen) => {
        if (!item.proximoVencimiento) return '-';
        const fecha = item.proximoVencimiento;
        const hoy = new Date();
        const diasRestantes = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={diasRestantes <= 30 ? 'text-red-500' : ''}>
            {format(fecha, 'dd/MM/yyyy', { locale: es })}
            {diasRestantes <= 30 && ` (${diasRestantes} días)`}
          </span>
        );
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      defaultVisible: true,
      render: (item: InventarioResumen) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedProductoForLotes(item);
            setIsLotesTableOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver Lotes
        </Button>
      )
    }
  ];

  // Filtrar solo productos vencidos
  const productosVencidos = React.useMemo(() => {
    if (!inventarioData) return [];
    const hoy = new Date();
    return inventarioData.filter(item => {
      if (!item.proximoVencimiento) return false;
      const diasRestantes = Math.ceil((item.proximoVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes <= 0;
    });
  }, [inventarioData]);

  const columnasVencidos: Column<InventarioResumen>[] = [
    { key: 'nombreProducto', label: 'Producto', defaultVisible: true },
    { 
      key: 'stockTotal', 
      label: 'Stock Total', 
      defaultVisible: true,
      type: 'number'
    },
    { 
      key: 'proximoVencimiento', 
      label: 'Fecha Vencimiento', 
      defaultVisible: true,
      type: 'date',
      render: (item: InventarioResumen) => {
        if (!item.proximoVencimiento) return '-';
        const fecha = item.proximoVencimiento;
        const hoy = new Date();
        const diasRestantes = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={diasRestantes <= 0 ? 'text-red-500 font-bold' : 'text-orange-500'}>
            {format(fecha, 'dd/MM/yyyy', { locale: es })}
            {` (${diasRestantes <= 0 ? 'Vencido' : `${diasRestantes} días restantes`})`}
          </span>
        );
      }
    },
    { 
      key: 'numeroLotes', 
      label: 'Número de Lotes', 
      defaultVisible: true,
      type: 'number'
    },
    {
      key: 'acciones',
      label: 'Acciones',
      defaultVisible: true,
      render: (item: InventarioResumen) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedProductoForLotes(item);
            setIsLotesTableOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver Lotes
        </Button>
      )
    }
  ];

  const handleRegistrarLote = (producto: Producto) => {
    setSelectedProducto(producto);
    setIsRegistrarLoteOpen(true);
  };

  const handleCloseRegistrarLote = () => {
    setIsRegistrarLoteOpen(false);
    setSelectedProducto(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p>Error al cargar el inventario. Por favor, intente nuevamente.</p>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="text-gray-600"
            >
              Actualizar
            </Button>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setIsRegistrarMovimientoOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Registrar Movimiento
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={inventarioData || []}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          searchPlaceholder="Buscar en inventario..."
          showDefaultActions={false}
        />

        {/* Tabla de Productos Vencidos */}
        {productosVencidos.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Productos Vencidos
              </h2>
              <span className="text-sm text-gray-500">
                {productosVencidos.length} productos vencidos
              </span>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b border-gray-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">
                  ⚠️ Productos con fecha de vencimiento expirada
                </p>
              </div>
              <DataTable
                columns={columnasVencidos}
                data={productosVencidos}
                searchTerm=""
                onSearchChange={() => {}}
                currentPage={1}
                itemsPerPage={5}
                onPageChange={() => {}}
                showDefaultActions={false}
              />
            </div>
          </div>
        )}

        {selectedProducto && (
          <RegistrarLoteDialog
            isOpen={isRegistrarLoteOpen}
            onClose={() => {
              setIsRegistrarLoteOpen(false);
              setSelectedProducto(null);
            }}
            producto={selectedProducto}
            usuarioId={user?.id || ''}
          />
        )}

        <RegistrarMovimientoDialog
          isOpen={isRegistrarMovimientoOpen}
          onClose={() => setIsRegistrarMovimientoOpen(false)}
          usuarioId={user?.id || ''}
        />

        {selectedProductoForLotes && (
          <LotesTable
            isOpen={isLotesTableOpen}
            onClose={() => {
              setIsLotesTableOpen(false);
              setSelectedProductoForLotes(null);
            }}
            productoId={selectedProductoForLotes.productoId}
            nombreProducto={selectedProductoForLotes.nombreProducto}
          />
        )}
      </div>
    </div>
  );
};

export default InventarioPage; 