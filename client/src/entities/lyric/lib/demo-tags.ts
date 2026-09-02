export const UNNAMED_DEMO_NAME = '__unnamed__';

export const UNNAMED_DEMO_LABEL = 'Без названия';

export function formatDemoName(name: string): string {
  return name === UNNAMED_DEMO_NAME ? UNNAMED_DEMO_LABEL : name;
}

export function previewLyricText(
  text: string | null | undefined,
  maxLines = 3
) {
  if (!text?.trim()) {
    return 'Без текста';
  }

  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  return lines.slice(0, maxLines).join('\n');
}
