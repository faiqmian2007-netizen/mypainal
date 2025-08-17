
const socket = io();
let currentTab = 'console';
let selectedFiles = [];

// Tab switching function
function showTab(tab) {
  currentTab = tab;
  
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  
  // Show selected tab
  document.getElementById(tab + '-tab').style.display = 'block';
  document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
  
  if (tab === 'files') {
    loadFiles();
  } else if (tab === 'setup') {
    loadStartupConfig();
  }
}

// Bot control functions
function startBot() {
  fetch('/start', { method: 'POST' })
    .then(() => updateSystemStats());
}

function stopBot() {
  fetch('/stop', { method: 'POST' })
    .then(() => updateSystemStats());
}

function restartBot() {
  fetch('/restart', { method: 'POST' })
    .then(() => updateSystemStats());
}

// Command execution
function executeCommand() {
  const input = document.getElementById('command-input');
  const command = input.value.trim();
  if (!command) return;
  
  fetch('/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  
  input.value = '';
}

// Clear logs
function clearLogs() {
  fetch('/clear-logs', { method: 'POST' })
    .then(() => {
      document.getElementById('logs').innerHTML = '';
    });
}

// Copy address
function copyAddress() {
  const address = window.location.origin;
  navigator.clipboard.writeText(address).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}

// File management functions
function loadFiles() {
  fetch('/files')
    .then(res => res.json())
    .then(files => {
      const container = document.getElementById('file-list');
      container.innerHTML = '';
      
      files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
          <input type="checkbox" onchange="toggleFileSelection('${file.path}')">
          <span class="file-name ${file.isDir ? 'directory' : 'file'}">${file.name}</span>
          <span class="file-size">${file.isDir ? 'DIR' : formatSize(file.size)}</span>
          <div class="file-actions">
            ${!file.isDir ? `<button onclick="editFile('${file.path}')">Edit</button>` : ''}
            ${file.name.endsWith('.zip') ? `<button onclick="unzipFile('${file.path}')">...</button>` : ''}
            <button onclick="deleteFile('${file.path}')">Delete</button>
          </div>
        `;
        container.appendChild(div);
      });
    });
}

function toggleFileSelection(path) {
  const index = selectedFiles.indexOf(path);
  if (index > -1) {
    selectedFiles.splice(index, 1);
  } else {
    selectedFiles.push(path);
  }
}

function selectAllFiles() {
  const checkboxes = document.querySelectorAll('#file-list input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = true;
    const path = cb.nextElementSibling.textContent;
    if (!selectedFiles.includes(path)) {
      selectedFiles.push(path);
    }
  });
}

function createDirectory() {
  const name = prompt('Enter directory name:');
  if (name) {
    fetch('/create-directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(() => loadFiles());
  }
}

function createNewFile() {
  const name = prompt('Enter file name (with extension):');
  if (name) {
    fetch('/create-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content: '' })
    }).then(() => loadFiles());
  }
}

function uploadFiles() {
  document.getElementById('file-input').click();
}

function handleFileUpload(event) {
  const files = event.target.files;
  const formData = new FormData();
  
  for (let file of files) {
    formData.append('files', file);
  }
  
  const progressDiv = document.createElement('div');
  progressDiv.innerHTML = 'Uploading... <span id="upload-progress">0</span>%';
  document.getElementById('file-list').prepend(progressDiv);
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    document.getElementById('upload-progress').textContent = progress;
    if (progress >= 100) {
      clearInterval(interval);
      progressDiv.remove();
      loadFiles();
    }
  }, 200);
  
  fetch('/upload', {
    method: 'POST',
    body: formData
  });
}

function editFile(path) {
  fetch(`/file-content?path=${encodeURIComponent(path)}`)
    .then(res => res.text())
    .then(content => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <h3>Edit File: ${path}</h3>
          <textarea id="file-editor" rows="20" cols="80">${content}</textarea>
          <div>
            <button onclick="saveFile('${path}')">Save</button>
            <button onclick="closeModal()">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    });
}

function saveFile(path) {
  const content = document.getElementById('file-editor').value;
  fetch('/save-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content })
  }).then(() => {
    closeModal();
    loadFiles();
  });
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

function deleteFile(path) {
  if (confirm('Are you sure you want to delete this file?')) {
    fetch('/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: path })
    }).then(() => loadFiles());
  }
}

function unzipFile(path) {
  fetch('/unzip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: path })
  }).then(() => {
    alert('File unzipped successfully!');
    loadFiles();
  });
}

function downloadSelected() {
  if (selectedFiles.length === 0) {
    alert('Please select files to download');
    return;
  }
  
  fetch('/download-zip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: selectedFiles })
  }).then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected-files.zip';
      a.click();
    });
}

// Startup configuration
function loadStartupConfig() {
  // Load current config if needed
}

function saveStartupConfig() {
  const mainFile = document.getElementById('main-file').value;
  const autoInstall = document.getElementById('auto-install').checked;
  
  fetch('/startup-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mainFile, autoInstall })
  }).then(() => {
    alert('Startup configuration saved!');
  });
}

// Utility functions
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateSystemStats() {
  fetch('/system-stats')
    .then(res => res.json())
    .then(stats => {
      document.getElementById('cpu-load').textContent = stats.cpu + '%';
      document.getElementById('memory-usage').textContent = stats.memory + ' MB';
      document.getElementById('disk-usage').textContent = stats.disk + ' GB';
      document.getElementById('network-in').textContent = stats.networkIn + ' KB/s';
      document.getElementById('network-out').textContent = stats.networkOut + ' KB/s';
    });
}

// Socket event handlers
socket.on('status', (status) => {
  document.getElementById('status').textContent = status;
  document.getElementById('status').className = `status ${status}`;
});

socket.on('log', (log) => {
  const logsDiv = document.getElementById('logs');
  logsDiv.innerHTML += log;
  logsDiv.scrollTop = logsDiv.scrollHeight;
});

// Uptime counter
let uptime = 0;
setInterval(() => {
  const status = document.getElementById('status').textContent;
  if (status === 'running') {
    uptime++;
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    document.getElementById('uptime').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    uptime = 0;
    document.getElementById('uptime').textContent = '00:00:00';
  }
}, 1000);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showTab('console');
  updateSystemStats();
  setInterval(updateSystemStats, 5000);
  
  // Command input enter key
  document.getElementById('command-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeCommand();
  });
});
