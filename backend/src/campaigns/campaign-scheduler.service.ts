import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Campaign } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

/**
 * Quản lý cron job động cho từng campaign.
 * Mỗi campaign có `schedule` (cron string) + `isActive=true` sẽ được đăng ký
 * một CronJob riêng. Khi tới giờ, tự trigger workflow generate trên n8n.
 */
@Injectable()
export class CampaignSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CampaignSchedulerService.name);
  private readonly prefix = 'campaign-';

  constructor(
    private prisma: PrismaService,
    private webhooks: WebhooksService,
    private registry: SchedulerRegistry,
  ) {}

  // Nạp lại toàn bộ lịch khi backend khởi động
  async onModuleInit() {
    const campaigns = await this.prisma.campaign.findMany({
      where: { isActive: true, NOT: { schedule: null } },
    });
    for (const c of campaigns) this.syncCampaign(c);
    this.logger.log(`Đã nạp ${campaigns.length} lịch campaign`);
  }

  private jobName(id: string) {
    return `${this.prefix}${id}`;
  }

  // Đăng ký / cập nhật / gỡ cron cho 1 campaign dựa trên trạng thái hiện tại
  syncCampaign(campaign: Pick<Campaign, 'id' | 'schedule' | 'isActive'>) {
    this.removeCampaign(campaign.id);

    if (!campaign.isActive || !campaign.schedule?.trim()) return;

    try {
      const job = new CronJob(
        campaign.schedule,
        () => {
          void this.runGenerate(campaign.id);
        },
        null,
        false,
        process.env.GENERIC_TIMEZONE || 'Asia/Ho_Chi_Minh',
      );
      this.registry.addCronJob(this.jobName(campaign.id), job as never);
      job.start();
      this.logger.log(
        `Đã lên lịch campaign ${campaign.id}: "${campaign.schedule}"`,
      );
    } catch (e) {
      this.logger.error(
        `Cron không hợp lệ cho campaign ${campaign.id}: "${campaign.schedule}" — ${(e as Error).message}`,
      );
    }
  }

  // Gỡ cron job của campaign (nếu có)
  removeCampaign(id: string) {
    const name = this.jobName(id);
    try {
      if (this.registry.doesExist('cron', name)) {
        this.registry.deleteCronJob(name);
        this.logger.log(`Đã gỡ lịch campaign ${id}`);
      }
    } catch {
      // job không tồn tại — bỏ qua
    }
  }

  private async runGenerate(campaignId: string) {
    try {
      await this.webhooks.triggerGenerate(campaignId);
      this.logger.log(`Cron trigger generate cho campaign ${campaignId}`);
    } catch (e) {
      this.logger.error(
        `Cron generate lỗi cho campaign ${campaignId}: ${(e as Error).message}`,
      );
    }
  }
}
