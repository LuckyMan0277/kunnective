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
