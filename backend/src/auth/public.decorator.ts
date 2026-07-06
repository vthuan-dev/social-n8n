import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Đánh dấu route công khai (bỏ qua JWT guard) — dùng cho login/register và webhook từ n8n
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
