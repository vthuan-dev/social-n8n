import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Platform } from '@prisma/client';

export class ConnectAccountDto {
  @IsEnum(Platform)
  platform: Platform;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  // OAuth access token (sẽ được mã hoá trước khi lưu)
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  // page id / account id trên nền tảng
  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
