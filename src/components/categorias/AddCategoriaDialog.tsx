import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { categoriaService, Categoria } from '../../services/categoriaService';
import { CreateCategoriaDto } from '../../pages/Categorias';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddCategoriaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (categoria: CreateCategoriaDto) => Promise<void>;
  categoriaId?: number; // Si se proporciona, estamos en modo edición
}

export function AddCategoriaDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  categoriaId 
}: AddCategoriaDialogProps) {
  const { user } = useAuthStore();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!categoriaId;

  // Cargar datos de la categoría si estamos en modo edición
  useEffect(() => {
    const loadCategoria = async () => {
      if (!categoriaId) return;
      
      console.log('Cargando categoría con ID:', categoriaId);
      setIsLoading(true);
      try {
        const categoria = await categoriaService.getCategoria(categoriaId);
        console.log('Categoría cargada:', categoria);
        setNombre(categoria.nombre);
        setDescripcion(categoria.descripcion);
      } catch (err) {
        console.error('Error al cargar categoría:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la categoría');
        toast.error('Error al cargar la categoría');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && categoriaId) {
      console.log('Dialog abierto, iniciando carga de categoría');
      loadCategoria();
    }
  }, [categoriaId, isOpen]);

  // Resetear el formulario cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setNombre('');
      setDescripcion('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('No hay usuario autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const categoriaData = {
        nombre,
        descripcion,
        usuarioId: user.id
      };

      await onSuccess(categoriaData);
    } catch (err) {
      console.error('Error al guardar la categoría:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la categoría';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los detalles de la categoría existente.'
              : 'Complete los campos para crear una nueva categoría.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese el nombre de la categoría"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese una descripción"
              required
              disabled={isLoading}
              className="min-h-[100px]"
            />
          </div>
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                isEditing ? 'Guardar Cambios' : 'Crear Categoría'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 