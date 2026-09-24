'use client';

import { createContext, useContext, useState, useRef, useEffect, ReactNode, HTMLAttributes, ForwardedRef } from 'react';
import { cn } from '@/lib/utils';

interface PopoverContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: ForwardedRef<HTMLButtonElement>;
  contentRef: ForwardedRef<HTMLDivElement>;
}

const PopoverContext = createContext<PopoverContextType | null>(null);

interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Popover({ children, open: controlledOpen, onOpenChange, className }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOpen ? onOpenChange : setUncontrolledOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen!(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, onOpenChange: setOpen!, triggerRef, contentRef }}>
      <div className={cn('relative inline-block', className)}>{children}</div>
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PopoverTrigger({ children, className, ...props }: PopoverTriggerProps) {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within Popover');
  
  return (
    <button
      ref={context.triggerRef}
      className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', 'bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2', className)}
      onClick={() => context.onOpenChange(!context.open)}
      {...props}
    >
      {children}
    </button>
  );
}

interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function PopoverContent({ className, align = 'start', sideOffset = 5, children, ...props }: PopoverContentProps) {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverContent must be used within Popover');
  
  if (!context.open) return null;
  
  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={context.contentRef}
      className={cn(
        'absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md top-full mt-2',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}