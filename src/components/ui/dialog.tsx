'use client';

import { createContext, useContext, useState, ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { X as XIcon } from 'lucide-react';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Dialog({ children, open: controlledOpen, onOpenChange, className }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOpen ? onOpenChange : setUncontrolledOpen;
  
  return (
    <DialogContext.Provider value={{ open, onOpenChange: setOpen! }}>
      <div className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}>
        {open && (
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen!(false)} />
        )}
        {open && (
          <div className="relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
            {children}
          </div>
        )}
      </div>
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogTrigger must be used within Dialog');
  
  return (
    <button
      className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', 'bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2')}
      onClick={() => context.onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  );
}

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');
  
  return (
    <div className={cn('relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg', className)} {...props}>
      <button
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={() => context.onOpenChange(false)}
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />;
}

interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}