import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [total, byStatus, campaigns, accounts, recentLogs] =
      await Promise.all([
        this.prisma.post.count(),
        this.prisma.post.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.campaign.count({ where: { isActive: true } }),
        this.prisma.socialAccount.count({ where: { isActive: true } }),
        this.prisma.log.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of Object.values(PostStatus)) statusMap[s] = 0;
    for (const row of byStatus) {
      statusMap[row.status] = row._count._all;
    }

    return {
      totalPosts: total,
      byStatus: statusMap,
      activeCampaigns: campaigns,
      connectedAccounts: accounts,
      recentLogs,
    };
  }

  // Số bài đăng theo ngày trong N ngày gần nhất (cho biểu đồ)
  async postsTimeline(days = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const posts = await this.prisma.post.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const p of posts) {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (key in buckets) buckets[key]++;
    }

    return Object.entries(buckets)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
