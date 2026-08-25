# --- build stage ---
FROM node:22-slim AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# prod-only node_modules, kept separate so the runtime image skips devDependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# --- runtime stage (Angular SSR via Express) ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist/omnihogar-frontend ./dist/omnihogar-frontend
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/omnihogar-frontend/server/server.mjs"]
