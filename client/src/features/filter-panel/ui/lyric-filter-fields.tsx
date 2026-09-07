'use client';

import { useQuery } from '@apollo/client/react';
import { CalendarRange, Smile } from 'lucide-react';

import {
  FacetChipGroup,
  LYRIC_DELIVERIES,
  LYRIC_DELIVERY_HINTS,
  LYRIC_DELIVERY_LABELS,
  LYRIC_EMOJIS,
  LYRIC_ENERGIES,
  LYRIC_ENERGY_HINTS,
  LYRIC_ENERGY_LABELS,
  LYRIC_MOOD_HINTS,
  LYRIC_MOOD_LABELS,
  LYRIC_MOODS,
  LYRIC_READINESS,
  LYRIC_READINESS_HINTS,
  LYRIC_READINESS_LABELS,
  LYRIC_SONG_ROLE_HINTS,
  LYRIC_SONG_ROLE_LABELS,
  LYRIC_SONG_ROLES,
  LYRIC_TAGS,
} from '@/entities/lyric';
import type { DateSortState } from '@/shared/lib/catalog-section-filters';
import type {
  LyricDelivery,
  LyricEnergy,
  LyricMood,
  LyricReadiness,
  LyricSongRole,
} from '@/shared/lib/lyric-facets';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Label } from '@/shared/ui/shadcn/ui/label';
import { Skeleton } from '@/shared/ui/shadcn/ui/skeleton';

import { DateRangeInputs } from './date-range-inputs';
import { DateSortButtons } from './date-sort-buttons';

export type LyricFilterFieldsValue = {
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  mood: LyricMood[];
  excludeMood: LyricMood[];
  delivery: LyricDelivery[];
  excludeDelivery: LyricDelivery[];
  songRole: LyricSongRole[];
  excludeSongRole: LyricSongRole[];
  readiness: LyricReadiness[];
  excludeReadiness: LyricReadiness[];
  energy: LyricEnergy[];
  excludeEnergy: LyricEnergy[];
};

const TAG_SKELETON_WIDTHS = [
  '4.5rem',
  '3.25rem',
  '5.5rem',
  '3.75rem',
  '4rem',
  '6rem',
  '3.5rem',
  '5rem',
] as const;

function ChipSkeletons({
  label,
  kind,
}: {
  label: string;
  kind: 'tags' | 'emojis';
}) {
  return (
    <div
      data-swipe-ignore
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className="flex max-h-28 min-w-0 flex-wrap content-start gap-1.5 overflow-x-hidden overflow-y-auto md:max-h-36 md:gap-2"
    >
      {kind === 'tags'
        ? TAG_SKELETON_WIDTHS.map((width) => (
            <Skeleton
              key={width}
              className="h-5 rounded-md"
              style={{ width }}
            />
          ))
        : Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="size-8 rounded-md" />
          ))}
    </div>
  );
}

function toggleInList(current: string[], item: string) {
  return current.includes(item)
    ? current.filter((entry) => entry !== item)
    : [...current, item];
}

