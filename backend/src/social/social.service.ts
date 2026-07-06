import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '../webhooks/http.service';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { encrypt, decrypt } from '../common/crypto.util';
import { Platform } from '@prisma/client';

const FB_GRAPH = 'https://graph.facebook.com/v21.0';
const FB_OAUTH = 'https://www.facebook.com/v21.0/dialog/oauth';
const FB_SCOPES = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'];

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private http: HttpService,
  ) {}

  // Kết nối / cập nhật tài khoản mạng xã hội. Token được mã hoá trước khi lưu.
  async connect(dto: ConnectAccountDto) {
    const account = await this.prisma.socialAccount.create({
      data: {
        platform: dto.platform,
        displayName: dto.displayName,
        accessToken: encrypt(dto.accessToken),
        refreshToken: dto.refreshToken ? encrypt(dto.refreshToken) : null,
        externalId: dto.externalId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    return this.toSafe(account);
  }

  async findAll() {
    const accounts = await this.prisma.socialAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map((a) => this.toSafe(a));
  }

  async disconnect(id: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Tài khoản không tồn tại');
    await this.prisma.socialAccount.delete({ where: { id } });
    return { deleted: true };
  }

  // Trả token đã giải mã cho internal use (vd: n8n publish qua backend proxy)
  async getDecryptedToken(id: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Tài khoản không tồn tại');
    return {
      accessToken: decrypt(account.accessToken),
      refreshToken: account.refreshToken ? decrypt(account.refreshToken) : null,
    };
  }

  /**
   * Resolve access token cho 1 target khi publish.
   * Ưu tiên socialAccountId đã gắn với target; nếu chưa có thì lấy tài khoản
   * active gần nhất của cùng platform. Trả token ĐÃ GIẢI MÃ (chỉ dùng nội bộ,
   * đính vào payload gửi n8n — không bao giờ lộ ra REST API công khai).
   */
  async resolveTokenForTarget(
    platform: Platform,
    socialAccountId?: string | null,
  ): Promise<{
    id: string;
    externalId: string | null;
    accessToken: string;
  } | null> {
    const account = socialAccountId
      ? await this.prisma.socialAccount.findUnique({
          where: { id: socialAccountId },
        })
      : await this.prisma.socialAccount.findFirst({
          where: { platform, isActive: true },
          orderBy: { createdAt: 'desc' },
        });

    if (!account || !account.isActive) return null;

    try {
      return {
        id: account.id,
        externalId: account.externalId,
        accessToken: decrypt(account.accessToken),
      };
    } catch (e) {
      this.logger.error(
        `Không giải mã được token của account ${account.id}: ${(e as Error).message}`,
      );
      return null;
    }
  }

  // ===== Facebook OAuth =====

  // Bước 1: tạo URL uỷ quyền để redirect người dùng sang Facebook.
  getFacebookOAuthUrl(): { url: string } {
    const appId = this.config.get<string>('FACEBOOK_APP_ID');
    if (!appId) {
      throw new BadRequestException(
        'Chưa cấu hình FACEBOOK_APP_ID trên backend',
      );
    }
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: this.facebookRedirectUri(),
      scope: FB_SCOPES.join(','),
      response_type: 'code',
    });
    return { url: `${FB_OAUTH}?${params.toString()}` };
  }

  /**
   * Bước 2 (callback): đổi `code` -> user access token -> long-lived token ->
   * danh sách Page + page access token, rồi lưu (mã hoá) từng Page.
   * Trả về danh sách tài khoản đã kết nối (không kèm token).
   */
  async handleFacebookCallback(code: string) {
    const appId = this.config.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET');
    if (!appId || !appSecret) {
      throw new BadRequestException('Chưa cấu hình Facebook App trên backend');
    }

    // 2a. code -> short-lived user token
    const tokenRes = await this.http.get<{ access_token: string }>(
      `${FB_GRAPH}/oauth/access_token`,
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: this.facebookRedirectUri(),
          code,
        },
      },
    );

    // 2b. short-lived -> long-lived user token (~60 ngày)
    const longRes = await this.http.get<{
      access_token: string;
      expires_in?: number;
    }>(`${FB_GRAPH}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: tokenRes.access_token,
      },
    });

    const userToken = longRes.access_token;

    // 2c. lấy các Page mà user quản lý (kèm page access token)
    const pagesRes = await this.http.get<{
      data: { id: string; name: string; access_token: string }[];
    }>(`${FB_GRAPH}/me/accounts`, {
      params: { access_token: userToken },
    });

    const pages = pagesRes.data ?? [];
    if (!pages.length) {
      throw new BadRequestException(
        'Tài khoản Facebook không quản lý Page nào để đăng bài',
      );
    }

    const saved: ReturnType<SocialService['toSafe']>[] = [];
    for (const page of pages) {
      // upsert theo externalId (page id) để tránh trùng khi kết nối lại
      const existing = await this.prisma.socialAccount.findFirst({
        where: { platform: Platform.FACEBOOK, externalId: page.id },
      });
      const data = {
        platform: Platform.FACEBOOK,
        displayName: page.name,
        accessToken: encrypt(page.access_token),
        externalId: page.id,
        isActive: true,
      };
      const account = existing
        ? await this.prisma.socialAccount.update({
            where: { id: existing.id },
            data,
          })
        : await this.prisma.socialAccount.create({ data });
      saved.push(this.toSafe(account));
    }

    this.logger.log(`Đã kết nối ${saved.length} Facebook Page qua OAuth`);
    return saved;
  }

  private facebookRedirectUri(): string {
    const base =
      this.config.get<string>('BACKEND_PUBLIC_URL') ||
      `http://localhost:${this.config.get<string>('BACKEND_PORT') || 4000}`;
    return `${base}/api/social/facebook/callback`;
  }

  // Không bao giờ trả token ra ngoài API
  private toSafe(account: {
    id: string;
    platform: string;
    displayName: string;
    externalId: string | null;
    expiresAt: Date | null;
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: account.id,
      platform: account.platform,
      displayName: account.displayName,
      externalId: account.externalId,
      expiresAt: account.expiresAt,
      isActive: account.isActive,
      createdAt: account.createdAt,
    };
  }
}
