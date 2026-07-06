'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const initial = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-bg/70 px-6 backdrop-blur-xl">
      <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-bg-card/50 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-white/40" />
          <input
            className="w-40 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            placeholder="Tìm kiếm..."
          />
        </div>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-card/50 text-white/60 transition-colors hover:text-white"
          aria-label="Thông báo"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-pink" />
        </button>

        {/* User */}
        <div className="group relative">
          <button className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-card/50 py-1.5 pl-1.5 pr-3 transition-colors hover:border-border">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-gradient text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium leading-tight">{user?.email ?? 'Người dùng'}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/40">
                {user?.role ?? 'EDITOR'}
              </p>
            </div>
          </button>
          <div className="absolute right-0 top-full mt-2 hidden w-40 rounded-xl border border-border bg-bg-card p-1.5 shadow-card group-hover:block">
            <button
              onClick={logout}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
