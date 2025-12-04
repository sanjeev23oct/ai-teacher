# Multi-stage build for AI Teacher platform
FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
FROM base AS dependencies
RUN npm install --prefix client
RUN npm install --prefix server

# Build client
FROM dependencies AS build-client
COPY client ./client
RUN npm run build --prefix client

# Build server
FROM dependencies AS build-server
COPY server ./server
WORKDIR /app/server
RUN npm exec prisma generate

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Copy server dependencies and built files
COPY --from=dependencies /app/server/node_modules ./server/node_modules
COPY --from=build-server /app/server ./server

# Copy built client
COPY --from=build-client /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p server/uploads

WORKDIR /app/server

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["npm", "start"]
