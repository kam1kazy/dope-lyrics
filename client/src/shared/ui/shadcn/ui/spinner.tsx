import { Loader2Icon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/utils/cn';

function Spinner({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Загрузка"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
