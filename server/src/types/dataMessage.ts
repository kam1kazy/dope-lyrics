interface IInputPeer {
  _: string
  channelId: number
  accessHash: any[]
}

interface IChatAdminRights {
  _: string
  changeInfo: boolean
  postMessages: boolean
  editMessages: boolean
  deleteMessages: boolean
  banUsers: boolean
  inviteUsers: boolean
  pinMessages: boolean
  addAdmins: boolean
  anonymous: boolean
  manageCall: boolean
  other: boolean
  manageTopics: boolean
  postStories: boolean
  editStories: boolean
  deleteStories: boolean
}

interface IColor {
  color: number
  backgroundEmojiId: any
}

interface IPhoto {
  isPersonal: boolean
  small: any
  big: any
}

interface ISender {
  id: number
  isMin: boolean
  inputPeer: IInputPeer
  chatType: string
  isGroup: boolean
  isVerified: boolean
  isRestricted: boolean
  isCreator: boolean
  isAdmin: boolean
  isScam: boolean
  isFake: boolean
  isSupport: boolean
  isSelf: boolean
  isContact: boolean
  isForum: boolean
  isUnavailable: boolean
  isMember: boolean
  storiesHidden: boolean
  storiesUnavailable: boolean
  hasJoinRequests: boolean
  hasJoinToSend: boolean
  hasContentProtection: boolean
  hasProfileSignatures: boolean
  title: string
  username: any
  usernames: any
  firstName: any
  lastName: any
  displayName: string
  photo: IPhoto
  dcId: number
  restrictions: any
  permissions: any
  defaultPermissions: any
  adminRights: IChatAdminRights
  storiesMaxId: number
  color: IColor
  emojiStatus: any
  profileIColors: IColor
  boostsLevel: number
  subscriptionUntilDate: any
}

interface IChat {
  id: number
  isMin: boolean
  inputPeer: IInputPeer
  chatType: string
  isGroup: boolean
  isVerified: boolean
  isRestricted: boolean
  isCreator: boolean
  isAdmin: boolean
  isScam: boolean
  isFake: boolean
  isSupport: boolean
  isSelf: boolean
  isContact: boolean
  isForum: boolean
  isUnavailable: boolean
  isMember: boolean
  storiesHidden: boolean
  storiesUnavailable: boolean
  hasJoinRequests: boolean
  hasJoinToSend: boolean
  hasContentProtection: boolean
  hasProfileSignatures: boolean
  title: string
  username: any
  usernames: any
  firstName: any
  lastName: any
  displayName: string
  photo: IPhoto
  dcId: number
  restrictions: any
  permissions: any
  defaultPermissions: any
  adminRights: IChatAdminRights
  storiesMaxId: number
  color: IColor
  emojiStatus: any
  profileIColors: IColor
  boostsLevel: number
  subscriptionUntilDate: any
}

interface IMessage {
  isScheduled: boolean
  id: number
  views: number | null
  forwards: number | null
  signature: any
  isOutgoing: boolean
  isService: boolean
  isContentProtected: boolean
  isFromOffline: boolean
  isSilent: boolean
  hasUnreadMedia: boolean
  isChannelPost: boolean
  isFromScheduled: boolean
  isPinned: boolean
  hideEditMark: boolean
  invertMedia: boolean
  groupedId: any
  groupedIdUnique: any
  sender: ISender
  senderBoostCount: number
  chat: IChat
  date: string
  editDate: any
  forward: any
  isAutomaticForward: boolean
  replies: any
  replyToMessage: any
  replyToStory: any
  isTopicMessage: boolean
  isMention: boolean
  quickReplyShortcutId: any
  viaBot: any
  viaBusinessBot: any
  text: string
  entities: any[]
  textWithEntities: any
  action: any
  media: any
  isForwardedPremiumMedia: boolean
  ttlPeriod: any
  markup: any
  canBeForwarded: boolean
  reactions: any
  factCheck: any
  effectId: any
}

interface IHashtagData {
  offset: number
  length: number
  kind: string
  params: {
    kind: string
  }
  text: string
}

export { IMessage, IHashtagData }
