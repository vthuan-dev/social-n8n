'use client';

import useSWR from 'swr';
import {
  FileText,
  Clock,
  Send,
  Megaphone,
  Activity,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { fetcher } from '@/lib/api';
import { Card, StatCard, Spinner } from '@/components/ui';
import type { AnalyticsOverview } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';

interface TimelinePoint {
  date: string;
  count: number;
}

const PIPELINE = [
  { key: 'DRAFT', label: 'Nháp', color: 'bg-white/30' },
  { key: 'PENDING', label: 'Chờ duyệt', color: 'bg-accent-amber' },
  { key: 'APPROVED', label: 'Đã duyệt', color: 'bg-brand' },
  { key: 'PUBLISHED', label: 'Đã đăng', color: 'bg-accent-green' },
] as const;

export default function DashboardPage() {
  const { data: overview } = useSWR<AnalyticsOverview>(
    '/analytics/overview',
    fetcher,
  );
  const { data: timeline } = useSWR<TimelinePoint[]>(
    '/analytics/timeline?days=14',
    fetcher,
  );

  if (!overview) return <Spinner />;

  const maxPipeline = Math.max(
    1,
    ...PIPELINE.map((p) => overview.byStatus[p.key] ?? 0),
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng bài viết"
          value={overview.totalPosts}
          icon={<FileText className="h-5 w-5" />}
          accent="brand"
        />
        <StatCard
          label="Chờ duyệt"
          value={overview.byStatus.PENDING ?? 0}
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Đã đăng"
          value={overview.byStatus.PUBLISHED ?? 0}
          icon={<Send className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Chiến dịch hoạt động"
          value={overview.activeCampaigns}
          icon={<Megaphone className="h-5 w-5" />}
          accent="cyan"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Bài đăng 14 ngày qua
              </h2>
              <p className="text-sm text-white/45">
                Số lượng nội dung được tạo mỗi ngày
              </p>
            </div>
            <Zap className="h-5 w-5 text-brand-soft" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline ?? []}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: '#16161f',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#7c5cff"
                  strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline */}
        <Card>
          <h2 className="mb-4 font-display text-lg font-semibold">
            Pipeline nội dung
          </h2>
          <div className="space-y-4">
            {PIPELINE.map((p) => {
              const val = overview.byStatus[p.key] ?? 0;
              return (
                <div key={p.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-white/60">{p.label}</span>
                    <span className="font-semibold">{val}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${p.color} transition-all`}
                      style={{ width: `${(val / maxPipeline) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-soft" />
          <h2 className="font-display text-lg font-semibold">
            Hoạt động gần đây
          </h2>
        </div>
        {overview.recentLogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            Chưa có hoạt động nào
          </p>
        ) : (
          <div className="space-y-1">
            {overview.recentLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/5"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    log.level === 'error'
                      ? 'bg-accent-red'
                      : 'bg-accent-green'
                  }`}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-white/70">
                  {log.message}
                </span>
                <span className="shrink-0 text-xs text-white/35">
                  {formatRelativeTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
