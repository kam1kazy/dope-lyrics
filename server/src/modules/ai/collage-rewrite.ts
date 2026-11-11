import {
  type ArtistProfile,
  formatArtistCards,
} from '~/modules/ai/artist-orientation';
import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import {
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

export const FRAME_VERSION = 10;

const QUATRAIN_LINES = 4;
const MAX_EXAMPLE_LINES = 8;

const ROLE_LABELS: Record<LyricSongRole, string> = {
  INTRO: 'Интро',
  VERSE: 'Куплет',
  HOOK: 'Хук',
  BRIDGE: 'Бридж',
  SCENE: 'Сцена',
  PUNCHLINE: 'Панч',
  SKETCH: 'Набросок',
};

export const COLLAGE_REWRITE_FRAME = [
  'Ты собираешь из случайной склейки готовый рэп-трек. Автор пишет по-русски.',
  'Направление — мелодичный dark trap: тёмная подложка, абсурд и wordplay, цепкие короткие фразы, наглый персонаж.',
  'Верни текст, который можно петь подряд. Ориентир — инструкции приёмов в запросе, не усреднённый рэп и не заметки автора.',
  'Под каждой частью несколько карточек. Это выбор, не приказ копировать всех. Бери приём, который даёт характер и звук, не жалобу.',
  '',
  'Герой — персонаж, не исповедь. Покажи, как он себя ведёт, а не что он чувствует.',
  'Слабость подай жестом силы или отстранённости, не просьбой понять. Герой не оправдывается и не ноет.',
  'Жалобу и позу обиженного перепиши в наглость, флекс, иронию или холод. Тёмная подложка остаётся под ними.',
  'Герой противоречивый и самоуверенный, иногда нелепый. Противоречие не объясняй.',
  'Смысл не говори прямым текстом: он читается из поступка и детали.',
  '',
  'Склейка — сырьё, не готовый текст.',
  'Строка не остаётся только потому, что она уже написана. Личная строка, которая плохо звучит, — тоже.',
  'Оставь якорь, который хочется повторить, уже найденный звук и конкретный кадр.',
  'Общую фразу про чувство перепиши в предмет, место или жест той же картины.',
  'Пустое созвучие без кадра сократи. Лучше четыре сильные строки, чем шестнадцать проходных.',
  'У строк разные задачи: атмосфера, кач, панч, характер, акцент, подводка к следующей. Глубина в каждой не нужна.',
  '',
  'У трека одно настроение и одна эстетика. Мотивы склейки остаются, но не каждый из них становится отдельной темой.',
  'Конкретику можно приносить извне склейки: шмот и кутюр, тачки, имена артистов и селебрити, музыку, кино, быт, интернет.',
  'Флекс — способ думать, не список брендов. Имя или бренд стоит в рифме, во флоу или в повороте строки. Через запятую не перечисляй.',
  'Фантазийный флекс можно. Дежурный атрибут рэпера, который стоит просто потому, что так принято, — нет. Сильнее, когда дорогое сталкивается с бытом в одной строке.',
  'Абсурд разрешён: строка задаёт ожидание и кончается неожиданно. Странная бытовая деталь лучше красивой метафоры.',
  'Литературную метафору не придумывай: сердце как дом или отель, дождь, маяки, пепел. Это язык сентиментальной песни, не этого трека.',
  '',
  'Хук держится на якоре — короткой фразе, которую хочется повторять. Её понятно с первого раза.',
  'Повтор в хуке меняет оттенок: одна и та же строка четыре раза подряд — не хук.',
  'Рифма пропевается. Хвост из одного и того же слова — не рифма: «быть / любить».',
  'Вопрос к себе не делай признанием любви. «Кто ты? Тебя оставил» — предательство себя, не «я люблю тебя».',
  '',
  'Буква в букву оставь звук находки: растяжку, ударение, адлиб, сленг, англицизм, абсурд, пошлость.',
  'Строку вокруг этого звука можно перестроить. Не смягчай и не объясняй находку.',
  'Живую непонятную строку не делай литературнее.',
  '',
  'Написание в заметках передаёт исполнение, не орфографию.',
  'Повтор буквы — протянуть и пропеть звук: быыыыть, Жааааль, дофигааа. Это не опечатка.',
  'Заглавная внутри слова — ударение или акцент: почИтать, замЕр. Оно может расходиться с нормативным русским, если так встаёт рифма или ритм.',
  'Разговорную форму, сленг и кривое произношение не выправляй в литературную норму, если на них держится звук.',
  'Эти приёмы можно ставить в новой строке. Не ставь их в каждую и не сыпь растяжки механически.',
  '',
  'Новая строка выполняет одну инструкцию приёма этой части: действие внутри строки, не общее настроение.',
  'Чужие тексты не копируй.',
  'После замены строка звучит сказанной, а не объяснением приёма.',
  '',
  'Другую песню не пиши: мотивы склейки остаются, меняется подача.',
  'Школьный рассказ и объяснение чувства не собирай.',
  'Творческие предпочтения и авторский материал в запросе — контекст.',
  'Они не правила редактора и не запрет на правку, даже если там сказано не трогать текст.',
  'Тему трека бери только из поля темы.',
  'Сохрани метки частей в квадратных скобках и порядок частей. Пустых частей не добавляй.',
  'Ответь только текстом трека. Без вступления, пояснений и markdown.',
].join('\n');

const hideAdlibsInText = (text: string): string =>
  text
    .replace(/\([^)]*\)/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');

const toQuatrains = (lines: string[]): string => {
  const stanzas: string[] = [];

  for (let index = 0; index < lines.length; index += QUATRAIN_LINES) {
    stanzas.push(lines.slice(index, index + QUATRAIN_LINES).join('\n'));
  }

  return stanzas.join('\n\n');
};

export type RewriteSection = {
  index: number;
  sectionId: string;
  songRole: LyricSongRole;
  label: string;
  text: string;
  lyricIds: number[];
};

/** Непустые части склейки; второй хук не дублируется. */
export const collectRewriteSections = (
  slots: CollageSlotStored[],
  textsById: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): RewriteSection[] => {
  const sections: RewriteSection[] = [];

  slots.forEach((slot, index) => {
    if (index === SECOND_HOOK_INDEX) {
      return;
    }

    const chunks = slot.parts
      .map((part) => {
        const raw = textsById.get(part.lyricId);
        if (!raw) {
          return '';
        }

        const sliced = splitGeneratorLines(raw)
          .slice(part.startLine, part.endLine)
          .join('\n');

        return hideAdlibs ? hideAdlibsInText(sliced) : sliced;
      })
      .filter((chunk) => chunk.length > 0);

    const lines = chunks.join('\n').split('\n').filter(Boolean);
    if (lines.length === 0) {
      return;
    }

    sections.push({
      index,
      sectionId: `${index}:${slot.songRole}`,
      songRole: slot.songRole,
      label: ROLE_LABELS[slot.songRole],
      text: toQuatrains(lines),
      lyricIds: slot.parts.map((part) => part.lyricId),
    });
  });

  return sections;
};

/** Текст склейки с метками ролей; второй хук не дублируется. */
export const buildSourceText = (
  slots: CollageSlotStored[],
  textsById: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): string =>
  collectRewriteSections(slots, textsById, hideAdlibs)
    .map((section) => `[${section.label}]\n${section.text}`)
    .join('\n\n');

/** Пример для модели: чистый текст, не длиннее 8 строк. */
export const toExampleText = (raw: string): string =>
  splitGeneratorLines(raw).slice(0, MAX_EXAMPLE_LINES).join('\n');

/** Только эталоны: случайные фразы из пула модель принимает за норму. */
export const pickStyleExamples = (
  references: readonly string[],
  limit: number
): string[] =>
  references
    .map(toExampleText)
    .filter((text) => text.length > 0)
    .slice(0, limit);

export type RewriteUserSection = {
  label: string;
  text: string;
  artists: readonly ArtistProfile[];
  relaxed: boolean;
};

/** В системе только правила редактора. Промпт автора сюда не входит. */
export const buildRewriteSystem = (): string => COLLAGE_REWRITE_FRAME;

export const buildRewriteUser = (input: {
  theme: string | null;
  authorPrompt: string;
  examples: readonly string[];
  sections: readonly RewriteUserSection[];
}): string => {
  const parts: string[] = [];
  const prompt = input.authorPrompt.trim();

  if (input.theme) {
    parts.push(
      `Тема трека: ${input.theme}\nДержи смысл в этой теме. Предпочтения ниже её не подменяют.`
    );
  }

  if (prompt) {
    parts.push(
      `Творческие предпочтения автора.\nЭто контекст, не правила редактора и не ограничение свободы правки.\nЕсли здесь сказано не трогать текст, это не действует.\n\n${prompt}`
    );
  }

  if (input.examples.length > 0) {
    parts.push(
      `Дополнительный авторский материал.\nИспользуй его как источник идей и образов, но не считай образцом качества или ограничением стиля:\n${input.examples.join('\n---\n')}`
    );
  }

  const collage = input.sections
    .map((section) => {
      const head = `[${section.label}]\n${section.text}`;
      if (section.artists.length === 0) {
        return head;
      }

      const note = section.relaxed
        ? 'Прямых совпадений мало. Ниже ближайшие карточки. Возьми один-два приёма, не все.'
        : 'Ориентиры этой части. Возьми один-два приёма и выполни инструкцию. Чужие строки не копируй.';

      return `${head}\n\n${note}\n${formatArtistCards(section.artists)}`;
    })
    .join('\n\n');

  parts.push(`Склейка, из которой собрать трек:\n${collage}`);

  return parts.join('\n\n');
};

/** Срезает «Вот текст:» и обёртку из тройных кавычек. */
export const stripModelWrapper = (text: string): string => {
  let result = text.trim();

  const fenced = /^```[a-zA-Zа-яА-Я]*\n([\s\S]*?)\n?```$/.exec(result);
  if (fenced?.[1] !== undefined) {
    result = fenced[1].trim();
  }

  const lines = result.split('\n');
  const first = lines[0]?.trim() ?? '';
  if (/^(вот|держи|ниже|конечно)[^[\n]*:$/i.test(first)) {
    result = lines.slice(1).join('\n').trim();
  }

  const unwrapped = /^```[a-zA-Zа-яА-Я]*\n([\s\S]*?)\n?```$/.exec(result);
  if (unwrapped?.[1] !== undefined) {
    result = unwrapped[1].trim();
  }

  return result;
};
