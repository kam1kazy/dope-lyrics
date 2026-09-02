'use client';

import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/ui/dialog';

interface DataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataModal({ open, onOpenChange }: DataModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>Данные</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Содержимое появится позже.
        </p>
        <DialogFooter>
          <Button type="button">Сохранить</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
