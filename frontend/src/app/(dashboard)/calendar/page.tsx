'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Facebook, Clock } from 'lucide-react';
import { fetcher } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Card, Spinner } from '@/components/ui';
import { cn, POST_STATUS_META } from '@/lib/utils';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Trả về offset thứ 2 = 0 ... chủ nhật = 6
function mondayIndex(day: number) {
  return (day + 6) % 7;
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const { data, isLoading } = useSWR<Post[]>('/posts', fetcher);

  const monthLabel = cursor.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  // Gom bài viết theo ngày (yyyy-mm-dd) dựa trên scheduledAt
  const postsByDay = useMemo(() => {
    const map: Record<string, Post[]> = {};
    (data ?? []).forEach((p) => {
      if (!p.scheduledAt) return;
      const key = new Date(p.scheduledAt).toDateString();
      (map[key] ??= []).push(p);
    });
    return map;
  }, [data]);

  // Danh sách các ô ngày trong lưới (bao gồm padding đầu tháng)
  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate();
    const pad = mondayIndex(first.getDay());
    const arr: (Date | null)[] = [];
    for (let i = 0; i < pad; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    return arr;
  }, [cursor]);

  const today = new Date().toDateString();

  // Danh sách bài sắp tới (scheduled trong tương lai gần)
  const upcoming = useMemo(() => {
    const now = Date.now();
    return (data ?? [])
      .filter((p) => p.scheduledAt && new Date(p.scheduledAt).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.scheduledAt!).getTime() -
          new Date(b.scheduledAt!).getTime(),
      )
      .slice(0, 6);
  }, [data]);

  return (
    <div className="animate-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Lịch đăng
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Theo dõi lịch trình các bài viết đã lên lịch và đã đăng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost !px-2.5"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center font-display text-sm font-semibold capitalize">
            {monthLabel}
          </span>
          <button
            className="btn btn-ghost !px-2.5"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
          {/* Calendar grid */}
          <Card className="!p-4">
            <div className="mb-2 grid grid-cols-7 gap-2">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="py-1 text-center text-xs font-semibold text-white/40"
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((date, i) => {
                if (!date) return <div key={`pad-${i}`} />;
                const key = date.toDateString();
                const dayPosts = postsByDay[key] ?? [];
                const isToday = key === today;
                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-[92px] rounded-lg border p-1.5 transition-colors',
                      isToday
                        ? 'border-brand/60 bg-brand/5 shadow-glow'
                        : 'border-border bg-bg-card/40 hover:border-border',
                    )}
                  >
                    <div
                      className={cn(
                        'mb-1 text-xs font-medium',
                        isToday ? 'text-brand-soft' : 'text-white/50',
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((p) => {
                        const meta = POST_STATUS_META[p.status];
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px]"
                            style={{ background: meta.bg, color: meta.color }}
                            title={p.captionVi ?? ''}
                          >
                            <Facebook className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">
                              {new Date(p.scheduledAt!).toLocaleTimeString(
                                'vi-VN',
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                            </span>
                          </div>
                        );
                      })}
                      {dayPosts.length > 2 && (
                        <div className="text-[10px] text-white/40">
                          +{dayPosts.length - 2} bài khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming panel */}
          <Card className="h-fit">
            <h3 className="mb-4 font-display text-base font-semibold">
              Sắp đăng
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-white/40">
                Chưa có bài nào được lên lịch.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((p) => {
                  const meta = POST_STATUS_META[p.status];
                  return (
                    <div
                      key={p.id}
                      className="flex gap-3 rounded-lg border border-border bg-bg-card/40 p-3"
                    >
                      <div
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: meta.color }}
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs text-white/75">
                          {p.captionVi ?? p.captionEn ?? 'Bài viết'}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
                          <Clock className="h-3 w-3" />
                          {new Date(p.scheduledAt!).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
