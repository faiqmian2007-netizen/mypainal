# 🚀 Deployment Guide

This guide covers deploying the Node.js Deployment Panel on various platforms.

## 🌐 Amazon EC2 / AWS

### Prerequisites
- EC2 instance running Ubuntu/Debian
- Security group configured to allow port 3000 (or your custom port)
- SSH access to your instance

### Step-by-Step Deployment

#### 1. Connect to Your EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 2. Install Node.js
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 3. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

#### 4. Clone and Setup the Panel
```bash
# Clone your repository
git clone https://github.com/yourusername/node-deployment-panel.git
cd node-deployment-panel

# Install dependencies
npm install

# Create required directories
mkdir -p uploads projects logs
```

#### 5. Configure Environment
```bash
# Edit environment file
nano .env

# Set production environment
NODE_ENV=production
PORT=3000
```

#### 6. Start with PM2
```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 7. Configure Firewall
```bash
# Allow your port
sudo ufw allow 3000

# Enable firewall
sudo ufw enable
```

#### 8. Access Your Panel
Open your browser and navigate to:
```
http://your-ec2-public-ip:3000
```

### Production with Nginx (Recommended)

#### 1. Install Nginx
```bash
sudo apt install nginx
```

#### 2. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/node-panel
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/node-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📱 Replit

### Step-by-Step Deployment

#### 1. Create New Repl
- Go to [replit.com](https://replit.com)
- Click "Create Repl"
- Choose "Node.js" template
- Give it a name like "node-deployment-panel"

#### 2. Upload Files
- Upload all panel files to your Repl
- Or use the Replit Git integration

#### 3. Install Dependencies
```bash
npm install
```

#### 4. Create Required Directories
```bash
mkdir uploads projects
```

#### 5. Start the Panel
- Click the "Run" button
- The panel will start and show the URL

#### 6. Access Your Panel
- Use the provided Replit URL
- The panel will be accessible from anywhere

## 🐧 Termux (Android)

### Prerequisites
- Termux app installed from F-Droid
- Android device with internet connection

### Step-by-Step Deployment

#### 1. Update Termux
```bash
pkg update && pkg upgrade
```

#### 2. Install Required Packages
```bash
pkg install nodejs git
```

#### 3. Clone and Setup
```bash
# Clone repository
git clone https://github.com/yourusername/node-deployment-panel.git
cd node-deployment-panel

# Install dependencies
npm install

# Create directories
mkdir -p uploads projects
```

#### 4. Start the Panel
```bash
npm start
```

#### 5. Access from Browser
- Note the IP address shown in Termux
- Access from your browser: `http://your-ip:3000`

## 🖥️ Local Development

### Prerequisites
- Node.js 16+ installed
- Git installed

### Step-by-Step Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/node-deployment-panel.git
cd node-deployment-panel
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Create Directories
```bash
mkdir -p uploads projects
```

#### 4. Start Development Server
```bash
npm run dev
```

#### 5. Access Panel
Open `http://localhost:3000` in your browser

## 🔧 Environment Configuration

### Environment Variables
Create a `.env` file in your project root:

```env
# Basic Configuration
PORT=3000
NODE_ENV=production

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Uploads
MAX_FILE_SIZE=104857600
UPLOAD_DIR=uploads
PROJECTS_DIR=projects

# Console
MAX_CONSOLE_LOGS=1000
LOG_RETENTION_HOURS=24
```

### Custom Port
```bash
# Set custom port
PORT=8080 npm start

# Or use the startup script
PORT=8080 ./start.sh
```

## 🔒 Security Considerations

### Firewall Configuration
```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### SSL/HTTPS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### User Authentication
For production use, consider implementing:
- Basic authentication
- JWT tokens
- OAuth integration
- Role-based access control

## 📊 Monitoring and Maintenance

### PM2 Commands
```bash
# View processes
pm2 list

# Monitor resources
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart node-deployment-panel

# Stop application
pm2 stop node-deployment-panel
```

### Log Management
```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/err.log

# View output logs
tail -f logs/out.log
```

### Backup Strategy
```bash
# Create backup script
nano backup.sh

# Add backup commands
tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ projects/ logs/
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Permission Denied
```bash
# Fix permissions
chmod +x start.sh
chmod 755 uploads projects

# Check ownership
ls -la
```

#### Node.js Not Found
```bash
# Check PATH
echo $PATH

# Reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Dependencies Installation Failed
```bash
# Clear cache
npm cache clean --force

# Remove and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Issues

#### High Memory Usage
```bash
# Monitor memory
pm2 monit

# Restart if needed
pm2 restart node-deployment-panel
```

#### Slow Response Times
```bash
# Check system resources
htop

# Monitor network
iftop
```

## 📈 Scaling

### Load Balancing
```bash
# Use PM2 cluster mode
pm2 start ecosystem.config.js -i max

# Or use Nginx load balancing
# Configure multiple instances
```

### Database Integration
Consider adding:
- MongoDB for project metadata
- Redis for caching
- PostgreSQL for user management

### Containerization
```bash
# Docker deployment
docker build -t node-panel .
docker run -p 3000:3000 node-panel

# Docker Compose
docker-compose up -d
```

## 🎯 Best Practices

1. **Always use PM2 in production**
2. **Set up proper logging**
3. **Implement monitoring**
4. **Use environment variables**
5. **Regular backups**
6. **Security updates**
7. **Performance monitoring**
8. **Error tracking**

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review logs and console output
3. Check system requirements
4. Create an issue in the repository

---

**Happy Deploying! 🚀**