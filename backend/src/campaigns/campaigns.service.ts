import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { WebhooksService } from '../webhooks/webhooks.service';
import { CampaignSchedulerService } from './campaign-scheduler.service';
import { Platform } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private webhooks: WebhooksService,
    private scheduler: CampaignSchedulerService,
  ) {}

  async create(ownerId: string, dto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: {
        ...dto,
        brandVoice: dto.brandVoice ?? '',
        // Mặc định chỉ đăng Facebook fanpage nếu client không chỉ định
        platforms: dto.platforms?.length ? dto.platforms : [Platform.FACEBOOK],
        ownerId,
      },
    });
    this.scheduler.syncCampaign(campaign);
    return campaign;
  }

  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { posts: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: dto,
    });
    this.scheduler.syncCampaign(campaign);
    return campaign;
  }

  async remove(id: string) {
    await this.findOne(id);
    this.scheduler.removeCampaign(id);
    return this.prisma.campaign.delete({ where: { id } });
  }

  // Trigger sinh nội dung thủ công từ dashboard (nút "Sinh ngay")
  async generate(id: string) {
    const campaign = await this.findOne(id);
    await this.webhooks.triggerGenerate(campaign.id);
    return { triggered: true, campaignId: campaign.id };
  }

  // Used by n8n to fetch active campaigns due for content generation
  findActive() {
    return this.prisma.campaign.findMany({
      where: { isActive: true },
    });
  }
}
