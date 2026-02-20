# ---------- 1. Install dependencies ----------
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile

# ---------- 2. Build the app ----------
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- 3. Production image ----------
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app ./

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]