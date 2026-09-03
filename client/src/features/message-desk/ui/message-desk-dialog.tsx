'use client';

import { useMutation } from '@apollo/client/react';
import { Ban, EyeOff, Sparkles, Star } from 'lucide-react';
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
  UPDATE_LYRIC_FLAGS,
  UPDATE_LYRIC_PROFILE,
  updateLyricsCacheAfterFlagsChange,
  upsertRoleProfile,
} from '@/entities/lyric';
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
}

type DeskTab = 'text' | 'profile';

type ProfileFields = Pick<
  ILyric,
  'mood' | 'delivery' | 'roleProfiles' | 'readiness'
>;

type FlagFields = Pick<
  ILyric,
  'isHidden' | 'isFavorite' | 'isReference' | 'isCensored'
>;

const PROFILE_SAVE_DEBOUNCE_MS = 280;

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
}: MessageDeskDialogProps) {
  const { suppressToggle } = usePlayback();
  const [tab, setTab] = useState<DeskTab>('text');
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
      setProfileError(null);
      setFlagsError(null);
      setProfileOverride(null);
      setFlagsOverride(null);
      setActiveSongRole(null);
    }
  }, [open]);

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
    setActiveSongRole(lyric?.roleProfiles?.[0]?.songRole ?? null);
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
        if (!nextOpen) {
          suppressToggle();
          flushPendingProfile();
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-h-[min(85svh,640px)] gap-5 overflow-y-auto p-6 sm:max-w-xl sm:gap-7 sm:p-8 md:max-h-[min(88svh,800px)]"
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
        <DialogHeader className="gap-2 sm:gap-3 sm:pr-8">
          <DialogTitle className="sm:text-xl">{deskTitle}</DialogTitle>
          <DialogDescription className="sm:text-base">
            {tab === 'text'
              ? 'Полный текст из каталога.'
              : 'Настроение, подача, роль и готовность.'}
          </DialogDescription>
        </DialogHeader>

        <div
          role="tablist"
          aria-label="Разделы карточки"
          className="bg-muted grid grid-cols-2 rounded-lg p-1 sm:p-1.5"
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
                aria-selected={selected}
                variant="ghost"
                className={cn(
                  'h-8 rounded-md text-sm sm:h-10 sm:text-base',
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

        {lyric && tab === 'text' ? (
          <div className="flex flex-col gap-4 sm:gap-6">
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

            <p className="text-sm leading-relaxed whitespace-pre-wrap sm:text-base sm:leading-7">
              {lyric.message?.text}
            </p>
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

        {flagsError ? (
          <p className="text-destructive text-sm">{flagsError}</p>
        ) : null}

        <DialogFooter className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:flex-row sm:flex-wrap sm:justify-start sm:gap-3">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
