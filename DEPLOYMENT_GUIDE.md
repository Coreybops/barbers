# 🚀 Barber Booking SaaS - Complete Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [VPS Production Deployment](#vps-production-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Domain and SSL Setup](#domain-and-ssl-setup)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Troubleshooting](#troubleshooting)

---

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- A VPS with Ubuntu 20.04+ (2GB RAM minimum)
- A domain name pointing to your VPS IP
- Basic knowledge of SSH and command line

---

## 🔧 Local Development Setup

### 1. Clone and Install
```bash
# Navigate to your project directory
cd C:\Users\andij\.claude

# Install all dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment files
copy .env.example .env
copy packages\backend\.env.example packages\backend\.env
copy packages\frontend\.env.example packages\frontend\.env
```

**Edit `packages/backend/.env`:**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/barber_booking"
JWT_SECRET="your-super-secret-jwt-key-here-32-chars-min"
JWT_REFRESH_SECRET="your-refresh-secret-here-32-chars-min"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://localhost:5173"
```

**Edit `packages/frontend/.env`:**
```env
VITE_API_URL=http://localhost:3001
```

### 3. Database Setup (Local)
```bash
# Option A: Using local PostgreSQL
createdb barber_booking
npm run db:push --workspace=backend
npm run db:seed --workspace=backend

# Option B: Using Docker for database only
docker run --name postgres-barber -e POSTGRES_PASSWORD=password -e POSTGRES_DB=barber_booking -p 5432:5432 -d postgres:15
```

### 4. Start Development
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev --workspace=backend    # Backend: http://localhost:3001
npm run dev --workspace=frontend   # Frontend: http://localhost:5173
```

### 5. Test Accounts
- **Shop Owner**: `owner@barbershop.com` / `password123`
- **Barber**: `barber@barbershop.com` / `password123`
- **Customer**: `customer@example.com` / `password123`

---

## 🌐 VPS Production Deployment

### Step 1: Prepare Your VPS

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install required software
apt install -y nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server git curl ufw

# Install Node.js (Latest LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Step 2: Set Up Database

```bash
# Configure PostgreSQL
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE USER barber_user WITH PASSWORD 'your_very_secure_database_password';
CREATE DATABASE barber_booking OWNER barber_user;
GRANT ALL PRIVILEGES ON DATABASE barber_booking TO barber_user;
\q

# Enable and start services
systemctl enable postgresql redis-server nginx
systemctl start postgresql redis-server nginx
```

### Step 3: Upload Your Code

#### Option A: Git Repository (Recommended)
```bash
# On your local machine, push to GitHub/GitLab
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/barber-booking.git
git push -u origin main

# On VPS, clone the repository
cd /var/www
git clone https://github.com/YOUR_USERNAME/barber-booking.git
cd barber-booking
```

#### Option B: Direct Upload
```bash
# From your local machine (Windows)
scp -r C:\Users\andij\.claude root@YOUR_VPS_IP:/var/www/barber-booking

# On VPS
cd /var/www/barber-booking
```

### Step 4: Configure Production Environment

```bash
cd /var/www/barber-booking

# Create production environment files
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Edit backend environment
nano packages/backend/.env
```

**Production `packages/backend/.env`:**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://barber_user:your_very_secure_database_password@localhost:5432/barber_booking"
JWT_SECRET="PASTE_GENERATED_JWT_SECRET_HERE"
JWT_REFRESH_SECRET="PASTE_GENERATED_JWT_REFRESH_SECRET_HERE"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="https://YOUR_DOMAIN.com"
```

**Production `packages/frontend/.env`:**
```env
VITE_API_URL=https://YOUR_DOMAIN.com/api
```

### Step 5: Build and Deploy

```bash
cd /var/www/barber-booking

# Install dependencies
npm install

# Build applications
npm run build

# Set up database
npm run db:push --workspace=backend
npm run db:seed --workspace=backend

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'barber-booking-backend',
    script: 'packages/backend/dist/index.js',
    cwd: '/var/www/barber-booking',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/barber-booking/error.log',
    out_file: '/var/log/barber-booking/out.log',
    log_file: '/var/log/barber-booking/combined.log'
  }]
}
EOF

