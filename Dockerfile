# Stage 1: Build React Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2: Run Express Server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=client-builder /app/client/build ./client/build

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server/server.js"]
