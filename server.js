const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const archiver = require('archiver');
const unzipper = require('unzipper');
const os = require('os');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/client.js', express.static('./client.js'));

let botProcess = null;
let botStatus = 'stopped';
let botLogs = [];
let startupConfig = {
  mainFile: 'index.js',
  autoInstall: true
};

// Enhanced start with auto dependency installation
app.post('/start', (req, res) => {
  if (botStatus === 'running') return res.sendStatus(400);

  const startBot = () => {
    botProcess = spawn('node', [startupConfig.mainFile]);
    botStatus = 'running';

    botProcess.stdout.on('data', (data) => {
      const log = data.toString();
      botLogs.push(log);
      io.emit('log', log);
    });

    botProcess.stderr.on('data', (data) => {
      const log = data.toString();
      botLogs.push(log);
      io.emit('log', log);
    });

    botProcess.on('close', () => {
      botStatus = 'stopped';
      io.emit('status', 'stopped');
    });

    io.emit('status', 'running');
    res.sendStatus(200);
  };

  if (startupConfig.autoInstall && fs.existsSync('package.json')) {
    const log = 'Installing dependencies...\n';
    botLogs.push(log);
    io.emit('log', log);

    const installProcess = spawn('npm', ['install']);

    installProcess.stdout.on('data', (data) => {
      const log = data.toString();
      botLogs.push(log);
      io.emit('log', log);
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        const log = 'Dependencies installed successfully!\n';
        botLogs.push(log);
        io.emit('log', log);
        startBot();
      } else {
        const log = 'Failed to install dependencies!\n';
        botLogs.push(log);
        io.emit('log', log);
        res.sendStatus(500);
      }
    });
  } else {
    startBot();
  }
});

// Stop bot
app.post('/stop', (req, res) => {
  if (botStatus === 'stopped') return res.sendStatus(400);
  botProcess.kill();
  botStatus = 'stopped';
  io.emit('status', 'stopped');
  res.sendStatus(200);
});

// Restart bot
app.post('/restart', (req, res) => {
  if (botProcess) botProcess.kill();

  setTimeout(() => {
    botProcess = spawn('node', [startupConfig.mainFile]);
    botStatus = 'running';

    botProcess.stdout.on('data', (data) => {
      const log = data.toString();
      botLogs.push(log);
      io.emit('log', log);
    });

    botProcess.stderr.on('data', (data) => {
      const log = data.toString();
      botLogs.push(log);
      io.emit('log', log);
    });

    botProcess.on('close', () => {
      botStatus = 'stopped';
      io.emit('status', 'stopped');
    });

    io.emit('status', 'running');
    res.sendStatus(200);
  }, 1000);
});

// Command execution
app.post('/execute', (req, res) => {
  const { command } = req.body;

  const log = `$ ${command}\n`;
  botLogs.push(log);
  io.emit('log', log);

  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (stdout) {
      botLogs.push(stdout);
      io.emit('log', stdout);
    }
    if (stderr) {
      botLogs.push(stderr);
      io.emit('log', stderr);
    }
    if (error) {
      const errorLog = `Error: ${error.message}\n`;
      botLogs.push(errorLog);
      io.emit('log', errorLog);
    }
  });

  res.json({ success: true });
});

// Clear logs
app.post('/clear-logs', (req, res) => {
  botLogs = [];
  res.sendStatus(200);
});

// Enhanced file list with more details
app.get('/files', (req, res) => {
  const dir = req.query.dir || __dirname;
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).send('Error reading directory');

    // Filter out panel-related files
    const panelFiles = [
      'server.js', 'client.js', 'public', 'uploads', 
      '.replit', 'package.json', 'package-lock.json',
      '.gitignore', 'attached_assets', 'bot.js', 'replit.nix',
      '.git', '.cache', '.config', '.local', '.upm',
      'node_modules'
    ];

    const fileList = files
      .filter(file => !panelFiles.includes(file.name))
      .map(file => {
        const filePath = path.join(dir, file.name);
        let stats = null;
        try {
          stats = fs.statSync(filePath);
        } catch (e) {}

        return {
          name: file.name,
          isDir: file.isDirectory(),
          path: filePath,
          size: stats ? stats.size : 0,
          modified: stats ? stats.mtime : new Date()
        };
      });

    res.json(fileList);
  });
});

