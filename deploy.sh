#!/bin/bash
# Deployment script — builds and deploys using Docker

set -e

echo "=== Calcutta Machinery Billing — Deploy ==="

# Build client
echo "→ Building client..."
cd client
npm ci
npm run build
cd ..

# Build & start with Docker Compose
echo "→ Starting services..."
docker compose down || true
docker compose up -d --build

echo "→ Cleaning up..."
docker system prune -f

echo "✓ Deployed successfully!"
echo "  Client: http://localhost"
echo "  Server: http://localhost:5000"
