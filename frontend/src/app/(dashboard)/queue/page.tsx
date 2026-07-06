'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Check,
  X,
  Pencil,
  Facebook,
  Sparkles,
  Clock,
  Save,
} from 'lucide-react';
import api, { fetcher } from '@/lib/api';
import type { Post, PostStatus } from '@/lib/types';
import { Card, EmptyState, Spinner, StatusBadge } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';

const FILTERS: { key: string; label: string; status?: PostStatus }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt', status: 'PENDING' },
  { key: 'APPROVED', label: 'Đã duyệt', status: 'APPROVED' },
  { key: 'PUBLISHED', label: 'Đã đăng', status: 'PUBLISHED' },
  { key: 'REJECTED', label: 'Từ chối', status: 'REJECTED' },
];

export default function QueuePage() {
  const [filter, setFilter] = useState('PENDING');
  const activeFilter = FILTERS.find((f) => f.key === filter);
  const query = activeFilter?.status ? `?status=${activeFilter.status}` : '';

  const { data, error, isLoading, mutate } = useSWR<Post[]>(
    `/posts${query}`,
    fetcher,
  );

  const [selected, setSelected] = useState<Post | null>(null);
  const [editVi, setEditVi] = useState('');
  const [editEn, setEditEn] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  function openDetail(post: Post) {
    setSelected(post);
    setEditVi(post.captionVi ?? '');
    setEditEn(post.captionEn ?? '');
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await api.post(`/posts/${id}/approve`);
      mutate();
      setSelected(null);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setBusyId(id);
    try {
      await api.post(`/posts/${id}/reject`);
      mutate();
      setSelected(null);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveEdit() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      await api.patch(`/posts/${selected.id}`, {
        captionVi: editVi,
        captionEn: editEn,
      });
      mutate();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Hàng chờ duyệt
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Xem lại nội dung do AI sinh, chỉnh sửa và duyệt trước khi đăng.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
              filter === f.key
                ? 'border-brand bg-brand/15 text-brand-soft'
                : 'border-border bg-bg-card/50 text-white/50 hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}
      {error && (
        <EmptyState
          title="Không tải được dữ liệu"
          description="Kiểm tra kết nối tới backend API."
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          title="Không có bài viết nào"
          description="Chưa có nội dung ở trạng thái này. Hãy sinh nội dung từ trang Chiến dịch."
        />
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((post) => (
            <Card
              key={post.id}
              hover
              className={cn(
                'flex cursor-pointer flex-col !p-0 overflow-hidden',
                selected?.id === post.id && 'ring-2 ring-brand',
              )}
            >
              <div onClick={() => openDetail(post)}>
                {/* Image */}
                {post.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageUrl}
                    alt="Ảnh minh hoạ bài viết"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-brand-gradient/10">
                    <Sparkles className="h-8 w-8 text-brand-soft/50" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="badge bg-[#1877F2]/15 text-[#4293ff]">
                      <Facebook className="h-3 w-3" /> Facebook
                    </span>
                    <StatusBadge status={post.status} />
                  </div>

                  {post.captionVi && (
                    <p className="mt-3 line-clamp-2 text-sm text-white/80">
                      {post.captionVi}
                    </p>
                  )}
                  {post.captionEn && (
                    <p className="mt-1.5 line-clamp-2 text-xs italic text-white/40">
                      {post.captionEn}
                    </p>
                  )}

                  {post.hashtags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.hashtags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-accent-cyan/80"
                        >
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}

                  {post.scheduledAt && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-white/35">
                      <Clock className="h-3 w-3" />
                      {formatDate(post.scheduledAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions for pending posts */}
              {post.status === 'PENDING' && (
                <div className="flex gap-2 border-t border-border p-3">
                  <button
                    className="btn btn-primary flex-1 !bg-none !bg-accent-green/90 hover:!bg-accent-green"
                    onClick={() => handleApprove(post.id)}
                    disabled={busyId === post.id}
                  >
                    <Check className="h-4 w-4" />
                    Duyệt
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => openDetail(post)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="btn btn-ghost text-accent-red"
                    onClick={() => handleReject(post.id)}
                    disabled={busyId === post.id}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Detail / edit panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 h-full w-full max-w-lg overflow-y-auto border-l border-border bg-bg-soft p-6 animate-in">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">
                Chi tiết bài viết
              </h3>
              <button
                className="text-white/50 hover:text-white"
                onClick={() => setSelected(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt="Ảnh minh hoạ"
                className="mb-4 h-52 w-full rounded-xl object-cover"
              />
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  Nội dung tiếng Việt
                </label>
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={editVi}
                  onChange={(e) => setEditVi(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  Nội dung tiếng Anh
                </label>
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={editEn}
                  onChange={(e) => setEditEn(e.target.value)}
                />
              </div>

              {selected.hashtags?.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Hashtag
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="badge bg-accent-cyan/15 text-accent-cyan"
                      >
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn btn-ghost w-full"
                onClick={handleSaveEdit}
                disabled={busyId === selected.id}
              >
                <Save className="h-4 w-4" />
                Lưu chỉnh sửa
              </button>
            </div>

            {selected.status === 'PENDING' && (
              <div className="mt-6 flex gap-3 border-t border-border pt-5">
                <button
                  className="btn flex-1 !bg-accent-green/90 text-white hover:!bg-accent-green"
                  onClick={() => handleApprove(selected.id)}
                  disabled={busyId === selected.id}
                >
                  <Check className="h-4 w-4" />
                  Duyệt & lên lịch đăng
                </button>
                <button
                  className="btn btn-ghost text-accent-red"
                  onClick={() => handleReject(selected.id)}
                  disabled={busyId === selected.id}
                >
                  <X className="h-4 w-4" />
                  Từ chối
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
