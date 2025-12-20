FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache bash curl openssl

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["pnpm", "start:api"]
