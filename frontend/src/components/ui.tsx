'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { PostStatus, TargetStatus } from '@/lib/types';

/* ---------- Status Badge ---------- */

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Nháp', cls: 'bg-white/8 text-white/60' },
  PENDING: { label: 'Chờ duyệt', cls: 'bg-accent-amber/15 text-accent-amber' },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-brand/15 text-brand-soft' },
  PUBLISHED: { label: 'Đã đăng', cls: 'bg-accent-green/15 text-accent-green' },
  FAILED: { label: 'Thất bại', cls: 'bg-accent-red/15 text-accent-red' },
  REJECTED: { label: 'Từ chối', cls: 'bg-accent-red/10 text-accent-red/80' },
};

export function StatusBadge({ status }: { status: PostStatus | TargetStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  return <span className={clsx('badge', s.cls)}>{s.label}</span>;
}

/* ---------- Card ---------- */

export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={clsx('card p-5', hover && 'card-hover', className)}>
      {children}
    </div>
  );
}

/* ---------- Stat Card ---------- */

export function StatCard({
  label,
  value,
  icon,
  accent = 'brand',
  delta,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'brand' | 'cyan' | 'green' | 'amber';
  delta?: string;
}) {
  const accentCls = {
    brand: 'bg-brand/15 text-brand-soft',
    cyan: 'bg-accent-cyan/15 text-accent-cyan',
    green: 'bg-accent-green/15 text-accent-green',
    amber: 'bg-accent-amber/15 text-accent-amber',
  }[accent];

  return (
    <Card hover className="flex items-start gap-4">
      <div className={clsx('flex h-11 w-11 items-center justify-center rounded-xl', accentCls)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-white/50">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tracking-tight">{value}</p>
        {delta && <p className="mt-1 text-xs text-accent-green">{delta}</p>}
      </div>
    </Card>
  );
}

/* ---------- Empty State ---------- */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/30 px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-white/45">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Spinner ---------- */

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-brand" />
    </div>
  );
}
