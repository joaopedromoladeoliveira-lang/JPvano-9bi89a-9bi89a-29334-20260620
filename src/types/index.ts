export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  isVerified: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  isPrivate: boolean;
  isBanned: boolean;
  isSuspended: boolean;
  followers: string[];
  following: string[];
  posts: string[];
  savedPosts: string[];
  createdAt: string;
  twoFactorEnabled: boolean;
  notifications: NotificationSettings;
  verificationStatus?: 'none' | 'pending' | 'reviewing' | 'approved' | 'rejected';
  premiumTier?: 'none' | 'basic' | 'pro' | 'creator';
  theme?: 'dark' | 'light';
  badgeColor?: string;
}

export interface Post {
  id: string;
  userId: string;
  type: 'image' | 'video' | 'carousel' | 'text' | 'reel';
  content: string;
  media: string[];
  likes: string[];
  comments: Comment[];
  shares: number;
  saves: string[];
  hashtags: string[];
  mentions: string[];
  location?: string;
  isStory: boolean;
  expiresAt?: string;
  createdAt: string;
  isReported: boolean;
  reports: Report[];
  viewCount: number;
  isHidden: boolean;
  commentsDisabled: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  likes: string[];
  replies: Comment[];
  createdAt: string;
  isDeleted: boolean;
}

export interface Story {
  id: string;
  userId: string;
  media: string;
  type: 'image' | 'video';
  viewers: string[];
  createdAt: string;
  expiresAt: string;
  duration: number;
  overlayText?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'emoji';
  mediaUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  isDeleted: boolean;
  reactions: { userId: string; emoji: string }[];
}

export interface Conversation {
  id: string;
  participants: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
  admins?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  fromUserId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share' | 'story' | 'live' | 'verification' | 'system';
  postId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentImages: string[];
  selfieImage?: string;
  reason: string;
  adminNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Advertisement {
  id: string;
  userId: string;
  title: string;
  description: string;
  media: string;
  targetUrl: string;
  budget: number;
  spent: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  targeting: {
    ageMin: number;
    ageMax: number;
    interests: string[];
    location: string[];
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
  };
  isFreeAdmin: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  creatorId: string;
  tier: 'basic' | 'pro' | 'vip';
  price: number;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reason: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  messages: boolean;
  stories: boolean;
  live: boolean;
  email: boolean;
  push: boolean;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalRevenue: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  activeSubscriptions: number;
  adRevenue: number;
  newUsersToday: number;
  postsToday: number;
  pendingVerifications: number;
  pendingReports: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
