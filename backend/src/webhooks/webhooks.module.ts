import { Module, Global } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { HttpService } from './http.service';
import { SocialModule } from '../social/social.module';

@Global()
@Module({
  imports: [SocialModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, HttpService],
  exports: [WebhooksService, HttpService],
})
export class WebhooksModule {}
