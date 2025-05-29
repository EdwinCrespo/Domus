import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { categoriaService, Categoria } from '../../services/categoriaService';
import { Producto } from '../../services/productoService';

interface ProductoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (producto: Producto) => Promise<void>;
  producto?: Producto;
  usuarioId: string;
}

export const ProductoDialog: React.FC<ProductoDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  producto,
  usuarioId
}) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formData, setFormData] = useState<Omit<Producto, 'id'>>({
    nombre: '',
    sku: '',
    codigoBarras: '',
    categoriaId: null,
    usuarioId: usuarioId,
    margenGanancia: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const data = await categoriaService.getCategorias(usuarioId);
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };

    if (isOpen) {
      console.log('Dialog abierto, producto:', producto);
      cargarCategorias();
      if (producto) {
        console.log('Cargando datos del producto:', producto);
        setFormData({
          nombre: producto.nombre,
          sku: producto.sku,
          codigoBarras: producto.codigoBarras,
          categoriaId: producto.categoriaId || null,
          usuarioId: producto.usuarioId,
          margenGanancia: producto.margenGanancia
        });
      } else {
        console.log('Inicializando formulario vacío');
        setFormData({
          nombre: '',
          sku: '',
          codigoBarras: '',
          categoriaId: null,
          usuarioId: usuarioId,
          margenGanancia: null
        });
      }
    }
  }, [isOpen, producto, usuarioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData as Producto);
      onClose();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' || name === 'stock' ? Number(value) : value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{producto ? 'Editar Producto' : 'Agregar Producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigoBarras">Código de Barra</Label>
            <Input
              id="codigoBarras"
              name="codigoBarras"
              value={formData.codigoBarras}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              value={formData.categoriaId ? formData.categoriaId.toString() : "0"}
              onValueChange={(value) => {
                console.log('Categoría seleccionada:', value);
                setFormData(prev => ({ 
                  ...prev, 
                  categoriaId: value === "0" ? null : parseInt(value)
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría">
                  {formData.categoriaId 
                    ? categorias.find(c => c.id === formData.categoriaId)?.nombre 
                    : "Sin categoría"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sin categoría</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="margenGanancia">Margen de Ganancia (%)</Label>
            <Input
              id="margenGanancia"
              name="margenGanancia"
              type="number"
              step="0.01"
              min="0"
              value={formData.margenGanancia || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? null : parseFloat(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  margenGanancia: value
                }));
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 