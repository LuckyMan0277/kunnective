export interface UserProfile {
  id: string
  email: string
  name: string
  major?: string
  year?: number
  bio?: string
  skills: string[]
  interests: string[]
  portfolio_url?: string
  github_url?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface InsertUserProfile {
  id: string
  email: string
  name: string
  major?: string
  year?: number
  bio?: string
  skills?: string[]
  interests?: string[]
  portfolio_url?: string
  github_url?: string
  avatar_url?: string
}

export interface UpdateUserProfile {
  name?: string
  major?: string
  year?: number
  bio?: string
  skills?: string[]
  interests?: string[]
  portfolio_url?: string
  github_url?: string
  avatar_url?: string
}

// Idea types
export type IdeaStatus = 'recruiting' | 'in_progress' | 'completed' | 'closed'

export interface Idea {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  tags: string[]
  status: IdeaStatus
  required_roles: string[]
  view_count: number
  created_at: string
  updated_at: string
  // Relations
  user?: UserProfile
  like_count?: number
  comment_count?: number
  is_liked?: boolean
  is_bookmarked?: boolean
}

export interface InsertIdea {
  user_id: string
  title: string
  content: string
  category: string
  tags?: string[]
  status?: IdeaStatus
  required_roles?: string[]
}

export interface UpdateIdea {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  status?: IdeaStatus
  required_roles?: string[]
}

export interface IdeaComment {
  id: string
  idea_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: UserProfile
}

export interface IdeaLike {
  id: string
  idea_id: string
  user_id: string
  created_at: string
}

export interface IdeaBookmark {
  id: string
  idea_id: string
  user_id: string
  created_at: string
}

// Project types
export type ProjectStatus = 'recruiting' | 'in_progress' | 'completed' | 'on_hold'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type MemberStatus = 'active' | 'left' | 'removed'

export interface Project {
  id: string
  idea_id?: string
  owner_id: string
  title: string
  description: string
  status: ProjectStatus
  category: string
  tags: string[]
  start_date?: string
  end_date?: string
  github_url?: string
  demo_url?: string
  max_members: number
  created_at: string
  updated_at: string
  // Relations
  owner?: UserProfile
  members?: ProjectMember[]
  member_count?: number
  required_roles?: ProjectRequiredRole[]
}

export interface InsertProject {
  idea_id?: string
  owner_id: string
  title: string
  description: string
  status?: ProjectStatus
  category: string
  tags?: string[]
  start_date?: string
  end_date?: string
  github_url?: string
  demo_url?: string
  max_members?: number
}

export interface UpdateProject {
  title?: string
  description?: string
  status?: ProjectStatus
  category?: string
  tags?: string[]
  start_date?: string
  end_date?: string
  github_url?: string
  demo_url?: string
  max_members?: number
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  status: MemberStatus
  joined_at: string
  user?: UserProfile
}

export interface ProjectApplication {
  id: string
  project_id: string
  user_id: string
  role: string
  message?: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  user?: UserProfile
  project?: Project
}

export interface ProjectScout {
  id: string
  project_id: string
  sender_id: string
  receiver_id: string
  role: string
  message?: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  sender?: UserProfile
  receiver?: UserProfile
  project?: Project
}

export interface ProjectRequiredRole {
  id: string
  project_id: string
  role_name: string
  count: number
  description?: string
  created_at: string
}

// Chat types
export type ChatRoomType = 'direct' | 'group' | 'project'
export type MessageType = 'text' | 'image' | 'file' | 'system'
export type ParticipantRole = 'admin' | 'member'

export interface ChatRoom {
  id: string
  name?: string
  type: ChatRoomType
  project_id?: string
  created_at: string
  updated_at: string
  // Relations
  participants?: ChatParticipant[]
  last_message?: Message
  unread_count?: number
  other_participant?: UserProfile // For direct chats
  project?: Project
}

export interface ChatParticipant {
  id: string
  room_id: string
  user_id: string
  role: ParticipantRole
  joined_at: string
  last_read_at: string
  user?: UserProfile
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  type: MessageType
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  user?: UserProfile
}

export interface InsertChatRoom {
  name?: string
  type: ChatRoomType
  project_id?: string
}

export interface InsertChatParticipant {
  room_id: string
  user_id: string
  role?: ParticipantRole
}

export interface InsertMessage {
  room_id: string
  user_id: string
  content: string
  type?: MessageType
  metadata?: Record<string, any>
}

// Notification types
export type NotificationType =
  | 'application_accepted'
  | 'application_rejected'
  | 'new_application'
  | 'scout_received'
  | 'scout_accepted'
  | 'scout_rejected'
  | 'idea_liked'
  | 'idea_commented'
  | 'project_invite'
  | 'new_message'
  | 'member_joined'
  | 'member_left'
  | 'project_update'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link_url?: string
  metadata: Record<string, any>
  is_read: boolean
  created_at: string
}

export interface InsertNotification {
  user_id: string
  type: NotificationType
  title: string
  message: string
  link_url?: string
  metadata?: Record<string, any>
}
