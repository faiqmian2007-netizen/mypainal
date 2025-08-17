const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { spawn, exec } = require('child_process');
const archiver = require('archiver');
const unzipper = require('unzipper');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Global variables
let runningProcesses = new Map();
let consoleLogs = [];
let systemInfo = {};

// Get system information
async function updateSystemInfo() {
  try {
    const { stdout: nodeVersion } = await exec('node --version');
    const { stdout: npmVersion } = await exec('npm --version');
    const { stdout: platform } = await exec('uname -a');
    
    systemInfo = {
      nodeVersion: nodeVersion.trim(),
      npmVersion: npmVersion.trim(),
      platform: platform.trim(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cwd: process.cwd()
    };
  } catch (error) {
    console.error('Error getting system info:', error);
  }
}

// Update system info every 30 seconds
setInterval(updateSystemInfo, 30000);
updateSystemInfo();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get system information
app.get('/api/system', (req, res) => {
  res.json(systemInfo);
});

// Get console logs
app.get('/api/logs', (req, res) => {
  res.json(consoleLogs.slice(-1000)); // Last 1000 logs
});

// Clear console logs
app.post('/api/logs/clear', (req, res) => {
  consoleLogs = [];
  res.json({ success: true });
});

// Get file list
app.get('/api/files', (req, res) => {
  const dir = req.query.dir || '.';
  const fullPath = path.resolve(dir);
  
  if (!fullPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const items = fs.readdirSync(fullPath);
    const files = items.map(item => {
      const itemPath = path.join(fullPath, item);
      const stats = fs.statSync(itemPath);
      return {
        name: item,
        path: path.relative(process.cwd(), itemPath),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        permissions: stats.mode.toString(8)
      };
    });
    
    res.json({
      currentDir: dir,
      parentDir: path.dirname(dir),
      files: files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create directory
app.post('/api/files/mkdir', (req, res) => {
  const { name, parentDir = '.' } = req.body;
  const fullPath = path.resolve(parentDir, name);
  
  if (!fullPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    fs.ensureDirSync(fullPath);
    res.json({ success: true, path: fullPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file/directory
app.delete('/api/files', (req, res) => {
  const { path: filePath } = req.query;
  const fullPath = path.resolve(filePath);
  
  if (!fullPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    fs.removeSync(fullPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { destination, filename } = req.file;
  const finalPath = path.join(destination, filename);
  
  res.json({
    success: true,
    file: {
      name: filename,
      path: finalPath,
      size: req.file.size
    }
  });
});

// Upload and extract ZIP
app.post('/api/upload-zip', upload.single('zip'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No ZIP file uploaded' });
  }
  
  try {
    const extractDir = path.join('projects', Date.now().toString());
    await fs.ensureDir(extractDir);
    
    const zipPath = req.file.path;
    const extractStream = fs.createReadStream(zipPath).pipe(unzipper.Parse());
    
    extractStream.on('entry', (entry) => {
      const fileName = entry.path;
      const type = entry.type;
      const size = entry.vars.uncompressedSize;
      
      if (type === 'Directory') {
        fs.ensureDirSync(path.join(extractDir, fileName));
      } else {
        const writeStream = fs.createWriteStream(path.join(extractDir, fileName));
        entry.pipe(writeStream);
      }
    });
    
    extractStream.on('close', () => {
      fs.unlinkSync(zipPath); // Remove uploaded ZIP
      res.json({
        success: true,
        extractDir: extractDir,
        message: 'ZIP extracted successfully'
      });
    });
    
    extractStream.on('error', (error) => {
      throw error;
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run Node.js project
app.post('/api/run', async (req, res) => {
  const { projectPath, mainFile = 'index.js' } = req.body;
  const fullPath = path.resolve(projectPath);
  
  if (!fullPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    // Check if package.json exists and install dependencies
    const packageJsonPath = path.join(fullPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const log = `Installing dependencies for ${projectPath}...\n`;
      consoleLogs.push(log);
      io.emit('console-log', log);
      
      const installProcess = spawn('npm', ['install'], { 
        cwd: fullPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      installProcess.stdout.on('data', (data) => {
        const log = data.toString();
        consoleLogs.push(log);
        io.emit('console-log', log);
      });
      
      installProcess.stderr.on('data', (data) => {
        const log = data.toString();
        consoleLogs.push(log);
        io.emit('console-log', log);
      });
      
      installProcess.on('close', (code) => {
        if (code === 0) {
          const log = `Dependencies installed successfully!\n`;
          consoleLogs.push(log);
          io.emit('console-log', log);
          startProject(fullPath, mainFile);
        } else {
          const log = `Failed to install dependencies (exit code: ${code})\n`;
          consoleLogs.push(log);
          io.emit('console-log', log);
          res.status(500).json({ error: 'Failed to install dependencies' });
        }
      });
    } else {
      startProject(fullPath, mainFile);
    }
    
    res.json({ success: true, message: 'Starting project...' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function startProject(projectPath, mainFile) {
  const mainFilePath = path.join(projectPath, mainFile);
  
  if (!fs.existsSync(mainFilePath)) {
    const log = `Main file ${mainFile} not found in ${projectPath}\n`;
    consoleLogs.push(log);
    io.emit('console-log', log);
    return;
  }
  
  const processId = Date.now().toString();
  const log = `Starting project: ${mainFile} in ${projectPath}\n`;
  consoleLogs.push(log);
  io.emit('console-log', log);
  
  const childProcess = spawn('node', [mainFile], {
    cwd: projectPath,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  runningProcesses.set(processId, {
    process: childProcess,
    projectPath: projectPath,
    mainFile: mainFile,
    startTime: new Date()
  });
  
  childProcess.stdout.on('data', (data) => {
    const log = `[${processId}] ${data.toString()}`;
    consoleLogs.push(log);
    io.emit('console-log', log);
  });
  
  childProcess.stderr.on('data', (data) => {
    const log = `[${processId}] ERROR: ${data.toString()}`;
    consoleLogs.push(log);
    io.emit('console-log', log);
  });
  
  childProcess.on('close', (code) => {
    const log = `[${processId}] Process exited with code ${code}\n`;
    consoleLogs.push(log);
    io.emit('console-log', log);
    runningProcesses.delete(processId);
  });
  
  io.emit('process-started', { processId, projectPath, mainFile });
}

// Stop process
app.post('/api/stop/:processId', (req, res) => {
  const { processId } = req.params;
  const processInfo = runningProcesses.get(processId);
  
  if (!processInfo) {
    return res.status(404).json({ error: 'Process not found' });
  }
  
  try {
    processInfo.process.kill();
    runningProcesses.delete(processId);
    
    const log = `Process ${processId} stopped\n`;
    consoleLogs.push(log);
    io.emit('console-log', log);
    
    res.json({ success: true, message: 'Process stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get running processes
app.get('/api/processes', (req, res) => {
  const processes = Array.from(runningProcesses.entries()).map(([id, info]) => ({
    id,
    projectPath: info.projectPath,
    mainFile: info.mainFile,
    startTime: info.startTime,
    uptime: Date.now() - info.startTime.getTime()
  }));
  
  res.json(processes);
});

// Execute command
app.post('/api/execute', (req, res) => {
  const { command, cwd = '.' } = req.body;
  const fullPath = path.resolve(cwd);
  
  if (!fullPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const log = `Executing: ${command} in ${cwd}\n`;
    consoleLogs.push(log);
    io.emit('console-log', log);
    
    const childProcess = exec(command, { cwd: fullPath });
    
    childProcess.stdout.on('data', (data) => {
      const log = data.toString();
      consoleLogs.push(log);
      io.emit('console-log', log);
    });
    
    childProcess.stderr.on('data', (data) => {
      const log = data.toString();
      consoleLogs.push(log);
      io.emit('console-log', log);
    });
    
    childProcess.on('close', (code) => {
      const log = `Command completed with exit code: ${code}\n`;
      consoleLogs.push(log);
      io.emit('console-log', log);
    });
    
    res.json({ success: true, message: 'Command executed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial data
  socket.emit('system-info', systemInfo);
  socket.emit('console-logs', consoleLogs.slice(-100));
  socket.emit('running-processes', Array.from(runningProcesses.keys()));
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Node.js Deployment Panel running on port ${PORT}`);
  console.log(`📱 Access the panel at: http://localhost:${PORT}`);
  console.log(`🌐 Mobile and PC friendly interface`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});