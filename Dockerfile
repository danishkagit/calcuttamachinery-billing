FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
EXPOSE 5000
CMD ["node", "server.js"]