# Create log directory
mkdir -p /var/log/barber-booking

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

### Step 6: Configure Nginx

```bash
# Create Nginx site configuration
cat > /etc/nginx/sites-available/barber-booking << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend - Serve React build
    location / {
        root /var/www/barber-booking/packages/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # File uploads
    client_max_body_size 10M;
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/barber-booking /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

### Step 7: Set Up SSL Certificate

```bash
# Get SSL certificate with Certbot
certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# Test auto-renewal
certbot renew --dry-run

# Nginx will be automatically updated with SSL configuration
```

### Step 8: Final Configuration

```bash
# Set proper permissions
chown -R www-data:www-data /var/www/barber-booking
chmod -R 755 /var/www/barber-booking

# Set up log rotation
cat > /etc/logrotate.d/barber-booking << 'EOF'
/var/log/barber-booking/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0640 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

---

## 🐳 Docker Deployment (Alternative)

### Prerequisites
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Docker Deployment
```bash
cd /var/www/barber-booking

# Create production override
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  frontend:
    environment:
      - VITE_API_URL=https://YOUR_DOMAIN.com/api
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`YOUR_DOMAIN.com`)"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

  backend:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://barber_user:your_secure_password@postgres:5432/barber_booking
      - JWT_SECRET=your_jwt_secret_here
      - JWT_REFRESH_SECRET=your_refresh_secret_here
      - FRONTEND_URL=https://YOUR_DOMAIN.com
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`YOUR_DOMAIN.com`) && PathPrefix(`/api`)"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"

  postgres:
    environment:
      - POSTGRES_PASSWORD=your_secure_password
      - POSTGRES_USER=barber_user
      - POSTGRES_DB=barber_booking
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Deploy with Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose logs -f
```

---

## 🌍 Domain and SSL Setup

### 1. Domain Configuration
- Point your domain's A record to your VPS IP address
- Add a CNAME record for `www` pointing to your main domain
- Wait for DNS propagation (can take up to 48 hours)

### 2. SSL Certificate
```bash
# Automatic SSL with Certbot (already covered above)
certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# Manual certificate renewal (if needed)
certbot renew

# Check certificate status
certbot certificates
```

---

## 📊 Monitoring and Maintenance

### 1. Set Up Basic Monitoring

```bash
# Create monitoring script
cat > /usr/local/bin/barber-monitoring.sh << 'EOF'
#!/bin/bash
# Check if services are running
if ! pm2 status | grep -q "online"; then
    echo "Backend service down, restarting..."
    pm2 restart all
fi

if ! systemctl is-active --quiet nginx; then
    echo "Nginx down, restarting..."
    systemctl restart nginx
fi

if ! systemctl is-active --quiet postgresql; then
    echo "PostgreSQL down, restarting..."
    systemctl restart postgresql
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is ${DISK_USAGE}%"
fi
EOF

chmod +x /usr/local/bin/barber-monitoring.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/barber-monitoring.sh" | crontab -
```

### 2. Backup Script

```bash
# Create backup script
cat > /usr/local/bin/barber-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/barber-booking"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U barber_user -h localhost barber_booking > $BACKUP_DIR/db_backup_$DATE.sql

# Code backup
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz /var/www/barber-booking

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/barber-backup.sh

# Run daily at 2 AM
echo "0 2 * * * /usr/local/bin/barber-backup.sh" | crontab -
```

### 3. Log Management

```bash
# View application logs
pm2 logs barber-booking-backend

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# View system logs
journalctl -u nginx -f
journalctl -u postgresql -f
```

---

## 🔧 Easy Deploy Script

Create this script for easy updates:

```bash
cat > /var/www/barber-booking/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting deployment..."

# Navigate to project directory
cd /var/www/barber-booking

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build applications
npm run build

# Run database migrations
npm run db:push --workspace=backend

# Restart PM2 processes
pm2 restart all

# Reload Nginx
systemctl reload nginx

echo "Deployment completed successfully!"
echo "Website: https://YOUR_DOMAIN.com"
echo "Status: pm2 status"
EOF

chmod +x /var/www/barber-booking/deploy.sh
```

