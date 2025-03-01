const fs = require('fs');
const path = require('path');

// Сервисы
import { prismaService } from '~/services/db';

// Типы
import { IUser } from '../../src/types/user';
import { IChatHistoryItem } from '../../src/types/prismaCreate';

const chatHistoryPath = path.resolve(
  __dirname,
  '../../bot-data/data/chatHistory.json'
);
const chatUserPath = path.resolve(
  __dirname,
  '../../bot-data/data/usersData.json'
);


const chatUser: IUser[] = require(chatUserPath);
const chatHistory: IChatHistoryItem[] = require(chatHistoryPath);

console.log('object');
console.log('Пользователи:', chatUser.length);
console.log('История чата:', chatHistory.length);

const seed = async () => {
  
console.log('chatHistoryPath', chatHistoryPath);
console.log('chatUserPath', chatUserPath);

  console.log(`\nPRISMA: 🌾 Выполняем посев данных...`);

  // Проверяем существование файлов с данными
  if (!fs.existsSync(chatUserPath)) {
    console.log('PRISMA: ⚠️ Файлы с данными пользователей не найдены');
    return;
  }

  // Добавляем пользователей
  console.log('Загрузка пользователей...');
  try {
    await prismaService.loadUsers(chatUser);
    console.log('Пользователи загружены.');
  } catch (error) {
    console.error('Ошибка при загрузке пользователей:', error);
  }

  // Проверяем существование файлов с данными истории
  if (!fs.existsSync(chatHistoryPath)) {
    console.log('PRISMA: ⚠️ Файлы с данными истории не найдены');
    return;
  }

  // Добавляем записи чата в базу
  if (chatHistory?.length) {
    console.log('Загрузка истории чата...');
    try {
      await prismaService.loadNewRecords(chatHistory);
      console.log('История чата загружена.');
    } catch (error) {
      console.error('Ошибка при загрузке истории чата:', error);
    }
  }
};

// Вызываем функцию seed
seed()
  .then(() => {
    console.log('Посев завершен успешно');
  })
  .catch((error) => {
    console.error('Ошибка при посеве:', error);
  });

export default seed;