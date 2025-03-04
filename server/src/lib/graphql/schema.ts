import { typeDefinitions } from './querys';
import { resolvers } from './resolvers';
import { createContext, GraphQLContext } from './context';

export const schema = {
  typeDefs: typeDefinitions,
  resolvers,
  context: async (initialContext: { request: Request }): Promise<GraphQLContext> => {
    const { request } = initialContext;
    const ctx = await createContext({ request });
    
    // Обработчик для установки кук в ответе
    const originalSetCookie = ctx.setCookie;
    ctx.setCookie = (name, value, options = {}) => {
      const cookieValue = originalSetCookie(name, value, options);
      
      // Формируем строку для заголовка Set-Cookie
      let cookieString = `${name}=${value}`;
      if (options.httpOnly) cookieString += '; HttpOnly';
      if (options.secure) cookieString += '; Secure';
      if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
      if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
      
      // В GraphQL Yoga нет прямого доступа к response.headers
      // Куки будут установлены через плагин cookie в Elysia
      
      return cookieValue;
    };
    
    return ctx;
  },
  plugins: [],
  path: 'graphql',
};