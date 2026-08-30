FROM node:20-bookworm-slim AS build
WORKDIR /app

# Install dependencies and generate Prisma Client for the Debian runtime.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

# Build the TypeScript application.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build


FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# Install production dependencies and generate the Prisma engine/client
# inside the same Debian-based environment used at runtime.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

# Copy freshly compiled application output.
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/server.js"]
