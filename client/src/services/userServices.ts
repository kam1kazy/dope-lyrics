import { IUser } from '../types/user'
import { prisma } from '@/auth'

// Загрузка пользователей
export async function loadUsers(users: IUser[]) {
  try {
    const userExists = await prisma.users.findUnique({
      where: {
        id: 1, // значение userId - это пользователь которому принадлежат данные
      },
    })

    if (!userExists) {
      console.log(`\nPRISMA: 🙅 Users не был найден`)
      console.log(`PRISMA: 📝 Начало загрузки ${users.length} пользователей`)
      await prisma.users.createMany({
        data: users,
        skipDuplicates: true,
      })
    } else {
      console.log(`PRISMA: 🫄 UserID: ${userExists.id} уже существует`)
      return
    }

    console.log(`PRISMA: 📊 Итого загружено пользователей: ${users.length}`)
  } catch (error) {
    console.error('PRISMA: ❌ Ошибка при загрузке пользователей:', error)
  }
}
