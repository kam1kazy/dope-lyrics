import { Message, MessageEntity, Peer } from '@mtcute/core';

import { IEmoji, ILyric, IMedia } from '~/types/lyric';

interface IProps {
  message: Message;
  handlerCountParagraphs: (text: string) => number;
  handlerCountWords: (text: string) => number;
  handlerCountReactions: (
    reactions: IEmoji[],
    type: 'total' | 'paid' | 'free'
  ) => number | void;
  handlerWithoutHashtags: (text: string) => string;
  hashtagStringsOnly: (entities: readonly MessageEntity[]) => string[];
}

const peerIsAdmin = (peer: Peer): boolean => {
  return peer.type === 'chat' ? peer.isAdmin : false;
};

const peerChatTitle = (peer: Peer): string => {
  return peer.type === 'chat' ? peer.title : peer.displayName;
};

const peerChatType = (peer: Peer): string => {
  return peer.type === 'chat' ? peer.chatType : peer.type;
};

const toReactionEmoji = (emoji: string | { toString(): string }): string => {
  return typeof emoji === 'string' ? emoji : emoji.toString();
};

const toLyricMedia = (media: Message['media']): IMedia | null => {
  if (media === null || !('mimeType' in media)) {
    return null;
  }

  return {
    mime: media.mimeType,
    duration:
      'duration' in media && typeof media.duration === 'number'
        ? media.duration
        : 0,
    convert: false,
  };
};

const messageObject = ({
  message,
  handlerCountParagraphs,
  handlerCountWords,
  handlerCountReactions,
  handlerWithoutHashtags,
  hashtagStringsOnly,
}: IProps): ILyric => {
  const reactionList = message.reactions?.reactions ?? [];
  const emojis: IEmoji[] = reactionList.map((reaction) => {
    return {
      emoji: toReactionEmoji(reaction.emoji),
      isPaid: reaction.isPaid,
      count: reaction.count,
      order: reaction.order,
    };
  });

  return {
    userId: 0,
    lyric_id: message.id,
    message: {
      text: handlerWithoutHashtags(message.text),
      message_id: message.id,
      word_count: handlerCountWords(message.text ?? ''),
      paragraph_count: handlerCountParagraphs(message.text ?? ''),

      reactions: emojis.length
        ? {
            emojis,
            uniqueCount: emojis.length,
            totalFreeCount: handlerCountReactions(emojis, 'free'),
            totalPaidCount: handlerCountReactions(emojis, 'paid'),
            totalCount: handlerCountReactions(emojis, 'total'),
          }
        : null,

      hashtags: message.entities.length
        ? {
            tags: hashtagStringsOnly(message.entities),
            count: message.entities.length,
          }
        : null,
    },
    user: {
      id: message.sender.id,
      username: message.sender.username ?? undefined,
      isAdmin: peerIsAdmin(message.sender),
    },
    chat: {
      id: message.chat.id,
      title: peerChatTitle(message.chat),
      type: peerChatType(message.chat),
    },
    date: message.date,
    editDate: message.editDate,
    isPinned: message.isPinned,
    isChannelPost: message.isChannelPost,
    replyToMessage: message.replyToMessage?.id ?? null,
    media: toLyricMedia(message.media),
  };
};

export default messageObject;
