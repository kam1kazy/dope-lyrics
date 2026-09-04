export const LYRIC_MOODS = [
  'AGGRESSION',
  'LONGING',
  'IRONY',
  'TENDERNESS',
  'BRAVADO',
  'ANXIETY',
  'COLD',
  'EUPHORIA',
] as const;

export const LYRIC_DELIVERIES = [
  'PUNCH',
  'FLOW',
  'HOOK',
  'SPOKEN',
  'TUNE',
  'ADLIB',
  'TONGUE_TWISTER',
] as const;

export const LYRIC_SONG_ROLES = [
  'VERSE',
  'HOOK',
  'BRIDGE',
  'INTRO',
  'SCENE',
  'PUNCHLINE',
  'SKETCH',
] as const;

export const LYRIC_READINESS = [
  'LINE',
  'FRAGMENT',
  'BLOCK',
  'TEXT',
  'READY',
] as const;

export const LYRIC_ENERGIES = [
  'WHISPER',
  'QUIET',
  'EVEN',
  'LOUD',
  'SCREAM',
] as const;

export type LyricMood = (typeof LYRIC_MOODS)[number];
export type LyricDelivery = (typeof LYRIC_DELIVERIES)[number];
export type LyricSongRole = (typeof LYRIC_SONG_ROLES)[number];
export type LyricReadiness = (typeof LYRIC_READINESS)[number];
export type LyricEnergy = (typeof LYRIC_ENERGIES)[number];

export const LYRIC_MOOD_LABELS: Record<LyricMood, string> = {
  AGGRESSION: 'агрессия',
  LONGING: 'тоска',
  IRONY: 'ирония',
  TENDERNESS: 'нежность',
  BRAVADO: 'бравада',
  ANXIETY: 'тревога',
  COLD: 'холод',
  EUPHORIA: 'эйфория',
};

export const LYRIC_DELIVERY_LABELS: Record<LyricDelivery, string> = {
  PUNCH: 'панч',
  FLOW: 'флоу',
  HOOK: 'хук',
  SPOKEN: 'spoken',
  TUNE: 'напев',
  ADLIB: 'адлиб',
  TONGUE_TWISTER: 'скороговорка',
};

export const LYRIC_SONG_ROLE_LABELS: Record<LyricSongRole, string> = {
  VERSE: 'куплет',
  HOOK: 'хук',
  BRIDGE: 'бридж',
  INTRO: 'интро',
  SCENE: 'сцена',
  PUNCHLINE: 'панчлайн',
  SKETCH: 'скетч',
};

export const LYRIC_READINESS_LABELS: Record<LyricReadiness, string> = {
  LINE: 'строка',
  FRAGMENT: 'фрагмент',
  BLOCK: 'блок',
  TEXT: 'текст',
  READY: 'готово',
};

export const LYRIC_ENERGY_LABELS: Record<LyricEnergy, string> = {
  WHISPER: 'шёпот',
  QUIET: 'тихо',
  EVEN: 'ровно',
  LOUD: 'громко',
  SCREAM: 'крик',
};

export const LYRIC_MOOD_HINTS: Record<LyricMood, string> = {
  AGGRESSION: 'Злость, давление, угроза — текст прёт вперёд.',
  LONGING: 'Тоска и нехватка: кого-то или чего-то уже нет.',
  IRONY: 'Издёвка и перевёртыш: сказано не в лоб.',
  TENDERNESS: 'Тепло и мягкость, без брони.',
  BRAVADO: 'Понты и уверенность: «я сверху».',
  ANXIETY: 'Тревога и напряжение, будто сейчас рванёт.',
  COLD: 'Лёд и дистанция: без тепла, без жалости.',
  EUPHORIA: 'Кайф и подъём, эйфория момента.',
};

export const LYRIC_DELIVERY_HINTS: Record<LyricDelivery, string> = {
  PUNCH: 'Ударная строка, которую хочется запомнить.',
  FLOW: 'Держит ритм и катится, без отдельного хука.',
  HOOK: 'Цепляющий повтор, который хочется петь.',
  SPOKEN: 'Почти речь: мало распева, больше сказанного.',
  TUNE: 'Напев: мелодия в голосе важнее удара.',
  ADLIB: 'Короткая вставка, отклик, выкрик сбоку.',
  TONGUE_TWISTER: 'Плотная скороговорка, слова летят часто.',
};

