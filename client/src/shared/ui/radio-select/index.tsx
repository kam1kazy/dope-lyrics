'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/ui/popover';

export const RadioSelect = ({ settings }: { settings: string[] }) => {
  const [selectedOption, setOptions] = useState(settings[0]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOptions(settings[0]);
  }, [settings]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="max-w-max min-w-[35px] flex-1 px-2 text-sm"
        >
          {selectedOption}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="flex flex-col gap-2">
          {settings.map((option) => (
            <Button
              key={option}
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setOptions(option);
                setOpen(false);
              }}
            >
              <Badge variant="outline">{option}</Badge>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
