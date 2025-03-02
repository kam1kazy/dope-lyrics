export interface IUser {
  id: number
  name: string
  password: string
  email: string
  emailVerified: Date
  image: string
  role: string
  accounts: Account[]
  sessions: Session[]
}

type Account = {
  id: number
  userId: number
  type: string
  provider: string
  providerAccountId: string
  refresh_token: string
  access_token: string
  expires_at: number
  token_type: string
  scope: string
  id_token: string
  session_state: string
  user: IUser
}

type Session = {
  id: number
  userId: number
  refreshToken: string
  sessionToken: string
  expires: Date
  user: IUser
}

export interface AuthResponse {
  id: number
  refreshToken: string
  sessionToken: string
  email: string
  name: string
  role: string
  user: IUser
  createdAt: string
  updatedAt: string
}