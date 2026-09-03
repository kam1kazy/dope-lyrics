'use client';

import {
  AlignVerticalSpaceAround,
  ArrowDownAZ,
  ArrowUpAZ,
  CircleGauge,
  Monitor,
  Moon,
  RotateCcw,
  Shuffle,
  Sun,
  Type,
  UnfoldVertical,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect, useState } from 'react';

import { CatalogIngest } from '@/features/catalog-ingest';
import {
  hasActiveLyricFilters,
  hasCustomLyricSettings,
  type SortMode,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Label } from '@/shared/ui/shadcn/ui/label';

import { LyricFilterFields } from './lyric-filter-fields';
import { ShelfFilterChips } from './shelf-filter-chips';

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
  { mode: 'shuffle', label: 'Вперемешку', icon: Shuffle },
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
    <div className="grid grid-cols-[1.5rem_7.25rem_minmax(0,1fr)_2.25rem] items-center gap-3 md:grid-cols-[1.75rem_8.5rem_minmax(0,1fr)_2.5rem] md:gap-4">
      <span
        className="text-muted-foreground flex size-6 items-center justify-center overflow-visible md:size-7 [&_svg]:overflow-visible"
        aria-hidden
      >
        {icon}
      </span>
      <Label
        htmlFor={id}
        className="text-muted-foreground whitespace-nowrap text-xs font-normal md:text-sm"
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
          'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted md:h-2',
          'accent-primary',
          '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full md:[&::-webkit-slider-thumb]:size-4',
          '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full md:[&::-moz-range-thumb]:size-4'
        )}
      />
      <span className="text-muted-foreground text-right text-xs tabular-nums md:text-sm">
        {display}
      </span>
    </div>
  );
}

function SettingsTab({ checkIngest }: { checkIngest: boolean }) {
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
    <div className="flex flex-col gap-4 pb-1 md:gap-6">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
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
                aria-label={
                  mode === 'shuffle'
                    ? 'Вперемешку. Повторное нажатие перемешивает заново'
                    : label
                }
                aria-checked={selected}
                title={
                  mode === 'shuffle'
                    ? 'Вперемешку — ещё раз, чтобы перемешать заново'
                    : label
                }
                className={cn(
                  'h-8 w-full rounded-md md:h-10',
                  selected
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
                onClick={() => {
                  setSortMode(mode);
                }}
              >
                <Icon className="size-4 md:size-5" />
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
                  'h-8 w-full rounded-md md:h-10',
                  selected
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
                onClick={() => setTheme(id)}
              >
                <Icon className="size-4 md:size-5" />
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-visible md:gap-5">
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
          display={lineGap.toFixed(1)}
          min={1}
          max={10}
          step={0.05}
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
        className="w-full gap-2 md:h-10"
        disabled={!canReset}
        onClick={resetSettings}
      >
        <RotateCcw className="size-4" />
        Сбросить настройки
      </Button>

      <CatalogIngest enabled={checkIngest} />
    </div>
  );
}

function FiltersTab() {
  const {
    includedShelves,
    excludedShelves,
    setShelfSelection,
    selectedTags,
    selectedEmojis,
    keyword,
    dateFrom,
    dateTo,
    resetFilters,
    mood,
    excludeMood,
    delivery,
    excludeDelivery,
    songRole,
    excludeSongRole,
    readiness,
    excludeReadiness,
    setMood,
    setExcludeMood,
    setDelivery,
    setExcludeDelivery,
    setSongRole,
    setExcludeSongRole,
    setReadiness,
    setExcludeReadiness,
    setKeyword,
    setDateFrom,
    setDateTo,
    toggleTag,
    toggleEmoji,
  } = useLyricView();
  const shelfSelection = {
    included: includedShelves,
    excluded: excludedShelves,
  };
  const canReset = hasActiveLyricFilters({
    includedShelves,
    excludedShelves,
    selectedTags,
    selectedEmojis,
    keyword,
    dateFrom,
    dateTo,
    mood,
    excludeMood,
    delivery,
    excludeDelivery,
    songRole,
    excludeSongRole,
    readiness,
    excludeReadiness,
  });

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-1 md:gap-6">
      <ShelfFilterChips
        selection={shelfSelection}
        onChange={setShelfSelection}
      />

      <LyricFilterFields
        idPrefix="carousel-filter"
        value={{
          selectedTags,
          selectedEmojis,
          keyword,
          dateFrom,
          dateTo,
          mood,
          excludeMood,
          delivery,
          excludeDelivery,
          songRole,
          excludeSongRole,
          readiness,
          excludeReadiness,
        }}
        onChange={(patch) => {
          if (patch.selectedTags) {
            const next = patch.selectedTags;
            const added = next.find((tag) => !selectedTags.includes(tag));
            const removed = selectedTags.find((tag) => !next.includes(tag));
            const tag = added ?? removed;

            if (tag) {
              toggleTag(tag);
            }
          }

          if (patch.selectedEmojis) {
            const next = patch.selectedEmojis;
            const added = next.find((emoji) => !selectedEmojis.includes(emoji));
            const removed = selectedEmojis.find(
              (emoji) => !next.includes(emoji)
            );
            const emoji = added ?? removed;

            if (emoji) {
              toggleEmoji(emoji);
            }
          }

          if (patch.keyword !== undefined) {
            setKeyword(patch.keyword);
          }

          if (patch.dateFrom !== undefined) {
            setDateFrom(patch.dateFrom);
          }

          if (patch.dateTo !== undefined) {
            setDateTo(patch.dateTo);
          }

          if (patch.mood !== undefined) {
            setMood(patch.mood);
          }

          if (patch.excludeMood !== undefined) {
            setExcludeMood(patch.excludeMood);
          }

          if (patch.delivery !== undefined) {
            setDelivery(patch.delivery);
          }

          if (patch.excludeDelivery !== undefined) {
            setExcludeDelivery(patch.excludeDelivery);
          }

          if (patch.songRole !== undefined) {
            setSongRole(patch.songRole);
          }

          if (patch.excludeSongRole !== undefined) {
            setExcludeSongRole(patch.excludeSongRole);
          }

          if (patch.readiness !== undefined) {
            setReadiness(patch.readiness);
          }

          if (patch.excludeReadiness !== undefined) {
            setExcludeReadiness(patch.excludeReadiness);
          }
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 md:h-10"
        disabled={!canReset}
        onClick={resetFilters}
      >
        <RotateCcw className="size-4" />
        Сбросить фильтры
      </Button>
    </div>
  );
}

export function FilterPanel({
  checkIngest = false,
}: {
  checkIngest?: boolean;
}) {
  const [tab, setTab] = useState<PanelTab>('settings');

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 md:gap-4">
      <div
        role="tablist"
        aria-label="Разделы панели"
        data-swipe-ignore
        className="bg-muted grid shrink-0 grid-cols-2 rounded-lg p-1 md:p-1.5"
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
                'h-8 rounded-md text-sm md:h-10 md:text-base',
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
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        <div hidden={tab !== 'settings'}>
          <SettingsTab checkIngest={checkIngest} />
        </div>
        {tab === 'filters' ? <FiltersTab /> : null}
      </div>
    </div>
  );
}
