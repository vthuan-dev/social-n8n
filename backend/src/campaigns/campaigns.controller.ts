import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { WebhookSecretGuard } from '../webhooks/webhook-secret.guard';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(userId, dto);
  }

  @Get()
  findAll() {
    return this.campaignsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  // n8n gọi vào để lấy chi tiết campaign khi sinh nội dung (public + shared secret).
  // Route 2 segment (internal/:id) nên không xung đột với @Get(':id') ở trên.
  @Public()
  @UseGuards(WebhookSecretGuard)
  @Get('internal/:id')
  findOneInternal(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  // Trigger sinh nội dung thủ công (nút "Sinh ngay" trên dashboard)
  @Post(':id/generate')
  generate(@Param('id') id: string) {
    return this.campaignsService.generate(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
