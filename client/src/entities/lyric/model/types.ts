import type { IUser } from '@/entities/user';
import type {
  LyricDelivery,
  LyricEnergy,
  LyricMood,
  LyricReadiness,
  LyricRoleProfile,
  LyricSongRole,
  LyricSource,
} from '@/shared/lib/lyric-facets';

export interface ILyric {
  id: number;
  userId: number;
  lyric_id?: number;
  source: LyricSource;
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
  isDonor: boolean;
  isUsed: boolean;
  mood: LyricMood[];
  delivery: LyricDelivery[];
  songRole: LyricSongRole[];
  roleProfiles: LyricRoleProfile[];
  readiness: LyricReadiness | null;
  energy: LyricEnergy | null;
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

export type ICatalogEnergyCount = {
  value: LyricEnergy;
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

export type CatalogThemeKind = 'MOOD' | 'DELIVERY';

export type ICatalogThemeCount = {
  kind: CatalogThemeKind;
  value: string;
  count: number;
};

export type ICatalogActivityPoint = {
  date: string;
  count: number;
};

export type ICatalogStats = {
  phraseCount: number;
  addedLastMonth: number;
  references: ICatalogShelfStat;
  favorites: ICatalogShelfStat;
  hidden: ICatalogShelfStat;
  censored: ICatalogShelfStat;
  donors: ICatalogShelfStat;
  withRole: ICatalogShelfStat;
  roles: ICatalogRoleStats[];
  unscoped: ICatalogUnscopedStats;
  readiness: ICatalogReadinessCount[];
  readinessNone: number;
  energy: ICatalogEnergyCount[];
  energyNone: number;
  themes: ICatalogThemeCount[];
};

export type TrackFormPreset = 'HIT' | 'CANVAS';

export type TrackFormQuotas = {
  intro: number;
  verse: number;
  hook: number;
  bridge: number;
};

export type IAssembledTrackPart = {
  lyricId: number;
  startLine: number;
  endLine: number;
  lyric:
    | (Pick<ILyric, 'id'> & {
        message: Pick<IMessage, 'text'> | null;
      })
    | null;
};

export type IAssembledTrackSlot = {
  songRole: LyricSongRole;
  parts: IAssembledTrackPart[];
};

export type IAssembledTrack = {
  slots: IAssembledTrackSlot[];
};

export type ILyricCollage = {
  id: number;
  createdAt: string;
  slots: IAssembledTrackSlot[];
};

export type CarouselHistorySource = 'SHUFFLE' | 'QUEUE' | 'GENERATOR' | 'AI';

export type ICarouselHistory = {
  id: number;
  createdAt: string;
  source: CarouselHistorySource;
  lyricIds: number[];
  previewText: string;
  isLiked: boolean;
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

export type LyricSlide = Pick<ILyric, 'id' | 'message' | 'lyric_id' | 'isUsed'>;
