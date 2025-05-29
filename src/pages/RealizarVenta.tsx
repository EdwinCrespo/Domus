import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Search, Loader2, Check, ChevronsUpDown, Wand2 } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
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
import { clienteService, Cliente as ClienteType } from '../services/clienteService';
import { productoService, Producto as ProductoBase } from '../services/productoService';
import { inventarioService, InventarioResumen } from '../services/inventarioService';
import { ventaService, MetodoPago, CreateVenta } from '../services/ventaService';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

interface Producto extends ProductoBase {
    precioVenta: number;
    stock: number;
    categoria?: {
        nombre: string;
    } | null;
}

interface Cliente {
    id: number;
    nombre: string;
    razonSocial: string;
    ruc: string;
    contacto?: string;
    email?: string;
}

interface DetalleVenta {
    id: number;
    productoId: number;
    nombreProducto: string;
    sku: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

interface Pago {
    metodo: string;
    monto: number;
}

const RealizarVenta = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [clienteId, setClienteId] = useState<string>('');
    const [clienteSearch, setClienteSearch] = useState('');
    const [detalles, setDetalles] = useState<DetalleVenta[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
    const [cantidad, setCantidad] = useState<string>('');
    const [precioUnitario, setPrecioUnitario] = useState<string>('');
    const [metodoPago, setMetodoPago] = useState<string>('');
    const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
    const [loadingMetodosPago, setLoadingMetodosPago] = useState(false);
    const itemsPerPage = 5;
    const [showAlert, setShowAlert] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{
        type: 'success' | 'error';
        title: string;
        message: string;
    } | null>(null);
    const queryClient = useQueryClient();

    // Usar TanStack Query para obtener el inventario
    const { 
        data: inventarioData, 
        isLoading: isLoadingInventario,
        error: errorInventario,
        refetch: refetchInventario 
    } = useQuery<InventarioResumen[]>({
        queryKey: ['inventario', user?.id],
        queryFn: () => inventarioService.obtenerResumenInventario(user?.id || ''),
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutos
        refetchOnWindowFocus: false
    });

    // Columnas para la tabla de productos disponibles
    const columnasProductos = [
        { key: 'nombre', label: 'Producto', type: 'text' as const },
        { key: 'sku', label: 'SKU', type: 'text' as const },
        { key: 'codigoBarras', label: 'Código de Barras', type: 'text' as const },
        {
            key: 'categoria', label: 'Categoría', type: 'text' as const,
            render: (item: Producto) => item.categoria?.nombre || 'Sin categoría'
        },
        { key: 'stock', label: 'Stock', type: 'number' as const },
        {
            key: 'precioVenta', label: 'Precio', type: 'number' as const,
            render: (item: Producto) => `$${item.precioVenta.toFixed(2)}`
        }
    ];

    // Columnas para la tabla de detalles de venta
    const columnasDetalles = [
        { key: 'nombreProducto', label: 'Producto', type: 'text' as const },
        { key: 'sku', label: 'SKU', type: 'text' as const },
        { key: 'cantidad', label: 'Cantidad', type: 'number' as const },
        {
            key: 'precioUnitario', label: 'Precio Unitario', type: 'number' as const,
            render: (item: DetalleVenta) => `$${item.precioUnitario.toFixed(2)}`
        },
        {
            key: 'subtotal', label: 'Subtotal', type: 'number' as const,
            render: (item: DetalleVenta) => `$${item.subtotal.toFixed(2)}`
        }
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
            
            // Combinar datos de productos con datos de inventario
            const productosFormateados: Producto[] = productosData.map(p => {
                const inventarioItem = inventarioData?.find(i => i.productoId === parseInt(p.id));
                return {
                    ...p,
                    precioVenta: p.precioVenta || 0,
                    stock: inventarioItem?.stockTotal || 0,
                    categoria: p.categoriaId ? { nombre: p.categoriaId.toString() } : null
                };
            });
            
            setProductos(productosFormateados);
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            toast.error('Error al cargar los productos');
        } finally {
            setLoadingProductos(false);
        }
    };

    // Actualizar productos cuando cambia el inventario
    useEffect(() => {
        if (inventarioData) {
            cargarProductos();
        }
    }, [inventarioData]);

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

    // Cargar clientes al montar el componente
    useEffect(() => {
        if (user?.id) {
            cargarClientes();
        }
    }, [user?.id]);

    const cargarClientes = async () => {
        try {
            setLoadingClientes(true);
            const clientesData = await clienteService.getClientes(user?.id || '');
            setClientes(clientesData);
        } catch (error) {
            console.error('Error al cargar los clientes:', error);
            toast.error('Error al cargar los clientes');
        } finally {
            setLoadingClientes(false);
        }
    };

