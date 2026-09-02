import { GraphQLError } from 'graphql';

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

export type LyricMood = (typeof LYRIC_MOODS)[number];
export type LyricDelivery = (typeof LYRIC_DELIVERIES)[number];
export type LyricSongRole = (typeof LYRIC_SONG_ROLES)[number];
export type LyricReadiness = (typeof LYRIC_READINESS)[number];

const isIn = <T extends string>(
  list: readonly T[],
  value: string
): value is T => {
  return (list as readonly string[]).includes(value);
};

export const isLyricMood = (value: string): value is LyricMood =>
  isIn(LYRIC_MOODS, value);

export const isLyricDelivery = (value: string): value is LyricDelivery =>
  isIn(LYRIC_DELIVERIES, value);

export const isLyricSongRole = (value: string): value is LyricSongRole =>
  isIn(LYRIC_SONG_ROLES, value);

export const isLyricReadiness = (value: string): value is LyricReadiness =>
  isIn(LYRIC_READINESS, value);

/** Абзац = 4 непустые строки; READY только вручную. */
export const readinessFromLineCount = (
  lineCount: number | null | undefined
): LyricReadiness | null => {
  const lines = lineCount ?? 0;
  if (lines < 1) {
    return null;
  }
  if (lines < 4) {
    return 'LINE';
  }
  const paragraphs = Math.floor(lines / 4);
  if (paragraphs <= 4) {
    return 'FRAGMENT';
  }
  if (paragraphs <= 8) {
    return 'BLOCK';
  }
  return 'TEXT';
};

export type LyricRoleProfile = {
  songRole: LyricSongRole;
  mood: LyricMood[];
  delivery: LyricDelivery[];
};

export type LyricProfilePatch = {
  mood?: LyricMood[];
  delivery?: LyricDelivery[];
  songRole?: LyricSongRole[];
  roleProfiles?: LyricRoleProfile[];
  readiness?: LyricReadiness | null;
};

export type RoleProfilesMap = Partial<
  Record<LyricSongRole, { mood: LyricMood[]; delivery: LyricDelivery[] }>
>;

const parseFacet = <T extends string>(
  value: string | null | undefined,
  isValid: (candidate: string) => candidate is T,
  label: string
): T | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!isValid(value)) {
    throw new GraphQLError(`Неизвестное значение для поля «${label}»`);
  }

  return value;
};

const parseFacetList = <T extends string>(
  value: readonly string[] | null | undefined,
  isValid: (candidate: string) => candidate is T,
  label: string
): T[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return [];
  }

  const result: T[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!isValid(item)) {
      throw new GraphQLError(`Неизвестное значение для поля «${label}»`);
    }

    if (seen.has(item)) {
      continue;
    }

    seen.add(item);
    result.push(item);
  }

  return result;
};

const parseRoleProfileItem = (value: unknown): LyricRoleProfile => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new GraphQLError('Некорректный профиль роли');
  }

  const record = value as Record<string, unknown>;
  const songRoleRaw =
    typeof record.songRole === 'string' ? record.songRole : '';

  if (!isLyricSongRole(songRoleRaw)) {
    throw new GraphQLError('Неизвестное значение для поля «роль в песне»');
  }

  const mood = parseFacetList(
    Array.isArray(record.mood)
      ? record.mood.filter((item): item is string => typeof item === 'string')
      : [],
    isLyricMood,
    'настроение'
  );
  const delivery = parseFacetList(
    Array.isArray(record.delivery)
      ? record.delivery.filter(
          (item): item is string => typeof item === 'string'
        )
      : [],
    isLyricDelivery,
    'подача'
  );

  return {
    songRole: songRoleRaw,
    mood: mood ?? [],
    delivery: delivery ?? [],
  };
};

export const parseRoleProfilesInput = (
  value: unknown
): LyricRoleProfile[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new GraphQLError('Некорректный список ролей');
  }

  const result: LyricRoleProfile[] = [];
  const seen = new Set<LyricSongRole>();

  for (const item of value) {
    const profile = parseRoleProfileItem(item);

    if (seen.has(profile.songRole)) {
      continue;
    }

    seen.add(profile.songRole);
    result.push(profile);
  }

  return result;
};

export const roleProfilesFromJson = (value: unknown): LyricRoleProfile[] => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [];
  }

  const result: LyricRoleProfile[] = [];

  for (const role of LYRIC_SONG_ROLES) {
    const entry = (value as Record<string, unknown>)[role];

    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      continue;
    }

    try {
      result.push(
        parseRoleProfileItem({
          songRole: role,
          ...(entry as Record<string, unknown>),
        })
      );
    } catch {
      continue;
    }
  }

  return result;
};

export const roleProfilesToJson = (
  profiles: LyricRoleProfile[]
): RoleProfilesMap => {
  const map: RoleProfilesMap = {};

  for (const profile of profiles) {
    map[profile.songRole] = {
      mood: profile.mood,
      delivery: profile.delivery,
    };
  }

  return map;
};

export const parseLyricProfilePatch = (input: {
  mood?: string[] | null;
  delivery?: string[] | null;
  songRole?: string[] | null;
  roleProfiles?: unknown;
  readiness?: string | null;
}): LyricProfilePatch => {
  const roleProfiles = parseRoleProfilesInput(input.roleProfiles);
  const songRole =
    roleProfiles !== undefined
      ? roleProfiles.map((profile) => profile.songRole)
      : parseFacetList(input.songRole, isLyricSongRole, 'роль в песне');

  return {
    mood: parseFacetList(input.mood, isLyricMood, 'настроение'),
    delivery: parseFacetList(input.delivery, isLyricDelivery, 'подача'),
    songRole,
    roleProfiles,
    readiness: parseFacet(input.readiness, isLyricReadiness, 'готовность'),
  };
};
