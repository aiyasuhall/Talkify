# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm prune --production

# Runtime stage
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app ./
ENV NODE_ENV=production
EXPOSE 5001

CMD ["node", "src/server.js"]