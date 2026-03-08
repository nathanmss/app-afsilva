FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
RUN mkdir -p uploads && chown -R node:node /app

USER node
EXPOSE 5000

CMD ["node", "dist/index.cjs"]
