import React, { useState, useRef, useEffect } from 'react';
import { Search, Settings2, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Input } from './input';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  defaultVisible?: boolean;
  render?: (item: T) => React.ReactNode;
  type?: 'text' | 'date' | 'number';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  searchPlaceholder?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  showDefaultActions?: boolean;
  onRowClick?: (item: T) => void;
}

function DataTable<T extends { id: number | string }>({
  columns,
  data,
  searchTerm,
  onSearchChange,
  currentPage,
  itemsPerPage,
  onPageChange,
  searchPlaceholder = "Buscar...",
  onEdit,
  onDelete,
  showDefaultActions = true,
  onRowClick,
}: DataTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce(
      (acc, col) => ({
        ...acc,
        [String(col.key)]: col.defaultVisible ?? true,
      }),
      {}
    )
  );
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Obtener columnas visibles
  const visibleColumnsList = columns.filter((col) => visibleColumns[String(col.key)]);

  // Filtrar datos basados en el término de búsqueda
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter((item) => {
      return visibleColumnsList.some((column) => {
        const value = item[column.key as keyof T];
        if (value === null || value === undefined) return false;
        
        // Manejo especial según el tipo de columna
        if (column.type === 'date' && value instanceof Date) {
          return format(value, 'dd/MM/yyyy', { locale: es }).toLowerCase().includes(searchLower);
        }
        
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, visibleColumnsList]);

  // Función para renderizar el valor de una celda según su tipo
  const renderCellValue = (item: T, column: Column<T>) => {
    if (column.render) return column.render(item);
    
    const value = item[column.key as keyof T];
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'date':
        return value instanceof Date 
          ? format(value, 'dd/MM/yyyy', { locale: es })
          : String(value);
      case 'number':
        return typeof value === 'number' 
          ? new Intl.NumberFormat('es-ES').format(value)
          : String(value);
      default:
        return String(value);
    }
  };

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para alternar la visibilidad de una columna
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Calcular el total de páginas con los datos filtrados
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Obtener los datos de la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Resetear la página cuando cambia el término de búsqueda
  useEffect(() => {
    onPageChange(1);
  }, [searchTerm, onPageChange]);

  return (
    <div className="w-full space-y-4">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        {/* Barra de búsqueda */}
        <div className="relative w-64">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>

        {/* Dropdown para seleccionar columnas */}
        <DropdownMenu open={isColumnMenuOpen} onOpenChange={setIsColumnMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {columns
              .filter(column => column.key !== 'id')
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={String(column.key)}
                  checked={visibleColumns[String(column.key)]}
                  onCheckedChange={() => toggleColumn(String(column.key))}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabla */}
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              {visibleColumnsList.map((column) => (
                <th 
                  key={String(column.key)} 
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
              {showDefaultActions && (onEdit || onDelete) && (
                <th className="w-[100px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleColumnsList.length + (showDefaultActions && (onEdit || onDelete) ? 1 : 0)} 
                  className="p-4 text-center text-muted-foreground bg-gray-50"
                >
                  {searchTerm ? 'No se encontraron resultados' : 'No hay datos disponibles'}
                </td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr 
                  key={item.id} 
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {visibleColumnsList.map((column) => (
                    <td key={String(column.key)} className="p-4">
                      {renderCellValue(item, column)}
                    </td>
                  ))}
                  {showDefaultActions && (onEdit || onDelete) && (
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                            }}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item);
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium">{filteredData.length > 0 ? startIndex + 1 : 0}</span> a{' '}
          <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> de{' '}
          <span className="font-medium">{filteredData.length}</span> resultados
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DataTable; 