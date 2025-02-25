export interface IUser {
  id: number
  name: string
  password: string
  email: string
  emailVerified: boolean
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
  expires_at: Date
  token_type: string
  scope: string
  id_token: string
  session_state: string
  user: IUser
}

type Session = {
  id: number
  sessionToken: string
  userId: number
  expires: Date
  user: IUser
}
