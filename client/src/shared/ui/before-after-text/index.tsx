'use client';

import { diffWordsWithSpace } from 'diff';
import {
  ArrowLeftRight,
  EllipsisVertical,
  Highlighter,
  Pencil,
  Sparkles,
  Undo2,
} from 'lucide-react';
import {
  type PointerEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils/cn';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/ui/dropdown-menu';

import { pairRewriteBlocks } from './pair-blocks';

type Side = 'before' | 'after';

type Piece = { text: string; changed: boolean };

type Editing = { paragraph: number; start: number };

const SIDES: Side[] = ['after', 'before'];

const SIDE_LABELS: Record<Side, string> = {
  before: 'Было',
  after: 'Стало',
};

const SIDE_ICONS = {
  before: Undo2,
  after: Sparkles,
} as const;

const CHANGED_CLASSES: Record<Side, string> = {
  before: 'bg-rose-400/20',
  after: 'bg-yellow-400/25',
};

const DRAG_START_PX = 8;
const MOUSE_SWIPE_ZONE_PX = 32;
const DOTS_WIDTH_PX = 40;
const LINES_PER_EDIT = 2;

const opposite = (side: Side): Side => (side === 'after' ? 'before' : 'after');

function diffLines(before: string, after: string, side: Side): Piece[][] {
  const lines: Piece[][] = [[]];

  for (const part of diffWordsWithSpace(before, after)) {
    if (side === 'after' ? part.removed : part.added) {
      continue;
    }

    const changed = (side === 'after' ? part.added : part.removed) === true;
    part.value.split('\n').forEach((text, index) => {
      if (index > 0) {
        lines.push([]);
      }

      if (text !== '') {
        lines[lines.length - 1]?.push({ text, changed });
      }
    });
  }

  return lines;
}

function EditBlock({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);

  return (
    <textarea
      autoFocus
      data-swipe-ignore
      value={value}
      rows={LINES_PER_EDIT}
      className="border-input bg-background focus-visible:ring-ring/50 w-full resize-none rounded-md border px-2 py-1 text-sm outline-none focus-visible:ring-2"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onChange={(event) => {
        setValue(event.target.value);
      }}
      onBlur={() => {
        onCommit(value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onCancel();
        }

        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          onCommit(value);
        }
      }}
    />
  );
}

function MenuButton({
  label,
  active,
  className,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Hint label={label}>
      <Button
        type="button"
        size="icon"
        variant={active ? 'secondary' : 'ghost'}
        className={cn('size-7', className)}
        aria-label={label}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
      >
        {children}
      </Button>
    </Hint>
  );
}

/**
 * Текст до и после правки ИИ. «Стало»/«Было» переключают общий вид.
 * Клик по абзацу закрепляет за ним другой вариант: пока он отличается
 * от общего, у абзаца иконка, по ней закрепление снимается. Двойной клик
 * правит пару строк (при `onAfterChange`). Свайп влево сдвигает абзац
 * и открывает его меню: три точки, затем подсветка, правка и переключение.
 */
