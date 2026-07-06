import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

// Cho phép editor chỉnh sửa nội dung trước khi duyệt
export class UpdatePostDto {
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
  @IsDateString()
  scheduledAt?: string;
}
