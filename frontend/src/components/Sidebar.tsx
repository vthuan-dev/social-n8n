'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  ListChecks,
  CalendarDays,
  Link2,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Chiến dịch', icon: Megaphone },
  { href: '/queue', label: 'Hàng chờ duyệt', icon: ListChecks },
  { href: '/calendar', label: 'Lịch đăng', icon: CalendarDays },
  { href: '/accounts', label: 'Tài khoản', icon: Link2 },
  { href: '/analytics', label: 'Phân tích', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-border bg-bg-soft/60 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">
          Social<span className="gradient-text">AI</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-brand/10 text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon
                className={clsx(
                  'h-[18px] w-[18px] transition-colors',
                  active ? 'text-brand-soft' : 'text-white/45 group-hover:text-white/80',
                )}
              />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-soft shadow-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="m-3 rounded-xl border border-border bg-bg-card/50 p-4">
        <p className="text-xs font-medium text-white/70">Tự động hoá n8n</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/40">
          Nội dung được AI sinh và đăng tự động qua workflow n8n.
        </p>
      </div>
    </aside>
  );
}
