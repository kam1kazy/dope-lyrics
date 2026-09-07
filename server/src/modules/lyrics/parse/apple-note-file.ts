export type AppleNoteFile = {
  text: string;
  date: Date;
  editDate: Date;
  hasMeta: boolean;
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export const normalizeAppleNoteText = (raw: string): string =>
  raw
    .replace(/\u2028/g, '\n')
    .replace(/\u2029/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

const parseIso = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const yamlField = (yaml: string, key: string): string | null => {
  const match = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(yaml);
  const value = match?.[1]?.trim();
  return value ? value : null;
};

export const parseAppleNoteFile = (
  raw: string,
  fallbackDate: Date
): AppleNoteFile => {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) {
    const text = normalizeAppleNoteText(raw);
    return {
      text,
      date: fallbackDate,
      editDate: fallbackDate,
      hasMeta: false,
    };
  }

  const yaml = match[1] ?? '';
  const created = parseIso(yamlField(yaml, 'created'));
  const modified = parseIso(yamlField(yaml, 'modified'));

  if (!created) {
    const text = normalizeAppleNoteText(raw);
    return {
      text,
      date: fallbackDate,
      editDate: fallbackDate,
      hasMeta: false,
    };
  }

  const body = raw.slice(match[0].length);
  return {
    text: normalizeAppleNoteText(body),
    date: created,
    editDate: modified ?? created,
    hasMeta: true,
  };
};
