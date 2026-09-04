import { GraphQLError } from 'graphql';

import { lyricInclude } from '~/graphql/lyric-include';
import { prisma } from '~/infrastructure/prisma';
import {
  buildCarouselPreviewText,
  type CarouselHistorySource,
  isCarouselHistorySource,
  pickIdsToEvict,
} from '~/modules/lyrics/carousel-history';
import {
  activityRangeStart,
  buildCatalogActivity,
  buildCatalogStats,
  isCatalogActivityDays,
} from '~/modules/lyrics/catalog-stats';
import { listLyricDemos } from '~/modules/lyrics/lyric-demos';
import {
  type LyricProfilePatch,
  parseLyricProfilePatch,
  roleProfilesToJson,
} from '~/modules/lyrics/lyric-facets';
import {
  buildGluedText,
  cleanedIndexShiftMap,
  collectTakenRangesByLyric,
  remapCollageSlotsAfterRip,
  ripCleanedRangesFromText,
} from '~/modules/lyrics/lyric-glue';
import {
  assertNonEmptyLyricText,
  buildSliceFromRanges,
  type LyricLineRange,
  readinessAfterTextChange,
  splitTextAtLine,
  textCounts,
} from '~/modules/lyrics/lyric-text';
import type { IChatHistoryItem } from '~/modules/lyrics/lyrics.types';
import {
  buildLyricsWhere,
  type LyricsListOptions,
} from '~/modules/lyrics/lyrics-list-filters';
import { createLyricData } from '~/modules/lyrics/persist/create-lyric-data';
import { shuffleIds, toShuffleSeed } from '~/modules/lyrics/shuffle-ids';
import {
  assembleSlotsFromPools,
  lyricIdsFromSlots,
  parseCollageSlotsInput,
  parseTrackFormQuotas,
  type PoolLyric,
  remapCollageSlotsAfterSplit,
  slotsFromJson,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';
import { usersService } from '~/modules/users/users.service';

const INSERT_CONCURRENCY = 8;

export class LyricsService {
  private readonly prisma = prisma;

  async list(options: LyricsListOptions) {
    const where = buildLyricsWhere(options);

    if (options.shuffleSeed != null && Number.isFinite(options.shuffleSeed)) {
      const rows = await this.prisma.lyrics.findMany({
        where,
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      const pageIds = shuffleIds(
        rows.map((row) => row.id),
        toShuffleSeed(options.shuffleSeed)
      ).slice(options.offset, options.offset + options.limit);

      if (pageIds.length === 0) {
        return [];
      }

      const page = await this.prisma.lyrics.findMany({
        where: { id: { in: pageIds } },
        include: lyricInclude,
      });
      const byId = new Map(page.map((row) => [row.id, row]));

      return pageIds.flatMap((id) => {
        const row = byId.get(id);
        return row ? [row] : [];
      });
    }

    const dateOrder = options.oldestFirst ? 'asc' : 'desc';

    return this.prisma.lyrics.findMany({
      where,
      take: options.limit,
      skip: options.offset,
      orderBy: [{ date: dateOrder }, { lyric_id: dateOrder }],
      include: lyricInclude,
    });
  }

  async listOrderedIds(options: LyricsListOptions): Promise<number[]> {
    const where = buildLyricsWhere(options);

    if (options.shuffleSeed != null && Number.isFinite(options.shuffleSeed)) {
      const rows = await this.prisma.lyrics.findMany({
        where,
        select: { id: true },
        orderBy: { id: 'asc' },
      });

      return shuffleIds(
        rows.map((row) => row.id),
        toShuffleSeed(options.shuffleSeed)
      );
    }

    const dateOrder = options.oldestFirst ? 'asc' : 'desc';
    const rows = await this.prisma.lyrics.findMany({
      where,
      select: { id: true },
      orderBy: [{ date: dateOrder }, { lyric_id: dateOrder }],
    });

    return rows.map((row) => row.id);
  }

  async listByIds(ids: number[]) {
    const orderedIds = ids.filter((id) => Number.isInteger(id) && id > 0);

    if (orderedIds.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(orderedIds)];
    const page = await this.prisma.lyrics.findMany({
      where: { id: { in: uniqueIds } },
      include: lyricInclude,
    });
    const byId = new Map(page.map((row) => [row.id, row]));

    return orderedIds.flatMap((id) => {
      const row = byId.get(id);
      return row ? [row] : [];
    });
  }

  async listLyricIds(): Promise<number[]> {
    const rows = await this.prisma.lyrics.findMany({
      select: { lyric_id: true },
    });
    return rows.map((row) => row.lyric_id);
  }

  async listTags(): Promise<string[]> {
    const rows = await this.prisma.hashtags.findMany({
      select: { tags: true },
    });

    const uniqueTags = new Set<string>();

    for (const row of rows) {
      for (const tag of row.tags) {
        const value = tag.trim();

        if (value) {
          uniqueTags.add(value);
        }
      }
    }

    return [...uniqueTags].sort((a, b) => a.localeCompare(b, 'ru'));
  }

  async listEmojis(): Promise<string[]> {
    const rows = await this.prisma.emoji.findMany({
      select: { emoji: true },
      distinct: ['emoji'],
      orderBy: { emoji: 'asc' },
    });

    return rows.map((row) => row.emoji).filter(Boolean);
  }

  listDemos() {
    return listLyricDemos();
  }

  async catalogStats() {
    const monthAgo = new Date();
    monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);

    const [rows, addedLastMonth] = await Promise.all([
      this.prisma.lyrics.findMany({
        select: {
          isReference: true,
          isFavorite: true,
          isHidden: true,
          isCensored: true,
          isDonor: true,
          songRole: true,
          mood: true,
          delivery: true,
          roleProfiles: true,
          readiness: true,
        },
      }),
      this.prisma.lyrics.count({
        where: {
          date: { gte: monthAgo },
        },
      }),
    ]);

    return buildCatalogStats(rows, addedLastMonth);
  }

  async catalogActivity(daysRaw: number) {
    if (!isCatalogActivityDays(daysRaw)) {
      throw new GraphQLError('Период активности: только 7, 30 или 90 дней', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const start = activityRangeStart(daysRaw);
    const rows = await this.prisma.lyrics.findMany({
      where: {
        date: { gte: start },
      },
      select: {
        date: true,
      },
    });

    return buildCatalogActivity(
      rows.map((row) => row.date),
      daysRaw
    );
  }

  async assembleTrack(
    formRaw?: unknown,
    filter?: Pick<
      LyricsListOptions,
      | 'tags'
      | 'keyword'
      | 'emojis'
      | 'dateFrom'
      | 'dateTo'
      | 'includeShelves'
      | 'excludeShelves'
      | 'mood'
      | 'excludeMood'
      | 'delivery'
      | 'excludeDelivery'
      | 'songRole'
      | 'excludeSongRole'
      | 'readiness'
      | 'excludeReadiness'
    > | null
  ) {
    const quotas = parseTrackFormQuotas(formRaw);
    const includeCensored = (filter?.includeShelves ?? []).includes('censored');
    const baseWhere = buildLyricsWhere({
      tags: filter?.tags,
      keyword: filter?.keyword,
      emojis: filter?.emojis,
      dateFrom: filter?.dateFrom,
      dateTo: filter?.dateTo,
      includeShelves: filter?.includeShelves,
      excludeShelves: filter?.excludeShelves ?? ['hidden', 'donors'],
      mood: filter?.mood,
      excludeMood: filter?.excludeMood,
      delivery: filter?.delivery,
      excludeDelivery: filter?.excludeDelivery,
      songRole: filter?.songRole,
      excludeSongRole: filter?.excludeSongRole,
      readiness: filter?.readiness,
      excludeReadiness: filter?.excludeReadiness,
    });

    const rows = await this.prisma.lyrics.findMany({
      where: {
        AND: [baseWhere, includeCensored ? {} : { isCensored: false }],
      },
      select: {
        id: true,
        songRole: true,
        message: { select: { text: true } },
      },
    });

    const catalog: PoolLyric[] = rows.map((row) => ({
      id: row.id,
      lines: splitGeneratorLines(row.message?.text ?? ''),
      songRoles: row.songRole,
    }));

    const slots = assembleSlotsFromPools(catalog, quotas);

    return this.hydrateSlots(slots);
  }

  async likeCollage(slotsInput: unknown) {
    const slots = parseCollageSlotsInput(slotsInput);
    const row = await this.prisma.lyricCollage.create({
      data: { slots },
    });

    return this.hydrateCollage(row.id, row.createdAt, row.slots);
  }

  async unlikeCollage(id: number) {
    const row = await this.prisma.lyricCollage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!row) {
      throw new GraphQLError('Склейка не найдена');
    }

    await this.prisma.lyricCollage.delete({ where: { id } });
    return id;
  }

  async glueLyrics(slotsInput: unknown, hideOriginals: boolean) {
    const slots = parseCollageSlotsInput(slotsInput);
    const lyricIds = lyricIdsFromSlots(slots);

    if (lyricIds.length === 0) {
      throw new GraphQLError('Нечего склеивать: в сборке нет строк');
    }

    const owner = await usersService.getOwner();
    if (!owner) {
      throw new GraphQLError('Владелец каталога не найден');
    }

    const donors = await this.prisma.lyrics.findMany({
      where: { id: { in: lyricIds } },
      include: { message: true },
    });
    const textsById = new Map(
      donors.map((row) => [row.id, row.message?.text ?? ''])
    );

    for (const id of lyricIds) {
      if (!textsById.has(id)) {
        throw new GraphQLError('Фраза из сборки не найдена');
      }
    }

    const built = buildGluedText(slots, textsById);
    const counts = textCounts(built.text);
    const now = new Date();
    const takenByLyric = collectTakenRangesByLyric(built.placements);

    return this.prisma.$transaction(async (tx) => {
      const glued = await tx.lyrics.create({
        data: {
          lyric_id: 0,
          date: now,
          editDate: now,
          isPinned: false,
          isChannelPost: false,
          isReference: false,
          isHidden: false,
          isFavorite: false,
          isCensored: false,
          isDonor: false,
          mood: [],
          delivery: [],
          songRole: [],
          roleProfiles: {},
          readiness: readinessAfterTextChange(null, counts.paragraph_count),
          replyToMessage: null,
          userId: owner.id,
          message: {
            create: {
              message_id: 0,
              text: built.text,
              word_count: counts.word_count,
              paragraph_count: counts.paragraph_count,
            },
          },
        },
        include: lyricInclude,
      });

      if (!hideOriginals) {
        return glued;
      }

      const collages = await tx.lyricCollage.findMany();

      for (const donor of donors) {
        const ranges = takenByLyric.get(donor.id) ?? [];
        if (ranges.length === 0) {
          continue;
        }

        const raw = donor.message?.text ?? '';
        const lineCount = splitGeneratorLines(raw).length;
        const rip = ripCleanedRangesFromText(raw, ranges);
        const markDonor = rip.removed && !rip.emptied;
        const nextText = markDonor ? rip.nextText : raw;
        const nextCounts = textCounts(nextText);

        await tx.lyrics.update({
          where: { id: donor.id },
          data: {
            isHidden: true,
            ...(markDonor
              ? {
                  isDonor: true,
                  editDate: now,
                  readiness: readinessAfterTextChange(
                    donor.readiness,
                    nextCounts.paragraph_count
                  ),
                  message: {
                    update: {
                      text: nextText,
                      word_count: nextCounts.word_count,
                      paragraph_count: nextCounts.paragraph_count,
                    },
                  },
                }
              : {}),
          },
        });

        const shiftMap = cleanedIndexShiftMap(lineCount, ranges);

        for (const collage of collages) {
          const collageSlots = slotsFromJson(collage.slots);
          if (!lyricIdsFromSlots(collageSlots).includes(donor.id)) {
            continue;
          }

          const nextSlots = remapCollageSlotsAfterRip(
            collageSlots,
            donor.id,
            glued.id,
            shiftMap,
            built.placements,
            markDonor
          );

          if (JSON.stringify(nextSlots) === JSON.stringify(collageSlots)) {
            continue;
          }

          await tx.lyricCollage.update({
            where: { id: collage.id },
            data: { slots: nextSlots },
          });
          collage.slots = nextSlots;
        }
      }

      return tx.lyrics.findUniqueOrThrow({
        where: { id: glued.id },
        include: lyricInclude,
      });
    });
  }

  async listCollages() {
    const rows = await this.prisma.lyricCollage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      rows.map((row) => this.hydrateCollage(row.id, row.createdAt, row.slots))
    );
  }

  async listCarouselHistories() {
    const rows = await this.prisma.carouselHistory.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.hydrateCarouselHistory(row));
  }

  async saveCarouselHistory(lyricIdsRaw: unknown, sourceRaw: unknown) {
    if (!isCarouselHistorySource(sourceRaw)) {
      throw new GraphQLError('Неизвестный источник снимка');
    }

    const lyricIds = this.parseCarouselLyricIds(lyricIdsRaw);

    if (lyricIds.length === 0) {
      throw new GraphQLError('Нечего сохранять в историю');
    }

    const previewText = await this.buildCarouselHistoryPreview(lyricIds);
    const row = await this.prisma.carouselHistory.create({
      data: {
        lyricIds,
        source: sourceRaw,
        previewText,
      },
    });

    await this.evictCarouselHistories();

    const saved = await this.prisma.carouselHistory.findUnique({
      where: { id: row.id },
    });

    if (!saved) {
      throw new GraphQLError('Снимок не найден');
    }

    return this.hydrateCarouselHistory(saved);
  }

  async likeCarouselHistory(id: number) {
    const row = await this.prisma.carouselHistory.findUnique({
      where: { id },
    });

    if (!row) {
      throw new GraphQLError('Снимок не найден');
    }

    if (row.isLiked) {
      return this.hydrateCarouselHistory(row);
    }

    const liked = await this.prisma.carouselHistory.update({
      where: { id },
      data: { isLiked: true },
    });

    return this.hydrateCarouselHistory(liked);
  }

  async unlikeCarouselHistory(id: number) {
    return this.deleteCarouselHistory(id);
  }

  async deleteCarouselHistory(id: number) {
    const row = await this.prisma.carouselHistory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!row) {
      throw new GraphQLError('Снимок не найден');
    }

    await this.prisma.carouselHistory.delete({ where: { id } });
    return id;
  }

  private parseCarouselLyricIds(value: unknown): number[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (id): id is number =>
        typeof id === 'number' && Number.isInteger(id) && id > 0
    );
  }

  private async buildCarouselHistoryPreview(lyricIds: number[]) {
    const previewIds = lyricIds.slice(0, 12);
    const rows = await this.prisma.lyrics.findMany({
      where: { id: { in: previewIds } },
      select: { id: true, message: { select: { text: true } } },
    });
    const byId = new Map(rows.map((row) => [row.id, row.message?.text ?? '']));

    return buildCarouselPreviewText(previewIds.map((id) => byId.get(id) ?? ''));
  }

  private async evictCarouselHistories() {
    const rows = await this.prisma.carouselHistory.findMany({
      select: { id: true, createdAt: true, isLiked: true },
    });
    const evictIds = pickIdsToEvict(rows);

    if (evictIds.length === 0) {
      return;
    }

    await this.prisma.carouselHistory.deleteMany({
      where: { id: { in: evictIds } },
    });
  }

  private hydrateCarouselHistory(row: {
    id: number;
    createdAt: Date;
    source: CarouselHistorySource;
    lyricIds: number[];
    previewText: string;
    isLiked: boolean;
  }) {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      source: row.source,
      lyricIds: row.lyricIds,
      previewText: row.previewText,
      isLiked: row.isLiked,
    };
  }

  private async hydrateCollage(
    id: number,
    createdAt: Date,
    slotsJson: unknown
  ) {
    const slots = slotsFromJson(slotsJson);

    return {
      id,
      createdAt: createdAt.toISOString(),
      ...(await this.hydrateSlots(slots)),
    };
  }

  private async hydrateSlots(slots: ReturnType<typeof slotsFromJson>) {
    const lyricIds = lyricIdsFromSlots(slots);

    const lyrics =
      lyricIds.length === 0
        ? []
        : await this.prisma.lyrics.findMany({
            where: { id: { in: lyricIds } },
            include: lyricInclude,
          });
    const byId = new Map(lyrics.map((row) => [row.id, row]));

    return {
      slots: slots.map((slot) => ({
        songRole: slot.songRole,
        parts: slot.parts.map((part) => ({
          lyricId: part.lyricId,
          startLine: part.startLine,
          endLine: part.endLine,
          lyric: byId.get(part.lyricId) ?? null,
        })),
      })),
    };
  }

  async updateFlags(
    id: number,
    flags: {
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
      isCensored?: boolean;
      isDonor?: boolean;
    }
  ) {
    const data: {
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
      isCensored?: boolean;
      isDonor?: boolean;
    } = {};

    if (flags.isHidden !== undefined) {
      data.isHidden = flags.isHidden;
    }

    if (flags.isFavorite !== undefined) {
      data.isFavorite = flags.isFavorite;
    }

    if (flags.isReference !== undefined) {
      data.isReference = flags.isReference;
    }

    if (flags.isCensored !== undefined) {
      data.isCensored = flags.isCensored;
    }

    if (flags.isDonor !== undefined) {
      data.isDonor = flags.isDonor;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.lyrics.findUniqueOrThrow({
        where: { id },
        include: lyricInclude,
      });
    }

    return this.prisma.lyrics.update({
      where: { id },
      data,
      include: lyricInclude,
    });
  }

  async updateProfile(
    id: number,
    input: {
      mood?: string[] | null;
      delivery?: string[] | null;
      songRole?: string[] | null;
      roleProfiles?: unknown;
      readiness?: string | null;
    }
  ) {
    const parsed = parseLyricProfilePatch(input);
    const data: {
      mood?: LyricProfilePatch['mood'];
      delivery?: LyricProfilePatch['delivery'];
      songRole?: LyricProfilePatch['songRole'];
      roleProfiles?: ReturnType<typeof roleProfilesToJson>;
      readiness?: LyricProfilePatch['readiness'];
    } = {};

    if (parsed.mood !== undefined) {
      data.mood = parsed.mood;
    }

    if (parsed.delivery !== undefined) {
      data.delivery = parsed.delivery;
    }

    if (parsed.roleProfiles !== undefined) {
      data.roleProfiles = roleProfilesToJson(parsed.roleProfiles);
      data.songRole = parsed.roleProfiles.map((profile) => profile.songRole);
    } else if (parsed.songRole !== undefined) {
      data.songRole = parsed.songRole;
    }

    if (parsed.readiness !== undefined) {
      data.readiness = parsed.readiness;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.lyrics.findUniqueOrThrow({
        where: { id },
        include: lyricInclude,
      });
    }

    return this.prisma.lyrics.update({
      where: { id },
      data,
      include: lyricInclude,
    });
  }

  async updateLyricText(id: number, text: string) {
    const nextText = assertNonEmptyLyricText(text);
    const counts = textCounts(nextText);
    const row = await this.prisma.lyrics.findUnique({
      where: { id },
      include: { message: true },
    });

    if (!row?.message) {
      throw new GraphQLError('Фраза не найдена');
    }

    return this.prisma.lyrics.update({
      where: { id },
      data: {
        editDate: new Date(),
        readiness: readinessAfterTextChange(
          row.readiness,
          counts.paragraph_count
        ),
        message: {
          update: {
            text: nextText,
            word_count: counts.word_count,
            paragraph_count: counts.paragraph_count,
          },
        },
      },
      include: lyricInclude,
    });
  }

  async splitLyric(id: number, afterLine: number) {
    const row = await this.prisma.lyrics.findUnique({
      where: { id },
      include: lyricInclude,
    });

    const sourceMessage = row?.message;

    if (!row || !sourceMessage?.text) {
      throw new GraphQLError('Фраза не найдена');
    }

    const { top, bottom } = splitTextAtLine(sourceMessage.text, afterLine);
    const topCounts = textCounts(top);
    const bottomCounts = textCounts(bottom);
    const editedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const topRow = await tx.lyrics.update({
        where: { id },
        data: {
          editDate: editedAt,
          readiness: readinessAfterTextChange(
            row.readiness,
            topCounts.paragraph_count
          ),
          message: {
            update: {
              text: top,
              word_count: topCounts.word_count,
              paragraph_count: topCounts.paragraph_count,
            },
          },
        },
        include: lyricInclude,
      });

      const bottomRow = await tx.lyrics.create({
        data: {
          lyric_id: row.lyric_id,
          date: row.date,
          editDate: editedAt,
          isPinned: row.isPinned,
          isChannelPost: row.isChannelPost,
          isReference: row.isReference,
          isHidden: row.isHidden,
          isFavorite: row.isFavorite,
          isCensored: row.isCensored,
          mood: row.mood,
          delivery: row.delivery,
          songRole: row.songRole,
          roleProfiles: row.roleProfiles ?? {},
          readiness: readinessAfterTextChange(
            row.readiness,
            bottomCounts.paragraph_count
          ),
          replyToMessage: row.replyToMessage,
          userId: row.userId,
          message: {
            create: {
              message_id: sourceMessage.message_id,
              text: bottom,
              word_count: bottomCounts.word_count,
              paragraph_count: bottomCounts.paragraph_count,
              hashtags: sourceMessage.hashtags
                ? {
                    create: {
                      tags: sourceMessage.hashtags.tags,
                      count: sourceMessage.hashtags.count,
                    },
                  }
                : undefined,
            },
          },
          user: row.user
            ? {
                create: {
                  id: row.user.id,
                  username: row.user.username,
                  displayName: row.user.displayName,
                  isAdmin: row.user.isAdmin,
                },
              }
            : undefined,
          chat: row.chat
            ? {
                create: {
                  id: row.chat.id,
                  title: row.chat.title,
                  type: row.chat.type,
                },
              }
            : undefined,
        },
        include: lyricInclude,
      });

      const topLineCount = splitGeneratorLines(top).length;
      const collages = await tx.lyricCollage.findMany();

      for (const collage of collages) {
        const slots = slotsFromJson(collage.slots);
        if (!lyricIdsFromSlots(slots).includes(id)) {
          continue;
        }

        const nextSlots = remapCollageSlotsAfterSplit(
          slots,
          id,
          bottomRow.id,
          topLineCount
        );

        if (JSON.stringify(nextSlots) === JSON.stringify(slots)) {
          continue;
        }

        await tx.lyricCollage.update({
          where: { id: collage.id },
          data: { slots: nextSlots },
        });
      }

      return { top: topRow, bottom: bottomRow };
    });
  }

  async sliceLyric(
    id: number,
    rangesInput: LyricLineRange[],
    ripDonor: boolean
  ) {
    const row = await this.prisma.lyrics.findUnique({
      where: { id },
      include: lyricInclude,
    });

    const sourceMessage = row?.message;

    if (!row || !sourceMessage?.text) {
      throw new GraphQLError('Фраза не найдена');
    }

    const sourceText = sourceMessage.text;
    const built = buildSliceFromRanges(sourceText, rangesInput, id);
    const createdCounts = textCounts(built.createdText);
    const editedAt = new Date();
    const lineCount = splitGeneratorLines(sourceText).length;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.lyrics.create({
        data: {
          lyric_id: row.lyric_id,
          date: row.date,
          editDate: editedAt,
          isPinned: row.isPinned,
          isChannelPost: row.isChannelPost,
          isReference: row.isReference,
          isHidden: row.isHidden,
          isFavorite: row.isFavorite,
          isCensored: row.isCensored,
          isDonor: false,
          mood: row.mood,
          delivery: row.delivery,
          songRole: row.songRole,
          roleProfiles: row.roleProfiles ?? {},
          readiness: readinessAfterTextChange(
            row.readiness,
            createdCounts.paragraph_count
          ),
          replyToMessage: row.replyToMessage,
          userId: row.userId,
          message: {
            create: {
              message_id: sourceMessage.message_id,
              text: built.createdText,
              word_count: createdCounts.word_count,
              paragraph_count: createdCounts.paragraph_count,
              hashtags: sourceMessage.hashtags
                ? {
                    create: {
                      tags: sourceMessage.hashtags.tags,
                      count: sourceMessage.hashtags.count,
                    },
                  }
                : undefined,
            },
          },
          user: row.user
            ? {
                create: {
                  id: row.user.id,
                  username: row.user.username,
                  displayName: row.user.displayName,
                  isAdmin: row.user.isAdmin,
                },
              }
            : undefined,
          chat: row.chat
            ? {
                create: {
                  id: row.chat.id,
                  title: row.chat.title,
                  type: row.chat.type,
                },
              }
            : undefined,
        },
        include: lyricInclude,
      });

      if (!ripDonor) {
        return { source: row, created };
      }

      const rip = ripCleanedRangesFromText(sourceText, built.cleanedTaken);
      const markDonor = rip.removed && !rip.emptied;
      const nextText = markDonor ? rip.nextText : sourceText;
      const nextCounts = textCounts(nextText);

      let source = row;

      if (rip.emptied || markDonor) {
        source = await tx.lyrics.update({
          where: { id },
          data: rip.emptied
            ? { isHidden: true }
            : {
                isDonor: true,
                editDate: editedAt,
                readiness: readinessAfterTextChange(
                  row.readiness,
                  nextCounts.paragraph_count
                ),
                message: {
                  update: {
                    text: nextText,
                    word_count: nextCounts.word_count,
                    paragraph_count: nextCounts.paragraph_count,
                  },
                },
              },
          include: lyricInclude,
        });
      }

      if (markDonor) {
        const shiftMap = cleanedIndexShiftMap(lineCount, built.cleanedTaken);
        const collages = await tx.lyricCollage.findMany();

        for (const collage of collages) {
          const collageSlots = slotsFromJson(collage.slots);
          if (!lyricIdsFromSlots(collageSlots).includes(id)) {
            continue;
          }

          const nextSlots = remapCollageSlotsAfterRip(
            collageSlots,
            id,
            created.id,
            shiftMap,
            built.placements,
            true
          );

          if (JSON.stringify(nextSlots) === JSON.stringify(collageSlots)) {
            continue;
          }

          await tx.lyricCollage.update({
            where: { id: collage.id },
            data: { slots: nextSlots },
          });
        }
      }

      return { source, created };
    });
  }

  async clearCatalog() {
    try {
      await this.prisma.emoji.deleteMany();
      await this.prisma.reactions.deleteMany();
      await this.prisma.hashtags.deleteMany();
      await this.prisma.message.deleteMany();
      await this.prisma.userLyric.deleteMany();
      await this.prisma.chat.deleteMany();
      await this.prisma.media.deleteMany();
      await this.prisma.lyrics.deleteMany();
      await this.prisma.users.deleteMany();

      console.log('PRISMA: 🗑 База данных очищена');
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при очистке базы:', error);
    }
  }

  async loadNewRecords(records: IChatHistoryItem[]): Promise<number> {
    try {
      const owner = await usersService.getOwner();

      if (!owner) {
        console.log(`\nPRISMA: 🙅 Users не был найден`);
        return 0;
      }
      console.log(`\nPRISMA: 🫄 Пользователь UserID: ${owner.id} найден`);
      console.log(`PRISMA: 📝 Начало загрузки ${records.length} записей`);

      const existing = await this.prisma.lyrics.findMany({
        select: { lyric_id: true },
      });
      const existingIds = new Set(existing.map((row) => row.lyric_id));

      const fresh = records.filter((item) => {
        const lyricId = item.message.message_id;
        return !existingIds.has(lyricId);
      });

      const skipped = records.length - fresh.length;
      if (skipped > 0) {
        console.log(`PRISMA: ⏭️ Пропущено дублей lyric_id: ${skipped}`);
      }

      let loaded = 0;

      for (let i = 0; i < fresh.length; i += INSERT_CONCURRENCY) {
        const batch = fresh.slice(i, i + INSERT_CONCURRENCY);
        await Promise.all(
          batch.map(async (item) => {
            try {
              await this.prisma.lyrics.create({
                data: createLyricData(item, owner.id),
              });
              existingIds.add(item.message.message_id);
              loaded += 1;
            } catch (error) {
              console.error(
                `PRISMA: 🚧 Данные Lyrics - lyric_id: ${item.message.message_id} - не удалось загрузить в базу\n\n`,
                error
              );
            }
          })
        );
      }

      console.log(`PRISMA: 📊 Итого загружено записей: ${loaded}`);
      return loaded;
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при загрузке записей:', error);
      return 0;
    }
  }

  async getStats() {
    try {
      const [users, lyrics, messages, reactions, hashtags, media] =
        await Promise.all([
          this.prisma.users.count(),
          this.prisma.lyrics.count(),
          this.prisma.message.count(),
          this.prisma.reactions.count(),
          this.prisma.hashtags.count(),
          this.prisma.media.count(),
        ]);

      const stats = {
        users,
        lyrics,
        messages,
        reactions,
        hashtags,
        media,
        lastUpdate: new Date().toISOString(),
      };

      console.log('PRISMA: 📊 Статистика базы данных:', stats);
      return stats;
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при получении статистики:', error);
      return null;
    }
  }
}

export const lyricsService = new LyricsService();
