import type { IUser } from '~/modules/users/users.types';

export interface ILyric {
  userId: number;
  lyric_id?: number;
  message: IMessage | null;
  user: IUserLyric | null;
  chat: IChat | null;
  date: Date;
  editDate: Date | null;
  isPinned: boolean;
  isChannelPost: boolean;
  owner?: IUser | null;
  replyToMessage: number | null;
  media: IMedia | null;
}

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

export interface IChatHistoryItem {
  userId: number;
  message: {
    text: string;
    message_id: number;
    word_count: number;
    paragraph_count: number;
    reactions: {
      emojis: {
        emoji: string;
        isPaid: boolean;
        count: number;
        order: number;
      }[];
      uniqueCount: number;
      totalFreeCount: number;
      totalPaidCount: number;
      totalCount: number;
    } | null;
    hashtags?: {
      tags: string[];
      count: number;
    } | null;
  };
  user: {
    id: number;
    username: string;
    displayName: string;
    isAdmin: boolean;
  };
  chat: {
    id: number;
    title: string;
    type: string;
  };
  date: Date;
  editDate: Date | null;
  isPinned: boolean;
  isChannelPost: boolean;
  replyToMessage: number | null;
  media: {
    mime: string;
    duration: number;
    convert: boolean;
  } | null;
}