**Usage:**
```bash
cd /var/www/barber-booking
./deploy.sh
```

---

## 🆘 Troubleshooting

### Common Issues and Solutions

#### 1. Backend not starting
```bash
# Check PM2 logs
pm2 logs barber-booking-backend

# Check if port is in use
netstat -tulpn | grep :3001

# Restart PM2
pm2 restart all
pm2 save
```

#### 2. Database connection issues
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test database connection
psql -U barber_user -h localhost -d barber_booking

# Check environment variables
cat packages/backend/.env
```

#### 3. Nginx configuration issues
```bash
# Test Nginx config
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx
```

#### 4. SSL certificate issues
```bash
# Check certificate status
certbot certificates

# Renew certificate
certbot renew

# Check SSL configuration
openssl s_client -connect YOUR_DOMAIN.com:443
```

#### 5. Frontend not loading
```bash
# Check if build exists
ls -la /var/www/barber-booking/packages/frontend/dist/

# Rebuild frontend
cd /var/www/barber-booking
npm run build --workspace=frontend

# Check Nginx serving correct files
curl -I https://YOUR_DOMAIN.com
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Connect to database
psql -U barber_user -d barber_booking

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_status ON appointments(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_barbershops_location ON barbershops USING gist(location);
```

#### 2. Redis Caching Setup
```bash
# Configure Redis
echo "maxmemory 256mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
systemctl restart redis-server
```

---

## 🔐 Security Checklist

- [ ] Strong database passwords
- [ ] JWT secrets are 32+ characters
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] Regular backups enabled
- [ ] Log monitoring set up
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] File upload restrictions in place
- [ ] Regular security updates scheduled

---

## 📞 Support Commands

### Quick Status Check
```bash
# Overall system status
pm2 status && systemctl status nginx postgresql redis-server

# Check website
curl -I https://YOUR_DOMAIN.com

# Check API
curl -I https://YOUR_DOMAIN.com/api/health
```

### Emergency Recovery
```bash
# If everything breaks, restart all services
systemctl restart nginx postgresql redis-server
pm2 restart all

# If database is corrupted, restore from backup
pg_dump -U barber_user barber_booking > backup_before_restore.sql
dropdb -U barber_user barber_booking
createdb -U barber_user barber_booking
psql -U barber_user barber_booking < /var/backups/barber-booking/db_backup_LATEST.sql
```

---

## 🎉 Final Steps

1. **Replace all instances of:**
   - `YOUR_DOMAIN.com` with your actual domain
   - `YOUR_VPS_IP` with your VPS IP address
   - `your_secure_password` with strong passwords
   - `YOUR_USERNAME` with your GitHub username

2. **Test your deployment:**
   - Visit https://YOUR_DOMAIN.com
   - Test user registration and login
   - Create a test appointment
   - Check admin dashboard

3. **Set up monitoring and backups**

4. **Celebrate! 🎉** Your barber booking SaaS is now live!

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Domain purchased and DNS configured
- [ ] VPS with minimum 2GB RAM provisioned
- [ ] SSH access to VPS confirmed
- [ ] Local development environment tested

### During deployment
- [ ] All software installed on VPS
- [ ] Database configured and secured
- [ ] Code uploaded and built successfully
- [ ] Environment variables configured
- [ ] PM2 process manager set up
- [ ] Nginx configured and tested
- [ ] SSL certificate installed
- [ ] Firewall configured

### Post-deployment
- [ ] Website accessible via HTTPS
- [ ] API endpoints responding
- [ ] Database seeded with test data
- [ ] Admin dashboard functional
- [ ] Booking flow tested
- [ ] Mobile responsiveness confirmed
- [ ] Backup system enabled
- [ ] Monitoring set up
- [ ] Performance optimized

### Maintenance
- [ ] Regular security updates scheduled
- [ ] Backup verification routine
- [ ] Log monitoring in place
- [ ] Performance monitoring active
- [ ] SSL certificate auto-renewal confirmed

---

**Support:** If you encounter issues, check the troubleshooting section or review the application logs for specific error messages.