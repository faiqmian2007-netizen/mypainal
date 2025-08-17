# 🚀 Node.js Deployment Panel

A professional, feature-rich Node.js deployment panel with console management, file management, and auto-deployment capabilities. Perfect for deploying and managing Node.js projects on various platforms including Amazon, Replit, Termux, and more.

## ✨ Features

- **📊 Dashboard**: Real-time system statistics and project overview
- **💻 Console**: Live console output with command execution
- **📁 File Manager**: Complete file and directory management
- **🚀 Project Management**: Upload, deploy, and manage Node.js projects
- **⚙️ System Info**: Detailed system information and performance metrics
- **📱 Mobile Friendly**: Responsive design for all devices
- **🔄 Auto-Deployment**: Automatic dependency installation and project startup
- **🔒 Security**: Rate limiting and security headers
- **🌐 Cross-Platform**: Works on Linux, Windows, macOS

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- NPM 8.0.0 or higher

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd node-deployment-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the panel**
   ```bash
   npm start
   ```

4. **Access the panel**
   Open your browser and go to: `http://localhost:3000`

## 📋 Step-by-Step Setup Instructions

### For Amazon EC2/Linux Server

1. **Connect to your server**
   ```bash
   ssh -i your-key.pem ec2-user@your-server-ip
   ```

2. **Install Node.js and NPM**
   ```bash
   # Update system
   sudo yum update -y
   
   # Install Node.js 18.x
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

3. **Clone and setup the panel**
   ```bash
   git clone <repository-url>
   cd node-deployment-panel
   npm install
   ```

4. **Configure firewall (if needed)**
   ```bash
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --reload
   ```

5. **Start the panel**
   ```bash
   npm start
   ```

6. **Access from anywhere**
   Open: `http://your-server-ip:3000`

### For Replit

1. **Create new Repl**
   - Go to [replit.com](https://replit.com)
   - Click "Create Repl"
   - Choose "Node.js" template

2. **Upload files**
   - Copy all project files to your Repl
   - Or use the Replit Git integration

3. **Install dependencies**
   - Run `npm install` in the Replit shell

4. **Start the panel**
   - Run `npm start`
   - Click "Run" button

5. **Access your panel**
   - Use the Replit webview or external URL

### For Termux (Android)

1. **Install Termux**
   - Download from F-Droid or Google Play Store

2. **Update and install packages**
   ```bash
   pkg update && pkg upgrade
   pkg install nodejs git
   ```

3. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd node-deployment-panel
   npm install
   ```

4. **Start the panel**
   ```bash
   npm start
   ```

5. **Access from your phone**
   - Open browser and go to: `http://localhost:3000`
   - Or use your phone's IP address from other devices

### For Windows

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org)
   - Choose LTS version

2. **Open Command Prompt or PowerShell**
   ```cmd
   # Navigate to project directory
   cd path\to\node-deployment-panel
   
   # Install dependencies
   npm install
   
   # Start the panel
   npm start
   ```

3. **Access the panel**
   - Open browser and go to: `http://localhost:3000`

### For macOS

1. **Install Node.js**
   ```bash
   # Using Homebrew
   brew install node
   
   # Or download from nodejs.org
   ```

2. **Setup the panel**
   ```bash
   cd node-deployment-panel
   npm install
   npm start
   ```

3. **Access the panel**
   - Open browser and go to: `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=production
```

### Custom Port

To run on a different port:

```bash
PORT=8080 npm start
```

### Production Deployment

For production use:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "node-panel"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 📱 Usage Guide

### Dashboard
- View system statistics
- Monitor running projects
- Quick access to common actions

### Console
- View real-time console output
- Execute commands
- Download logs
- Clear console

### File Manager
- Navigate directories
- Upload files
- Create folders
- Delete files
- Download files

### Projects
- Upload ZIP projects
- Create new projects
- Start/stop projects
- Monitor running processes

### System Info
- View system details
- Monitor performance
- Check Node.js and NPM versions

## 🚀 Deploying Your First Project

1. **Prepare your project**
   - Create a ZIP file of your Node.js project
   - Ensure it has a `package.json` file

2. **Upload to the panel**
   - Go to Projects tab
   - Click "Upload Project"
   - Select your ZIP file
   - Click "Upload & Extract"

3. **Run your project**
   - Find your project in the list
   - Click "Run" button
   - Dependencies will be installed automatically
   - Project will start running

4. **Monitor your project**
   - Check console output
   - Monitor running processes
   - Stop when needed

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes)
- Security headers with Helmet
- CORS protection
- Input validation
- File upload restrictions

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Permission denied**
   ```bash
   # Make sure you have write permissions
   chmod 755 .
   ```

3. **Dependencies not installing**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Projects not starting**
   - Check if `package.json` exists
   - Verify main file path
   - Check console for errors

### Logs and Debugging

- Check browser console for JavaScript errors
- Monitor server console for Node.js errors
- Use the panel's console tab for real-time logs

## 📚 API Endpoints

- `GET /api/system` - Get system information
- `GET /api/logs` - Get console logs
- `POST /api/logs/clear` - Clear console logs
- `GET /api/files` - List files in directory
- `POST /api/files/mkdir` - Create directory
- `DELETE /api/files` - Delete file/directory
- `POST /api/upload` - Upload file
- `POST /api/upload-zip` - Upload and extract ZIP
- `POST /api/run` - Run Node.js project
- `POST /api/stop/:id` - Stop process
- `GET /api/processes` - Get running processes
- `POST /api/execute` - Execute command

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information
4. Include your system details and error logs

## 🌟 Features in Detail

### Auto-Dependency Installation
- Automatically detects `package.json`
- Runs `npm install` before starting projects
- Shows installation progress in real-time

### Real-Time Console
- Live console output streaming
- Command execution
- Log management and download

### File Management
- Full file system navigation
- Upload/download capabilities
- ZIP extraction support
- Directory creation

### Project Management
- Multiple project support
- Process monitoring
- Start/stop controls
- Status tracking

### Mobile Optimization
- Responsive design
- Touch-friendly interface
- Optimized for small screens

### Cross-Platform Support
- Linux (Ubuntu, CentOS, Amazon Linux)
- Windows (10, 11)
- macOS (10.15+)
- Android (Termux)
- Cloud platforms (Replit, Heroku, etc.)

---

**Happy Deploying! 🚀**

This panel makes Node.js deployment simple, professional, and accessible from anywhere in the world.