import { lyricInclude } from '~/graphql/lyric-include';
import { prisma } from '~/infrastructure/prisma';
import { buildCatalogStats } from '~/modules/lyrics/catalog-stats';
import { listLyricDemos } from '~/modules/lyrics/lyric-demos';
import {
  type LyricProfilePatch,
  parseLyricProfilePatch,
  roleProfilesToJson,
} from '~/modules/lyrics/lyric-facets';
import type { IChatHistoryItem } from '~/modules/lyrics/lyrics.types';
import {
  buildLyricsWhere,
  type LyricsListOptions,
} from '~/modules/lyrics/lyrics-list-filters';
import { createLyricData } from '~/modules/lyrics/persist/create-lyric-data';
import { usersService } from '~/modules/users/users.service';

const INSERT_CONCURRENCY = 8;

export class LyricsService {
  private readonly prisma = prisma;

  list(options: LyricsListOptions) {
    return this.prisma.lyrics.findMany({
      where: buildLyricsWhere(options),
      take: options.limit,
      skip: options.offset,
      orderBy: { date: options.oldestFirst ? 'asc' : 'desc' },
      include: lyricInclude,
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
    const rows = await this.prisma.lyrics.findMany({
      select: {
        isReference: true,
        isFavorite: true,
        isHidden: true,
        isCensored: true,
        songRole: true,
        mood: true,
        delivery: true,
        roleProfiles: true,
        readiness: true,
      },
    });

    return buildCatalogStats(rows);
  }

  async updateFlags(
    id: number,
    flags: {
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
      isCensored?: boolean;
    }
  ) {
    const data: {
      isHidden?: boolean;
      isFavorite?: boolean;
      isReference?: boolean;
      isCensored?: boolean;
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
