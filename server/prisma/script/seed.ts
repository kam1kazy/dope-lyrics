import fs from 'fs';
import path from 'path';

import { prismaService } from '~/services/db';

import { IChatHistoryItem } from '../../src/types/prismaCreate';
import { IUser } from '../../src/types/user';

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

  await prismaService.loadUsers(loadUsersFromFile(chatUserPath));

  if (!fs.existsSync(chatHistoryPath)) {
    console.log('PRISMA: ⚠️ Файлы с данными истории не найдены');
    return;
  }

  const chatHistory = readJson<IChatHistoryItem[]>(chatHistoryPath);
  if (chatHistory?.length) {
    await prismaService.loadNewRecords(chatHistory);
  }
};

export default seed;
