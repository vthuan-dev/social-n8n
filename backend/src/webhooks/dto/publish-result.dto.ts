import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Platform } from '@prisma/client';

class TargetResultDto {
  @IsEnum(Platform)
  platform: Platform;

  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  permalink?: string;

  @IsOptional()
  @IsString()
  error?: string;
}

export class PublishResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetResultDto)
  results: TargetResultDto[];
}
