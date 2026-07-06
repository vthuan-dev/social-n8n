import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SocialService } from './social.service';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Roles('ADMIN')
  @Post('connect')
  connect(@Body() dto: ConnectAccountDto) {
    return this.socialService.connect(dto);
  }

  @Get('accounts')
  findAll() {
    return this.socialService.findAll();
  }

  // Bước 1 OAuth: FE lấy URL uỷ quyền rồi redirect user sang Facebook
  @Roles('ADMIN')
  @Get('facebook/oauth-url')
  facebookOAuthUrl() {
    return this.socialService.getFacebookOAuthUrl();
  }

  // Bước 2 OAuth: Facebook redirect về đây kèm ?code — public vì không có JWT.
  // Xử lý xong redirect người dùng về trang Accounts của dashboard.
  @Public()
  @Get('facebook/callback')
  async facebookCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontend = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000';
    if (error || !code) {
      return res.redirect(`${frontend}/accounts?connected=error`);
    }
    try {
      await this.socialService.handleFacebookCallback(code);
      return res.redirect(`${frontend}/accounts?connected=success`);
    } catch {
      return res.redirect(`${frontend}/accounts?connected=error`);
    }
  }

  @Roles('ADMIN')
  @Delete('accounts/:id')
  disconnect(@Param('id') id: string) {
    return this.socialService.disconnect(id);
  }
}