export const LYRIC_SONG_ROLE_HINTS: Record<LyricSongRole, string> = {
  VERSE: 'Основной куплет — рассказ и развитие.',
  HOOK: 'Припев песни, место, куда всё сходится.',
  BRIDGE: 'Переход между частями, смена воздуха.',
  INTRO: 'Вход и зачин, до основного движения.',
  SCENE: 'Картинка или момент, не обязательно куплет.',
  PUNCHLINE: 'Финальный удар, ради которого держали паузу.',
  SKETCH: 'Набросок: ещё не ясно, куда в песне ляжет.',
};

export const LYRIC_READINESS_HINTS: Record<LyricReadiness, string> = {
  LINE: 'Одна-две строки, ещё не кусок.',
  FRAGMENT: 'Фрагмент: уже больше строки, ещё не блок.',
  BLOCK: 'Собранный кусок, ближе к куплету.',
  TEXT: 'Почти целый текст, можно собирать трек.',
  READY: 'Готово: можно в трек или убрать с карусели.',
};

export const LYRIC_ENERGY_HINTS: Record<LyricEnergy, string> = {
  WHISPER: 'Шёпот: почти без накала, вплотную к уху.',
  QUIET: 'Тихо: сдержанный голос, без давления.',
  EVEN: 'Ровно: обычный уровень, без крайностей.',
  LOUD: 'Громко: напор и объём, уже не шепчет.',
  SCREAM: 'Крик: максимум накала, строка орёт.',
};

export type LyricRoleProfile = {
  songRole: LyricSongRole;
  mood: LyricMood[];
  delivery: LyricDelivery[];
};

export function selectFacetValue<T extends string>(
  current: readonly T[],
  item: T,
  multiple: boolean
): T[] {
  if (current.includes(item)) {
    return [...current];
  }

  if (multiple) {
    return [...current, item];
  }

  return [item];
}

export function disableFacetValue<T extends string>(
  current: readonly T[],
  item: T
): T[] {
  return current.filter((entry) => entry !== item);
}

export function toggleFacetValue<T extends string>(
  current: readonly T[],
  item: T,
  multiple: boolean
): T[] {
  if (current.includes(item)) {
    return disableFacetValue(current, item);
  }

  return selectFacetValue(current, item, multiple);
}

export function clickFacetFilter<T extends string>(
  included: readonly T[],
  excluded: readonly T[],
  item: T,
  multiple: boolean
): { included: T[]; excluded: T[] } {
  if (excluded.includes(item)) {
    return {
      included: [...included],
      excluded: excluded.filter((entry) => entry !== item),
    };
  }

  if (included.includes(item)) {
    return {
      included: included.filter((entry) => entry !== item),
      excluded: [...excluded],
    };
  }

  return {
    included: multiple ? [...included, item] : [item],
    excluded: [...excluded],
  };
}

export function toggleExcludeFacetFilter<T extends string>(
  included: readonly T[],
  excluded: readonly T[],
  item: T
): { included: T[]; excluded: T[] } {
  if (excluded.includes(item)) {
    return {
      included: [...included],
      excluded: excluded.filter((entry) => entry !== item),
    };
  }

  return {
    included: included.filter((entry) => entry !== item),
    excluded: [...excluded, item],
  };
}

export function upsertRoleProfile(
  profiles: readonly LyricRoleProfile[],
  songRole: LyricSongRole,
  seed: { mood: LyricMood[]; delivery: LyricDelivery[] }
): LyricRoleProfile[] {
  if (profiles.some((profile) => profile.songRole === songRole)) {
    return [...profiles];
  }

  return [
    ...profiles,
    {
      songRole,
      mood: [...seed.mood],
      delivery: [...seed.delivery],
    },
  ];
}

export function patchRoleProfile(
  profiles: readonly LyricRoleProfile[],
  songRole: LyricSongRole,
  patch: Partial<Pick<LyricRoleProfile, 'mood' | 'delivery'>>
): LyricRoleProfile[] {
  return profiles.map((profile) =>
    profile.songRole === songRole ? { ...profile, ...patch } : profile
  );
}
