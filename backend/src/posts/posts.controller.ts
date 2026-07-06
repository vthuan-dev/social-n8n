import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { WebhookSecretGuard } from '../webhooks/webhook-secret.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PostStatus } from '@prisma/client';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // n8n gọi vào để lưu draft sau khi sinh nội dung (public + shared secret)
  @Public()
  @UseGuards(WebhookSecretGuard)
  @Post('draft')
  createDraft(@Body() dto: CreateDraftDto) {
    return this.postsService.createDraft(dto);
  }

  @Get()
  findAll(@Query('status') status?: PostStatus) {
    return this.postsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.postsService.approve(id, user.userId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.postsService.reject(id, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
