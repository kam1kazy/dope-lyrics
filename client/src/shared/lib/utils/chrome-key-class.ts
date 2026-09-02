import { cn } from '@/shared/lib/utils/cn';

export function chromeKeyClass({
  playing,
  lit = false,
  hidden = false,
  drag = false,
}: {
  playing: boolean;
  lit?: boolean;
  hidden?: boolean;
  drag?: boolean;
}) {
  const idle = !hidden && !lit;

  return cn(
    'pointer-events-auto bg-transparent transition-[opacity,color] hover:bg-transparent hover:text-inherit active:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent',
    drag && !lit && 'cursor-grab',
    drag && lit && 'cursor-grabbing',
    !drag && 'cursor-pointer',
    hidden && 'pointer-events-none opacity-0 duration-200',
    !hidden && lit && 'text-foreground opacity-100 duration-150',
    idle &&
      playing &&
      'text-muted-foreground opacity-40 duration-500 ease-[cubic-bezier(0.05,0.85,0.15,1)]',
    idle &&
      !playing &&
      'text-foreground opacity-100 duration-500 ease-[cubic-bezier(0.05,0.85,0.15,1)]'
  );
}
