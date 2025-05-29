import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  className?: string;
  onClose?: () => void;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  className,
  onClose,
}) => {
  const Icon = icons[type];
  const style = styles[type];

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4 shadow-sm transition-all duration-300 ease-in-out',
        style,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto flex-shrink-0 rounded-full p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <XCircle className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        )}
      </div>
    </div>
  );
}; 