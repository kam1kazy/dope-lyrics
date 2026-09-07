'use client';

import { cn } from '@/shared/lib/utils/cn';
import { Input } from '@/shared/ui/shadcn/ui/input';

export function DateRangeInputs({
  idPrefix,
  dateFrom,
  dateTo,
  onChange,
  inputClassName,
}: {
  idPrefix: string;
  dateFrom: string;
  dateTo: string;
  onChange: (next: { dateFrom: string; dateTo: string }) => void;
  inputClassName?: string;
}) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="min-w-0 flex-1 overflow-hidden">
        <Input
          id={`${idPrefix}-date-from`}
          type="date"
          value={dateFrom}
          aria-label="Дата с"
          onChange={(event) =>
            onChange({ dateFrom: event.target.value, dateTo })
          }
          className={cn(
            'h-9 w-full min-w-0 max-w-full overflow-hidden px-2',
            inputClassName
          )}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <Input
          id={`${idPrefix}-date-to`}
          type="date"
          value={dateTo}
          aria-label="Дата по"
          onChange={(event) =>
            onChange({ dateFrom, dateTo: event.target.value })
          }
          className={cn(
            'h-9 w-full min-w-0 max-w-full overflow-hidden px-2',
            inputClassName
          )}
        />
      </div>
    </div>
  );
}
