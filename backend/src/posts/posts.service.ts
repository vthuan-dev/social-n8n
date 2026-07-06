import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PostStatus, Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private webhooks: WebhooksService,
  ) {}

  // n8n gọi vào để lưu draft sau khi sinh nội dung
  async createDraft(dto: CreateDraftDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaign không tồn tại');

    const platforms = dto.platforms?.length ? dto.platforms : campaign.platforms;

    const post = await this.prisma.post.create({
      data: {
        campaignId: dto.campaignId,
        captionVi: dto.captionVi,
        captionEn: dto.captionEn,
        imageUrl: dto.imageUrl,
        hashtags: dto.hashtags ?? [],
        status: PostStatus.PENDING,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        resumeUrl: dto.resumeUrl ?? null,
        targets: {
          create: platforms.map((platform) => ({ platform })),
        },
      },
      include: { targets: true },
    });

    await this.log(post.id, 'info', 'n8n:generate', 'Draft tạo từ n8n');
    return post;
  }

  async findAll(status?: PostStatus) {
    return this.prisma.post.findMany({
      where: status ? { status } : undefined,
      include: { targets: true, campaign: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { targets: true, campaign: true, logs: true },
    });
    if (!post) throw new NotFoundException('Post không tồn tại');
    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    await this.findOne(id);
    return this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: { targets: true },
    });
  }

  // Duyệt bài -> trigger n8n publish workflow
  async approve(id: string, userId: string) {
    const post = await this.findOne(id);
    if (post.status === PostStatus.PUBLISHED) {
      throw new BadRequestException('Bài đã được đăng');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.APPROVED, approvedById: userId },
      include: { targets: true, campaign: true },
    });

    await this.log(id, 'info', 'approval', 'Bài được duyệt, trigger publish');

    // Nếu bài đến từ workflow hợp nhất (có resumeUrl) -> resume execution đang
    // treo tại node Wait. Ngược lại (bài tạo tay) -> fallback trigger webhook cũ.
    try {
      if (updated.resumeUrl) {
        await this.webhooks.resumePublish(updated);
      } else {
        await this.webhooks.triggerPublish(updated);
      }
    } catch (e) {
      await this.log(
        id,
        'error',
        'approval',
        `Không trigger được publish: ${(e as Error).message}`,
      );
    }

    return updated;
  }

  async reject(id: string, userId: string) {
    await this.findOne(id);
    const updated = await this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.REJECTED, approvedById: userId },
    });
    await this.log(id, 'info', 'approval', 'Bài bị từ chối');
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.post.delete({ where: { id } });
    return { deleted: true };
  }

  private async log(
    postId: string | null,
    level: string,
    source: string,
    message: string,
    meta?: Prisma.InputJsonValue,
  ) {
    await this.prisma.log.create({
      data: { postId, level, source, message, meta },
    });
  }
}
