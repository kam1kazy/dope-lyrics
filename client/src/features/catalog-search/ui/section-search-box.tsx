'use client';

import { useQuery } from '@apollo/client/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  ALL_LYRICS,
  catalogLyricsVariables,
  catalogQueryVariablesForSection,
  type ILyric,
  type ILyricCollage,
  LYRIC_COLLAGES,
} from '@/entities/lyric';
import { collageCarouselText } from '@/features/catalog-assemble/lib/generator-text';
import {
  type ITrackTextItem,
  TRACK_TEXTS,
  trackTextTitle,
} from '@/features/track-texts';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { cn } from '@/shared/lib/utils/cn';
import { useDebouncedValue } from '@/shared/lib/utils/use-debounced-value';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

const SUGGESTION_LIMIT = 8;
const QUERY_DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 3;

export type CatalogSearchSection = 'list' | 'demos' | 'generator';

export type SectionSearchHit =
  | { kind: 'lyric'; key: string; label: string; lyric: ILyric }
  | { kind: 'favorite'; key: string; label: string; collage: ILyricCollage }
  | { kind: 'text'; key: string; label: string; id: number };

function matchingPreview(text: string, query: string): string {
  const needle = query.trim().toLocaleLowerCase('ru-RU');
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const line =
    lines.find((item) => item.toLocaleLowerCase('ru-RU').includes(needle)) ??
    lines[0] ??
    '';

  if (!line) {
    return 'Без текста';
  }

  const flat = line.replace(/\s+/g, ' ');
  if (flat.length <= 90) {
    return flat;
  }

  const index = flat.toLocaleLowerCase('ru-RU').indexOf(needle);
  if (index < 0) {
    return `${flat.slice(0, 90)}…`;
  }

  const start = Math.max(0, index - 28);
  const end = Math.min(flat.length, index + needle.length + 48);
  const slice = flat.slice(start, end);

  return `${start > 0 ? '…' : ''}${slice}${end < flat.length ? '…' : ''}`;
}

function includesQuery(text: string, query: string): boolean {
  return text
    .toLocaleLowerCase('ru-RU')
    .includes(query.toLocaleLowerCase('ru-RU'));
}

