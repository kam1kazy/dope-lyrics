export interface IUser {
  id: number;
  username: string;
  email?: string | null;
  password?: string | null;
  isAdmin?: boolean;
  role?: 'OWNER' | 'ADMIN' | 'USER';
  telegramId?: bigint | number | null;
}
