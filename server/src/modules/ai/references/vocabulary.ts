import { AiProviderError } from '~/modules/ai/model/polza.client';

/** Словари граней для модели: те же коды, что у заметок автора. */
export const FACET_VOCABULARY = [
  'Настроение (mood): AGGRESSION — злость и давление; LONGING — тоска и нехватка; IRONY — издёвка, сказано не в лоб; TENDERNESS — тепло без брони; BRAVADO — понты, «я сверху»; ANXIETY — тревога; COLD — лёд и дистанция; EUPHORIA — кайф и подъём.',
  'Подача (delivery): PUNCH — ударная строка; FLOW — держит ритм и катится; HOOK — цепляющий повтор; SPOKEN — почти речь; TUNE — напев, мелодия важнее удара; ADLIB — вставка сбоку; TONGUE_TWISTER — плотная скороговорка.',
  'Роль в треке (songRole): VERSE — куплет; HOOK — припев; BRIDGE — переход; INTRO — зачин; SCENE — картинка-момент; PUNCHLINE — финальный удар; SKETCH — набросок.',
  'Энергия (energy): WHISPER — шёпот; QUIET — тихо; EVEN — ровно; LOUD — громко; SCREAM — крик.',
].join('\n');

/** JSON из ответа модели: срезает блок кода и текст вокруг объекта. */
export const parseModelJson = (raw: string, message: string): unknown => {
  const unwrapped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = unwrapped.indexOf('{');
  const end = unwrapped.lastIndexOf('}');

  if (start === -1 || end <= start) {
    throw new AiProviderError(message);
  }

  try {
    return JSON.parse(unwrapped.slice(start, end + 1));
  } catch {
    throw new AiProviderError(message);
  }
};

/** Только известные значения, без повторов. */
export const keepKnown = <T extends string>(
  values: readonly unknown[] | undefined,
  isValid: (value: string) => value is T
): T[] => [
  ...new Set(
    (values ?? []).filter(
      (value): value is T => typeof value === 'string' && isValid(value)
    )
  ),
];

export const clipLines = (text: string, limit: number): string =>
  text.trim().split(/\r?\n/).slice(0, limit).join('\n');

/** Срезает ссылки-источники, которые модель тащит из поиска: [текст](url) → текст, остальное — прочь. */
export const stripSources = (text: string): string =>
  text
    .replace(/\[([^\]]+)\]\(\s*https?:\/\/[^)\s]*\s*\)/g, '$1')
    .replace(/\(\s*\[?[^()]*?\]?\(?\s*https?:\/\/[^)\s]*\s*\)?\s*\)/g, '')
    .replace(/(источник|источники|source)\s*:\s*/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s.]*$/, (tail) => (tail.includes('.') ? '.' : ''))
    .trim();
