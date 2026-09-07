'use client';

import { useMutation } from '@apollo/client/react';
import {
  Ban,
  Check,
  CheckCheck,
  EyeOff,
  ListPlus,
  ListX,
  MoreHorizontal,
  Play,
  Scissors,
  Sparkles,
  Split,
  Star,
  X,
} from 'lucide-react';
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import {
  FacetChipGroup,
  type ILyric,
  LYRIC_COLLAGES,
  LYRIC_DELIVERIES,
  LYRIC_DELIVERY_HINTS,
  LYRIC_DELIVERY_LABELS,
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
  LYRIC_SOURCE_LABELS,
  type LyricDelivery,
  type LyricEnergy,
  type LyricMood,
  type LyricReadiness,
  type LyricRoleProfile,
  type LyricSongRole,
  type LyricsQueryVariables,
  patchRoleProfile,
  SLICE_LYRIC,
  SPLIT_LYRIC,
  UPDATE_LYRIC_FLAGS,
  UPDATE_LYRIC_PROFILE,
  UPDATE_LYRIC_TEXT,
  updateLyricsCacheAfterFlagsChange,
  updateLyricsCacheAfterSlice,
  updateLyricsCacheAfterSplit,
  updateLyricsCacheAfterTextChange,
  upsertRoleProfile,
} from '@/entities/lyric';
import { useSaveCarouselSnapshot } from '@/features/carousel-history';
import {
  canSplitLyricText,
  defaultAfterLine,
  defaultUntilLine,
  isValidAfterLine,
  isValidLineRange,
  lyricHalves,
  lyricRangeText,
  previewLyricHalf,
  type SliceChunk,
  splitLyricLines,
  untakenRangesInZone,
} from '@/features/message-desk/lib/lyric-text-lines';
import { SliceChunkList } from '@/features/message-desk/ui/slice-chunk-list';
import { SplitTextView } from '@/features/message-desk/ui/split-text-view';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/shadcn/ui/tooltip';

interface MessageDeskDialogProps {
  lyric: ILyric | null;
  open: boolean;
  queryVariables: LyricsQueryVariables;
  onOpenChange: (open: boolean) => void;
  onHidden?: () => void;
  onLyricChange?: (lyric: ILyric) => void;
  showQueueActions?: boolean;
}

type DeskTab = 'text' | 'profile' | 'chunks';
type TextMode = 'view' | 'split' | 'edit';
type DiscardPrompt = 'edit' | 'desk' | null;

function usesChunksTab(readiness: LyricReadiness | null) {
  return readiness === 'BLOCK' || readiness === 'TEXT' || readiness === 'READY';
}

type ProfileFields = Pick<
  ILyric,
  'mood' | 'delivery' | 'roleProfiles' | 'readiness' | 'energy'
>;

type FlagFields = Pick<
  ILyric,
  | 'isHidden'
  | 'isFavorite'
  | 'isReference'
  | 'isCensored'
  | 'isDonor'
  | 'isUsed'
>;

const PROFILE_SAVE_DEBOUNCE_MS = 280;
const SPLIT_HOLD_MS = 500;
const SPLIT_HOLD_MOVE_PX = 10;

function lyricTypename(id: number, lyricId: number | undefined) {
  return {
    __typename: 'Lyric' as const,
    id,
    lyric_id: lyricId ?? id,
  };
}

function QueueActionButton({
  hint,
  disabled,
  onClick,
  className,
  children,
}: {
  hint: string;
  disabled: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          className={cn('h-10 gap-2 px-2', className)}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{hint}</TooltipContent>
    </Tooltip>
  );
}

