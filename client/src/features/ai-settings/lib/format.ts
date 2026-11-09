import type { IAiPromptVersion } from '../api/queries';

export const formatRub = (value: number | null): string =>
  value === null ? '—' : `${value.toFixed(2)} ₽`;

export const formatTokens = (value: number): string =>
  value.toLocaleString('ru-RU');

export const firstLine = (text: string): string =>
  text
    .split('\n')
    .find((line) => line.trim() !== '')
    ?.trim() ?? '';

export const versionTitle = (version: IAiPromptVersion): string =>
  version.name ?? `Версия ${version.number}`;
