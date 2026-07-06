import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';
import { WebhookSecretGuard } from './webhook-secret.guard';
import { PublishResultDto } from './dto/publish-result.dto';
import { PostStatus, TargetStatus } from '@prisma/client';

// Endpoint cho n8n gọi callback vào Backend.
// Được bảo vệ bằng shared secret header thay vì JWT (n8n -> server).
@Controller('webhooks')
export class WebhooksController {
  constructor(private prisma: PrismaService) {}

  // n8n báo kết quả đăng bài cho từng target
  @Public()
  @UseGuards(WebhookSecretGuard)
  @Post('publish-result/:postId')
  async publishResult(
    @Param('postId') postId: string,
    @Body() dto: PublishResultDto,
  ) {
    // Cập nhật từng target theo kết quả n8n trả về
    for (const result of dto.results) {
      await this.prisma.postTarget.updateMany({
        where: { postId, platform: result.platform },
        data: {
          status: result.success ? TargetStatus.PUBLISHED : TargetStatus.FAILED,
          externalId: result.externalId,
          permalink: result.permalink,
          error: result.error,
          publishedAt: result.success ? new Date() : null,
        },
      });
    }

    // Tổng hợp trạng thái post
    const targets = await this.prisma.postTarget.findMany({ where: { postId } });
    const allPublished = targets.every((t) => t.status === TargetStatus.PUBLISHED);
    const anyFailed = targets.some((t) => t.status === TargetStatus.FAILED);

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        status: allPublished
          ? PostStatus.PUBLISHED
          : anyFailed
            ? PostStatus.FAILED
            : PostStatus.APPROVED,
      },
    });

    await this.prisma.log.create({
      data: {
        postId,
        level: anyFailed ? 'error' : 'info',
        source: 'n8n:publish',
        message: `Kết quả đăng: ${targets
          .map((t) => `${t.platform}=${t.status}`)
          .join(', ')}`,
      },
    });

    return { ok: true };
  }
}
