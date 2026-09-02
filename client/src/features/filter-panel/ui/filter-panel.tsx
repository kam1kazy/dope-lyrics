'use client';

import { useQuery } from '@apollo/client/react';
import {
  AlignVerticalSpaceAround,
  ArrowDownAZ,
  ArrowUpAZ,
  BookMarked,
  CalendarRange,
  CircleGauge,
  Monitor,
  Moon,
  RotateCcw,
  Shuffle,
  Smile,
  Sun,
  Type,
  UnfoldVertical,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect, useState } from 'react';

import { LYRIC_EMOJIS, LYRIC_TAGS } from '@/entities/lyric';
import {
  hasActiveLyricFilters,
  hasCustomLyricSettings,
  type SortMode,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Label } from '@/shared/ui/shadcn/ui/label';

type PanelTab = 'settings' | 'filters';

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'settings', label: 'Настройки' },
  { id: 'filters', label: 'Фильтры' },
];

const THEME_OPTIONS: {
  id: 'system' | 'light' | 'dark';
  label: string;
  icon: typeof Sun;
}[] = [
  { id: 'system', label: 'Системная', icon: Monitor },
  { id: 'light', label: 'Светлая', icon: Sun },
  { id: 'dark', label: 'Тёмная', icon: Moon },
];

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
    <div className="grid grid-cols-[1.5rem_7.25rem_minmax(0,1fr)_2.25rem] items-center gap-3">
      <span
        className="text-muted-foreground flex size-6 items-center justify-center overflow-visible [&_svg]:overflow-visible"
        aria-hidden
      >
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

function SettingsTab() {
  const {
    sortMode,
    setSortMode,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    lineGap,
    setLineGap,
    carouselSpeed,
    setCarouselSpeed,
    resetSettings,
  } = useLyricView();
  const { theme, setTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  const canReset = hasCustomLyricSettings({
    sortMode,
    fontSize,
    lineHeight,
    lineGap,
    carouselSpeed,
  });

  useEffect(() => {
    setThemeReady(true);
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-1">
      <div className="grid grid-cols-2 gap-2">
        <div
          role="radiogroup"
          aria-label="Порядок показа"
          className="bg-muted grid grid-cols-3 rounded-lg p-1"
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

        <div
          role="radiogroup"
          aria-label="Тема"
          className="bg-muted grid grid-cols-3 rounded-lg p-1"
        >
          {THEME_OPTIONS.map(({ id, label, icon: Icon }) => {
            const selected = themeReady && theme === id;

            return (
              <Button
                key={id}
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
                onClick={() => setTheme(id)}
              >
                <Icon className="size-4" />
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-visible">
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
          id="lyric-line-gap"
          icon={<UnfoldVertical className="size-4" />}
          label="Отступ строк"
          value={lineGap}
          display={String(lineGap)}
          min={1}
          max={10}
          step={1}
          onChange={setLineGap}
        />
        <SliderRow
          id="lyric-carousel-speed"
          icon={<CircleGauge className="size-4 overflow-visible" />}
          label="Скорость"
          value={carouselSpeed}
          display={String(carouselSpeed)}
          min={1}
          max={10}
          step={1}
          onChange={setCarouselSpeed}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={!canReset}
        onClick={resetSettings}
      >
        <RotateCcw className="size-4" />
        Сбросить настройки
      </Button>
    </div>
  );
}

function FiltersTab() {
  const {
    selectedTags,
    toggleTag,
    selectedEmojis,
    toggleEmoji,
    keyword,
    setKeyword,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    referencesOnly,
    setReferencesOnly,
    resetFilters,
  } = useLyricView();
  const canReset = hasActiveLyricFilters({
    selectedTags,
    selectedEmojis,
    keyword,
    dateFrom,
    dateTo,
    referencesOnly,
  });

  const { data: tagsData, loading: tagsLoading } = useQuery<{
    lyricTags: string[];
  }>(LYRIC_TAGS);
  const { data: emojisData, loading: emojisLoading } = useQuery<{
    lyricEmojis: string[];
  }>(LYRIC_EMOJIS);

  const tags = tagsData?.lyricTags ?? [];
  const emojis = emojisData?.lyricEmojis ?? [];

  return (
    <div className="flex flex-col gap-4 pb-1">
      <Button
        type="button"
        variant={referencesOnly ? 'default' : 'outline'}
        className="w-full justify-start gap-2"
        aria-pressed={referencesOnly}
        onClick={() => setReferencesOnly(!referencesOnly)}
      >
        <BookMarked className="size-4" />
        Полка эталонов
      </Button>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
          <CalendarRange className="size-3.5" aria-hidden />
          Период
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            id="filter-date-from"
            type="date"
            value={dateFrom}
            aria-label="Дата с"
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9"
          />
          <Input
            id="filter-date-to"
            type="date"
            value={dateTo}
            aria-label="Дата по"
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs font-normal">
          Теги
        </Label>
        {tagsLoading ? (
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
        <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
          <Smile className="size-3.5" aria-hidden />
          Реакции
        </Label>
        {emojisLoading ? (
          <p className="text-muted-foreground text-xs">Загрузка реакций…</p>
        ) : emojis.length === 0 ? (
          <p className="text-muted-foreground text-xs">Реакций пока нет</p>
        ) : (
          <div
            data-swipe-ignore
            className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto"
          >
            {emojis.map((emoji) => {
              const selected = selectedEmojis.includes(emoji);

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleEmoji(emoji)}
                  className="cursor-pointer"
                  aria-label={`Реакция ${emoji}`}
                  aria-pressed={selected}
                >
                  <Badge
                    variant={selected ? 'default' : 'secondary'}
                    className="inline-flex min-h-8 min-w-8 items-center justify-center px-2.5 py-1.5 text-base leading-none"
                  >
                    {emoji}
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

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={!canReset}
        onClick={resetFilters}
      >
        <RotateCcw className="size-4" />
        Сбросить фильтры
      </Button>
    </div>
  );
}

export function FilterPanel() {
  const [tab, setTab] = useState<PanelTab>('settings');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        role="tablist"
        aria-label="Разделы панели"
        data-swipe-ignore
        className="bg-muted grid shrink-0 grid-cols-2 rounded-lg p-1"
      >
        {TABS.map(({ id, label }) => {
          const selected = tab === id;

          return (
            <Button
              key={id}
              type="button"
              role="tab"
              id={`panel-tab-${id}`}
              aria-selected={selected}
              aria-controls={`panel-tabpanel-${id}`}
              variant="ghost"
              className={cn(
                'h-8 rounded-md text-sm',
                selected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
              onClick={() => setTab(id)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      <div
        id={`panel-tabpanel-${tab}`}
        role="tabpanel"
        aria-labelledby={`panel-tab-${tab}`}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {tab === 'settings' ? <SettingsTab /> : <FiltersTab />}
      </div>
    </div>
  );
}
