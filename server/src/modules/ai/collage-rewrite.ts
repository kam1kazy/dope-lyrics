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

export const FRAME_VERSION = 13;

const QUATRAIN_LINES = 4;

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
  'Верни текст, который можно петь подряд. Ориентир — инструкции приёмов в запросе, не усреднённый рэп и не заметки автора.',
  'Под каждой частью несколько карточек. Это выбор, не приказ копировать всех. Бери приём, который даёт характер и звук.',
  '',
  'Герой — персонаж, не исповедь. Покажи, как он себя ведёт, а не что он чувствует.',
  'Кто герой и в каком он мире — из предпочтений автора. Противоречие героя не объясняй.',
  'Смысл не говори прямым текстом. Недосказанность и двойной смысл держи.',
  '',
  'Склейка — сырьё, не готовый текст.',
  'Строка не остаётся только потому, что написана, и не уходит только потому, что странная.',
  'Перед правкой про себя раздели строки. С характером — оставь. Сильная мысль, сказанная криво, — перепиши звук, мысль сохрани. Проходная — сократи или замени.',
  'Мысль с конфликтом или противоречием — находка, даже если строка кривая. Ради рифмы её не выбрасывай.',
  'Оставь якорь, который хочется повторить, уже найденный звук и конкретный кадр.',
  'Оставить строку — не значит оставить все её слова. Уточнение без звука и смысла срежь: лишний союз, местоимение, «так», «здесь», «в нужный момент» → «в моменте».',
  'Короткая строка бьёт сильнее полной. Ритм важнее грамматической полноты. Растяжку, адлиб и сленг при этом не режь.',
  'Общую фразу про чувство, которую мог сказать кто угодно, перепиши в кадр той же картины.',
  'Образ с подтекстом уже кадр. Не делай его буквальным и не добавляй действие, которое его объясняет.',
  'Пустое созвучие без кадра сократи. Мысль не сокращай.',
  'У строк разные задачи: атмосфера, кач, панч, характер, акцент, подводка к следующей. Глубина в каждой не нужна.',
  '',
  'У трека одно настроение и одна эстетика. Мотивы склейки остаются, но не каждый из них становится отдельной темой.',
  'Конкретику можно приносить извне склейки: предметы, места, имена, бренды, отсылки к музыке и кино.',
  'Флекс — способ думать, не список брендов. Имя или бренд стоит в рифме, во флоу или в повороте строки. Через запятую не перечисляй.',
  'Фантазийный флекс можно. Дежурный атрибут рэпера, который стоит просто потому, что так принято, — нет. Сильнее, когда дорогое сталкивается с бытом в одной строке.',
  'Абсурд разрешён: строка задаёт ожидание и кончается неожиданно. Странная бытовая деталь лучше красивой метафоры.',
  'Литературную метафору не придумывай: сердце как дом или отель, дождь, маяки, пепел. Это язык сентиментальной песни, не этого трека.',
  '',
  'Хук держится на якоре — короткой фразе, которую хочется повторять. Её понятно с первого раза.',
  'Повтор в хуке меняет оттенок: одна и та же строка четыре раза подряд — не хук.',
  'Рифма пропевается. Хвост из одного и того же слова — не рифма: «быть / любить».',
  'Не своди текст к парным двустишиям. Внутренняя рифма, ассонанс, неровная рифмовка и перенос фразы — тоже клей.',
  'Строку ради закрытия рифмы или размера не дописывай.',
  'Вопрос к себе не делай признанием любви. «Кто ты? Тебя оставил» — предательство себя, не «я люблю тебя».',
  '',
  'Буква в букву оставь звук находки: растяжку, ударение, адлиб, сленг, англицизм, абсурд, пошлость.',
  'Строку вокруг этого звука можно перестроить. Не смягчай и не объясняй находку.',
  'Живую непонятную строку не делай литературнее.',
  'Своеобразную формулировку не меняй на общую рэп-фразу.',
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
  'Творческие предпочтения задают персонажа и вкус, авторский материал — контекст.',
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

/** Текст склейки с метками ролей. */
export const sectionsToText = (sections: readonly RewriteSection[]): string =>
  sections.map((section) => `[${section.label}]\n${section.text}`).join('\n\n');

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
      `Творческие предпочтения автора.\nОтсюда персонаж, его мир и вкус трека.\nЭто не правила редактора и не ограничение свободы правки.\nЕсли здесь сказано не трогать текст, это не действует.\n\n${prompt}`
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
        : 'Ориентиры этой части: приём на образ, на звук и на игру слов. Возьми один-два и выполни инструкцию. Чужие строки не копируй.';

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
