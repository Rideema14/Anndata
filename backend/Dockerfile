<<<<<<< HEAD
FROM node:20-alpine AS base
=======
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install && npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npx prisma generate

<<<<<<< HEAD
COPY src ./src
=======
COPY --from=build /app/dist ./dist
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

ENV NODE_ENV=production
EXPOSE 5000

<<<<<<< HEAD
CMD ["node", "src/server.js"]
=======
CMD ["node", "dist/server.js"]
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
