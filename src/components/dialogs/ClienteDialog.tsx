import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { clienteService, Cliente } from '../../services/clienteService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { User, Building, FileText, X } from 'lucide-react';

interface ClienteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: {
    nombre: string;
    razonSocial: string;
    ruc: string;
    usuarioId: string;
    estado: number;
  }) => void;
  cliente?: Cliente;
  usuarioId: string;
}

export const ClienteDialog: React.FC<ClienteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  cliente,
  usuarioId
}) => {
  const { user } = useAuthStore();
  const [nombre, setNombre] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre);
      setRazonSocial(cliente.razonSocial);
      setRuc(cliente.ruc);
    } else {
      // Resetear el formulario cuando se abre para crear nuevo
      setNombre('');
      setRazonSocial('');
      setRuc('');
    }
  }, [cliente, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const clienteData = {
        nombre,
        razonSocial,
        ruc,
        estado: 1,
        usuarioId: usuarioId,
      };

      await onSave(clienteData);
      onClose();
    } catch (error) {
      console.error('Error al guardar el cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <DialogHeader className="flex-1">
              <DialogTitle className="text-xl font-bold flex items-center space-x-2">
                <User className="w-6 h-6" />
                <span>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1">
                {cliente ? 'Actualiza la información del cliente' : 'Agrega un nuevo cliente al directorio'}
              </p>
            </DialogHeader>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ingresa el nombre del cliente"
                  className="bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razonSocial" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Building className="w-4 h-4 mr-2 text-purple-500" />
                  Razón Social
                </Label>
                <Input
                  id="razonSocial"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ingresa la razón social"
                  className="bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruc" className="text-sm font-semibold text-gray-700 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                  RUC
                </Label>
                <Input
                  id="ruc"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  placeholder="Ingresa el RUC"
                  className="bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-6 py-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  cliente ? 'Actualizar Cliente' : 'Crear Cliente'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 