'use client';

import { useQuery } from '@apollo/client/react';
import {
  AlignVerticalSpaceAround,
  ArrowDownAZ,
  ArrowUpAZ,
  Gauge,
  Shuffle,
  Type,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { ALL_LYRICS, collectTags, type ILyric } from '@/entities/lyric';
import {
  type SortMode,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Label } from '@/shared/ui/shadcn/ui/label';
import { Separator } from '@/shared/ui/shadcn/ui/separator';

const SORT_OPTIONS: {
  mode: SortMode;
  label: string;
  icon: typeof Shuffle;
}[] = [
  { mode: 'shuffle', label: 'Случайный порядок', icon: Shuffle },
  { mode: 'forward', label: 'По порядку', icon: ArrowDownAZ },
  { mode: 'reverse', label: 'В обратном порядке', icon: ArrowUpAZ },
];

function SliderRow({
  id,
  icon,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_7.25rem_minmax(0,1fr)_2.25rem] items-center gap-3">
      <span className="text-muted-foreground flex justify-center" aria-hidden>
        {icon}
      </span>
      <Label
        htmlFor={id}
        className="text-muted-foreground whitespace-nowrap text-xs font-normal"
      >
        {label}
      </Label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted',
          'accent-primary',
          '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full'
        )}
      />
      <span className="text-muted-foreground text-right text-xs tabular-nums">
        {display}
      </span>
    </div>
  );
}

export function FilterPanel() {
  const {
    sortMode,
    setSortMode,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    carouselSpeed,
    setCarouselSpeed,
    selectedTags,
    toggleTag,
    keyword,
    setKeyword,
  } = useLyricView();

  const { data, loading } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS);
  const tags = collectTags(data?.lyrics ?? []);

  return (
    <div className="flex flex-col gap-4 pb-1">
      <div
        role="radiogroup"
        aria-label="Порядок показа"
        className="bg-muted mx-auto grid w-full max-w-[220px] grid-cols-3 rounded-lg p-1"
      >
        {SORT_OPTIONS.map(({ mode, label, icon: Icon }) => {
          const selected = sortMode === mode;

          return (
            <Button
              key={mode}
              type="button"
              role="radio"
              size="icon-sm"
              variant="ghost"
              aria-label={label}
              aria-checked={selected}
              title={label}
              className={cn(
                'h-8 w-full rounded-md',
                selected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
              onClick={() => setSortMode(mode)}
            >
              <Icon className="size-4" />
            </Button>
          );
        })}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <SliderRow
          id="lyric-font-size"
          icon={<Type className="size-4" />}
          label="Размер текста"
          value={fontSize}
          display={String(fontSize)}
          min={16}
          max={36}
          step={1}
          onChange={setFontSize}
        />
        <SliderRow
          id="lyric-line-height"
          icon={<AlignVerticalSpaceAround className="size-4" />}
          label="Межстрочие"
          value={lineHeight}
          display={lineHeight.toFixed(2)}
          min={1.1}
          max={1.9}
          step={0.05}
          onChange={setLineHeight}
        />
        <SliderRow
          id="lyric-carousel-speed"
          icon={<Gauge className="size-4" />}
          label="Скорость"
          value={carouselSpeed}
          display={String(carouselSpeed)}
          min={1}
          max={10}
          step={1}
          onChange={setCarouselSpeed}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs font-normal">
          Теги
        </Label>
        {loading ? (
          <p className="text-muted-foreground text-xs">Загрузка тегов…</p>
        ) : tags.length === 0 ? (
          <p className="text-muted-foreground text-xs">Тегов пока нет</p>
        ) : (
          <div
            data-swipe-ignore
            className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto"
          >
            {tags.map((tag) => {
              const selected = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="cursor-pointer"
                >
                  <Badge
                    variant={selected ? 'default' : 'secondary'}
                    className="px-2 py-0.5 text-xs"
                  >
                    #{tag}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="filter-keywords"
          className="text-muted-foreground text-xs font-normal"
        >
          Ключевые слова
        </Label>
        <Input
          id="filter-keywords"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Часть слова в тексте"
          className="h-9"
        />
      </div>
    </div>
  );
}
