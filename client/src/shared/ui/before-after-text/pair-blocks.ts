export type RewriteBlock = {
  before: string;
  after: string;
};

const splitParagraphs = (text: string): string[] =>
  text.split(/\n{2,}/).filter((paragraph) => paragraph.trim() !== '');

const sectionLabel = (paragraph: string): string | null =>
  /^\[([^\]]+)\]/.exec(paragraph)?.[1] ?? null;

type Section = {
  label: string;
  paragraphs: string[];
};

const sectionsOf = (text: string): Section[] => {
  const sections: Section[] = [];

  for (const paragraph of splitParagraphs(text)) {
    const label = sectionLabel(paragraph);
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
      before: before.paragraphs[index] ?? '',
      after: after.paragraphs[index] ?? '',
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
    return [{ before: '', after: '' }];
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