export function BeforeAfterText({
  before,
  after,
  side: controlledSide,
  onAfterChange,
  actions,
}: {
  before: string;
  after: string;
  /** Если задан, вариант выбирают снаружи, а свои кнопки не рисуются. */
  side?: Side;
  onAfterChange?: (next: string) => void;
  actions?: ReactNode;
}) {
  const [ownSide, setSide] = useState<Side>('after');
  const side = controlledSide ?? ownSide;
  const [pinned, setPinned] = useState<ReadonlyMap<number, Side>>(new Map());
  const [highlight, setHighlight] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [drag, setDrag] = useState<{ index: number; dx: number } | null>(null);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragged = useRef(false);

  const blocks = useMemo(
    () => pairRewriteBlocks(before, after),
    [before, after]
  );

  const shownSide = (index: number): Side => pinned.get(index) ?? side;

  const pin = (index: number, next: Side) => {
    setPinned((current) => new Map(current).set(index, next));
  };

  const unpin = (index: number) => {
    setPinned((current) => {
      const next = new Map(current);
      next.delete(index);
      return next;
    });
  };

  const setReveal = (index: number, open: boolean) => {
    setRevealed((current) => {
      const next = new Set(current);
      if (open) {
        next.add(index);
      } else {
        next.delete(index);
      }

      return next;
    });
  };

  const startEdit = (paragraph: number, start: number) => {
    pin(paragraph, 'after');
    setEditing({ paragraph, start });
  };

  const commitEdit = (paragraph: number, start: number, value: string) => {
    setEditing(null);
    const lines = (blocks[paragraph]?.after ?? '').split('\n');
    const nextLines = [
      ...lines.slice(0, start),
      ...value.split('\n'),
      ...lines.slice(start + LINES_PER_EDIT),
    ];
    const next = blocks
      .map((block, index) =>
        index === paragraph ? nextLines.join('\n') : block.after
      )
      .filter((text) => text.trim() !== '')
      .join('\n\n');
    if (next !== after) {
      onAfterChange?.(next);
    }
  };

  const onRowPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      const { right } = event.currentTarget.getBoundingClientRect();
      if (right - event.clientX > MOUSE_SWIPE_ZONE_PX) {
        dragOrigin.current = null;
        return;
      }
    }

    dragOrigin.current = { x: event.clientX, y: event.clientY };
    dragging.current = false;
    dragged.current = false;
  };

  const onRowPointerMove = (
    event: PointerEvent<HTMLDivElement>,
    index: number
  ) => {
    const origin = dragOrigin.current;
    if (!origin) {
      return;
    }

    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;

    if (
      !dragging.current &&
      Math.abs(dx) > DRAG_START_PX &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (dragging.current) {
      setDrag({ index, dx });
    }
  };

  const onRowPointerEnd = (index: number) => {
    const wasDragging = dragging.current;
    const current = drag;
    dragOrigin.current = null;
    dragging.current = false;

    if (!wasDragging || current?.index !== index) {
      return;
    }

    dragged.current = true;
    setDrag(null);
    const base = revealed.has(index) ? -DOTS_WIDTH_PX : 0;
    setReveal(index, base + current.dx < -DOTS_WIDTH_PX / 2);
  };

  return (
    <div data-swipe-ignore className="flex flex-col gap-3">
      {controlledSide === undefined || actions ? (
        <div className="flex items-center gap-4">
          {controlledSide === undefined
            ? SIDES.map((key) => {
                const Icon = SIDE_ICONS[key];
                const selected = side === key;

                return (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'h-8 gap-1.5 px-0 has-[>svg]:px-0 hover:bg-transparent',
                      selected
                        ? 'text-foreground underline underline-offset-4'
                        : 'text-muted-foreground'
                    )}
                    aria-pressed={selected}
                    onClick={() => {
                      setSide(key);
                    }}
                  >
                    <Icon className="size-4" />
                    {SIDE_LABELS[key]}
                  </Button>
                );
              })
            : null}
          {actions ? (
            <div className="ml-auto flex items-center gap-1">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {blocks.map((block, index) => {
        const shown = shownSide(index);
        const PinIcon = SIDE_ICONS[shown];
        const afterParagraph = block.after;
        const beforeParagraph = block.before;
        const lines = diffLines(beforeParagraph, afterParagraph, shown);
        const editStart = editing?.paragraph === index ? editing.start : null;
        const open = revealed.has(index);
        const dragDx = drag?.index === index ? drag.dx : null;
        const offset =
          dragDx === null
            ? open
              ? -DOTS_WIDTH_PX
              : 0
            : Math.min(
                0,
                Math.max(-DOTS_WIDTH_PX, (open ? -DOTS_WIDTH_PX : 0) + dragDx)
              );

        return (
          <div key={index} className="relative overflow-hidden rounded-md">
            <div
              className={cn(
                'bg-muted absolute inset-y-0 right-0 flex items-center justify-center gap-0.5',
                offset === 0 && 'pointer-events-none opacity-0'
              )}
              style={{ width: DOTS_WIDTH_PX }}
            >
              <DropdownMenu>
                <Hint label="Меню блока">
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Меню блока"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <EllipsisVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </Hint>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      pin(index, opposite(shown));
                    }}
                  >
                    <ArrowLeftRight className="size-4" />
                    Показать «{SIDE_LABELS[opposite(shown)]}»
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setHighlight((on) => !on);
                    }}
                  >
                    <Highlighter className="size-4" />
                    {highlight ? 'Скрыть подсветку' : 'Показать подсветку'}
                  </DropdownMenuItem>
                  {onAfterChange !== undefined ? (
                    <DropdownMenuItem
                      onSelect={() => {
                        startEdit(index, 0);
                      }}
                    >
                      <Pencil className="size-4" />
                      Править первые две строки
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div
              className={cn(
                'group bg-background relative touch-pan-y',
                dragDx === null && 'transition-transform duration-200 ease-out'
              )}
              style={{ transform: `translate3d(${offset}px, 0, 0)` }}
              onPointerDown={onRowPointerDown}
              onPointerMove={(event) => {
                onRowPointerMove(event, index);
              }}
              onPointerUp={() => {
                onRowPointerEnd(index);
              }}
              onPointerCancel={() => {
                onRowPointerEnd(index);
              }}
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }

                if (window.getSelection()?.toString()) {
                  return;
                }

                if (open) {
                  setReveal(index, false);
                  return;
                }

                pin(index, opposite(shown));
              }}
            >
              <div
                key={shown}
                className="animate-in fade-in-0 slide-in-from-bottom-1 pr-8 text-sm duration-300"
              >
                {lines.map((line, lineIndex) => {
                  const pairStart = lineIndex - (lineIndex % LINES_PER_EDIT);

                  if (editStart !== null && pairStart === editStart) {
                    if (lineIndex !== editStart) {
                      return null;
                    }

                    return (
                      <EditBlock
                        key={`edit-${lineIndex}`}
                        initial={afterParagraph
                          .split('\n')
                          .slice(editStart, editStart + LINES_PER_EDIT)
                          .join('\n')}
                        onCommit={(value) => {
                          commitEdit(index, editStart, value);
                        }}
                        onCancel={() => {
                          setEditing(null);
                        }}
                      />
                    );
                  }

                  return (
                    <p
                      key={lineIndex}
                      className={cn(
                        'min-h-5',
                        onAfterChange !== undefined && 'cursor-text'
                      )}
                      onDoubleClick={() => {
                        if (onAfterChange !== undefined) {
                          startEdit(index, pairStart);
                        }
                      }}
                    >
                      {line.map((piece, pieceIndex) => (
                        <span
                          key={pieceIndex}
                          className={
                            highlight && piece.changed
                              ? CHANGED_CLASSES[shown]
                              : undefined
                          }
                        >
                          {piece.text}
                        </span>
                      ))}
                    </p>
                  );
                })}
              </div>
              <div className="absolute top-0 right-0 flex items-center gap-0.5">
                {pinned.has(index) && shown !== side ? (
                  <MenuButton
                    label={`Закреплено «${SIDE_LABELS[shown]}». Нажми, чтобы снять`}
                    active
                    onClick={() => {
                      unpin(index);
                    }}
                  >
                    <PinIcon className="size-3.5" />
                  </MenuButton>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
