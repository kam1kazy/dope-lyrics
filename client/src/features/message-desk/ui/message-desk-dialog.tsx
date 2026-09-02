'use client';

import { useMutation } from '@apollo/client/react';
import { EyeOff, Sparkles, Star } from 'lucide-react';

import {
  type ILyric,
  type LyricsQueryVariables,
  UPDATE_LYRIC_FLAGS,
  updateLyricsCacheAfterFlagsChange,
} from '@/entities/lyric';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
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

export function MessageDeskDialog({
  lyric,
  open,
  queryVariables,
  onOpenChange,
  onHidden,
}: MessageDeskDialogProps) {
  const { shelfMode } = useLyricView();
  const { suppressToggle } = usePlayback();

  const [updateFlags, { loading }] = useMutation<
    {
      updateLyricFlags: Pick<
        ILyric,
        'id' | 'isHidden' | 'isFavorite' | 'isReference'
      >;
    },
    {
      id: number;
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
    }
  >(UPDATE_LYRIC_FLAGS, {
    update(cache, { data }) {
      if (!data?.updateLyricFlags) {
        return;
      }

      updateLyricsCacheAfterFlagsChange(
        cache,
        data.updateLyricFlags,
        queryVariables,
        shelfMode
      );
    },
  });

  const tags = lyric?.message?.hashtags?.tags ?? [];
  const reactionEmojis = (lyric?.message?.reactions?.emojis ?? [])
    .map((entry) => entry.emoji)
    .filter((emoji): emoji is string => Boolean(emoji));

  const patchFlags = async (
    flags: {
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
    },
    options?: { closeOnSuccess?: boolean; onHidden?: boolean }
  ) => {
    if (!lyric) {
      return;
    }

    await updateFlags({
      variables: {
        id: lyric.id,
        ...flags,
      },
    });

    if (options?.onHidden) {
      onHidden?.();
    }

    if (options?.closeOnSuccess) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          suppressToggle();
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-h-[min(85svh,640px)] overflow-y-auto sm:max-w-md"
        onClick={(event) => {
          event.stopPropagation();
        }}
        onPointerDownOutside={() => {
          suppressToggle();
        }}
        onInteractOutside={() => {
          suppressToggle();
        }}
      >
        <DialogHeader>
          <DialogTitle>Сообщение</DialogTitle>
          <DialogDescription>
            Полный текст из каталога. Изменения остаются в приложении.
          </DialogDescription>
        </DialogHeader>

        {lyric ? (
          <div className="flex flex-col gap-4">
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}

            {reactionEmojis.length > 0 ? (
              <div
                className="text-muted-foreground flex flex-wrap gap-1.5 text-lg"
                aria-label="Реакции"
              >
                {reactionEmojis.map((emoji) => (
                  <span key={emoji}>{emoji}</span>
                ))}
              </div>
            ) : null}

            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {lyric.message?.text}
            </p>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            variant={lyric?.isHidden ? 'secondary' : 'outline'}
            disabled={!lyric || loading}
            className="gap-2"
            onClick={() =>
              patchFlags(
                { isHidden: !lyric?.isHidden },
                {
                  closeOnSuccess: !lyric?.isHidden,
                  onHidden: !lyric?.isHidden,
                }
              )
            }
          >
            <EyeOff className="size-4" aria-hidden />
            {lyric?.isHidden ? 'Вернуть в карусель' : 'Скрыть'}
          </Button>

          <Button
            type="button"
            variant={lyric?.isFavorite ? 'secondary' : 'outline'}
            disabled={!lyric || loading}
            className="gap-2"
            onClick={() => patchFlags({ isFavorite: !lyric?.isFavorite })}
          >
            <Star className="size-4" aria-hidden />
            {lyric?.isFavorite ? 'Убрать из избранного' : 'В избранное'}
          </Button>

          <Button
            type="button"
            variant={lyric?.isReference ? 'secondary' : 'outline'}
            disabled={!lyric || loading}
            className="gap-2"
            onClick={() => patchFlags({ isReference: !lyric?.isReference })}
          >
            <Sparkles className="size-4" aria-hidden />
            {lyric?.isReference ? 'Снять эталон' : 'Эталон'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
