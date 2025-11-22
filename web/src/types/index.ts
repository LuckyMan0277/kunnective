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
