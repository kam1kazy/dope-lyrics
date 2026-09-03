'use client';

import { useMutation } from '@apollo/client/react';
import { Ban, Check, EyeOff, Scissors, Sparkles, Star, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  FacetChipGroup,
  type ILyric,
  LYRIC_DELIVERIES,
  LYRIC_DELIVERY_HINTS,
  LYRIC_DELIVERY_LABELS,
  LYRIC_MOOD_HINTS,
  LYRIC_MOOD_LABELS,
  LYRIC_MOODS,
  LYRIC_READINESS,
  LYRIC_READINESS_HINTS,
  LYRIC_READINESS_LABELS,
  LYRIC_SONG_ROLE_HINTS,
  LYRIC_SONG_ROLE_LABELS,
  LYRIC_SONG_ROLES,
  type LyricDelivery,
  type LyricMood,
  type LyricReadiness,
  type LyricRoleProfile,
  type LyricSongRole,
  type LyricsQueryVariables,
  patchRoleProfile,
  SPLIT_LYRIC,
  UPDATE_LYRIC_FLAGS,
  UPDATE_LYRIC_PROFILE,
  UPDATE_LYRIC_TEXT,
  updateLyricsCacheAfterFlagsChange,
  updateLyricsCacheAfterSplit,
  updateLyricsCacheAfterTextChange,
  upsertRoleProfile,
} from '@/entities/lyric';
import {
  canSplitLyricText,
  defaultAfterLine,
  isValidAfterLine,
  lyricHalves,
  previewLyricHalf,
  splitLyricLines,
} from '@/features/message-desk/lib/lyric-text-lines';
import { SplitTextView } from '@/features/message-desk/ui/split-text-view';
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

interface MessageDeskDialogProps {
  lyric: ILyric | null;
  open: boolean;
  queryVariables: LyricsQueryVariables;
  onOpenChange: (open: boolean) => void;
  onHidden?: () => void;
  onLyricChange?: (lyric: ILyric) => void;
}

type DeskTab = 'text' | 'profile';
type TextMode = 'view' | 'split' | 'edit';
type DiscardPrompt = 'edit' | 'desk' | null;

type ProfileFields = Pick<
  ILyric,
  'mood' | 'delivery' | 'roleProfiles' | 'readiness'
>;

type FlagFields = Pick<
  ILyric,
  'isHidden' | 'isFavorite' | 'isReference' | 'isCensored'
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

