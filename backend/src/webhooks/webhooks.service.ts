import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from './http.service';
import { Post, PostTarget, Campaign } from '@prisma/client';
import { SocialService } from '../social/social.service';

type PostWithRelations = Post & {
  targets: PostTarget[];
  campaign?: Campaign;
};

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private config: ConfigService,
    private http: HttpService,
    private social: SocialService,
  ) {}

  // Build payload publish cho 1 post: resolve + giải mã token cho từng target.
  // Token chỉ được giải mã tại đây (thời điểm duyệt) và bơm thẳng vào payload
  // gửi n8n — không bao giờ lưu ở n8n hay lộ ra REST API công khai.
  private async buildPublishPayload(post: PostWithRelations) {
    const targets = await Promise.all(
      post.targets.map(async (t) => {
        const resolved = await this.social.resolveTokenForTarget(
          t.platform,
          t.socialAccountId,
        );
        return {
          id: t.id,
          platform: t.platform,
          socialAccountId: resolved?.id ?? t.socialAccountId ?? null,
          externalId: resolved?.externalId ?? null,
          accessToken: resolved?.accessToken ?? null,
        };
      }),
    );

    const missing = targets.filter((t) => !t.accessToken).map((t) => t.platform);
    if (missing.length) {
      this.logger.warn(
        `Post ${post.id}: thiếu token cho ${missing.join(', ')} — n8n sẽ báo lỗi các nền tảng này`,
      );
    }

    return {
      postId: post.id,
      captionVi: post.captionVi,
      captionEn: post.captionEn,
      imageUrl: post.imageUrl,
      hashtags: post.hashtags,
      scheduledAt: post.scheduledAt,
      targets,
    };
  }

  // Luồng hợp nhất: resume execution n8n đang treo tại node Wait.
  // Backend POST payload (kèm token) vào resumeUrl -> workflow chạy tiếp đăng bài.
  async resumePublish(post: PostWithRelations) {
    if (!post.resumeUrl) {
      this.logger.warn(`Post ${post.id}: không có resumeUrl, bỏ qua resume`);
      return;
    }
    const payload = await this.buildPublishPayload(post);
    await this.http.post(post.resumeUrl, payload);
    this.logger.log(`Đã resume execution publish cho post ${post.id}`);
  }

  // Backend -> n8n: trigger publish workflow riêng (fallback cho bài tạo tay).
  // Với mỗi target, backend giải mã access token của tài khoản MXH tương ứng
  // và đính kèm vào payload để n8n gọi thẳng Graph API (token không lưu ở n8n).
  async triggerPublish(post: PostWithRelations) {
    const url = this.config.get<string>('N8N_WEBHOOK_PUBLISH');
    if (!url) {
      this.logger.warn('N8N_WEBHOOK_PUBLISH chưa cấu hình, bỏ qua trigger');
      return;
    }
    const payload = await this.buildPublishPayload(post);
    await this.http.post(url, payload);
    this.logger.log(`Đã trigger publish workflow cho post ${post.id}`);
  }

  // Backend -> n8n: trigger generate workflow (chạy thủ công từ dashboard)
  async triggerGenerate(campaignId: string) {
    const url = this.config.get<string>('N8N_WEBHOOK_GENERATE');
    if (!url) {
      this.logger.warn('N8N_WEBHOOK_GENERATE chưa cấu hình, bỏ qua trigger');
      return;
    }
    await this.http.post(url, { campaignId });
    this.logger.log(`Đã trigger generate workflow cho campaign ${campaignId}`);
  }
}
