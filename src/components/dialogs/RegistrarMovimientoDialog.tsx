import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { X, Plus, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandInput,
  CommandItem,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { toast } from 'sonner';
import { inventarioService, LoteInventario, Producto, InventarioSalida } from '../../services/inventarioService';
import { Alert } from '../ui/alert';

interface Lote extends Omit<LoteInventario, 'codigoLote'> {
  codigo: string;
}

interface MovimientoItem extends InventarioSalida {}

interface RegistrarMovimientoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: string;
  onSuccess?: () => void;
}

const MOTIVOS = [
  { value: 'vencido', label: 'Vencido' },
  { value: 'perdida', label: 'Perdida' },
  { value: 'dano', label: 'Daño' },
  { value: 'consumo', label: 'Consumo' },
  { value: 'ajuste', label: 'Ajuste' },
];

export const RegistrarMovimientoDialog: React.FC<RegistrarMovimientoDialogProps> = ({
  isOpen,
  onClose,
  usuarioId,
  onSuccess,
}) => {
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>([]);
  const [currentMovimiento, setCurrentMovimiento] = useState<Partial<MovimientoItem>>({});
  const [openProducto, setOpenProducto] = useState(false);
  const [openLote, setOpenLote] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [loading, setLoading] = useState({
    productos: false,
    lotes: false,
    guardando: false
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Cargar productos al abrir el diálogo
  useEffect(() => {
    if (isOpen) {
      cargarProductos();
    }
  }, [isOpen]);

  // Cargar lotes cuando se selecciona un producto
  useEffect(() => {
    console.log('useEffect para selectedProductoId detectó cambio a:', selectedProductoId);
    if (selectedProductoId !== null) {
      cargarLotes(selectedProductoId);
      setCurrentMovimiento(prev => ({
        ...prev,
        inventarioLoteId: undefined
      })); // Limpiar lote seleccionado al cambiar producto
    } else {
       setLotes([]); // Limpiar lotes si no hay producto seleccionado
       setCurrentMovimiento(prev => ({
        ...prev,
        inventarioLoteId: undefined
      })); // Limpiar lote seleccionado si no hay producto seleccionado
    }
  }, [selectedProductoId, usuarioId]); // usuarioId también es dependencia porque cargarLotes lo usa

  const cargarProductos = async () => {
    try {
      setLoading(prev => ({ ...prev, productos: true }));
      const productosData = await inventarioService.getProductos(usuarioId);
      console.log('Productos cargados:', productosData); // Log para verificar datos
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(prev => ({ ...prev, productos: false }));
    }
  };

  const cargarLotes = async (productoId: number) => {
    try {
      setLoading(prev => ({ ...prev, lotes: true }));
      const lotesData = await inventarioService.getLotesByProducto(productoId);
      setLotes(lotesData.map(lote => ({
        ...lote,
        codigo: lote.codigoLote || ''
      })));
    } catch (error) {
      console.error('Error al cargar los lotes:', error);
      alert('Error al cargar los lotes');
    } finally {
      setLoading(prev => ({ ...prev, lotes: false }));
    }
  };

  const handleProductoSelect = async (productoId: number) => {
    console.log('handleProductoSelect llamado con:', productoId);
    try {
      setSelectedProductoId(productoId);
      setOpenProducto(false);
      await cargarLotes(productoId);
    } catch (error) {
      console.error('Error en handleProductoSelect:', error);
      toast.error('Error al seleccionar el producto');
    }
  };

  const handleAgregarMovimiento = () => {
    if (currentMovimiento.inventarioLoteId && 
        currentMovimiento.cantidad && 
        currentMovimiento.tipo) {
      const nuevoMovimiento: MovimientoItem = {
        ...currentMovimiento,
        inventarioLoteId: currentMovimiento.inventarioLoteId,
        cantidad: Number(currentMovimiento.cantidad),
        tipo: currentMovimiento.tipo,
        descripcion: currentMovimiento.descripcion || '',
      };
      setMovimientos([...movimientos, nuevoMovimiento]);
      setCurrentMovimiento({});
    } else {
      toast.error('Por favor complete todos los campos requeridos');
    }
  };

  const handleRegistrarMovimientos = async () => {
    try {
      setLoading(prev => ({ ...prev, guardando: true }));
      await inventarioService.procesarSalidas(usuarioId, movimientos);
      
      setAlertInfo({
        type: 'success',
        title: '¡Movimientos registrados exitosamente!',
        message: `Se han procesado ${movimientos.length} movimiento${movimientos.length !== 1 ? 's' : ''} de inventario.`
      });
      setShowAlert(true);

      // Esperar 3 segundos antes de cerrar
      setTimeout(() => {
        setShowAlert(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }, 3000);

    } catch (error) {
      console.error('Error al registrar los movimientos:', error);
      setAlertInfo({
        type: 'error',
        title: 'Error al registrar los movimientos',
        message: 'Por favor, intente nuevamente o contacte al soporte técnico.'
      });
      setShowAlert(true);
    } finally {
      setLoading(prev => ({ ...prev, guardando: false }));
    }
  };

  const getProductoNombre = (id: number) => {
    return productos.find(p => p.id === id)?.nombre || '';
  };

  const getLoteInfo = (id: number) => {
    const lote = lotes.find(l => l.id === id);
    if (!lote) return '';
    const fecha = new Date(lote.fechaEntrada).toLocaleDateString();
    return `${lote.codigo} - ${fecha} - (${lote.cantidad})`;
  };

  const getLoteStock = (id: number) => {
    return lotes.find(l => l.id === id)?.cantidad || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        {showAlert && alertInfo && (
          <div className="mb-4 flex-shrink-0">
            <Alert
              type={alertInfo.type}
              title={alertInfo.title}
              message={alertInfo.message}
              onClose={() => setShowAlert(false)}
            />
          </div>
        )}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-blue-700">
              Productos a descontar: {movimientos.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMovimientos([])}
              className="text-red-600 hover:text-red-700"
            >
              Limpiar lista
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select
                  value={selectedProductoId?.toString() || ""}
                  onValueChange={(value) => {
                    console.log('Select onValueChange:', value);
                    if (value) {
                      handleProductoSelect(Number(value));
                    }
                  }}
                  disabled={loading.productos}
                >
                  <SelectTrigger className="w-full">
                    {loading.productos ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cargando...
                      </div>
                    ) : (
                      <SelectValue placeholder="Seleccionar producto" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((producto) => (
                      <SelectItem 
                        key={producto.id} 
                        value={producto.id.toString()}
                        className="cursor-pointer"
                      >
                        {producto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-500">
                  {productos.length} productos disponibles
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lote</Label>
                <Select
                  value={currentMovimiento.inventarioLoteId?.toString() || ""}
                  onValueChange={(value) => {
                    console.log('Lote onValueChange:', value);
                    if (value) {
                      setCurrentMovimiento({
                        ...currentMovimiento,
                        inventarioLoteId: Number(value)
                      });
                    }
                  }}
                  disabled={loading.lotes || !selectedProductoId || lotes.length === 0}
                >
                  <SelectTrigger className="w-full">
                    {loading.lotes ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cargando...
                      </div>
                    ) : !selectedProductoId ? (
                      "Seleccione un producto"
                    ) : lotes.length === 0 ? (
                      "No hay lotes disponibles"
                    ) : (
                      <SelectValue placeholder="Seleccionar lote" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((lote) => (
                      <SelectItem 
                        key={lote.id} 
                        value={lote.id.toString()}
                        className="cursor-pointer"
                      >
                        {`${lote.codigo} - ${new Date(lote.fechaEntrada).toLocaleDateString()} - (${lote.cantidad})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-500">
                  {lotes.length} lotes disponibles
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  max={currentMovimiento.inventarioLoteId ? getLoteStock(currentMovimiento.inventarioLoteId) : undefined}
                  value={currentMovimiento.cantidad || ''}
                  onChange={(e) => setCurrentMovimiento({...currentMovimiento, cantidad: Number(e.target.value)})}
                  placeholder="Ingrese la cantidad"
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select
                  value={currentMovimiento.tipo}
                  onValueChange={(value) => setCurrentMovimiento({...currentMovimiento, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map((motivo) => (
                      <SelectItem key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={currentMovimiento.descripcion || ''}
                  onChange={(e) => setCurrentMovimiento({...currentMovimiento, descripcion: e.target.value})}
                  placeholder="Ingrese una breve descripción"
                  rows={2}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleAgregarMovimiento}
              disabled={!currentMovimiento.inventarioLoteId || !currentMovimiento.cantidad || !currentMovimiento.tipo}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar a la lista
            </Button>

            {movimientos.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Lista de movimientos</h3>
                <div className="border rounded-lg">
                  <div className="max-h-[200px] overflow-y-auto space-y-2 p-2">
                    {movimientos.map((movimiento, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {getProductoNombre(lotes.find(l => l.id === movimiento.inventarioLoteId)?.productoId || 0)}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            Lote: {getLoteInfo(movimiento.inventarioLoteId)} | 
                            Cantidad: {movimiento.cantidad} | 
                            Motivo: {MOTIVOS.find(m => m.value === movimiento.tipo)?.label}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMovimientos(movimientos.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={movimientos.length === 0 || loading.guardando}
            onClick={handleRegistrarMovimientos}
          >
            {loading.guardando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Movimientos'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 