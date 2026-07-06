# Social Content Automation — Hệ thống Tự động Sinh Nội dung cho Mạng Xã hội

Hệ thống tự động **tạo → duyệt → lên lịch → đăng** nội dung lên mạng xã hội (Facebook Page), kết hợp **n8n** cho automation và **AI** (Groq + Pollinations.ai) để sinh nội dung song ngữ Việt–Anh.

## Kiến trúc

```
social/
├── docker-compose.yml    # postgres + n8n + backend + frontend
├── backend/              # NestJS API (auth, campaigns, posts, webhooks, social, analytics)
├── frontend/             # Next.js dashboard (dark premium UI)
└── n8n/                  # workflow JSON export + docs
```

## Thành phần

| Service   | Port  | Mô tả                       |
|-----------|-------|-----------------------------|
| frontend  | 3000  | Next.js dashboard           |
| backend   | 4000  | NestJS REST API             |
| n8n       | 5678  | Automation workflows        |
| postgres  | 5432  | Database                    |

## Chạy nhanh

```bash
cp .env.example .env
docker-compose up -d
```

- Dashboard: http://localhost:3000
- API: http://localhost:4000/api
- n8n: http://localhost:5678

## Luồng hoạt động

Toàn bộ chạy trong **1 workflow n8n hợp nhất** (human-in-the-loop), treo tại node **Wait** chờ duyệt:

1. Người dùng tạo **Campaign** (chủ đề, brand voice, nền tảng, lịch).
2. n8n chạy: lấy campaign → Groq sinh caption song ngữ → Pollinations sinh ảnh → lưu **Draft** về backend.
3. Execution **dừng tại node Wait**, bài hiện trạng thái *Chờ duyệt* trên dashboard.
4. Người duyệt bài trong **Content Queue** (Approve / Reject). Khi Approve, backend POST vào `resumeUrl` → **cùng execution chạy tiếp** đăng lên Facebook Page.
5. n8n callback kết quả về backend → ghi **log + analytics**.

Xem chi tiết workflow trong [n8n/README.md](./n8n/README.md).
