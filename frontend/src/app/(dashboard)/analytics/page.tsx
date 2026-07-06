'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Send,
  CheckCircle2,
  Percent,
  ExternalLink,
} from 'lucide-react';
import { fetcher } from '@/lib/api';
import type { AnalyticsOverview, Post, PostStatus } from '@/lib/types';
import { Card, StatCard, Spinner, StatusBadge } from '@/components/ui';
import { POST_STATUS_META, formatDate } from '@/lib/utils';

interface TimelinePoint {
  date: string;
  published: number;
  failed: number;
}

const RANGE_OPTIONS = [
  { value: 7, label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 30, label: '30 ngày' },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState(14);

  const { data: overview, isLoading } = useSWR<AnalyticsOverview>(
    '/analytics/overview',
    fetcher,
  );
  const { data: timeline } = useSWR<TimelinePoint[]>(
    `/analytics/timeline?days=${range}`,
    fetcher,
  );
  const { data: recent } = useSWR<Post[]>(
    '/posts?status=PUBLISHED&limit=8',
    fetcher,
  );

  if (isLoading) return <Spinner />;

  const byStatus = overview?.byStatus ?? ({} as Record<PostStatus, number>);
  const totalPosts = overview?.totalPosts ?? 0;
  const published = byStatus.PUBLISHED ?? 0;
  const failed = byStatus.FAILED ?? 0;
  const successRate =
    published + failed > 0
      ? Math.round((published / (published + failed)) * 100)
      : 0;

  // Dữ liệu donut theo trạng thái
  const statusData = (Object.keys(byStatus) as PostStatus[])
    .filter((k) => byStatus[k] > 0)
    .map((k) => ({
      name: POST_STATUS_META[k].label,
      value: byStatus[k],
      color: POST_STATUS_META[k].color,
    }));

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Phân tích
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Hiệu suất sinh và đăng nội dung theo thời gian.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-bg-card/50 p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={
                range === opt.value
                  ? 'rounded-md bg-brand/20 px-3 py-1.5 text-xs font-medium text-brand-soft'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white'
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng bài viết"
          value={totalPosts}
          icon={<Send className="h-5 w-5" />}
          accent="brand"
        />
        <StatCard
          label="Đã đăng"
          value={published}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Tỷ lệ thành công"
          value={`${successRate}%`}
          icon={<Percent className="h-5 w-5" />}
          accent="cyan"
        />
        <StatCard
          label="Chiến dịch hoạt động"
          value={overview?.activeCampaigns ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-4 font-display font-semibold">
            Hiệu suất đăng bài theo thời gian
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline ?? []}>
              <defs>
                <linearGradient id="gPub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
              />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#16161f',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="published"
                stroke="#7c5cff"
                strokeWidth={2}
                fill="url(#gPub)"
                name="Đã đăng"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="mb-4 font-display font-semibold">Phân bổ trạng thái</p>
          {statusData.length === 0 ? (
            <p className="py-16 text-center text-sm text-white/40">
              Chưa có dữ liệu
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#16161f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {statusData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 text-white/60">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: d.color }}
                      />
                      {d.name}
                    </span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Recent published table */}
      <Card>
        <p className="mb-4 font-display font-semibold">Bài viết gần đây</p>
        {!recent || recent.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/40">
            Chưa có bài viết nào được đăng.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-white/40">
                  <th className="pb-3 font-medium">Nội dung</th>
                  <th className="pb-3 font-medium">Nền tảng</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium">Thời gian</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((post) => {
                  const target = post.targets?.[0];
                  return (
                    <tr
                      key={post.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="max-w-xs py-3 pr-4">
                        <p className="truncate text-white/80">
                          {post.captionVi || post.captionEn || '—'}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-white/60">Facebook</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="py-3 pr-4 text-white/50">
                        {formatDate(target?.publishedAt || post.scheduledAt)}
                      </td>
                      <td className="py-3">
                        {target?.permalink && (
                          <a
                            href={target.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-soft hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
