import { parseBotEnv } from '~/config/env';

// SITE_URL — домен (он же origin для CORS), каталог живёт под /essence
export const catalogUrl = (): string =>
  `https://${parseBotEnv().SITE_URL.replace(/\/+$/, '')}/essence/`;