export function LyricFilterFields({
  value,
  onChange,
  idPrefix,
  dateSort,
  onDateSortChange,
}: {
  value: LyricFilterFieldsValue;
  onChange: (patch: Partial<LyricFilterFieldsValue>) => void;
  idPrefix: string;
  dateSort?: DateSortState;
  onDateSortChange?: (next: DateSortState) => void;
}) {
  const { data: tagsData, loading: tagsLoading } = useQuery<{
    lyricTags: string[];
  }>(LYRIC_TAGS);
  const { data: emojisData, loading: emojisLoading } = useQuery<{
    lyricEmojis: string[];
  }>(LYRIC_EMOJIS);

  const tags = tagsData?.lyricTags ?? [];
  const emojis = emojisData?.lyricEmojis ?? [];

  return (
    <>
      <div className="flex min-w-0 flex-col gap-2 md:gap-3">
        <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal md:text-sm">
          <CalendarRange className="size-3.5" aria-hidden />
          Период
        </Label>
        <DateRangeInputs
          idPrefix={idPrefix}
          dateFrom={value.dateFrom}
          dateTo={value.dateTo}
          onChange={onChange}
          inputClassName="md:h-10 md:text-sm"
        />
        {dateSort && onDateSortChange ? (
          <DateSortButtons value={dateSort} onChange={onDateSortChange} />
        ) : null}
      </div>

      <div className="flex flex-col gap-2 md:gap-3">
        <Label className="text-muted-foreground text-xs font-normal md:text-sm">
          Теги
        </Label>
        {tagsLoading ? (
          <ChipSkeletons kind="tags" label="Загрузка тегов" />
        ) : tags.length === 0 ? (
          <p className="text-muted-foreground text-xs md:text-sm">
            Тегов пока нет
          </p>
        ) : (
          <div
            data-swipe-ignore
            className="flex max-h-28 min-w-0 flex-wrap content-start gap-1.5 overflow-x-hidden overflow-y-auto md:max-h-36 md:gap-2"
          >
            {tags.map((tag) => {
              const selected = value.selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    onChange({
                      selectedTags: toggleInList(value.selectedTags, tag),
                    })
                  }
                  className="max-w-full cursor-pointer"
                >
                  <Badge
                    variant={selected ? 'default' : 'secondary'}
                    className="max-w-full px-2 py-0.5 text-xs break-all whitespace-normal md:px-2.5 md:py-1 md:text-sm"
                  >
                    #{tag}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 md:gap-3">
        <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal md:text-sm">
          <Smile className="size-3.5" aria-hidden />
          Реакции
        </Label>
        {emojisLoading ? (
          <ChipSkeletons kind="emojis" label="Загрузка реакций" />
        ) : emojis.length === 0 ? (
          <p className="text-muted-foreground text-xs md:text-sm">
            Реакций пока нет
          </p>
        ) : (
          <div
            data-swipe-ignore
            className="flex max-h-28 min-w-0 flex-wrap content-start gap-1.5 overflow-x-hidden overflow-y-auto md:max-h-36 md:gap-2"
          >
            {emojis.map((emoji) => {
              const selected = value.selectedEmojis.includes(emoji);

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    onChange({
                      selectedEmojis: toggleInList(value.selectedEmojis, emoji),
                    })
                  }
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

      <FacetChipGroup
        label="Настроение"
        options={LYRIC_MOODS}
        labels={LYRIC_MOOD_LABELS}
        hints={LYRIC_MOOD_HINTS}
        value={value.mood}
        excluded={value.excludeMood}
        multiple
        allowExclude
        onChange={(mood) => onChange({ mood })}
        onExcludedChange={(excludeMood) => onChange({ excludeMood })}
        onFilterChange={(next) =>
          onChange({ mood: next.included, excludeMood: next.excluded })
        }
      />
      <FacetChipGroup
        label="Подача"
        options={LYRIC_DELIVERIES}
        labels={LYRIC_DELIVERY_LABELS}
        hints={LYRIC_DELIVERY_HINTS}
        value={value.delivery}
        excluded={value.excludeDelivery}
        multiple
        allowExclude
        onChange={(delivery) => onChange({ delivery })}
        onExcludedChange={(excludeDelivery) => onChange({ excludeDelivery })}
        onFilterChange={(next) =>
          onChange({
            delivery: next.included,
            excludeDelivery: next.excluded,
          })
        }
      />
      <FacetChipGroup
        label="Роль в песне"
        options={LYRIC_SONG_ROLES}
        labels={LYRIC_SONG_ROLE_LABELS}
        hints={LYRIC_SONG_ROLE_HINTS}
        value={value.songRole}
        excluded={value.excludeSongRole}
        multiple
        allowExclude
        onChange={(songRole) => onChange({ songRole })}
        onExcludedChange={(excludeSongRole) => onChange({ excludeSongRole })}
        onFilterChange={(next) =>
          onChange({
            songRole: next.included,
            excludeSongRole: next.excluded,
          })
        }
      />
      <FacetChipGroup
        label="Энергия"
        options={LYRIC_ENERGIES}
        labels={LYRIC_ENERGY_LABELS}
        hints={LYRIC_ENERGY_HINTS}
        value={value.energy}
        excluded={value.excludeEnergy}
        multiple
        allowExclude
        onChange={(energy) => onChange({ energy })}
        onExcludedChange={(excludeEnergy) => onChange({ excludeEnergy })}
        onFilterChange={(next) =>
          onChange({
            energy: next.included,
            excludeEnergy: next.excluded,
          })
        }
      />
      <FacetChipGroup
        label="Готовность"
        options={LYRIC_READINESS}
        labels={LYRIC_READINESS_LABELS}
        hints={LYRIC_READINESS_HINTS}
        value={value.readiness}
        excluded={value.excludeReadiness}
        multiple
        allowExclude
        onChange={(readiness) => onChange({ readiness })}
        onExcludedChange={(excludeReadiness) => onChange({ excludeReadiness })}
        onFilterChange={(next) =>
          onChange({
            readiness: next.included,
            excludeReadiness: next.excluded,
          })
        }
      />

      <div className="flex flex-col gap-2 md:gap-3">
        <Label
          htmlFor={`${idPrefix}-keywords`}
          className="text-muted-foreground text-xs font-normal md:text-sm"
        >
          Ключевые слова
        </Label>
        <Input
          id={`${idPrefix}-keywords`}
          value={value.keyword}
          onChange={(event) => onChange({ keyword: event.target.value })}
          placeholder="Часть слова в тексте"
          className="h-9 md:h-10 md:text-sm"
        />
      </div>
    </>
  );
}