    const handleSeleccionarProducto = (producto: Producto) => {
        setSelectedProducto(producto);
        setPrecioUnitario(producto.precioVenta.toString());
    };

    const handleAgregarProducto = () => {
        if (!selectedProducto || !cantidad || !precioUnitario) return;

        const cantidadSolicitada = parseInt(cantidad);
        const stockDisponible = selectedProducto.stock;

        // Validar que la cantidad no exceda el stock disponible
        if (cantidadSolicitada > stockDisponible) {
            toast.error(`Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles.`);
            return;
        }

        // Validar que la cantidad sea mayor a 0
        if (cantidadSolicitada <= 0) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        const nuevoDetalle: DetalleVenta = {
            id: Date.now(),
            productoId: parseInt(selectedProducto.id.toString()),
            nombreProducto: selectedProducto.nombre,
            sku: selectedProducto.sku,
            cantidad: cantidadSolicitada,
            precioUnitario: parseFloat(precioUnitario),
            subtotal: cantidadSolicitada * parseFloat(precioUnitario)
        };

        setDetalles([...detalles, nuevoDetalle]);
        setSelectedProducto(null);
        setCantidad('');
        setPrecioUnitario('');
    };

    const handleEliminarProducto = (detalle: DetalleVenta) => {
        setDetalles(detalles.filter(d => d.id !== detalle.id));
    };

    const calcularTotal = () => {
        return detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
    };

    const reiniciarEstados = () => {
        setClienteId('');
        setClienteSearch('');
        setDetalles([]);
        setSelectedProducto(null);
        setCantidad('');
        setPrecioUnitario('');
        setSearchTerm('');
        setCurrentPage(1);
        setMetodoPago('');
        setShowAlert(false);
        setAlertInfo(null);
    };

