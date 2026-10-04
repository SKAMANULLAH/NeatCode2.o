# Deployment Guide for neat-code.online

This directory contains the deployment files for moving NeatCode to a new Ubuntu EC2 instance.

## Files
- `nginx.conf`: Nginx server block configured for `neat-code.online`, handling React SPA routing, 20MB payload limit, caching, and `/api` reverse proxy to port `3000`.
- `setup.sh`: Automated server setup script for fresh Ubuntu EC2 instances.

## Quick Start on New Server

1. **Clone repo on the new server**:
   ```bash
   sudo chown -R $USER:$USER /var/www
   git clone https://github.com/SKAMANULLAH/NeatCode2.o.git /var/www/neatcode
   ```

2. **Run setup script**:
   ```bash
   cd /var/www/neatcode/deploy
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Add your backend `.env`**:
   ```bash
   nano /var/www/neatcode/backend/.env
   ```

4. **Start backend with PM2**:
   ```bash
   cd /var/www/neatcode/backend
   pm2 start src/index.js --name "neatcode-backend"
   pm2 startup
   pm2 save
   ```

5. **Update DNS & Generate SSL**:
   - Point your domain's **A Record** to the new EC2 Public IP.
   - Run Certbot:
     ```bash
     sudo certbot --nginx -d neat-code.online -d www.neat-code.online
     ```
