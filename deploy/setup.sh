#!/bin/bash
# ========================================================
# NeatCode Deployment Setup Script for Ubuntu 22.04 / 24.04
# ========================================================

set -e

echo ">>> 1. Updating system packages & configuring swap..."
sudo apt update && sudo apt upgrade -y

# Setup 2GB Swap memory if none exists (prevents npm install / vite build memory crashes on t2/t3.micro)
if [ $(swapon --show | wc -l) -le 1 ]; then
    echo ">>> Creating 2GB swap space..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo ">>> 2. Installing Node.js 20, Git, Nginx, Certbot..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx certbot python3-certbot-nginx

echo ">>> 3. Installing PM2 globally..."
sudo npm install -g pm2

PROJECT_DIR="/var/www/neatcode"

echo ">>> 4. Setting up project in $PROJECT_DIR..."
# Ensure permissions
sudo chown -R $USER:$USER /var/www

# Install backend dependencies
echo ">>> Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install --production

# Install frontend dependencies and build
echo ">>> Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# Link Nginx configuration
echo ">>> Configuring Nginx..."
sudo cp "$PROJECT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/neat-code.online
sudo ln -sf /etc/nginx/sites-available/neat-code.online /etc/nginx/sites-enabled/neat-code.online
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "========================================================"
echo "Setup complete!"
echo "Next steps:"
echo "1. Put your production .env inside $PROJECT_DIR/backend/.env"
echo "2. Start the backend: pm2 start src/index.js --name 'neatcode-backend'"
echo "3. Run: pm2 startup && pm2 save"
echo "4. Point your domain DNS (A record) to this server's IP"
echo "5. Issue SSL: sudo certbot --nginx -d neat-code.online -d www.neat-code.online"
echo "========================================================"
