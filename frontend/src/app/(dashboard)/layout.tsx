'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui';

// Tiêu đề trang theo route
const TITLES: Record<string, string> = {
  '/dashboard': 'Tổng quan',
  '/campaigns': 'Chiến dịch',
  '/queue': 'Hàng chờ duyệt',
  '/calendar': 'Lịch đăng',
  '/accounts': 'Tài khoản kết nối',
  '/analytics': 'Phân tích',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Chặn truy cập khi chưa đăng nhập
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Xác định tiêu đề dựa trên prefix route
  const title =
    Object.entries(TITLES).find(([href]) => pathname.startsWith(href))?.[1] ??
    'SocialAI';

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-64">
        <Topbar title={title} />
        <main className="mx-auto max-w-7xl px-6 py-6">
          <div className="animate-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
