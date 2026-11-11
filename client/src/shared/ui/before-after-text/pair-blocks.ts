export type RewriteBlock = {
  before: string;
  after: string;
  /** Индекс первой строки абзаца «после» в `after.split('\n')`; `-1`, если абзаца нет. */
  afterLine: number;
};

type Paragraph = { text: string; line: number };

const countLines = (text: string): number => text.split('\n').length - 1;

const splitParagraphs = (text: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  let start = 0;

  const push = (end: number) => {
    const chunk = text.slice(start, end);
    if (chunk.trim() !== '') {
      paragraphs.push({ text: chunk, line: countLines(text.slice(0, start)) });
    }
  };

  for (const match of text.matchAll(/\n{2,}/g)) {
    push(match.index);
    start = match.index + match[0].length;
  }
  push(text.length);

  return paragraphs;
};

const sectionLabel = (paragraph: string): string | null =>
  /^\[([^\]]+)\]/.exec(paragraph)?.[1] ?? null;

type Section = {
  label: string;
  paragraphs: Paragraph[];
};

const sectionsOf = (text: string): Section[] => {
  const sections: Section[] = [];

  for (const paragraph of splitParagraphs(text)) {
    const label = sectionLabel(paragraph.text);
    if (label !== null) {
      sections.push({ label, paragraphs: [paragraph] });
      continue;
    }

    const current = sections[sections.length - 1];
    if (current) {
      current.paragraphs.push(paragraph);
    } else {
      sections.push({ label: '', paragraphs: [paragraph] });
    }
  }

  return sections;
};

const pairSection = (before: Section, after: Section): RewriteBlock[] => {
  const count = Math.max(before.paragraphs.length, after.paragraphs.length);
  const blocks: RewriteBlock[] = [];

  for (let index = 0; index < count; index += 1) {
    blocks.push({
      before: before.paragraphs[index]?.text ?? '',
      after: after.paragraphs[index]?.text ?? '',
      afterLine: after.paragraphs[index]?.line ?? -1,
    });
  }

  return blocks;
};

/** Абзацы внутри части сравниваются по порядку. Лишний абзац не склеивает весь текст. */
export const pairRewriteBlocks = (
  before: string,
  after: string
): RewriteBlock[] => {
  const left = sectionsOf(before);
  const right = sectionsOf(after);

  if (left.length === 0 && right.length === 0) {
    return [{ before: '', after: '', afterLine: -1 }];
  }

  const count = Math.max(left.length, right.length);
  const blocks: RewriteBlock[] = [];

  for (let index = 0; index < count; index += 1) {
    blocks.push(
      ...pairSection(
        left[index] ?? { label: '', paragraphs: [] },
        right[index] ?? { label: '', paragraphs: [] }
      )
    );
  }

  return blocks;
};
