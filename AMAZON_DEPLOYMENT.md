# 🚀 Amazon AWS Deployment Guide

Complete guide to deploy the Node.js Deployment Panel on Amazon AWS services.

## 🌐 Amazon EC2 Deployment

### 1. Launch EC2 Instance

1. **Go to AWS Console**
   - Sign in to [AWS Console](https://aws.amazon.com/console/)
   - Navigate to EC2 service

2. **Launch Instance**
   - Click "Launch Instance"
   - Choose "Amazon Linux 2023" (recommended)
   - Select instance type: `t2.micro` (free tier) or `t3.small` for production
   - Configure instance details (default settings work fine)
   - Add storage: 8GB minimum (free tier) or 20GB+ for production

3. **Security Group Configuration**
   - Create new security group
   - Add these rules:
     - SSH (Port 22): Your IP address
     - HTTP (Port 80): 0.0.0.0/0 (for web access)
     - Custom TCP (Port 3000): 0.0.0.0/0 (for panel access)
     - HTTPS (Port 443): 0.0.0.0/0 (if using SSL)

4. **Launch and Connect**
   - Create or select existing key pair
   - Launch instance
   - Wait for instance to be running

### 2. Connect to Your Instance

```bash
# Replace with your key file and instance IP
ssh -i "your-key.pem" ec2-user@your-instance-public-ip
```

### 3. Install Required Software

```bash
# Update system
sudo yum update -y

# Install Node.js 18.x (LTS)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 for process management
sudo npm install -g pm2

# Verify installations
node --version
npm --version
git --version
```

### 4. Deploy the Panel

```bash
# Clone the repository
git clone <your-repository-url>
cd node-deployment-panel

# Install dependencies
npm install

# Create necessary directories
mkdir -p uploads projects

# Test the panel
npm start
```

### 5. Configure PM2 for Production

```bash
# Start the panel with PM2
pm2 start server.js --name "node-panel"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Follow the instructions provided by PM2
# Usually involves running a sudo command
```

### 6. Configure Firewall

```bash
# If using Amazon Linux 2023
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --remanent

# If using older Amazon Linux
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo service iptables save
```

### 7. Access Your Panel

- **Local access**: `http://localhost:3000`
- **Public access**: `http://your-instance-public-ip:3000`
- **Domain access**: `http://your-domain.com:3000` (if you have a domain)

## 🌐 Amazon Lightsail Deployment

### 1. Create Lightsail Instance

1. **Go to Lightsail Console**
   - Navigate to [Lightsail Console](https://lightsail.aws.amazon.com/)
   - Click "Create instance"

2. **Choose Platform**
   - Select "Linux/Unix"
   - Choose "Amazon Linux 2023"
   - Select instance plan (recommended: $5/month for production)

3. **Launch Instance**
   - Give your instance a name
   - Click "Create instance"

### 2. Connect and Deploy

```bash
# Connect via browser terminal or SSH
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Clone and setup
git clone <your-repository-url>
cd node-deployment-panel
npm install

# Start with PM2
sudo npm install -g pm2
pm2 start server.js --name "node-panel"
pm2 save
pm2 startup
```

## 🔒 Security Best Practices

### 1. Update Security Groups
- Restrict SSH access to your IP only
- Use specific port ranges instead of 0.0.0.0/0 when possible
- Consider using AWS Systems Manager instead of SSH

### 2. Enable HTTPS
```bash
# Install Certbot for Let's Encrypt SSL
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Use IAM Roles
- Create IAM role for EC2 instance
- Attach minimal required permissions
- Use role instead of access keys

## 📊 Monitoring and Logging

### 1. CloudWatch Integration
```bash
# Install CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent

# Configure monitoring
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 2. Log Management
```bash
# View PM2 logs
pm2 logs node-panel

# View system logs
sudo journalctl -u pm2-ec2-user

# Monitor resources
pm2 monit
```

## 🚀 Auto-Scaling (Optional)

### 1. Create Launch Template
- Use your configured instance as base
- Include all necessary scripts and configurations

### 2. Setup Auto Scaling Group
- Minimum: 1 instance
- Maximum: 3-5 instances
- Target CPU utilization: 70%

## 💰 Cost Optimization

### 1. Instance Types
- **Development**: t2.micro (free tier)
- **Production**: t3.small or t3.medium
- **High Performance**: t3.large or c5.large

### 2. Reserved Instances
- Purchase 1 or 3-year terms for production
- Save 30-60% compared to on-demand

### 3. Spot Instances
- Use for non-critical workloads
- Save up to 90% compared to on-demand

## 🔧 Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   ```bash
   # Check if service is running
   pm2 status
   
   # Check firewall
   sudo firewall-cmd --list-ports
   
   # Check security group in AWS console
   ```

2. **Permission denied errors**
   ```bash
   # Fix file permissions
   sudo chown -R ec2-user:ec2-user /home/ec2-user/node-deployment-panel
   chmod +x start.sh
   ```

3. **Memory issues**
   ```bash
   # Check memory usage
   free -h
   
   # Restart with more memory
   pm2 restart node-panel
   ```

4. **Node.js version issues**
   ```bash
   # Update Node.js
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

## 📱 Mobile Access

### 1. From Your Phone
- Use your phone's browser
- Navigate to: `http://your-instance-ip:3000`
- The panel is fully mobile-responsive

### 2. From Anywhere
- Use the public IP address
- Works on any device with internet access
- Secure with HTTPS for production use

## 🎯 Production Checklist

- [ ] Instance running with sufficient resources
- [ ] Security groups properly configured
- [ ] PM2 process manager installed and configured
- [ ] Firewall rules updated
- [ ] SSL certificate installed (if using domain)
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Auto-scaling configured (if needed)
- [ ] Cost optimization measures in place

## 🆘 Support

### AWS Support
- **Basic**: Community forums and documentation
- **Developer**: Email support
- **Business**: Phone and email support
- **Enterprise**: Dedicated support team

### Panel Support
- Check the main README.md for troubleshooting
- Review logs: `pm2 logs node-panel`
- Monitor system resources: `htop` or `top`

---

**Your Node.js Deployment Panel is now ready on Amazon AWS! 🚀**

Access it from anywhere in the world at: `http://your-instance-ip:3000`