export function SectionSearchBox({
  section,
  query,
  filters,
  includeSavedTexts,
  onQueryChange,
  onClose,
  onPick,
}: {
  section: CatalogSearchSection;
  query: string;
  filters: CatalogSectionFilters;
  includeSavedTexts: boolean;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onPick: (hit: SectionSearchHit) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { excludedShelves } = useLyricView();
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, QUERY_DEBOUNCE_MS);
  const suggest = trimmed.length >= MIN_QUERY_LENGTH;
  const lyricSearch =
    suggest &&
    (section === 'list' || section === 'demos') &&
    debouncedQuery.length >= MIN_QUERY_LENGTH;
  const generatorSearch = section === 'generator';
  const [activeIndex, setActiveIndex] = useState(0);

  const lyricVariables = useMemo(() => {
    if (section !== 'list' && section !== 'demos') {
      return catalogLyricsVariables({ limit: SUGGESTION_LIMIT, offset: 0 });
    }

    return {
      ...catalogQueryVariablesForSection(
        section,
        filters,
        !excludedShelves.includes('censored')
      ),
      keyword: debouncedQuery,
      limit: SUGGESTION_LIMIT,
      offset: 0,
      shuffleSeed: null,
    };
  }, [debouncedQuery, excludedShelves, filters, section]);

  const lyricQuery = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS, {
    variables: lyricVariables,
    skip: !lyricSearch,
  });
  const collageQuery = useQuery<{ lyricCollages: ILyricCollage[] }>(
    LYRIC_COLLAGES,
    {
      skip: !generatorSearch,
      fetchPolicy: 'cache-and-network',
    }
  );
  const textQuery = useQuery<{ trackTexts: ITrackTextItem[] }>(TRACK_TEXTS, {
    skip: !generatorSearch || !includeSavedTexts,
    fetchPolicy: 'cache-and-network',
  });

  const hits = useMemo(() => {
    if (!suggest) {
      return [];
    }

    if (section === 'list' || section === 'demos') {
      if (debouncedQuery.length < MIN_QUERY_LENGTH) {
        return [];
      }

      return (lyricQuery.data?.lyrics ?? []).map((lyric) => ({
        kind: 'lyric' as const,
        key: `lyric-${lyric.id}`,
        label: matchingPreview(lyric.message?.text ?? '', debouncedQuery),
        lyric,
      }));
    }

    const needle = trimmed;
    const favorites = (collageQuery.data?.lyricCollages ?? [])
      .map((collage) => {
        const text = collageCarouselText(collage.slots, false);
        return { collage, text };
      })
      .filter((item) => includesQuery(item.text, needle))
      .slice(0, SUGGESTION_LIMIT)
      .map((item) => ({
        kind: 'favorite' as const,
        key: `favorite-${item.collage.id}`,
        label: matchingPreview(item.text, needle) || 'Пустая склейка',
        collage: item.collage,
      }));
    const texts = includeSavedTexts
      ? (textQuery.data?.trackTexts ?? [])
          .filter(
            (item) =>
              !item.scratch &&
              includesQuery(`${item.theme ?? ''}\n${item.text}`, needle)
          )
          .slice(0, SUGGESTION_LIMIT)
          .map((item) => ({
            kind: 'text' as const,
            key: `text-${item.id}`,
            label:
              matchingPreview(
                item.theme ? `${item.theme}\n${item.text}` : item.text,
                needle
              ) || trackTextTitle(item),
            id: item.id,
          }))
      : [];

    return [...favorites, ...texts];
  }, [
    collageQuery.data?.lyricCollages,
    debouncedQuery,
    includeSavedTexts,
    lyricQuery.data?.lyrics,
    section,
    suggest,
    textQuery.data?.trackTexts,
    trimmed,
  ]);

  const hitsKey = hits.map((hit) => hit.key).join('|');

  useEffect(() => {
    setActiveIndex(0);
  }, [hitsKey]);

  useEffect(() => {
    const node = document.getElementById(`${listId}-option-${activeIndex}`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listId]);

  const lyricPending =
    suggest &&
    (section === 'list' || section === 'demos') &&
    debouncedQuery !== trimmed;
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const node = event.target;
      if (!(node instanceof Node) || rootRef.current?.contains(node)) {
        return;
      }

      onClose();
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);

  const lyricLoading =
    lyricSearch && lyricQuery.loading && lyricQuery.data === undefined;
  const generatorLoading =
    generatorSearch &&
    suggest &&
    ((collageQuery.loading && collageQuery.data === undefined) ||
      (includeSavedTexts && textQuery.loading && textQuery.data === undefined));
  const loading = lyricPending || lyricLoading || generatorLoading;
  const failed =
    (lyricSearch && Boolean(lyricQuery.error) && !lyricQuery.data) ||
    (generatorSearch &&
      suggest &&
      Boolean(collageQuery.error) &&
      !collageQuery.data &&
      (!includeSavedTexts || (Boolean(textQuery.error) && !textQuery.data)));

  const pick = (hit: SectionSearchHit) => {
    onPick(hit);
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <Input
        autoFocus
        value={query}
        placeholder="Поиск"
        aria-label="Поиск"
        aria-autocomplete="list"
        aria-controls={suggest ? listId : undefined}
        aria-expanded={suggest}
        aria-activedescendant={
          suggest && hits.length > 0
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
        data-swipe-ignore
        className="h-8 px-2 text-sm"
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
          }

          if (!suggest || hits.length === 0) {
            return;
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % hits.length);
            return;
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + hits.length) % hits.length);
            return;
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            const hit = hits[activeIndex] ?? hits[0];
            if (hit) {
              pick(hit);
            }
          }
        }}
      />

      {suggest ? (
        <div
          id={listId}
          role="listbox"
          data-swipe-ignore
          className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-md border shadow-md"
        >
          {loading ? (
            <div className="flex justify-center px-3 py-3">
              <Spinner className="size-4" />
            </div>
          ) : failed ? (
            <p className="text-muted-foreground px-3 py-2 text-sm">
              Не удалось найти
            </p>
          ) : hits.length === 0 ? (
            <p className="text-muted-foreground px-3 py-2 text-sm">
              Ничего не нашлось
            </p>
          ) : (
            hits.map((hit, index) => {
              const previous = hits[index - 1];
              const showGroup =
                section === 'generator' &&
                (index === 0 || previous?.kind !== hit.kind);

              return (
                <div key={hit.key}>
                  {showGroup ? (
                    <p className="text-muted-foreground px-3 pt-2 pb-1 text-xs">
                      {hit.kind === 'favorite'
                        ? 'Избранное'
                        : 'Сохранённые тексты'}
                    </p>
                  ) : null}
                  <button
                    id={`${listId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      'hover:bg-muted flex w-full px-3 py-2 text-left text-sm',
                      index === activeIndex && 'bg-muted'
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    onClick={() => {
                      pick(hit);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{hit.label}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
