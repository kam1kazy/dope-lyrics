import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers'
import { ITelegramProfile } from '@/types/services'

export default function TelegramProvider<P extends ITelegramProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: 'telegram',
    name: 'Telegram',
    type: 'oauth',
    authorization: {
      url: 'https://oauth.telegram.org/auth',
      // Telegram не использует стандартный OAuth2 поток, но мы адаптируем его
      params: {
        scope: '', // У Телеги нет scope, оставляем пустым
        // bot_id: options.botId },
      },
    },
    token: {
      // Telegram не выдает токены в классическом виде,
      // поэтому это будет обработано через callback
      url: 'https://oauth.telegram.org/auth',
    },
    // userinfo: 'https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe', // Тут нужно делать запрос через Bot API
    userinfo: {
      // Здесь мы получаем данные пользователя из callback
      request: async (context: any) => {
        return context.user
      },
    },

    profile(profile) {
      return {
        id: profile.id.toString(), // ID в Telegram - это число
        name:
          profile.first_name +
          (profile.last_name ? ' ' + profile.last_name : ''),
        username: profile.username,
        email: null, // У Телеграма нет email, можно генерировать или запрашивать отдельно
        image: profile.photo_url,
      }
    },

    checks: ['state'], // Используем `state` для безопасности

    options,

    // Кастомная логика для проверки подписи Telegram
    // async signIn({ user, account, profile, credentials }) {
    //   const { hash, ...userData } = credentials || profile

    //   // Создаем строку для проверки подписи
    //   const dataCheckString = Object.keys(userData)
    //     .sort()
    //     .map((key) => `${key}=${userData[key]}`)
    //     .join('\n')

    //   // Используем crypto из Node.js для проверки HMAC
    //   const crypto = await import('crypto')
    //   const secretKey = crypto
    //     .createHash('sha256')
    //     .update(options.botToken)
    //     .digest()
    //   const hmac = crypto
    //     .createHmac('sha256', secretKey)
    //     .update(dataCheckString)
    //     .digest('hex')

    //   // Проверяем, что подпись валидна
    //   if (hmac !== hash) {
    //     return false
    //   }

    //   // Проверяем актуальность данных (auth_date не старше 24 часов)
    //   const authDate = parseInt(userData.auth_date)
    //   const now = Math.floor(Date.now() / 1000)
    //   if (now - authDate > 86400) {
    //     return false
    //   }

    //   return true
    // },
  }
}