export function MessageDeskDialog({
  lyric,
  open,
  queryVariables,
  onOpenChange,
  onHidden,
  onLyricChange,
  showQueueActions = false,
}: MessageDeskDialogProps) {
  const { suppressToggle, setPaused } = usePlayback();
  const { addToQueue, removeFromQueue, playNow, clearQueue, queue } =
    useCarouselSession();
  const { saveSnapshot } = useSaveCarouselSnapshot();
  const inQueue = lyric ? queue.some((item) => item.id === lyric.id) : false;
  const [tab, setTab] = useState<DeskTab>('text');
  const [textMode, setTextMode] = useState<TextMode>('view');
  const [afterLine, setAfterLine] = useState(0);
  const [untilLine, setUntilLine] = useState<number | null>(null);
  const [sliceChunks, setSliceChunks] = useState<SliceChunk[]>([]);
  const [draftText, setDraftText] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [splitPick, setSplitPick] = useState<{
    top: string;
    bottom: string;
  } | null>(null);
  const [slicePrompt, setSlicePrompt] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<DiscardPrompt>(null);
  const lastTextTapRef = useRef(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdOriginRef = useRef<{ x: number; y: number } | null>(null);
  const holdConsumedRef = useRef(false);
  const [deskTitle, setDeskTitle] = useState('Сообщение');
  const [activeSongRole, setActiveSongRole] = useState<LyricSongRole | null>(
    null
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [profileOverride, setProfileOverride] = useState<ProfileFields | null>(
    null
  );
  const [flagsOverride, setFlagsOverride] = useState<FlagFields | null>(null);
  const pendingProfileRef = useRef<{
    id: number;
    lyricId: number;
    fields: ProfileFields;
  } | null>(null);
  const profileTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setTab('text');
      setTextMode('view');
      setTextError(null);
      setSplitPick(null);
      setSlicePrompt(false);
      setUntilLine(null);
      setSliceChunks([]);
      setDiscardPrompt(null);
      setProfileError(null);
      setFlagsError(null);
      setProfileOverride(null);
      setFlagsOverride(null);
      setActiveSongRole(null);
      setMoreOpen(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    setDeskTitle(lyric?.readiness === 'LINE' ? 'фразочка' : 'Сообщение');
    // Заголовок только на открытии: смена готовности в открытой карточке его не трогает.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lyric.readiness нарочно не в зависимостях
  }, [open, lyric?.id]);

  useEffect(() => {
    setProfileOverride(null);
    setFlagsOverride(null);
    setProfileError(null);
    setFlagsError(null);
    setTextError(null);
    setTextMode('view');
    setSplitPick(null);
    setSlicePrompt(false);
    setUntilLine(null);
    setSliceChunks([]);
    setDiscardPrompt(null);
    setDraftText(lyric?.message?.text ?? '');
    setActiveSongRole(lyric?.roleProfiles?.[0]?.songRole ?? null);
    setMoreOpen(false);
    // Сброс только при смене фразы, не при правке текста в кэше.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lyric.id нарочно единственная зависимость
  }, [lyric?.id]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && moreMenuRef.current?.contains(target)) {
        return;
      }

      setMoreOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setMoreOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [moreOpen]);

  const [updateFlags] = useMutation<
    {
      updateLyricFlags: Pick<
        ILyric,
        | 'id'
        | 'lyric_id'
        | 'isHidden'
        | 'isFavorite'
        | 'isReference'
        | 'isCensored'
        | 'isDonor'
        | 'isUsed'
      >;
    },
    {
      id: number;
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
      isCensored?: boolean;
      isDonor?: boolean;
      isUsed?: boolean;
    }
  >(UPDATE_LYRIC_FLAGS, {
    update(cache, { data }) {
      if (!data?.updateLyricFlags) {
        return;
      }

      updateLyricsCacheAfterFlagsChange(
        cache,
        data.updateLyricFlags,
        queryVariables
      );
    },
  });

  const [updateProfile] = useMutation<
    {
      updateLyricProfile: Pick<
        ILyric,
        | 'id'
        | 'lyric_id'
        | 'mood'
        | 'delivery'
        | 'songRole'
        | 'roleProfiles'
        | 'readiness'
        | 'energy'
      >;
    },
    {
      id: number;
      mood: LyricMood[];
      delivery: LyricDelivery[];
      roleProfiles: LyricRoleProfile[];
      readiness: LyricReadiness | null;
      energy: LyricEnergy | null;
    }
  >(UPDATE_LYRIC_PROFILE, {
    update(cache, { data }) {
      if (!data?.updateLyricProfile) {
        return;
      }

      updateLyricsCacheAfterFlagsChange(
        cache,
        data.updateLyricProfile,
        queryVariables
      );
    },
  });

  const [updateText] = useMutation<
    { updateLyricText: ILyric },
    { id: number; text: string }
  >(UPDATE_LYRIC_TEXT, {
    update(cache, { data }) {
      if (!data?.updateLyricText) {
        return;
      }

      updateLyricsCacheAfterTextChange(
        cache,
        data.updateLyricText,
        queryVariables
      );
    },
  });

  const [splitLyric] = useMutation<
    { splitLyric: { top: ILyric; bottom: ILyric } },
    { id: number; afterLine: number }
  >(SPLIT_LYRIC, {
    refetchQueries: [{ query: LYRIC_COLLAGES }],
    update(cache, { data }) {
      if (!data?.splitLyric) {
        return;
      }

      updateLyricsCacheAfterSplit(
        cache,
        data.splitLyric.top,
        data.splitLyric.bottom,
        queryVariables
      );
    },
  });

  const [sliceLyric] = useMutation<
    { sliceLyric: { source: ILyric; created: ILyric } },
    {
      id: number;
      ranges: { afterLine: number; untilLine: number }[];
      ripDonor: boolean;
    }
  >(SLICE_LYRIC, {
    refetchQueries: [{ query: LYRIC_COLLAGES }],
    update(cache, { data }) {
      if (!data?.sliceLyric) {
        return;
      }

      updateLyricsCacheAfterSlice(
        cache,
        data.sliceLyric.source,
        data.sliceLyric.created,
        queryVariables
      );
    },
  });

  const tags = lyric?.message?.hashtags?.tags ?? [];
  const reactionEmojis = (lyric?.message?.reactions?.emojis ?? [])
    .map((entry) => entry.emoji)
    .filter((emoji): emoji is string => Boolean(emoji));

  const profile: ProfileFields = {
    mood: profileOverride?.mood ?? lyric?.mood ?? [],
    delivery: profileOverride?.delivery ?? lyric?.delivery ?? [],
    roleProfiles: profileOverride?.roleProfiles ?? lyric?.roleProfiles ?? [],
    readiness: profileOverride?.readiness ?? lyric?.readiness ?? null,
    energy: profileOverride?.energy ?? lyric?.energy ?? null,
  };

  const activeProfile = activeSongRole
    ? (profile.roleProfiles.find((item) => item.songRole === activeSongRole) ??
      null)
    : null;
  const editingMood = activeProfile ? activeProfile.mood : profile.mood;
  const editingDelivery = activeProfile
    ? activeProfile.delivery
    : profile.delivery;

  const flags: FlagFields = {
    isHidden: flagsOverride?.isHidden ?? lyric?.isHidden ?? false,
    isFavorite: flagsOverride?.isFavorite ?? lyric?.isFavorite ?? false,
    isReference: flagsOverride?.isReference ?? lyric?.isReference ?? false,
    isCensored: flagsOverride?.isCensored ?? lyric?.isCensored ?? false,
    isDonor: flagsOverride?.isDonor ?? lyric?.isDonor ?? false,
    isUsed: flagsOverride?.isUsed ?? lyric?.isUsed ?? false,
  };

  const sourceText = lyric?.message?.text ?? '';
  const canSplit = canSplitLyricText(sourceText);
  const isDraftDirty = textMode === 'edit' && draftText !== sourceText;
  const showChunksTab =
    textMode === 'split' && usesChunksTab(profile.readiness);

  useEffect(() => {
    if (tab === 'chunks' && !showChunksTab) {
      setTab('text');
    }
  }, [tab, showChunksTab]);

  const errorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const enterSplitMode = () => {
    setTextError(null);
    setAfterLine(defaultAfterLine(sourceText));
    setUntilLine(null);
    setSliceChunks([]);
    setSlicePrompt(false);
    setMoreOpen(false);
    setTextMode('split');
  };

  const exitSplitMode = () => {
    setTextMode('view');
    setTextError(null);
    setSplitPick(null);
    setSlicePrompt(false);
    setUntilLine(null);
    setSliceChunks([]);

    if (tab === 'chunks') {
      setTab('text');
    }
  };

  const toggleSecondCut = () => {
    setTextError(null);

    if (untilLine !== null) {
      setUntilLine(null);
      return;
    }

    setUntilLine(defaultUntilLine(sourceText, afterLine));
  };

  const handleAfterLineChange = (next: number) => {
    setAfterLine(next);

    if (untilLine !== null && untilLine <= next) {
      setUntilLine(defaultUntilLine(sourceText, next));
    }
  };

  const clearTextHold = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    holdOriginRef.current = null;
  };

  const startTextHold = (clientX: number, clientY: number) => {
    if (!canSplit) {
      return;
    }

    clearTextHold();
    holdOriginRef.current = { x: clientX, y: clientY };
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      holdOriginRef.current = null;
      lastTextTapRef.current = 0;
      holdConsumedRef.current = true;
      enterSplitMode();
    }, SPLIT_HOLD_MS);
  };

  const moveTextHold = (clientX: number, clientY: number) => {
    const origin = holdOriginRef.current;

    if (!origin) {
      return;
    }

    const dx = clientX - origin.x;
    const dy = clientY - origin.y;

    if (dx * dx + dy * dy > SPLIT_HOLD_MOVE_PX * SPLIT_HOLD_MOVE_PX) {
      clearTextHold();
    }
  };

  const enterEditMode = () => {
    setDraftText(sourceText);
    setTextError(null);
    setTextMode('edit');
  };

  const discardEdit = () => {
    setDraftText(sourceText);
    setTextMode('view');
    setTextError(null);
    setDiscardPrompt(null);
  };

  const saveEdit = () => {
    if (!lyric) {
      return;
    }

    setTextError(null);

    void updateText({
      variables: { id: lyric.id, text: draftText },
    })
      .then((result) => {
        const next = result.data?.updateLyricText;

        if (next) {
          onLyricChange?.(next);
        }

        const closeDesk = discardPrompt === 'desk';
        setTextMode('view');
        setDiscardPrompt(null);

        if (closeDesk) {
          suppressToggle();
          flushPendingProfile();
          onOpenChange(false);
        }
      })
      .catch((error: unknown) => {
        setTextError(errorMessage(error, 'Не удалось сохранить текст'));
      });
  };

  const requestExitEdit = () => {
    if (isDraftDirty) {
      setDiscardPrompt('edit');
      return;
    }

    discardEdit();
  };

  const openSplitPick = () => {
    if (!isValidAfterLine(sourceText, afterLine)) {
      return;
    }

    setTextError(null);
    setSplitPick(lyricHalves(sourceText, afterLine));
  };

  const addSliceChunk = () => {
    if (
      untilLine === null ||
      !isValidLineRange(sourceText, afterLine, untilLine)
    ) {
      return;
    }

    const free = untakenRangesInZone(
      { afterLine, untilLine },
      sliceChunks,
      sourceText
    );

    if (free.length === 0) {
      return;
    }

    const now = Date.now();
    const nextChunks: SliceChunk[] = free.map((range, index) => ({
      id: `${range.afterLine}-${range.untilLine}-${now}-${index}`,
      afterLine: range.afterLine,
      untilLine: range.untilLine,
      text: lyricRangeText(sourceText, range.afterLine, range.untilLine),
    }));

    setTextError(null);
    setSliceChunks((prev) => [...prev, ...nextChunks]);
  };

  const chooseSplitPart = (part: 'top' | 'bottom') => {
    if (!lyric) {
      return;
    }

    setTextError(null);

    void splitLyric({
      variables: { id: lyric.id, afterLine },
    })
      .then((result) => {
        const payload = result.data?.splitLyric;

        if (!payload) {
          return;
        }

        onLyricChange?.(part === 'top' ? payload.top : payload.bottom);
        setSplitPick(null);
        setTextMode('view');
      })
      .catch((error: unknown) => {
        setSplitPick(null);
        setTextError(errorMessage(error, 'Не удалось разрезать фразу'));
      });
  };

  const confirmSlice = (ripDonor: boolean) => {
    if (!lyric || sliceChunks.length === 0) {
      return;
    }

    setTextError(null);

    void sliceLyric({
      variables: {
        id: lyric.id,
        ranges: sliceChunks.map(({ afterLine: a, untilLine: u }) => ({
          afterLine: a,
          untilLine: u,
        })),
        ripDonor,
      },
    })
      .then((result) => {
        const payload = result.data?.sliceLyric;

        if (!payload) {
          return;
        }

        onLyricChange?.(payload.source);
        setSlicePrompt(false);
        setSliceChunks([]);
        setUntilLine(null);
        setTextMode('view');
      })
      .catch((error: unknown) => {
        setSlicePrompt(false);
        setTextError(errorMessage(error, 'Не удалось сохранить куски'));
      });
  };

  const takenLineIndexes = sliceChunks.flatMap((chunk) => {
    const indexes: number[] = [];

    for (
      let index = chunk.afterLine + 1;
      index <= chunk.untilLine;
      index += 1
    ) {
      indexes.push(index);
    }

    return indexes;
  });

  const persistProfile = (pending: {
    id: number;
    lyricId: number;
    fields: ProfileFields;
  }) => {
    const roleProfiles = pending.fields.roleProfiles.map(
      ({ songRole, mood, delivery }) => ({ songRole, mood, delivery })
    );

    void updateProfile({
      variables: {
        id: pending.id,
        ...pending.fields,
        roleProfiles,
      },
      optimisticResponse: {
        updateLyricProfile: {
          ...lyricTypename(pending.id, pending.lyricId),
          ...pending.fields,
          roleProfiles: roleProfiles.map((item) => ({
            __typename: 'LyricRoleProfile' as const,
            ...item,
          })),
          songRole: roleProfiles.map((item) => item.songRole),
        },
      },
    }).catch((error: unknown) => {
      setProfileOverride(null);
      const message =
        error instanceof Error ? error.message : 'Не удалось сохранить профиль';
      setProfileError(message);
    });
  };

  const flushPendingProfile = () => {
    if (profileTimerRef.current !== null) {
      window.clearTimeout(profileTimerRef.current);
      profileTimerRef.current = null;
    }

    const pending = pendingProfileRef.current;

    if (!pending) {
      return;
    }

    pendingProfileRef.current = null;
    persistProfile(pending);
  };

  const patchFlags = (
    nextFlags: Partial<FlagFields>,
    options?: { closeOnSuccess?: boolean; onHidden?: boolean }
  ) => {
    if (!lyric) {
      return;
    }

    const next: FlagFields = {
      ...flags,
      ...nextFlags,
    };

    setFlagsError(null);
    setFlagsOverride(next);

    if (options?.onHidden) {
      onHidden?.();
    }

    if (options?.closeOnSuccess) {
      flushPendingProfile();
      onOpenChange(false);
    }

    void updateFlags({
      variables: {
        id: lyric.id,
        ...nextFlags,
      },
      optimisticResponse: {
        updateLyricFlags: {
          ...lyricTypename(lyric.id, lyric.lyric_id),
          ...next,
        },
      },
    }).catch((error: unknown) => {
      setFlagsOverride(null);
      const message =
        error instanceof Error ? error.message : 'Не удалось сохранить метки';
      setFlagsError(message);
    });
  };

  const patchProfile = (next: ProfileFields) => {
    if (!lyric) {
      return;
    }

    setProfileError(null);
    setProfileOverride(next);
    pendingProfileRef.current = {
      id: lyric.id,
      lyricId: lyric.lyric_id ?? lyric.id,
      fields: next,
    };

    if (profileTimerRef.current !== null) {
      window.clearTimeout(profileTimerRef.current);
    }

    profileTimerRef.current = window.setTimeout(() => {
      profileTimerRef.current = null;
      const pending = pendingProfileRef.current;

      if (!pending) {
        return;
      }

      pendingProfileRef.current = null;
      persistProfile(pending);
    }, PROFILE_SAVE_DEBOUNCE_MS);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isDraftDirty) {
          setDiscardPrompt('desk');
          return;
        }

        if (!nextOpen && splitPick) {
          setSplitPick(null);
          return;
        }

        if (!nextOpen) {
          suppressToggle();
          flushPendingProfile();
          setTextMode('view');
          setSplitPick(null);
          setDiscardPrompt(null);
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="flex max-h-[min(85svh,640px)] flex-col gap-5 overflow-hidden p-6 sm:max-w-xl sm:gap-6 sm:p-8 md:max-h-[min(88svh,800px)]"
        onClick={(event) => {
          event.stopPropagation();
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
        }}
        onPointerCancel={(event) => {
          event.stopPropagation();
        }}
        onPointerDownOutside={() => {
          suppressToggle();
        }}
        onInteractOutside={() => {
          suppressToggle();
        }}
      >
        <DialogHeader className="shrink-0 gap-2 sm:gap-3 sm:pr-8">
          <DialogTitle className="sm:text-xl">{deskTitle}</DialogTitle>
          <DialogDescription className="sm:text-base">
            {tab === 'text'
              ? 'Полный текст из каталога.'
              : tab === 'chunks'
                ? 'Нарезанные куски.'
                : 'Настроение, подача, роль, энергия и готовность.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-3 sm:gap-4">
          <div
            role="tablist"
            aria-label="Разделы карточки"
            className="bg-muted grid w-full shrink-0 grid-cols-2 items-center rounded-lg p-1"
          >
            {(showChunksTab
              ? ([
                  { id: 'text', label: 'Текст' },
                  { id: 'chunks', label: 'Куски' },
                ] as const)
              : ([
                  { id: 'text', label: 'Текст' },
                  { id: 'profile', label: 'Профиль' },
                ] as const)
            ).map(({ id, label }) => {
              const selected = tab === id;

              return (
                <Button
                  key={id}
                  type="button"
                  role="tab"
                  size="sm"
                  aria-selected={selected}
                  variant="ghost"
                  className={cn(
                    'h-8 w-full rounded-md text-sm leading-none',
                    selected
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                  onClick={() => {
                    if (id === tab) {
                      return;
                    }

                    if (isDraftDirty) {
                      setDiscardPrompt('edit');
                      return;
                    }

                    if (id !== 'chunks' && tab !== 'chunks') {
                      setTextMode('view');
                    }

                    setTab(id);
                  }}
                >
                  {id === 'chunks' ? (
                    <Scissors className="size-3.5" aria-hidden />
                  ) : null}
                  {label}
                </Button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {lyric && tab === 'text' ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs sm:px-2.5 sm:py-1 sm:text-sm"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {reactionEmojis.length > 0 ? (
                  <div
                    className="text-muted-foreground flex flex-wrap gap-1.5 text-lg sm:gap-2 sm:text-xl"
                    aria-label="Реакции"
                  >
                    {reactionEmojis.map((emoji) => (
                      <span key={emoji}>{emoji}</span>
                    ))}
                  </div>
                ) : null}

                {textMode === 'split' ? (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
                    <div className="min-w-0 flex-1">
                      <SplitTextView
                        text={sourceText}
                        afterLine={afterLine}
                        untilLine={untilLine}
                        takenLineIndexes={takenLineIndexes}
                        onAfterLineChange={handleAfterLineChange}
                        onUntilLineChange={setUntilLine}
                        onToggleSecondCut={toggleSecondCut}
                        onHold={exitSplitMode}
                      />
                    </div>
                    {!showChunksTab &&
                    (untilLine !== null || sliceChunks.length > 0) ? (
                      <div className="w-full shrink-0 lg:w-56">
                        <SliceChunkList
                          chunks={sliceChunks}
                          onReorder={setSliceChunks}
                          onRemove={(id) => {
                            setSliceChunks((prev) =>
                              prev.filter((chunk) => chunk.id !== id)
                            );
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : textMode === 'edit' ? (
                  <div className="relative">
                    <textarea
                      value={draftText}
                      rows={Math.max(splitLyricLines(draftText).length, 2)}
                      onChange={(event) => setDraftText(event.target.value)}
                      className="border-input bg-background w-full resize-none rounded-md border px-3 py-2 pr-20 text-sm leading-relaxed whitespace-pre-wrap sm:text-base sm:leading-7"
                      aria-label="Текст фразы"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={saveEdit}
                        aria-label="Сохранить"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={requestExitEdit}
                        aria-label="Выйти без сохранения"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap sm:text-base sm:leading-7"
                    onContextMenu={(event) => {
                      if (canSplit) {
                        event.preventDefault();
                      }
                    }}
                    onPointerDown={(event) => {
                      startTextHold(event.clientX, event.clientY);
                    }}
                    onPointerMove={(event) => {
                      moveTextHold(event.clientX, event.clientY);
                    }}
                    onPointerUp={() => {
                      clearTextHold();

                      if (holdConsumedRef.current) {
                        holdConsumedRef.current = false;
                        return;
                      }

                      const now = Date.now();

                      if (now - lastTextTapRef.current < 400) {
                        lastTextTapRef.current = 0;
                        enterEditMode();
                        return;
                      }

                      lastTextTapRef.current = now;
                    }}
                    onPointerCancel={clearTextHold}
                  >
                    {lyric.message?.text}
                  </p>
                )}
                {textError ? (
                  <p className="text-destructive text-sm">{textError}</p>
                ) : null}
              </div>
            ) : null}

            {lyric && tab === 'chunks' && showChunksTab ? (
              <div className="flex flex-col gap-3">
                {sliceChunks.length > 0 ? (
                  <SliceChunkList
                    showTitle={false}
                    chunks={sliceChunks}
                    onReorder={setSliceChunks}
                    onRemove={(id) => {
                      setSliceChunks((prev) =>
                        prev.filter((chunk) => chunk.id !== id)
                      );
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Пока нет кусков.
                  </p>
                )}
                {textError ? (
                  <p className="text-destructive text-sm">{textError}</p>
                ) : null}
              </div>
            ) : null}

            {lyric && tab === 'profile' ? (
              <div className="flex flex-col gap-5 sm:gap-7">
                {lyric.source ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs font-normal">
                      Откуда
                    </span>
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      {LYRIC_SOURCE_LABELS[lyric.source]}
                    </span>
                  </div>
                ) : null}
                <FacetChipGroup
                  label="Роль в песне"
                  options={LYRIC_SONG_ROLES}
                  labels={LYRIC_SONG_ROLE_LABELS}
                  hints={LYRIC_SONG_ROLE_HINTS}
                  value={profile.roleProfiles.map((item) => item.songRole)}
                  multiple
                  accent={activeSongRole}
                  size="desk"
                  onSelect={(role) => setActiveSongRole(role)}
                  onChange={(roles) => {
                    let roleProfiles = profile.roleProfiles.filter((item) =>
                      roles.includes(item.songRole)
                    );

                    for (const role of roles) {
                      roleProfiles = upsertRoleProfile(roleProfiles, role, {
                        mood: [],
                        delivery: [],
                      });
                    }

                    if (activeSongRole && !roles.includes(activeSongRole)) {
                      setActiveSongRole(roles[0] ?? null);
                    }

                    patchProfile({ ...profile, roleProfiles });
                  }}
                />
                <FacetChipGroup
                  label="Настроение"
                  options={LYRIC_MOODS}
                  labels={LYRIC_MOOD_LABELS}
                  hints={LYRIC_MOOD_HINTS}
                  value={editingMood}
                  multiple
                  toggleOnClick
                  size="desk"
                  onChange={(mood) => {
                    if (activeSongRole) {
                      patchProfile({
                        ...profile,
                        roleProfiles: patchRoleProfile(
                          profile.roleProfiles,
                          activeSongRole,
                          { mood }
                        ),
                      });
                      return;
                    }

                    patchProfile({ ...profile, mood });
                  }}
                />
                <FacetChipGroup
                  label="Подача"
                  options={LYRIC_DELIVERIES}
                  labels={LYRIC_DELIVERY_LABELS}
                  hints={LYRIC_DELIVERY_HINTS}
                  value={editingDelivery}
                  multiple
                  toggleOnClick
                  size="desk"
                  onChange={(delivery) => {
                    if (activeSongRole) {
                      patchProfile({
                        ...profile,
                        roleProfiles: patchRoleProfile(
                          profile.roleProfiles,
                          activeSongRole,
                          { delivery }
                        ),
                      });
                      return;
                    }

                    patchProfile({ ...profile, delivery });
                  }}
                />
                <FacetChipGroup
                  label="Энергия"
                  options={LYRIC_ENERGIES}
                  labels={LYRIC_ENERGY_LABELS}
                  hints={LYRIC_ENERGY_HINTS}
                  value={profile.energy ? [profile.energy] : []}
                  multiple={false}
                  size="desk"
                  onChange={(next) => {
                    const energy = next[0] ?? null;
                    patchProfile({ ...profile, energy });
                  }}
                />
                <FacetChipGroup
                  label="Готовность"
                  options={LYRIC_READINESS}
                  labels={LYRIC_READINESS_LABELS}
                  hints={LYRIC_READINESS_HINTS}
                  value={profile.readiness ? [profile.readiness] : []}
                  multiple={false}
                  size="desk"
                  onChange={(next) => {
                    const readiness = next[0] ?? null;
                    patchProfile({ ...profile, readiness });

                    if (readiness === 'READY' && !flags.isHidden) {
                      patchFlags(
                        { isHidden: true },
                        { closeOnSuccess: true, onHidden: true }
                      );
                    }
                  }}
                />
                {profileError ? (
                  <p className="text-destructive text-sm">{profileError}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {flagsError ? (
          <p className="text-destructive shrink-0 text-sm">{flagsError}</p>
        ) : null}

        {textMode === 'edit' ? null : (
          <DialogFooter className="flex shrink-0 flex-col gap-2 pt-1 sm:gap-3">
            {textMode === 'split' ? (
              <div className="flex w-full flex-wrap items-center justify-between gap-1 max-[414px]:flex-nowrap">
                <div className="flex flex-wrap gap-1 max-[414px]:flex-nowrap">
                  {untilLine === null ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2"
                      disabled={!isValidAfterLine(sourceText, afterLine)}
                      onClick={openSplitPick}
                    >
                      <Scissors className="size-4 text-sky-400" aria-hidden />
                      Разрезать
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        aria-label="В список"
                        disabled={
                          !isValidLineRange(sourceText, afterLine, untilLine) ||
                          untakenRangesInZone(
                            { afterLine, untilLine },
                            sliceChunks,
                            sourceText
                          ).length === 0
                        }
                        onClick={addSliceChunk}
                      >
                        <Scissors className="size-4 text-sky-400" aria-hidden />
                        <span className="max-[414px]:hidden">В список</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        aria-label="Сохранить"
                        disabled={sliceChunks.length === 0}
                        onClick={() => {
                          setTextError(null);
                          setSlicePrompt(true);
                        }}
                      >
                        <Check
                          className="size-4 text-emerald-400"
                          aria-hidden
                        />
                        <span className="max-[414px]:hidden">Сохранить</span>
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  onClick={exitSplitMode}
                >
                  <X className="size-4 text-rose-400" aria-hidden />
                  Отмена
                </Button>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!lyric}
                    aria-label="Избранное"
                    aria-pressed={flags.isFavorite}
                    className="size-10"
                    onClick={() =>
                      patchFlags({ isFavorite: !flags.isFavorite })
                    }
                  >
                    <Star
                      className={cn(
                        'size-4',
                        flags.isFavorite && 'fill-amber-400 text-amber-400'
                      )}
                      aria-hidden
                    />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!lyric}
                    aria-label="Эталон"
                    aria-pressed={flags.isReference}
                    className="size-10"
                    onClick={() =>
                      patchFlags({ isReference: !flags.isReference })
                    }
                  >
                    <Sparkles
                      className={cn(
                        'size-4',
                        flags.isReference && 'fill-violet-400 text-violet-400'
                      )}
                      aria-hidden
                    />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!lyric}
                    aria-label="Использовал"
                    aria-pressed={flags.isUsed}
                    className="size-10"
                    onClick={() => patchFlags({ isUsed: !flags.isUsed })}
                  >
                    <CheckCheck
                      className={cn('size-4', flags.isUsed && 'text-amber-400')}
                      aria-hidden
                    />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!lyric}
                    aria-label="Скрыть"
                    aria-pressed={flags.isHidden}
                    className="size-10"
                    onClick={() => patchFlags({ isHidden: !flags.isHidden })}
                  >
                    <EyeOff
                      className={cn(
                        'size-4',
                        flags.isHidden && 'text-rose-400'
                      )}
                      aria-hidden
                    />
                  </Button>

                  <div ref={moreMenuRef} className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!lyric}
                      aria-label="Ещё"
                      aria-expanded={moreOpen}
                      aria-haspopup="menu"
                      className="relative size-10"
                      onClick={() => setMoreOpen((openMenu) => !openMenu)}
                    >
                      <MoreHorizontal className="size-4" aria-hidden />
                      {flags.isCensored || flags.isDonor ? (
                        <>
                          <span
                            className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full"
                            aria-hidden
                          />
                          <span className="sr-only">есть метки</span>
                        </>
                      ) : null}
                    </Button>
                    {moreOpen ? (
                      <div
                        role="menu"
                        className="bg-popover text-popover-foreground absolute right-0 bottom-full z-10 mb-1 min-w-[12rem] rounded-md border p-1 shadow-md"
                      >
                        <button
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={flags.isCensored}
                          className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm"
                          onClick={() =>
                            patchFlags({ isCensored: !flags.isCensored })
                          }
                        >
                          <Ban
                            className={cn(
                              'size-4',
                              flags.isCensored && 'text-rose-400'
                            )}
                            aria-hidden
                          />
                          Цензура
                          {flags.isCensored ? (
                            <span
                              className="bg-rose-400 ml-auto size-1.5 rounded-full"
                              aria-hidden
                            />
                          ) : null}
                        </button>
                        <button
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={flags.isDonor}
                          className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm"
                          onClick={() =>
                            patchFlags({ isDonor: !flags.isDonor })
                          }
                        >
                          <Split
                            className={cn(
                              'size-4',
                              flags.isDonor && 'text-sky-400'
                            )}
                            aria-hidden
                          />
                          Донор
                          {flags.isDonor ? (
                            <span
                              className="bg-sky-400 ml-auto size-1.5 rounded-full"
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                {showQueueActions && tab === 'text' ? (
                  <div className="flex w-full items-center justify-between gap-1">
                    <QueueActionButton
                      hint="Убрать все фразы с экрана"
                      disabled={!lyric}
                      onClick={() => {
                        void (async () => {
                          const saved = await saveSnapshot();
                          if (!saved) {
                            return;
                          }

                          clearQueue();
                          toast('Карусель очищена');
                        })();
                      }}
                    >
                      <ListX className="size-4 text-rose-400" aria-hidden />
                      Очистить
                    </QueueActionButton>
                    <QueueActionButton
                      hint={
                        inQueue
                          ? 'Убрать из своей карусели'
                          : 'В свою карусель — дальше только добавленные'
                      }
                      disabled={!lyric}
                      className={cn(inQueue && 'bg-muted')}
                      onClick={() => {
                        if (!lyric) {
                          return;
                        }

                        if (inQueue) {
                          removeFromQueue(lyric.id);
                          return;
                        }

                        addToQueue(lyric);
                      }}
                    >
                      <ListPlus className="size-4 text-sky-400" aria-hidden />
                      Добавить
                    </QueueActionButton>
                    <QueueActionButton
                      hint="Поставить сверху и сразу запустить"
                      disabled={!lyric}
                      onClick={() => {
                        if (!lyric) {
                          return;
                        }

                        playNow(lyric);
                        suppressToggle();
                        onOpenChange(false);
                        setPaused(false);
                      }}
                    >
                      <Play
                        className="size-4 fill-emerald-400 text-emerald-400"
                        aria-hidden
                      />
                      Играть
                    </QueueActionButton>
                  </div>
                ) : null}
              </div>
            )}
          </DialogFooter>
        )}

        {splitPick ? (
          <div
            className="bg-background/95 absolute inset-0 z-20 flex flex-col gap-4 overflow-y-auto p-6"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSplitPick(null);
              }
            }}
          >
            <p className="text-lg font-semibold">
              Какую часть оставить открытой?
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-auto flex-col items-start gap-2 whitespace-pre-wrap py-3 text-left"
              onClick={() => chooseSplitPart('top')}
            >
              <span className="font-medium">Верх</span>
              <span className="text-muted-foreground text-sm">
                {previewLyricHalf(splitPick.top)}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto flex-col items-start gap-2 whitespace-pre-wrap py-3 text-left"
              onClick={() => chooseSplitPart('bottom')}
            >
              <span className="font-medium">Низ</span>
              <span className="text-muted-foreground text-sm">
                {previewLyricHalf(splitPick.bottom)}
              </span>
            </Button>
          </div>
        ) : null}

        {slicePrompt ? (
          <div
            className="bg-background/95 absolute inset-0 z-20 flex flex-col gap-3 p-6 justify-center items-center center"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSlicePrompt(false);
              }
            }}
          >
            <p className="text-lg font-semibold">Вырезать из донора?</p>
            <p className="text-muted-foreground text-sm">
              Соберет в одну запись каталога из выбранных кусков.
              <br />
              Оригиналы можно оставить или спрятать.
              <br />
              <br />
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => confirmSlice(false)}
              >
                Оставить
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => confirmSlice(true)}
              >
                Вырезать
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSlicePrompt(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : null}

        {discardPrompt ? (
          <div className="bg-background/95 absolute inset-0 z-20 flex flex-col justify-end gap-3 p-6">
            <p className="text-lg font-semibold">Сохранить изменения?</p>
            <p className="text-muted-foreground text-sm">
              Текст менялся и ещё не записан в каталог.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={saveEdit}>
                Сохранить
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const closeDesk = discardPrompt === 'desk';
                  discardEdit();

                  if (closeDesk) {
                    suppressToggle();
                    flushPendingProfile();
                    onOpenChange(false);
                  }
                }}
              >
                Не сохранять
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDiscardPrompt(null)}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
