// Kiểu dữ liệu dùng chung, khớp với Prisma schema của backend

export type Role = 'ADMIN' | 'EDITOR';

export type Platform = 'FACEBOOK';

export type PostStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'FAILED'
  | 'REJECTED';

export type TargetStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export type ContentLanguage = 'VI' | 'EN' | 'BOTH';

export interface Campaign {
  id: string;
  name: string;
  topic: string;
  brandVoice?: string | null;
  language: ContentLanguage;
  schedule?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { posts: number };
}

export interface PostTarget {
  id: string;
  platform: Platform;
  status: TargetStatus;
  externalId?: string | null;
  permalink?: string | null;
  error?: string | null;
  publishedAt?: string | null;
}

export interface Post {
  id: string;
  campaignId: string;
  captionVi?: string | null;
  captionEn?: string | null;
  imageUrl?: string | null;
  hashtags: string[];
  status: PostStatus;
  scheduledAt?: string | null;
  createdAt: string;
  targets: PostTarget[];
  campaign?: Campaign;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  displayName: string;
  externalId?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  postId?: string | null;
  level: string;
  source: string;
  message: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalPosts: number;
  byStatus: Record<PostStatus, number>;
  activeCampaigns: number;
  connectedAccounts: number;
  recentLogs: LogEntry[];
}
