import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import DataTable, { Column } from '../ui/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { inventarioService, LoteInventario } from '../../services/inventarioService';
import { Loader2 } from 'lucide-react';

interface LotesTableProps {
  isOpen: boolean;
  onClose: () => void;
  productoId: number;
  nombreProducto: string;
}

const LotesTable: React.FC<LotesTableProps> = ({
  isOpen,
  onClose,
  productoId,
  nombreProducto
}) => {
  const [lotes, setLotes] = useState<LoteInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const columns: Column<LoteInventario>[] = [
    { 
      key: 'codigoLote', 
      label: 'Código de Lote', 
      defaultVisible: true 
    },
    { 
      key: 'cantidad', 
      label: 'Cantidad', 
      defaultVisible: true,
      type: 'number'
    },
    { 
      key: 'costoUnitario', 
      label: 'Costo Unitario', 
      defaultVisible: true,
      type: 'number',
      render: (item: LoteInventario) => (
        <span>${item.costoUnitario.toFixed(2)}</span>
      )
    },
    { 
      key: 'fechaEntrada', 
      label: 'Fecha de Entrada', 
      defaultVisible: true,
      type: 'date',
      render: (item: LoteInventario) => (
        format(item.fechaEntrada, 'dd/MM/yyyy', { locale: es })
      )
    },
    { 
      key: 'fechaVencimiento', 
      label: 'Fecha de Vencimiento', 
      defaultVisible: true,
      type: 'date',
      render: (item: LoteInventario) => {
        if (!item.fechaVencimiento) return '-';
        const fecha = item.fechaVencimiento;
        const hoy = new Date();
        const diasRestantes = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span className={diasRestantes <= 30 ? 'text-red-500' : ''}>
            {format(fecha, 'dd/MM/yyyy', { locale: es })}
            {diasRestantes <= 30 && ` (${diasRestantes} días)`}
          </span>
        );
      }
    }
  ];

  useEffect(() => {
    const cargarLotes = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const lotesData = await inventarioService.getLotesByProducto(productoId);
        setLotes(lotesData);
        setError(null);
      } catch (err) {
        console.error('Error al cargar los lotes:', err);
        setError('Error al cargar los lotes. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    cargarLotes();
  }, [isOpen, productoId]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Cargando lotes...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            <p>{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-h-[70vh] overflow-y-auto">
        <DataTable
          columns={columns}
          data={lotes}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          searchPlaceholder="Buscar en lotes..."
          showDefaultActions={false}
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Lotes de {nombreProducto}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default LotesTable; 