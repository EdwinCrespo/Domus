import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { proveedorService, Proveedor } from '../../services/proveedorService';
import { useAuthStore } from '../../store/authStore';

interface AddProveedorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedorId?: number;
  onProveedorCreated?: (proveedor: Omit<Proveedor, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => Promise<void>;
  onProveedorUpdated?: (id: number, proveedor: Partial<Proveedor>) => Promise<void>;
}

export const AddProveedorDialog: React.FC<AddProveedorDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  proveedorId,
  onProveedorCreated,
  onProveedorUpdated
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    direccion: '',
    email: '',
    estado: 1
  });

  useEffect(() => {
    if (isOpen && proveedorId) {
      loadProveedor();
    } else {
      resetForm();
    }
  }, [isOpen, proveedorId]);

  const loadProveedor = async () => {
    if (!proveedorId) return;
    try {
      const proveedor = await proveedorService.getProveedor(proveedorId);
      setFormData({
        nombre: proveedor.nombre,
        contacto: proveedor.contacto || '',
        direccion: proveedor.direccion || '',
        email: proveedor.email || '',
        estado: proveedor.estado
      });
    } catch (err) {
      console.error('Error al cargar proveedor:', err);
      setError('Error al cargar los datos del proveedor');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      contacto: '',
      direccion: '',
      email: '',
      estado: 1
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      if (proveedorId) {
        if (onProveedorUpdated) {
          await onProveedorUpdated(proveedorId, {
            ...formData,
            usuarioId: user.id
          });
        } else {
          await proveedorService.updateProveedor(proveedorId, {
            ...formData,
            usuarioId: user.id
          });
        }
      } else {
        if (onProveedorCreated) {
          await onProveedorCreated({
            ...formData,
            usuarioId: user.id
          });
        } else {
          await proveedorService.createProveedor({
            ...formData,
            usuarioId: user.id
          });
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      setError('Error al guardar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {proveedorId ? 'Editar Proveedor' : 'Agregar Proveedor'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contacto">Contacto</Label>
            <Input
              id="contacto"
              value={formData.contacto}
              onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : proveedorId ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 