    const handleRegistrarVenta = async () => {
        if (!clienteId || detalles.length === 0) {
            toast.error('Debe seleccionar un cliente y agregar al menos un producto');
            return;
        }

        if (!metodoPago) {
            toast.error('Debe seleccionar un método de pago');
            return;
        }

        try {
            setIsLoading(true);

            const venta: CreateVenta = {
                usuarioId: user?.id || '',
                clienteId: parseInt(clienteId),
                total: calcularTotal(),
                estado: 'completada',
                detalles: detalles.map(detalle => ({
                    productoId: detalle.productoId,
                    cantidad: detalle.cantidad,
                    precioUnitario: detalle.precioUnitario,
                    subtotal: detalle.subtotal
                })),
                pagos: [{
                    metodoPagoId: parseInt(metodoPago),
                    monto: calcularTotal()
                }]
            };

            await ventaService.crearVenta(venta);
            
            // Después de una venta exitosa
            await queryClient.invalidateQueries({ queryKey: ['inventario'] });
            
            setAlertInfo({
                type: 'success',
                title: 'Venta registrada exitosamente',
                message: 'La venta se ha registrado correctamente. Será redirigido a la lista de ventas.'
            });
            setShowAlert(true);
        } catch (error) {
            console.error('Error al registrar la venta:', error);
            setAlertInfo({
                type: 'error',
                title: 'Error al registrar la venta',
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
            reiniciarEstados();
            navigate('/ventas/nueva', { replace: true });
        }
    };

    // Filtrar clientes basado en la búsqueda
    const filteredClientes = React.useMemo(() => {
        if (!clienteSearch.trim()) return clientes;

        const searchLower = clienteSearch.toLowerCase();
        return clientes.filter((cliente) =>
            cliente.nombre.toLowerCase().includes(searchLower) ||
            cliente.razonSocial.toLowerCase().includes(searchLower) ||
            cliente.ruc.toLowerCase().includes(searchLower)
        );
    }, [clientes, clienteSearch]);

    // Cargar métodos de pago al montar el componente
    useEffect(() => {
        cargarMetodosPago();
    }, []);

    const cargarMetodosPago = async () => {
        try {
            setLoadingMetodosPago(true);
            const data = await ventaService.obtenerMetodosPago();
            setMetodosPago(data);
        } catch (error) {
            console.error('Error al cargar los métodos de pago:', error);
            toast.error('Error al cargar los métodos de pago');
        } finally {
            setLoadingMetodosPago(false);
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Realizar Venta</h1>
                    <p className="text-gray-600 mt-1">Registre una nueva venta de productos</p>
                </div>

                {/* Formulario principal */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selección de Cliente */}
                        <div className="space-y-2">
                            <Label htmlFor="cliente">Cliente *</Label>
                            <Select
                                value={clienteId}
                                onValueChange={setClienteId}
                                disabled={loadingClientes}
                            >
                                <SelectTrigger className="w-full">
                                    {loadingClientes ? (
                                        <div className="flex items-center">
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Cargando...
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Seleccionar cliente" />
                                    )}
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px]">
                                    <div className="sticky top-0 z-10 bg-white border-b px-3 py-2">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                value={clienteSearch}
                                                onChange={(e) => setClienteSearch(e.target.value)}
                                                className="pl-8 h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[350px] overflow-auto">
                                        {filteredClientes.length === 0 ? (
                                            <div className="py-6 text-center text-sm text-gray-500">
                                                No se encontraron clientes
                                            </div>
                                        ) : (
                                            filteredClientes.map((cliente) => (
                                                <SelectItem
                                                    key={cliente.id}
                                                    value={cliente.id.toString()}
                                                    className="cursor-pointer py-2"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium truncate max-w-[300px]">{cliente.razonSocial || cliente.nombre}</span>
                                                        <span className="text-sm text-gray-500">RUC: {cliente.ruc}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </div>
                                </SelectContent>
                            </Select>
                            <div className="text-sm text-gray-500">
                                {clientes.length} clientes disponibles
                            </div>
                        </div>

                        {/* Fecha de Venta */}
                        <div className="space-y-2">
                            <Label htmlFor="fecha">Fecha de Venta</Label>
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
                                <h3 className="font-medium">Agregar Producto a la Venta</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedProducto(null);
                                        setPrecioUnitario('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Cancelar selección
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <Label>Producto Seleccionado</Label>
                                    <div className="mt-1 p-2 bg-white rounded border border-gray-200">
                                        <div className="font-medium">{selectedProducto.nombre}</div>
                                        <div className="text-sm text-gray-500">
                                            SKU: {selectedProducto.sku} |
                                            {selectedProducto.codigoBarras && ` Código: ${selectedProducto.codigoBarras}`} |
                                            Stock: {selectedProducto.stock}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="cantidad">Cantidad *</Label>
                                    <Input
                                        type="number"
                                        id="cantidad"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(e.target.value)}
                                        min="1"
                                        max={selectedProducto.stock}
                                        placeholder="Cantidad"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="precio">Precio Unitario *</Label>
                                    <Input
                                        type="number"
                                        id="precio"
                                        value={precioUnitario}
                                        disabled
                                        className="mt-1 bg-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={handleAgregarProducto}
                                    disabled={!cantidad || !precioUnitario || parseInt(cantidad) > selectedProducto.stock}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar a la Venta
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabla de detalles de venta */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Detalles de la Venta</h2>
                    
                    {/* Métodos de Pago */}
                    <div className="mb-6">
                        <h3 className="text-md font-medium mb-3">Método de Pago</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <Label htmlFor="metodoPago">Método de Pago *</Label>
                                <Select
                                    value={metodoPago}
                                    onValueChange={setMetodoPago}
                                    disabled={loadingMetodosPago}
                                >
                                    <SelectTrigger className="w-full">
                                        {loadingMetodosPago ? (
                                            <div className="flex items-center">
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Cargando...
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Seleccione un método de pago" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[400px]">
                                        <div className="sticky top-0 z-10 bg-white border-b px-3 py-2">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="text"
                                                    placeholder="Buscar método de pago..."
                                                    className="pl-8 h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[350px] overflow-auto">
                                            {metodosPago.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-gray-500">
                                                    No hay métodos de pago disponibles
                                                </div>
                                            ) : (
                                                metodosPago.map((metodo) => (
                                                    <SelectItem
                                                        key={metodo.id}
                                                        value={metodo.id.toString()}
                                                        className="cursor-pointer py-2"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{metodo.nombre}</span>
                                                            {metodo.descripcion && (
                                                                <span className="text-sm text-gray-500">{metodo.descripcion}</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-sm text-gray-600">Total de la Venta</div>
                                <div className="text-lg font-semibold">${calcularTotal().toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={columnasDetalles}
                        data={detalles}
                        searchTerm=""
                        onSearchChange={() => { }}
                        currentPage={1}
                        itemsPerPage={itemsPerPage}
                        onPageChange={() => { }}
                        onDelete={handleEliminarProducto}
                        showDefaultActions={true}
                    />
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/ventas/nueva')}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        disabled={!clienteId || detalles.length === 0 || isLoading}
                        onClick={handleRegistrarVenta}
                    >
                        {isLoading ? 'Registrando...' : 'Registrar Venta'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RealizarVenta; 