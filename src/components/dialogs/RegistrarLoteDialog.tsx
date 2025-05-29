import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Producto } from '../../services/productoService';
import { Loader2 } from 'lucide-react';
import { inventarioService } from '../../services/inventarioService';

interface RegistrarLoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto;
  usuarioId: string;
}

interface FormData {
  codigoLote: string;
  cantidad: number;
  costoUnitario: number;
  fechaEntrada: string;
  fechaVencimiento: string;
}

export const RegistrarLoteDialog: React.FC<RegistrarLoteDialogProps> = ({
  isOpen,
  onClose,
  producto,
  usuarioId
}) => {
  const [formData, setFormData] = useState<FormData>({
    codigoLote: '',
    cantidad: 0,
    costoUnitario: 0,
    fechaEntrada: new Date().toISOString().split('T')[0],
    fechaVencimiento: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventarioService.registrarLote(usuarioId, {
        productoId: parseInt(producto.id),
        codigoLote: formData.codigoLote,
        cantidad: formData.cantidad,
        costoUnitario: formData.costoUnitario,
        fechaEntrada: new Date(formData.fechaEntrada),
        fechaVencimiento: formData.fechaVencimiento ? new Date(formData.fechaVencimiento) : undefined
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar el lote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cantidad' || name === 'costoUnitario') {
      // Si el valor está vacío o es solo un signo negativo, permitirlo
      if (value === '' || value === '-') {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        return;
      }

      // Validar que sea un número válido
      const numValue = name === 'cantidad' 
        ? parseInt(value) 
        : parseFloat(value);

      if (!isNaN(numValue)) {
        setFormData(prev => ({
          ...prev,
          [name]: numValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Lote de Inventario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Input
              value={producto.nombre}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigoLote">Código de Lote</Label>
            <Input
              id="codigoLote"
              name="codigoLote"
              type="text"
              value={formData.codigoLote}
              onChange={handleChange}
              required
              placeholder="Ingrese el código del lote"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              name="cantidad"
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              value={formData.cantidad}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costoUnitario">Costo Unitario</Label>
            <Input
              id="costoUnitario"
              name="costoUnitario"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputMode="decimal"
              value={formData.costoUnitario}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaEntrada">Fecha de Entrada</Label>
            <Input
              id="fechaEntrada"
              name="fechaEntrada"
              type="date"
              value={formData.fechaEntrada}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaVencimiento">Fecha de Vencimiento (Opcional)</Label>
            <Input
              id="fechaVencimiento"
              name="fechaVencimiento"
              type="date"
              value={formData.fechaVencimiento}
              onChange={handleChange}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Lote'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 