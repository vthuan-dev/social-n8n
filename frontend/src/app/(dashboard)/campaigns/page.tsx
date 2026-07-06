'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Plus,
  Megaphone,
  Sparkles,
  Play,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import api, { fetcher } from '@/lib/api';
import type { Campaign, ContentLanguage } from '@/lib/types';
import { Card, EmptyState, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const LANGUAGE_LABEL: Record<ContentLanguage, string> = {
  VI: 'Tiếng Việt',
  EN: 'English',
  BOTH: 'Song ngữ',
};

interface CampaignForm {
  name: string;
  topic: string;
  brandVoice: string;
  language: ContentLanguage;
  schedule: string;
  isActive: boolean;
}

const EMPTY_FORM: CampaignForm = {
  name: '',
  topic: '',
  brandVoice: '',
  language: 'BOTH',
  schedule: '0 9 * * *',
  isActive: true,
};

export default function CampaignsPage() {
  const { data, error, isLoading, mutate } = useSWR<Campaign[]>(
    '/campaigns',
    fetcher,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(c: Campaign) {
    setEditing(c);
    setForm({
      name: c.name,
      topic: c.topic,
      brandVoice: c.brandVoice ?? '',
      language: c.language,
      schedule: c.schedule ?? '',
      isActive: c.isActive,
    });
    setDrawerOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        topic: form.topic,
        brandVoice: form.brandVoice || undefined,
        language: form.language,
        schedule: form.schedule || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/campaigns/${editing.id}`, payload);
      } else {
        await api.post('/campaigns', payload);
      }
      setDrawerOpen(false);
      mutate();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá chiến dịch này? Các bài viết liên quan cũng sẽ bị xoá.'))
      return;
    await api.delete(`/campaigns/${id}`);
    mutate();
  }

  async function handleGenerate(id: string) {
    setGeneratingId(id);
    try {
      await api.post(`/campaigns/${id}/generate`);
      alert('Đã gửi yêu cầu sinh nội dung. Bài viết sẽ xuất hiện trong Hàng chờ duyệt.');
    } catch {
      alert('Không thể trigger sinh nội dung. Kiểm tra cấu hình n8n.');
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Chiến dịch
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Định nghĩa chủ đề, giọng thương hiệu và lịch tự động sinh nội dung.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Chiến dịch mới
        </button>
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
          title="Chưa có chiến dịch nào"
          description="Tạo chiến dịch đầu tiên để bắt đầu tự động sinh nội dung."
          action={
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Tạo chiến dịch
            </button>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <Card key={c.id} hover className="flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand-soft">
                  <Megaphone className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'badge',
                    c.isActive
                      ? 'bg-accent-green/15 text-accent-green'
                      : 'bg-white/8 text-white/50',
                  )}
                >
                  {c.isActive ? 'Đang chạy' : 'Tạm dừng'}
                </span>
              </div>

              <h3 className="mt-3 font-display text-lg font-semibold">
                {c.name}
              </h3>
              <p className="mt-1 text-sm text-white/50">{c.topic}</p>

              {c.brandVoice && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/35">
                  {c.brandVoice}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge bg-white/8 text-white/60">
                  {LANGUAGE_LABEL[c.language]}
                </span>
                {c.schedule && (
                  <span className="badge bg-accent-cyan/15 text-accent-cyan">
                    {c.schedule}
                  </span>
                )}
                <span className="badge bg-white/8 text-white/60">
                  {c._count?.posts ?? 0} bài
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => handleGenerate(c.id)}
                  disabled={generatingId === c.id}
                >
                  {generatingId === c.id ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Sinh ngay
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => openEdit(c)}
                  aria-label="Sửa"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="btn btn-ghost text-accent-red"
                  onClick={() => handleDelete(c.id)}
                  aria-label="Xoá"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Drawer form */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-border bg-bg-soft p-6 animate-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">
                {editing ? 'Sửa chiến dịch' : 'Chiến dịch mới'}
              </h3>
              <button
                className="text-white/50 hover:text-white"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  Tên chiến dịch
                </label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Ra mắt sản phẩm mùa hè"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  Chủ đề
                </label>
                <input
                  className="input"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="VD: Mẹo công nghệ hằng ngày"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  Giọng thương hiệu
                </label>
                <textarea
                  className="input min-h-[90px] resize-y"
                  value={form.brandVoice}
                  onChange={(e) =>
                    setForm({ ...form, brandVoice: e.target.value })
                  }
                  placeholder="VD: Thân thiện, chuyên nghiệp, truyền cảm hứng..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  Ngôn ngữ nội dung
                </label>
                <div className="flex gap-2">
                  {(['VI', 'EN', 'BOTH'] as ContentLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setForm({ ...form, language: lang })}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                        form.language === lang
                          ? 'border-brand bg-brand/15 text-brand-soft'
                          : 'border-border bg-bg-card/50 text-white/50 hover:text-white',
                      )}
                    >
                      {LANGUAGE_LABEL[lang]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  Lịch (cron)
                </label>
                <input
                  className="input font-mono text-sm"
                  value={form.schedule}
                  onChange={(e) =>
                    setForm({ ...form, schedule: e.target.value })
                  }
                  placeholder="0 9 * * *"
                />
                <p className="mt-1 text-xs text-white/35">
                  VD: <span className="font-mono">0 9 * * *</span> = 9h sáng mỗi
                  ngày. Để trống nếu chỉ sinh thủ công.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-border bg-bg-card/50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-sm text-white/70">
                  Kích hoạt chiến dịch (tự động sinh theo lịch)
                </span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setDrawerOpen(false)}
              >
                Huỷ
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={handleSave}
                disabled={saving || !form.name || !form.topic}
              >
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
