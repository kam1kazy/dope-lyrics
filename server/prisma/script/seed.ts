import fs from 'fs';
import path from 'path';

import { lyricsService } from '~/modules/lyrics/lyrics.service';
import type { IChatHistoryItem } from '~/modules/lyrics/lyrics.types';
import { usersService } from '~/modules/users/users.service';
import type { IUser } from '~/modules/users/users.types';

const chatHistoryPath = path.resolve(
  __dirname,
  '../../bot-data/data/chatHistory.json'
);
const chatUserPath = path.resolve(
  __dirname,
  '../../bot-data/data/usersData.json'
);

const readJson = <T>(filePath: string): T =>
  JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;

const loadUsersFromFile = (filePath: string): IUser[] => {
  const data = readJson<IUser[] | { users: IUser[] }>(filePath);
  return Array.isArray(data) ? data : data.users;
};

const seed = async () => {
  console.log(`\nPRISMA: 🌾 Выполняем посев данных...`);

  if (!fs.existsSync(chatUserPath)) {
    console.log('PRISMA: ⚠️ Файлы с данными пользователей не найдены');
    return;
  }

  await usersService.loadUsers(loadUsersFromFile(chatUserPath));

  if (!fs.existsSync(chatHistoryPath)) {
    console.log('PRISMA: ⚠️ Файлы с данными истории не найдены');
    return;
  }

  const chatHistory = readJson<IChatHistoryItem[]>(chatHistoryPath);
  if (chatHistory?.length) {
    await lyricsService.loadNewRecords(chatHistory);
  }
};

export default seed;
