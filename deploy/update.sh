#!/bin/bash
# ========================================================
# NeatCode Deployment Update Script
# Use this script to pull latest changes and restart services
# ========================================================

set -e

PROJECT_DIR="/var/www/neatcode"

echo ">>> 1. Pulling latest changes from git..."
cd "$PROJECT_DIR"
git pull origin main

echo ">>> 2. Updating backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install --production

echo ">>> 3. Restarting backend PM2 process..."
pm2 restart neatcode-backend

echo ">>> 4. Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

echo ">>> 5. Reloading Nginx..."
sudo systemctl reload nginx

echo ">>> Update completed successfully!"
