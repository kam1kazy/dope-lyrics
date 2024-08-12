import { LyricType } from './lyrics'

export interface UserType {
  id: number
  email: string
  password: string
  lyrics: LyricType[]
}
