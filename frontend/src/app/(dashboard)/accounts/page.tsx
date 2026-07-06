'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import {
  Facebook,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Trash2,
  RefreshCw,
  X,
  KeyRound,
} from 'lucide-react';
import api, { fetcher } from '@/lib/api';
import type { SocialAccount } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, EmptyState, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function AccountsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data, isLoading, mutate } = useSWR<SocialAccount[]>(
    '/social/accounts',
    fetcher,
  );
  const [busy, setBusy] = useState<string | null>(null);

  // Form nhập token thủ công (dùng khi OAuth Facebook chưa được duyệt App Review)
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    platform: 'FACEBOOK',
    displayName: '',
    accessToken: '',
    externalId: '',
  });
  const [manualError, setManualError] = useState<string | null>(null);

  // Hiển thị kết quả sau khi Facebook redirect về (?connected=success|error)
  const router = useRouter();
  const searchParams = useSearchParams();
  const [banner, setBanner] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected === 'success' || connected === 'error') {
      setBanner(connected);
      if (connected === 'success') mutate();
      // Dọn query param khỏi URL để không hiện lại khi refresh
      router.replace('/accounts');
    }
  }, [searchParams, router, mutate]);

  // Kiểm tra token sắp hết hạn (trong vòng 7 ngày)
  function isExpiringSoon(acc: SocialAccount) {
    if (!acc.expiresAt) return false;
    const diff = new Date(acc.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }

  async function handleConnect() {
    // Khởi tạo luồng OAuth Facebook — backend trả về URL uỷ quyền
    try {
      setBusy('connect');
      const { data: res } = await api.get('/social/facebook/oauth-url');
      if (res?.url) window.location.href = res.url;
    } catch {
      alert('Không thể khởi tạo kết nối. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm('Ngắt kết nối tài khoản này?')) return;
    setBusy(id);
    try {
      await api.delete(`/social/accounts/${id}`);
      mutate();
    } finally {
      setBusy(null);
    }
  }

  // Kết nối thủ công bằng cách dán trực tiếp Page Access Token (từ Graph API
  // Explorer). Dùng khi OAuth chưa qua App Review.
  async function handleManualConnect(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);
    if (!manualForm.displayName.trim() || !manualForm.accessToken.trim()) {
      setManualError('Vui lòng nhập Tên hiển thị và Access Token.');
      return;
    }
    setBusy('manual');
    try {
      await api.post('/social/connect', {
        platform: manualForm.platform,
        displayName: manualForm.displayName.trim(),
        accessToken: manualForm.accessToken.trim(),
        externalId: manualForm.externalId.trim() || undefined,
      });
      setShowManual(false);
      setManualForm({
        platform: 'FACEBOOK',
        displayName: '',
        accessToken: '',
        externalId: '',
      });
      setBanner('success');
      mutate();
    } catch (err: any) {
      setManualError(
        err?.response?.data?.message?.toString() ||
          'Kết nối thất bại. Kiểm tra lại token.',
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Tài khoản kết nối
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Quản lý các trang mạng xã hội dùng để đăng bài tự động.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => setShowManual(true)}
            >
              <KeyRound className="h-4 w-4" />
              Nhập token thủ công
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={busy === 'connect'}
            >
              <Plus className="h-4 w-4" />
              Kết nối tài khoản
            </button>
          </div>
        )}
      </div>

      {/* Modal nhập token thủ công */}
      {showManual && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowManual(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                Kết nối bằng token
              </h3>
              <button
                onClick={() => setShowManual(false)}
                className="text-white/50 hover:text-white"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-xs text-white/45">
              Dán Page Access Token lấy từ Graph API Explorer. Dùng khi OAuth
              chưa được Facebook duyệt.
            </p>
            <form onSubmit={handleManualConnect} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Nền tảng
                </label>
                <select
                  className="input w-full"
                  value={manualForm.platform}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, platform: e.target.value }))
                  }
                >
                  <option value="FACEBOOK">Facebook</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Tên hiển thị
                </label>
                <input
                  className="input w-full"
                  placeholder="Tên Page"
                  value={manualForm.displayName}
                  onChange={(e) =>
                    setManualForm((f) => ({
                      ...f,
                      displayName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Page Access Token
                </label>
                <textarea
                  className="input w-full font-mono text-xs"
                  rows={3}
                  placeholder="EAAG..."
                  value={manualForm.accessToken}
                  onChange={(e) =>
                    setManualForm((f) => ({
                      ...f,
                      accessToken: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Page ID <span className="text-white/30">(tuỳ chọn)</span>
                </label>
                <input
                  className="input w-full"
                  placeholder="1234567890"
                  value={manualForm.externalId}
                  onChange={(e) =>
                    setManualForm((f) => ({
                      ...f,
                      externalId: e.target.value,
                    }))
                  }
                />
              </div>
              {manualError && (
                <p className="text-xs text-accent-red">{manualError}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowManual(false)}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busy === 'manual'}
                >
                  {busy === 'manual' ? 'Đang lưu...' : 'Kết nối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OAuth result banner */}
      {banner && (
        <div
          className={
            banner === 'success'
              ? 'mb-5 flex items-center justify-between gap-2 rounded-xl border border-accent-green/30 bg-accent-green/10 px-4 py-2.5 text-sm text-accent-green'
              : 'mb-5 flex items-center justify-between gap-2 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-2.5 text-sm text-accent-red'
          }
        >
          <span className="flex items-center gap-2">
            {banner === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Kết nối Facebook thành công. Các Page đã được thêm bên dưới.
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Kết nối Facebook thất bại. Vui lòng thử lại.
              </>
            )}
          </span>
          <button
            onClick={() => setBanner(null)}
            className="text-current/70 hover:text-current"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Security note */}
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-bg-card/40 px-4 py-2.5 text-sm text-white/55">
        <ShieldCheck className="h-4 w-4 text-accent-green" />
        Token truy cập được mã hoá AES-256-GCM trước khi lưu trữ.
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Chưa có tài khoản nào"
          description="Kết nối một trang Facebook qua OAuth để bắt đầu đăng bài tự động."
          action={
            isAdmin && (
              <button className="btn btn-primary" onClick={handleConnect}>
                <Plus className="h-4 w-4" />
                Kết nối Facebook
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((acc) => {
            const expiring = isExpiringSoon(acc);
            return (
              <Card key={acc.id} hover className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1877F2]/15 text-[#1877F2]">
                      <Facebook className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{acc.displayName}</p>
                      <p className="text-xs text-white/40">Facebook Page</p>
                    </div>
                  </div>
                  {expiring ? (
                    <span className="badge bg-accent-amber/15 text-accent-amber">
                      <AlertTriangle className="h-3 w-3" />
                      Sắp hết hạn
                    </span>
                  ) : acc.isActive ? (
                    <span className="badge bg-accent-green/15 text-accent-green">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã kết nối
                    </span>
                  ) : (
                    <span className="badge bg-white/8 text-white/50">
                      Tạm ngưng
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-white/45">
                  <p>Kết nối: {formatDate(acc.createdAt)}</p>
                  {acc.expiresAt && (
                    <p>Token hết hạn: {formatDate(acc.expiresAt)}</p>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-auto flex gap-2 border-t border-border pt-3">
                    <button
                      className="btn btn-ghost flex-1 !py-2 text-xs"
                      onClick={handleConnect}
                      disabled={busy === acc.id}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Kết nối lại
                    </button>
                    <button
                      className="btn btn-ghost !py-2 text-xs !text-accent-red"
                      onClick={() => handleDisconnect(acc.id)}
                      disabled={busy === acc.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Add card */}
          {isAdmin && (
            <button
              onClick={handleConnect}
              disabled={busy === 'connect'}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-bg-card/20 text-white/40 transition-colors hover:border-brand/50 hover:text-brand-soft"
            >
              <Plus className="h-7 w-7" />
              <span className="text-sm font-medium">Kết nối trang Facebook</span>
              <span className="text-xs text-white/30">qua OAuth</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
