import { PostStatus, TargetStatus } from './types';

// Nhãn tiếng Việt + màu cho từng trạng thái bài viết
export const POST_STATUS_META: Record<
  PostStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: 'Nháp', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  PENDING: { label: 'Chờ duyệt', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  APPROVED: { label: 'Đã duyệt', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  PUBLISHED: { label: 'Đã đăng', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  FAILED: { label: 'Thất bại', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  REJECTED: { label: 'Từ chối', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
};

export const TARGET_STATUS_META: Record<
  TargetStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'Chờ đăng', color: '#fbbf24' },
  PUBLISHED: { label: 'Đã đăng', color: '#34d399' },
  FAILED: { label: 'Lỗi', color: '#f87171' },
};

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date?: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date?: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

// Thời gian tương đối tiếng Việt (vd: "vừa xong", "5 phút trước", "2 giờ trước")
export function formatRelativeTime(date?: string | null): string {
  if (!date) return '—';
  const then = new Date(date).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);

  if (diffSec < 30) return 'vừa xong';
  if (diffSec < 60) return `${diffSec} giây trước`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return formatDate(date);
}
