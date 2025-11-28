// Database Types
export interface Database {
    public: {
        Tables: {
            users: {
                Row: UserProfile
                Insert: InsertUserProfile
                Update: UpdateUserProfile
            }
            ideas: {
                Row: Idea
                Insert: InsertIdea
                Update: UpdateIdea
            }
            projects: {
                Row: Project
                Insert: InsertProject
                Update: UpdateProject
            }
        }
    }
}

// User Types
export interface UserProfile {
    id: string
    email: string
    username: string
    name?: string
    bio?: string
    major?: string
    year?: string
    skills: string[]
    portfolio_url?: string
    github_url?: string
    linkedin_url?: string
    avatar_url?: string
    available_for_projects: boolean
    project_count: number
    rating: number
    created_at: string
    updated_at: string
}

export interface InsertUserProfile {
    id: string
    email: string
    username: string
    name?: string
    bio?: string
    major?: string
    year?: string
    skills?: string[]
    portfolio_url?: string
    github_url?: string
    linkedin_url?: string
    avatar_url?: string
    available_for_projects?: boolean
}

export interface UpdateUserProfile {
    username?: string
    name?: string
    bio?: string
    major?: string
    year?: string
    skills?: string[]
    portfolio_url?: string
    github_url?: string
    linkedin_url?: string
    avatar_url?: string
    available_for_projects?: boolean
}

// Idea Types
export type IdeaStatus = 'active' | 'converted_to_project' | 'archived'

export interface Idea {
    id: string
    author_id: string
    title: string
    description: string
    category: string
    likes_count: number
    comments_count: number
    view_count: number
    status: IdeaStatus
    converted_project_id?: string
    created_at: string
    updated_at: string
    // Relations
    author?: UserProfile
    is_liked?: boolean
}

export interface InsertIdea {
    author_id: string
    title: string
    description: string
    category: string
    status?: IdeaStatus
}

export interface UpdateIdea {
    title?: string
    description?: string
    category?: string
    status?: IdeaStatus
    converted_project_id?: string
}

export interface IdeaComment {
    id: string
    idea_id: string
    author_id: string
    content: string
    parent_comment_id?: string
    likes_count: number
    created_at: string
    updated_at: string
    // Relations
    author?: UserProfile
    replies?: IdeaComment[]
}

export interface IdeaLike {
    id: string
    idea_id: string
    user_id: string
    created_at: string
}

// Project Types
export type ProjectStatus = 'recruiting' | 'in_progress' | 'completed' | 'on_hold'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'
export type MemberStatus = 'active' | 'left' | 'removed'
export type JoinedVia = 'application' | 'headhunt'

export interface Project {
    id: string
    owner_id: string
    title: string
    description: string
    category?: string
    tech_stack: string[]
    duration?: string
    status: ProjectStatus
    max_members?: number
    likes_count: number
    comments_count: number
    view_count: number
    source_idea_id?: string
    github_url?: string
    demo_url?: string
    created_at: string
    updated_at: string
    // Relations
    owner?: UserProfile
    positions?: Position[]
    team_members?: TeamMember[]
    is_liked?: boolean
}

export interface InsertProject {
    owner_id: string
    title: string
    description: string
    category?: string
    tech_stack?: string[]
    duration?: string
    status?: ProjectStatus
    source_idea_id?: string
    github_url?: string
    demo_url?: string
}

export interface UpdateProject {
    title?: string
    description?: string
    category?: string
    tech_stack?: string[]
    duration?: string
    status?: ProjectStatus
    github_url?: string
    demo_url?: string
}

export interface Position {
    id: string
    project_id: string
    role: string
    required_count: number
    filled_count: number
    description?: string
    created_at: string
}

export interface TeamMember {
    id: string
    project_id: string
    user_id: string
    position_id?: string
    joined_via: JoinedVia
    status: MemberStatus
    joined_at: string
    // Relations
    user?: UserProfile
    position?: Position
}

export interface Application {
    id: string
    project_id: string
    position_id: string
    user_id: string
    message?: string
    status: ApplicationStatus
    created_at: string
    updated_at: string
    // Relations
    user?: UserProfile
    project?: Project
    position?: Position
}

export interface HeadhuntProposal {
    id: string
    project_id: string
    position_id: string
    from_user_id: string
    to_user_id: string
    message?: string
    status: ApplicationStatus
    created_at: string
    updated_at: string
    // Relations
    from_user?: UserProfile
    to_user?: UserProfile
    project?: Project
    position?: Position
}

export interface ProjectComment {
    id: string
    project_id: string
    author_id: string
    content: string
    parent_comment_id?: string
    likes_count: number
    created_at: string
    updated_at: string
    // Relations
    author?: UserProfile
    replies?: ProjectComment[]
}

export interface ProjectLike {
    id: string
    project_id: string
    user_id: string
    created_at: string
}

// Notification Types
export type NotificationType = 'application' | 'proposal' | 'comment' | 'like' | 'system'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    content: string
    link_url?: string
    is_read: boolean
    created_at: string
    updated_at: string
}

// Chat Types
export interface ChatRoom {
    id: string
    created_at: string
    updated_at: string
    last_message?: string
    last_message_at?: string
    // Relations
    participants?: ChatParticipant[]
}

export interface ChatParticipant {
    room_id: string
    user_id: string
    joined_at: string
    // Relations
    user?: UserProfile
}

export interface ChatMessage {
    id: string
    room_id: string
    sender_id: string
    content: string
    is_read: boolean
    created_at: string
    // Relations
    sender?: UserProfile
}
