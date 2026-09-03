import {
  type IAssembledTrackSlot,
  LYRIC_SONG_ROLE_LABELS,
} from '@/entities/lyric';

import { slotDisplayText } from '../lib/generator-text';

export function AssembleSlotCard({
  slot,
  index,
  hideAdlibs,
}: {
  slot: IAssembledTrackSlot;
  index: number;
  hideAdlibs: boolean;
}) {
  const roleLabel = LYRIC_SONG_ROLE_LABELS[slot.songRole] ?? slot.songRole;
  const { text, empty } = slotDisplayText(slot, hideAdlibs);

  return (
    <div>
      <p className="text-muted-foreground text-xs">
        {index + 1}. {roleLabel}
      </p>
      <p
        className={
          empty
            ? 'text-muted-foreground mt-1 text-sm italic'
            : 'mt-1 text-sm whitespace-pre-wrap'
        }
      >
        {text}
      </p>
    </div>
  );
}
