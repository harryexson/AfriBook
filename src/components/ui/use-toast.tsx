'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './alert';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className="flex items-center gap-4 w-full max-w-sm">
            <Alert variant={toast.variant}>
              <div className="flex-1">
                {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
                {toast.description && <AlertDescription>{toast.description}</AlertDescription>}
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="ml-4 flex-shrink-0 p-1 rounded hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function toast(options: { title: string; description?: string; variant?: 'default' | 'destructive' }) {
  // This is a convenience function that works if ToastProvider is in the tree
  // For now, we'll just log to console
  console.log('Toast:', options);
}