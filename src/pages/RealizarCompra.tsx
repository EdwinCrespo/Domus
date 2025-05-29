import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Search, Loader2, Check, ChevronsUpDown, Wand2 } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import { compraService, CreateCompraDto, DetalleCompraDto } from '../services/compraService';
import { proveedorService, Proveedor } from '../services/proveedorService';
import { productoService, Producto as ProductoType } from '../services/productoService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Alert } from '../components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';

interface Producto extends ProductoType {
  categoria?: {
    nombre: string;
  } | null;
}

interface DetalleCompra {
  id: number;
  productoId: number;
  nombreProducto: string;
  sku: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  codigoLote: string;
  fechaVencimiento?: string;
}

const RealizarCompra = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [proveedorId, setProveedorId] = useState<string>('');
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<string>('');
  const [costoUnitario, setCostoUnitario] = useState<string>('');
  const [codigoLote, setCodigoLote] = useState<string>('');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');
  const itemsPerPage = 5;
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const queryClient = useQueryClient();

  // Columnas para la tabla de productos disponibles
  const columnasProductos = [
    { key: 'nombre', label: 'Producto', type: 'text' as const },
    { key: 'sku', label: 'SKU', type: 'text' as const },
    { key: 'codigoBarras', label: 'Código de Barras', type: 'text' as const },
    { key: 'categoria', label: 'Categoría', type: 'text' as const, 
      render: (item: Producto) => item.categoria?.nombre || 'Sin categoría' }
  ];

  // Columnas para la tabla de detalles de compra
  const columnasDetalles = [
    { key: 'nombreProducto', label: 'Producto', type: 'text' as const },
    { key: 'sku', label: 'SKU', type: 'text' as const },
    { key: 'codigoLote', label: 'Código Lote', type: 'text' as const },
    { key: 'cantidad', label: 'Cantidad', type: 'number' as const },
    { key: 'costoUnitario', label: 'Costo Unitario', type: 'number' as const, 
      render: (item: DetalleCompra) => `$${item.costoUnitario.toFixed(2)}` },
    { key: 'subtotal', label: 'Subtotal', type: 'number' as const, 
      render: (item: DetalleCompra) => `$${item.subtotal.toFixed(2)}` },
    { key: 'fechaVencimiento', label: 'Fecha Vencimiento', type: 'text' as const,
      render: (item: DetalleCompra) => item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString() : 'No especificada' }
  ];

  // Cargar productos al montar el componente
  useEffect(() => {
    if (user?.id) {
      cargarProductos();
    }
  }, [user?.id]);

  const cargarProductos = async () => {
    try {
      setLoadingProductos(true);
      const productosData = await productoService.getProductos(user?.id || '');
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoadingProductos(false);
    }
  };

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

  // Cargar proveedores al montar el componente
  useEffect(() => {
    if (user?.id) {
      cargarProveedores();
    }
  }, [user?.id]);

  const cargarProveedores = async () => {
    try {
      setLoadingProveedores(true);
      const proveedoresData = await proveedorService.getProveedores(user?.id || '');
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error al cargar los proveedores:', error);
      toast.error('Error al cargar los proveedores');
    } finally {
      setLoadingProveedores(false);
    }
  };

  const handleSeleccionarProducto = (producto: Producto) => {
    setSelectedProducto(producto);
  };

  const handleAgregarProducto = () => {
    if (!selectedProducto || !cantidad || !costoUnitario || !codigoLote) return;

    const nuevoDetalle: DetalleCompra = {
      id: Date.now(),
      productoId: parseInt(selectedProducto.id),
      nombreProducto: selectedProducto.nombre,
      sku: selectedProducto.sku,
      cantidad: parseInt(cantidad),
      costoUnitario: parseFloat(costoUnitario),
      subtotal: parseInt(cantidad) * parseFloat(costoUnitario),
      codigoLote: codigoLote,
      fechaVencimiento: fechaVencimiento || undefined
    };

    setDetalles([...detalles, nuevoDetalle]);
    setSelectedProducto(null);
    setCantidad('');
    setCostoUnitario('');
    setCodigoLote('');
    setFechaVencimiento('');
  };

  const handleEliminarProducto = (detalle: DetalleCompra) => {
    setDetalles(detalles.filter(d => d.id !== detalle.id));
  };

  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  };

  const handleRegistrarCompra = async () => {
    if (!proveedorId || detalles.length === 0) {
      toast.error('Debe seleccionar un proveedor y agregar al menos un producto');
      return;
    }

    try {
      setIsLoading(true);

      // Validar que todos los campos requeridos estén presentes
      const detallesInvalidos = detalles.some(detalle => 
        !detalle.productoId || 
        !detalle.cantidad || 
        !detalle.costoUnitario || 
        !detalle.codigoLote
      );

      if (detallesInvalidos) {
        toast.error('Todos los productos deben tener cantidad, costo y código de lote');
        return;
      }

      // Preparar los datos según el DTO del backend
      const compraData: CreateCompraDto = {
        usuarioId: user?.id || '',
        proveedorId: parseInt(proveedorId),
        total: calcularTotal(),
        detalles: detalles.map(detalle => ({
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          costoUnitario: detalle.costoUnitario,
          codigoLote: detalle.codigoLote,
          fechaVencimiento: detalle.fechaVencimiento
        }))
      };

      // Validar que los datos coincidan con el DTO
      if (!compraData.usuarioId || !compraData.proveedorId || compraData.detalles.length === 0) {
        toast.error('Faltan datos requeridos para la compra');
        return;
      }

      // Validar que todos los detalles tengan los campos requeridos
      const detallesValidos = compraData.detalles.every((detalle: DetalleCompraDto) => 
        typeof detalle.productoId === 'number' && 
        typeof detalle.cantidad === 'number' && 
        typeof detalle.costoUnitario === 'number' &&
        detalle.cantidad > 0 &&
        detalle.costoUnitario > 0
      );

      if (!detallesValidos) {
        toast.error('Los datos de los productos no son válidos');
        return;
      }

      await compraService.createCompra(compraData);
      
      // Después de una compra exitosa
      await queryClient.invalidateQueries({ queryKey: ['inventario'] });
      
      toast.success('Compra registrada exitosamente. Redirigiendo a la lista de compras...');
      navigate('/compras', { replace: true });
    } catch (error) {
      console.error('Error al registrar la compra:', error);
      setAlertInfo({
        type: 'error',
        title: 'Error al registrar la compra',
        message: 'Por favor, intente nuevamente o contacte al soporte técnico.'
      });
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el cierre del alert y la redirección
  const handleAlertClose = () => {
    setShowAlert(false);
    if (alertInfo?.type === 'success') {
      // Limpiar todos los estados
      setProveedorId('');
      setProveedorSearch('');
      setDetalles([]);
      setSelectedProducto(null);
      setCantidad('');
      setCostoUnitario('');
      setCodigoLote('');
      setFechaVencimiento('');
      setSearchTerm('');
      setCurrentPage(1);
      
      // Forzar recarga de la página
      window.location.href = '/compras/nueva';
    }
  };

  // Filtrar proveedores basado en la búsqueda
  const filteredProveedores = React.useMemo(() => {
    if (!proveedorSearch.trim()) return proveedores;
    
    const searchLower = proveedorSearch.toLowerCase();
    return proveedores.filter((proveedor) => 
      proveedor.nombre.toLowerCase().includes(searchLower) ||
      (proveedor.contacto?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [proveedores, proveedorSearch]);

  const generarCodigoLote = () => {
    if (!selectedProducto) return;
    
    const fecha = new Date();
    const fechaStr = fecha.toISOString()
      .replace(/[-:]/g, '')  // Eliminar guiones y dos puntos
      .replace('T', '-')     // Reemplazar T por guión
      .split('.')[0];        // Eliminar milisegundos
    
    const codigoGenerado = `${selectedProducto.sku}-${fechaStr}`;
    setCodigoLote(codigoGenerado);
  };

  return (
    <div className="p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Alerta Modal */}
        {showAlert && alertInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <Alert
                type={alertInfo.type}
                title={alertInfo.title}
                message={alertInfo.message}
                onClose={handleAlertClose}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleAlertClose}
                  className={alertInfo.type === 'success' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Realizar Compra</h1>
          <p className="text-gray-600 mt-1">Registre una nueva compra de productos</p>
        </div>

        {/* Formulario principal */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selección de Proveedor */}
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor *</Label>
              <Select
                value={proveedorId}
                onValueChange={setProveedorId}
                disabled={loadingProveedores}
              >
                <SelectTrigger className="w-full">
                  {loadingProveedores ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cargando...
                    </div>
                  ) : (
                    <SelectValue placeholder="Seleccionar proveedor" />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <div className="sticky top-0 z-10 bg-white border-b px-3 py-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="text"
                        placeholder="Buscar proveedor..."
                        value={proveedorSearch}
                        onChange={(e) => setProveedorSearch(e.target.value)}
                        className="pl-8 h-9"
                      />
                    </div>
                  </div>
                  <div className="max-h-[350px] overflow-auto">
                    {filteredProveedores.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500">
                        No se encontraron proveedores
                      </div>
                    ) : (
                      filteredProveedores.map((proveedor) => (
                        <SelectItem 
                          key={proveedor.id} 
                          value={proveedor.id.toString()}
                          className="cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">{proveedor.nombre}</div>
                            {proveedor.contacto && (
                              <div className="text-sm text-gray-500">
                                Contacto: {proveedor.contacto}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-500">
                {proveedores.length} proveedores disponibles
              </div>
            </div>

            {/* Fecha de Compra */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Compra</Label>
              <Input
                type="date"
                id="fecha"
                defaultValue={new Date().toISOString().split('T')[0]}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Sección de Búsqueda y Selección de Productos */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Selección de Productos</h2>
          
          {/* Tabla de productos disponibles */}
          <div className="mb-6">
            {loadingProductos ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Cargando productos...</span>
              </div>
            ) : (
              <DataTable
                columns={columnasProductos}
                data={filteredProductos}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onRowClick={handleSeleccionarProducto}
                showDefaultActions={false}
                searchPlaceholder="Buscar por nombre, SKU o código de barras..."
              />
            )}
          </div>

          {/* Formulario para agregar producto seleccionado */}
          {selectedProducto && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Agregar Producto a la Compra</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProducto(null);
                    setCodigoLote('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancelar selección
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Label>Producto Seleccionado</Label>
                  <div className="mt-1 p-2 bg-white rounded border border-gray-200">
                    <div className="font-medium">{selectedProducto.nombre}</div>
                    <div className="text-sm text-gray-500">
                      SKU: {selectedProducto.sku} | 
                      {selectedProducto.codigoBarras && ` Código: ${selectedProducto.codigoBarras}`}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="codigoLote">Código de Lote *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="text"
                      id="codigoLote"
                      value={codigoLote}
                      onChange={(e) => setCodigoLote(e.target.value)}
                      placeholder="Ingrese código de lote"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generarCodigoLote}
                      title="Generar código de lote"
                      className="shrink-0"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: SKU-YYYYMMDD-HHMMSS
                  </p>
                </div>

                <div>
                  <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                  <Input
                    type="date"
                    id="fechaVencimiento"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional
                  </p>
                </div>

                <div>
                  <Label htmlFor="cantidad">Cantidad *</Label>
                  <Input
                    type="number"
                    id="cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    min="1"
                    placeholder="Cantidad"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="costo">Costo Unitario *</Label>
                  <Input
                    type="number"
                    id="costo"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleAgregarProducto}
                  disabled={!cantidad || !costoUnitario || !codigoLote}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar a la Compra
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de detalles de compra */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Detalles de la Compra</h2>
          <DataTable
            columns={columnasDetalles}
            data={detalles}
            searchTerm=""
            onSearchChange={() => {}}
            currentPage={1}
            itemsPerPage={itemsPerPage}
            onPageChange={() => {}}
            onDelete={handleEliminarProducto}
            showDefaultActions={true}
          />

          {/* Total */}
          <div className="mt-4 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>${calcularTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/compras')}
          >
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={!proveedorId || detalles.length === 0 || isLoading}
            onClick={handleRegistrarCompra}
          >
            {isLoading ? 'Registrando...' : 'Registrar Compra'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RealizarCompra; 