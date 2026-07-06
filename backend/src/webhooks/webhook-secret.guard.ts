import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Xác thực request đến từ n8n bằng shared secret header (x-webhook-secret).
// Dùng cho các endpoint @Public() mà n8n gọi vào backend.
@Injectable()
export class WebhookSecretGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('WEBHOOK_SECRET');
    // Nếu chưa cấu hình secret (môi trường dev), cho qua nhưng nên set ở production.
    if (!expected) return true;

    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-webhook-secret'];
    if (provided !== expected) {
      throw new UnauthorizedException('Webhook secret không hợp lệ');
    }
    return true;
  }
}
