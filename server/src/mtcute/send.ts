import type { TypeBotClient } from '~/mtcute/types';

interface SendToBotChat {
  tg: TypeBotClient;
  chatId: number;
  text: number | string;
  url?: string;
  options?: Parameters<TypeBotClient['sendText']>[2];
}

export const sendToBotChat = ({ tg, chatId, text }: SendToBotChat) => {
  tg.sendText(chatId, text.toString());
};