// Enhanced upload with multiple files
app.post('/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded');
  }

  let completed = 0;
  const total = req.files.length;
  let hasPackageJson = false;

  req.files.forEach(file => {
    const newPath = path.join(__dirname, file.originalname);
    if (file.originalname === 'package.json') {
      hasPackageJson = true;
    }
    
    fs.rename(file.path, newPath, (err) => {
      if (err) {
        console.error('Error uploading file:', err);
      }
      completed++;
      if (completed === total) {
        // Check if package.json exists and node_modules doesn't
        if (hasPackageJson && !fs.existsSync(path.join(__dirname, 'node_modules'))) {
          const log = 'Auto-installing project dependencies...\n';
          botLogs.push(log);
          io.emit('log', log);

          const installProcess = spawn('npm', ['install']);

          installProcess.stdout.on('data', (data) => {
            const log = data.toString();
            botLogs.push(log);
            io.emit('log', log);
          });

          installProcess.stderr.on('data', (data) => {
            const log = data.toString();
            botLogs.push(log);
            io.emit('log', log);
          });

          installProcess.on('close', (code) => {
            if (code === 0) {
              const log = 'Project dependencies installed successfully!\n';
              botLogs.push(log);
              io.emit('log', log);
            } else {
              const log = 'Failed to install project dependencies!\n';
              botLogs.push(log);
              io.emit('log', log);
            }
          });
        }
        res.sendStatus(200);
      }
    });
  });
});

// Create directory
app.post('/create-directory', (req, res) => {
  const { name } = req.body;
  const dirPath = path.join(__dirname, name);

  fs.mkdir(dirPath, { recursive: true }, (err) => {
    if (err) return res.status(500).send('Error creating directory');
    res.sendStatus(200);
  });
});

// Create new file
app.post('/create-file', (req, res) => {
  const { name, content } = req.body;
  const filePath = path.join(__dirname, name);

  fs.writeFile(filePath, content || '', (err) => {
    if (err) return res.status(500).send('Error creating file');
    res.sendStatus(200);
  });
});

// Get file content for editing
app.get('/file-content', (req, res) => {
  const filePath = req.query.path;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file');
    res.send(data);
  });
});

// Save file content
app.post('/save-file', (req, res) => {
  const { path: filePath, content } = req.body;

  fs.writeFile(filePath, content, (err) => {
    if (err) return res.status(500).send('Error saving file');
    res.sendStatus(200);
  });
});

// Enhanced delete
app.post('/delete', (req, res) => {
  const { file } = req.body;

  fs.stat(file, (err, stats) => {
    if (err) return res.status(500).send('File not found');

    if (stats.isDirectory()) {
      fs.rmdir(file, { recursive: true }, (err) => {
        if (err) return res.status(500).send('Error deleting directory');
        res.sendStatus(200);
      });
    } else {
      fs.unlink(file, (err) => {
        if (err) return res.status(500).send('Error deleting file');
        res.sendStatus(200);
      });
    }
  });
});

// Unzip functionality
app.post('/unzip', (req, res) => {
  const { file } = req.body;
  const extractPath = path.dirname(file);

  fs.createReadStream(file)
    .pipe(unzipper.Extract({ path: extractPath }))
    .on('close', () => {
      res.sendStatus(200);
    })
    .on('error', (err) => {
      res.status(500).send('Error extracting file');
    });
});

// Download selected files as ZIP
app.post('/download-zip', (req, res) => {
  const { files } = req.body;

  res.attachment('selected-files.zip');

  const archive = archiver('zip');
  archive.pipe(res);

  files.forEach(file => {
    const stats = fs.statSync(file);
    if (stats.isFile()) {
      archive.file(file, { name: path.basename(file) });
    } else if (stats.isDirectory()) {
      archive.directory(file, path.basename(file));
    }
  });

  archive.finalize();
});

// Startup configuration
app.post('/startup-config', (req, res) => {
  startupConfig = req.body;
  res.sendStatus(200);
});

// System stats
app.get('/system-stats', (req, res) => {
  const stats = {
    cpu: Math.round(Math.random() * 100), // Simulated CPU usage
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    disk: Math.round(Math.random() * 10),
    networkIn: Math.round(Math.random() * 100),
    networkOut: Math.round(Math.random() * 50)
  };
  res.json(stats);
});

io.on('connection', (socket) => {
  socket.emit('status', botStatus);
  socket.emit('logs', botLogs.join(''));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Professional Bot Panel running on http://0.0.0.0:${PORT}`);
});