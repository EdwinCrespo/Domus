import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { clienteService } from '../../services/clienteService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';

interface AddClienteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cliente: {
    nombre: string;
    razonSocial: string;
    ruc: string;
    usuarioId: string;
    estado: number;
  }) => void;
  clienteId?: number;
}

export const AddClienteDialog: React.FC<AddClienteDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clienteId
}) => {
  const { user } = useAuthStore();
  const [nombre, setNombre] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (clienteId) {
      const loadCliente = async () => {
        try {
          const cliente = await clienteService.getCliente(clienteId);
          setNombre(cliente.nombre);
          setRazonSocial(cliente.razonSocial);
          setRuc(cliente.ruc);
        } catch (error) {
          console.error('Error al cargar el cliente:', error);
          toast.error('Error al cargar el cliente');
          onClose();
        }
      };
      loadCliente();
    } else {
      // Resetear el formulario cuando se abre para crear nuevo
      setNombre('');
      setRazonSocial('');
      setRuc('');
    }
  }, [clienteId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const clienteData = {
        nombre,
        razonSocial,
        ruc,
        estado: 1,
        usuarioId: user?.id || '',
      };

      if (clienteId) {
        await clienteService.updateCliente(clienteId, clienteData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        onSuccess(clienteData);
      }

      await queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onClose();
    } catch (error) {
      console.error('Error al guardar el cliente:', error);
      toast.error('Error al guardar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{clienteId ? 'Editar Cliente' : 'Agregar Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="razonSocial">Razón Social</Label>
            <Input
              id="razonSocial"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ruc">RUC</Label>
            <Input
              id="ruc"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : clienteId ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 