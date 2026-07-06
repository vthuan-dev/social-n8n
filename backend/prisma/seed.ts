import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@social.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123456';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin đã tồn tại: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      email,
      password: hash,
      name: 'Administrator',
      role: Role.ADMIN,
    },
  });

  // Campaign mẫu để demo
  await prisma.campaign.create({
    data: {
      name: 'Demo — Cà phê sáng',
      topic: 'Quán cà phê specialty, không gian trẻ trung',
      brandVoice:
        'Thân thiện, gần gũi, dùng emoji vừa phải, khơi gợi cảm giác thư giãn buổi sáng.',
      language: 'BOTH',
      platforms: ['FACEBOOK'],
      schedule: '0 9 * * *',
      ownerId: admin.id,
    },
  });

  console.log(`✅ Seed xong. Admin: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
