# 🚀 Node.js Deployment Panel

A professional, feature-rich Node.js deployment panel with console management, file management, and automatic project deployment capabilities. Perfect for hosting platforms like Amazon, Replit, Termux, and any Linux environment.

## ✨ Features

- **📊 Dashboard**: Real-time system statistics and project overview
- **🖥️ Console**: Live console output with command execution
- **📁 File Manager**: Complete file and directory management
- **🚀 Project Management**: Upload, deploy, and manage Node.js projects
- **⚡ Auto-Deployment**: Automatic dependency installation and project startup
- **📱 Mobile Friendly**: Responsive design for all devices
- **🔒 Secure**: Built-in security features and rate limiting
- **🌐 Cross-Platform**: Works on Linux, Windows, and macOS

## 🛠️ Prerequisites

- Node.js 16.0.0 or higher
- NPM 8.0.0 or higher
- Linux/Unix environment (for full functionality)

## 📦 Installation

### Step 1: Clone or Download
```bash
# If using git
git clone <your-repository-url>
cd node-deployment-panel

# Or download and extract the ZIP file
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Required Directories
```bash
mkdir -p uploads projects
```

### Step 4: Start the Panel
```bash
npm start
```

The panel will be available at: `http://localhost:3000`

## 🚀 Quick Start Guide

### 1. Access the Panel
Open your web browser and navigate to:
- **Local**: `http://localhost:3000`
- **Remote**: `http://your-server-ip:3000`

### 2. Upload Your First Project
1. Click **"Upload Project"** on the dashboard
2. Select a ZIP file containing your Node.js project
3. The panel will automatically extract and prepare your project

### 3. Deploy and Run
1. Go to the **Projects** tab
2. Find your uploaded project
3. Click **"Run"** to start the project
4. Dependencies will be automatically installed
5. Your project will start running

### 4. Monitor and Manage
- Use the **Console** tab to view real-time logs
- Monitor system resources in the **System** tab
- Manage files in the **Files** tab

## 🌐 Deployment Options

### Amazon EC2 / AWS
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup the panel
git clone <your-repo>
cd node-deployment-panel
npm install
npm start

# For production, use PM2
npm install -g pm2
pm2 start server.js --name "deployment-panel"
pm2 startup
pm2 save
```

### Replit
1. Create a new Node.js repl
2. Upload all panel files
3. Run `npm install`
4. Click "Run" to start the panel
5. Access via the provided Replit URL

### Termux (Android)
```bash
# Update packages
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs

# Install git
pkg install git

# Clone and setup
git clone <your-repo>
cd node-deployment-panel
npm install
npm start
```

### Local Development
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Start in production mode
npm start
```

## 📁 Project Structure

```
node-deployment-panel/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── public/                # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── app.js            # Frontend JavaScript
├── uploads/               # File upload directory
├── projects/              # Extracted projects
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=production
```

### Custom Port
```bash
# Set custom port
PORT=8080 npm start

# Or modify server.js
const PORT = process.env.PORT || 8080;
```

## 📱 Mobile and PC Compatibility

The panel is fully responsive and works on:
- **Desktop**: Windows, macOS, Linux
- **Mobile**: Android, iOS
- **Tablets**: iPad, Android tablets
- **Browsers**: Chrome, Firefox, Safari, Edge

## 🚀 Advanced Features

### Auto-Dependency Installation
- Automatically detects `package.json` files
- Runs `npm install` before starting projects
- Handles dependency conflicts gracefully

### Process Management
- Start/stop individual projects
- Monitor running processes
- View real-time logs and output

### File Operations
- Upload files and projects
- Create directories
- Delete files and folders
- Navigate file system

### Security Features
- Rate limiting
- Input validation
- Secure file operations
- CORS protection

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

#### Permission Denied
```bash
# Fix file permissions
chmod +x server.js
chmod 755 uploads projects

# Or run with sudo (not recommended for production)
sudo npm start
```

#### Node.js Not Found
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Dependencies Installation Failed
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Logs and Debugging
- Check console output in the **Console** tab
- View server logs in the terminal
- Monitor system resources in the **System** tab

## 🔒 Security Considerations

- **Firewall**: Configure firewall to allow only necessary ports
- **HTTPS**: Use reverse proxy (nginx) with SSL for production
- **Authentication**: Implement user authentication for production use
- **File Uploads**: Monitor upload sizes and file types
- **Rate Limiting**: Already implemented, but can be customized

## 📈 Performance Optimization

### For High Traffic
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server.js -i max

# Use nginx as reverse proxy
# Configure load balancing
```

### Memory Management
- Monitor memory usage in the System tab
- Restart the panel periodically if needed
- Use PM2 for automatic restarts

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

1. Check the troubleshooting section above
2. Review the console logs
3. Check system requirements
4. Create an issue in the repository

## 🎯 Use Cases

- **Web Development**: Deploy and manage multiple Node.js projects
- **Testing**: Quick deployment for testing environments
- **Education**: Learn Node.js deployment and management
- **Production**: Manage production applications (with proper security)
- **Development**: Local development environment management

## 🚀 Future Enhancements

- [ ] User authentication and authorization
- [ ] Database integration
- [ ] Docker container support
- [ ] CI/CD pipeline integration
- [ ] Advanced monitoring and analytics
- [ ] Backup and restore functionality
- [ ] Multi-language support

---

**Made with ❤️ for the Node.js community**

*This panel is designed to be simple yet powerful, making Node.js deployment accessible to everyone.*