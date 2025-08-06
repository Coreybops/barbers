import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorMessageProps {
  message: string;
  className?: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, className, onDismiss }: ErrorMessageProps) {
  return (
    <div className={cn(
      'flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md',
      className
    )}>
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      <span className="text-sm text-red-800 flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;