export function MessageDeskDialog({
  lyric,
  open,
  queryVariables,
  onOpenChange,
  onHidden,
  onLyricChange,
}: MessageDeskDialogProps) {
  const { suppressToggle } = usePlayback();
  const [tab, setTab] = useState<DeskTab>('text');
  const [textMode, setTextMode] = useState<TextMode>('view');
  const [afterLine, setAfterLine] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [splitPick, setSplitPick] = useState<{
    top: string;
    bottom: string;
  } | null>(null);
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
      setDiscardPrompt(null);
      setProfileError(null);
      setFlagsError(null);
      setProfileOverride(null);
      setFlagsOverride(null);
      setActiveSongRole(null);
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
    setDiscardPrompt(null);
    setDraftText(lyric?.message?.text ?? '');
    setActiveSongRole(lyric?.roleProfiles?.[0]?.songRole ?? null);
    // Сброс только при смене фразы, не при правке текста в кэше.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lyric.id нарочно единственная зависимость
  }, [lyric?.id]);

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
      >;
    },
    {
      id: number;
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
      isCensored?: boolean;
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
      >;
    },
    {
      id: number;
      mood: LyricMood[];
      delivery: LyricDelivery[];
      roleProfiles: LyricRoleProfile[];
      readiness: LyricReadiness | null;
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

  const tags = lyric?.message?.hashtags?.tags ?? [];
  const reactionEmojis = (lyric?.message?.reactions?.emojis ?? [])
    .map((entry) => entry.emoji)
    .filter((emoji): emoji is string => Boolean(emoji));

  const profile: ProfileFields = {
    mood: profileOverride?.mood ?? lyric?.mood ?? [],
    delivery: profileOverride?.delivery ?? lyric?.delivery ?? [],
    roleProfiles: profileOverride?.roleProfiles ?? lyric?.roleProfiles ?? [],
    readiness: profileOverride?.readiness ?? lyric?.readiness ?? null,
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
  };

  const sourceText = lyric?.message?.text ?? '';
  const canSplit = canSplitLyricText(sourceText);
  const isDraftDirty = textMode === 'edit' && draftText !== sourceText;

  const errorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const enterSplitMode = () => {
    setTextError(null);
    setAfterLine(defaultAfterLine(sourceText));
    setTextMode('split');
  };

  const exitSplitMode = () => {
    setTextMode('view');
    setTextError(null);
    setSplitPick(null);
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
              : 'Настроение, подача, роль и готовность.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto sm:gap-4">
          <div
            role="tablist"
            aria-label="Разделы карточки"
            className="bg-muted grid w-full shrink-0 grid-cols-2 items-center rounded-lg p-1"
          >
            {(
              [
                { id: 'text', label: 'Текст' },
                { id: 'profile', label: 'Профиль' },
              ] as const
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

                    setTextMode('view');
                    setTab(id);
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </div>

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
                <SplitTextView
                  text={sourceText}
                  afterLine={afterLine}
                  onAfterLineChange={setAfterLine}
                  onHold={exitSplitMode}
                />
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

          {lyric && tab === 'profile' ? (
            <div className="flex flex-col gap-5 sm:gap-7">
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

        {flagsError ? (
          <p className="text-destructive shrink-0 text-sm">{flagsError}</p>
        ) : null}

        {textMode === 'edit' ? null : (
          <DialogFooter className="flex shrink-0 flex-col gap-2 pt-1 sm:gap-3">
            {tab === 'text' && textMode === 'split' ? (
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  onClick={exitSplitMode}
                >
                  <X className="size-4 text-rose-400" aria-hidden />
                  Отмена
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  disabled={!isValidAfterLine(sourceText, afterLine)}
                  onClick={openSplitPick}
                >
                  <Scissors className="size-4 text-sky-400" aria-hidden />
                  Разделить
                </Button>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:justify-start sm:gap-3">
              <Button
                type="button"
                variant={flags.isFavorite ? 'secondary' : 'outline'}
                disabled={!lyric}
                className="gap-2 sm:h-10"
                onClick={() => patchFlags({ isFavorite: !flags.isFavorite })}
              >
                <Star
                  className={cn(
                    'size-4',
                    flags.isFavorite && 'fill-amber-400 text-amber-400'
                  )}
                  aria-hidden
                />
                <span className="sm:hidden">Избранное</span>
                <span className="hidden sm:inline">
                  {flags.isFavorite ? 'Убрать из избранного' : 'В избранное'}
                </span>
              </Button>

              <Button
                type="button"
                variant={flags.isReference ? 'secondary' : 'outline'}
                disabled={!lyric}
                className="gap-2 sm:h-10"
                onClick={() => patchFlags({ isReference: !flags.isReference })}
              >
                <Sparkles
                  className={cn(
                    'size-4',
                    flags.isReference && 'fill-violet-400 text-violet-400'
                  )}
                  aria-hidden
                />
                {flags.isReference ? (
                  <>
                    <span className="sm:hidden">Эталон</span>
                    <span className="hidden sm:inline">Снять эталон</span>
                  </>
                ) : (
                  'Эталон'
                )}
              </Button>

              <Button
                type="button"
                variant={flags.isCensored ? 'secondary' : 'outline'}
                disabled={!lyric}
                className="gap-2 sm:h-10"
                onClick={() => patchFlags({ isCensored: !flags.isCensored })}
              >
                <Ban
                  className={cn('size-4', flags.isCensored && 'text-rose-400')}
                  aria-hidden
                />
                {flags.isCensored ? (
                  <>
                    <span className="sm:hidden">Цензура</span>
                    <span className="hidden sm:inline">Снять цензуру</span>
                  </>
                ) : (
                  'Цензура'
                )}
              </Button>

              <Button
                type="button"
                variant={flags.isHidden ? 'secondary' : 'outline'}
                disabled={!lyric}
                className="gap-2 sm:h-10"
                onClick={() => patchFlags({ isHidden: !flags.isHidden })}
              >
                <EyeOff
                  className={cn('size-4', flags.isHidden && 'text-rose-400')}
                  aria-hidden
                />
                <span className="sm:hidden">
                  {flags.isHidden ? 'Скрыто' : 'Скрыть'}
                </span>
                <span className="hidden sm:inline">
                  {flags.isHidden ? 'Вернуть в карусель' : 'Скрыть'}
                </span>
              </Button>
            </div>
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
