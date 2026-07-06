import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Platform } from '@prisma/client';

// Payload n8n gửi về sau khi sinh nội dung (draft)
export class CreateDraftDto {
  @IsString()
  campaignId: string;

  @IsOptional()
  @IsString()
  captionVi?: string;

  @IsOptional()
  @IsString()
  captionEn?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms?: Platform[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  // URL resume của execution n8n đang treo tại node Wait (chờ duyệt).
  @IsOptional()
  @IsString()
  resumeUrl?: string;
}
