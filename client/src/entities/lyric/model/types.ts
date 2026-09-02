import type { IUser } from '@/entities/user';
import type {
  LyricDelivery,
  LyricMood,
  LyricReadiness,
  LyricRoleProfile,
  LyricSongRole,
} from '@/shared/lib/lyric-facets';

export interface ILyric {
  id: number;
  userId: number;
  lyric_id?: number;
  message: IMessage | null;
  user: IUserLyric | null;
  chat: IChat | null;
  date: Date;
  editDate: Date;
  isPinned: boolean;
  isChannelPost: boolean;
  isReference: boolean;
  isHidden: boolean;
  isFavorite: boolean;
  isCensored: boolean;
  mood: LyricMood[];
  delivery: LyricDelivery[];
  songRole: LyricSongRole[];
  roleProfiles: LyricRoleProfile[];
  readiness: LyricReadiness | null;
  owner?: IUser | null;
  replyToMessage: number | null;
  media: IMedia | null;
}

export interface ILyricDemo {
  name: string;
  count: number;
}

export type ICatalogShelfStat = {
  count: number;
  share: number;
};

export type ICatalogMoodCount = {
  value: LyricMood;
  count: number;
};

export type ICatalogDeliveryCount = {
  value: LyricDelivery;
  count: number;
};

export type ICatalogReadinessCount = {
  value: LyricReadiness;
  count: number;
};

export type ICatalogRoleStats = {
  songRole: LyricSongRole;
  phraseCount: number;
  mood: ICatalogMoodCount[];
  delivery: ICatalogDeliveryCount[];
};

export type ICatalogUnscopedStats = {
  phraseCount: number;
  mood: ICatalogMoodCount[];
  delivery: ICatalogDeliveryCount[];
};

export type ICatalogStats = {
  phraseCount: number;
  references: ICatalogShelfStat;
  favorites: ICatalogShelfStat;
  hidden: ICatalogShelfStat;
  censored: ICatalogShelfStat;
  withRole: ICatalogShelfStat;
  roles: ICatalogRoleStats[];
  unscoped: ICatalogUnscopedStats;
  readiness: ICatalogReadinessCount[];
  readinessNone: number;
};

export interface IMessage {
  message_id: number;
  text: string;
  word_count?: number;
  paragraph_count?: number;
  reactions?: IReaction | null;
  hashtags?: IHashtags | null;
}

export interface IHashtags {
  tags: string[];
  count: number;
}

export interface IReaction {
  emojis: IEmoji[] | null;
  uniqueCount: number;
  totalFreeCount: number | void;
  totalPaidCount: number | void;
  totalCount: number | void;
}

export interface IEmoji {
  emoji: string | void;
  isPaid: boolean;
  count: number;
  order?: null | number;
}

export interface IUserLyric {
  id: number;
  username?: string;
  displayName?: string;
  isAdmin: boolean;
}

export interface IChat {
  id: number;
  title: string;
  type: string;
}

export interface IMedia {
  mime: string;
  duration: number;
  convert: boolean;
}

export type LyricSlide = Pick<ILyric, 'id' | 'message' | 'lyric_id'>;
