'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils/cn';

interface CatalogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  onPointerDownOutside?: () => void;
}

export function CatalogPanel({
  open,
  onOpenChange,
  children,
  onPointerDownOutside,
}: CatalogPanelProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left fixed inset-y-0 left-0 z-50 flex w-full max-w-[min(100%,640px)] outline-none duration-300'
          )}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onPointerDownOutside={() => {
            onPointerDownOutside?.();
          }}
          onInteractOutside={() => {
            onPointerDownOutside?.();
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Каталог
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Полки каталога: избранное, демки и другие разделы
          </DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
