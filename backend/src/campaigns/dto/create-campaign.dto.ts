import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Language, Platform } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  topic: string;

  @IsOptional()
  @IsString()
  brandVoice?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  // Mặc định chỉ đăng Facebook fanpage nếu client không gửi
  @IsOptional()
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms?: Platform[];

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
