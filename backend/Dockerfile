# ---- Build stage ----
FROM node:22-alpine AS builder
# Prisma cần openssl + libc6-compat để engine chạy trên Alpine (musl)
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine
# Prisma cần openssl + libc6-compat để engine chạy trên Alpine (musl)
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

EXPOSE 4000

# Đồng bộ schema vào DB rồi start. Dùng db push vì chưa có migration history
# (idempotent, an toàn khi container khởi động lại).
CMD sh -c "npx prisma db push --skip-generate && node dist/main"
