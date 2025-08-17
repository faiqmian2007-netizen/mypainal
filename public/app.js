// Node.js Deployment Panel - Main Application
class NodeDeploymentPanel {
    constructor() {
        this.socket = null;
        this.currentTab = 'dashboard';
        this.currentDirectory = '.';
        this.runningProcesses = new Map();
        this.systemInfo = {};
        
        this.init();
    }

    init() {
        this.initializeSocket();
        this.initializeEventListeners();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    // Initialize Socket.IO connection
    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            this.showToast('Connected to server', 'success');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            this.showToast('Disconnected from server', 'error');
        });

        this.socket.on('console-log', (log) => {
            this.appendConsoleLog(log);
        });

        this.socket.on('system-info', (info) => {
            this.systemInfo = info;
            this.updateSystemInfo();
        });

        this.socket.on('console-logs', (logs) => {
            this.loadConsoleLogs(logs);
        });

        this.socket.on('running-processes', (processIds) => {
            this.updateRunningProcesses(processIds);
        });

        this.socket.on('process-started', (processInfo) => {
            this.addRunningProcess(processInfo);
            this.showToast(`Process started: ${processInfo.mainFile}`, 'success');
        });
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });

        // Form submissions
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadProject();
        });

        document.getElementById('newProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewProject();
        });

        document.getElementById('createFolderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createFolder();
        });

        document.getElementById('uploadFileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadFile();
        });

        // Command input
        document.getElementById('commandInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand();
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    // Load initial data
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadSystemInfo(),
                this.loadFiles(),
                this.loadProjects(),
                this.loadRunningProcesses()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Error loading data', 'error');
        }
    }

    // Tab switching
    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Update page title
        document.querySelector('.page-title').textContent = this.getTabTitle(tabName);

        // Load tab-specific data
        this.loadTabData(tabName);

        this.currentTab = tabName;
    }

    // Get tab title
    getTabTitle(tabName) {
        const titles = {
            dashboard: 'Dashboard',
            console: 'Console',
            files: 'File Manager',
            projects: 'Projects',
            system: 'System Info'
        };
        return titles[tabName] || 'Dashboard';
    }

    // Load tab-specific data
    loadTabData(tabName) {
        switch (tabName) {
            case 'files':
                this.loadFiles();
                break;
            case 'projects':
                this.loadProjects();
                break;
            case 'system':
                this.loadSystemInfo();
                break;
        }
    }

    // Load system information
    async loadSystemInfo() {
        try {
            const response = await fetch('/api/system');
            this.systemInfo = await response.json();
            this.updateSystemInfo();
        } catch (error) {
            console.error('Error loading system info:', error);
        }
    }

    // Update system information display
    updateSystemInfo() {
        const grid = document.getElementById('systemInfoGrid');
        if (!grid) return;

        const info = this.systemInfo;
        grid.innerHTML = `
            <div class="info-item">
                <span class="info-label">Node.js Version</span>
                <span class="info-value">${info.nodeVersion || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">NPM Version</span>
                <span class="info-value">${info.npmVersion || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Platform</span>
                <span class="info-value">${info.platform || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Current Directory</span>
                <span class="info-value">${info.cwd || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Uptime</span>
                <span class="info-value">${this.formatUptime(info.uptime || 0)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Memory Usage</span>
                <span class="info-value">${this.formatBytes(info.memory?.heapUsed || 0)}</span>
            </div>
        `;

        // Update dashboard stats
        this.updateDashboardStats();
    }

    // Update dashboard statistics
    updateDashboardStats() {
        const runningProjects = document.getElementById('runningProjects');
        const totalProjects = document.getElementById('totalProjects');
        const memoryUsage = document.getElementById('memoryUsage');
        const uptime = document.getElementById('uptime');

        if (runningProjects) runningProjects.textContent = this.runningProcesses.size;
        if (totalProjects) totalProjects.textContent = this.getTotalProjectsCount();
        if (memoryUsage) memoryUsage.textContent = this.formatBytes(this.systemInfo.memory?.heapUsed || 0);
        if (uptime) uptime.textContent = this.formatUptime(this.systemInfo.uptime || 0);
    }

    // Load files
    async loadFiles() {
        try {
            const response = await fetch(`/api/files?dir=${encodeURIComponent(this.currentDirectory)}`);
            const data = await response.json();
            this.renderFiles(data);
        } catch (error) {
            console.error('Error loading files:', error);
            this.showToast('Error loading files', 'error');
        }
    }

    // Render files
    renderFiles(data) {
        const filesList = document.getElementById('filesList');
        const breadcrumb = document.getElementById('fileBreadcrumb');

        if (!filesList || !breadcrumb) return;

        // Update breadcrumb
        breadcrumb.innerHTML = this.renderBreadcrumb(data.currentDir, data.parentDir);

        // Render files
        if (data.files.length === 0) {
            filesList.innerHTML = '<div class="text-center p-4 text-muted">No files found</div>';
            return;
        }

        filesList.innerHTML = data.files.map(file => `
            <div class="file-item ${file.isDirectory ? 'folder' : 'file'}" 
                 onclick="${file.isDirectory ? `this.navigateToDirectory('${file.path}')` : ''}">
                <i class="fas ${file.isDirectory ? 'fa-folder' : 'fa-file'}"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        ${file.isDirectory ? 'Directory' : this.formatBytes(file.size)} • 
                        Modified: ${new Date(file.modified).toLocaleString()}
                    </div>
                </div>
                <div class="file-actions">
                    ${file.isDirectory ? '' : `
                        <button class="btn btn-sm btn-info" onclick="event.stopPropagation(); this.downloadFile('${file.path}')">
                            <i class="fas fa-download"></i>
                        </button>
                    `}
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); this.deleteFile('${file.path}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render breadcrumb
    renderBreadcrumb(currentDir, parentDir) {
        const parts = currentDir.split('/').filter(part => part);
        let breadcrumb = '<span class="breadcrumb-item" onclick="this.navigateToDirectory(\'.\')">Home</span>';
        
        let path = '';
        parts.forEach(part => {
            path += (path ? '/' : '') + part;
            breadcrumb += `<span class="breadcrumb-item" onclick="this.navigateToDirectory('${path}')">${part}</span>`;
        });

        return breadcrumb;
    }

    // Navigate to directory
    navigateToDirectory(path) {
        this.currentDirectory = path;
        this.loadFiles();
    }

    // Load projects
    async loadProjects() {
        try {
            const response = await fetch('/api/processes');
            const processes = await response.json();
            this.updateRunningProcesses(processes.map(p => p.id));
            this.renderProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    // Render projects
    renderProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;

        // Get project directories
        this.getProjectDirectories().then(projects => {
            if (projects.length === 0) {
                projectsGrid.innerHTML = '<div class="text-center p-4 text-muted">No projects found</div>';
                return;
            }

            projectsGrid.innerHTML = projects.map(project => `
                <div class="project-card">
                    <div class="project-header">
                        <span class="project-name">${project.name}</span>
                        <span class="project-status ${this.isProjectRunning(project.path) ? 'running' : 'stopped'}">
                            ${this.isProjectRunning(project.path) ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                    <div class="project-meta">
                        Path: ${project.path}<br>
                        Main file: ${project.mainFile || 'index.js'}
                    </div>
                    <div class="project-actions">
                        ${this.isProjectRunning(project.path) ? 
                            `<button class="btn btn-sm btn-danger" onclick="this.stopProject('${project.path}')">
                                <i class="fas fa-stop"></i> Stop
                            </button>` :
                            `<button class="btn btn-sm btn-success" onclick="this.runProject('${project.path}')">
                                <i class="fas fa-play"></i> Run
                            </button>`
                        }
                        <button class="btn btn-sm btn-info" onclick="this.openProjectFolder('${project.path}')">
                            <i class="fas fa-folder-open"></i> Open
                        </button>
                    </div>
                </div>
            `).join('');
        });
    }

    // Get project directories
    async getProjectDirectories() {
        try {
            const response = await fetch('/api/files?dir=projects');
            const data = await response.json();
            return data.files.filter(file => file.isDirectory).map(dir => ({
                name: dir.name,
                path: dir.path,
                mainFile: this.detectMainFile(dir.path)
            }));
        } catch (error) {
            return [];
        }
    }

    // Detect main file
    detectMainFile(projectPath) {
        // This would need to be implemented based on your project structure
        return 'index.js';
    }

    // Check if project is running
    isProjectRunning(projectPath) {
        return Array.from(this.runningProcesses.values()).some(process => 
            process.projectPath === projectPath
        );
    }

    // Load running processes
    async loadRunningProcesses() {
        try {
            const response = await fetch('/api/processes');
            const processes = await response.json();
            this.updateRunningProcesses(processes.map(p => p.id));
            this.renderRunningProcesses(processes);
        } catch (error) {
            console.error('Error loading processes:', error);
        }
    }

    // Update running processes
    updateRunningProcesses(processIds) {
        // Remove processes that are no longer running
        Array.from(this.runningProcesses.keys()).forEach(id => {
            if (!processIds.includes(id)) {
                this.runningProcesses.delete(id);
            }
        });
    }

    // Add running process
    addRunningProcess(processInfo) {
        this.runningProcesses.set(processInfo.processId, processInfo);
        this.renderRunningProcesses(Array.from(this.runningProcesses.values()));
    }

    // Render running processes
    renderRunningProcesses(processes) {
        const processesList = document.getElementById('processesList');
        if (!processesList) return;

        if (processes.length === 0) {
            processesList.innerHTML = '<div class="text-center p-4 text-muted">No running processes</div>';
            return;
        }

        processesList.innerHTML = processes.map(process => `
            <div class="process-item">
                <div class="process-info">
                    <div class="process-name">${process.mainFile}</div>
                    <div class="process-path">${process.projectPath}</div>
                    <div class="process-uptime">Uptime: ${this.formatUptime(process.uptime)}</div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="this.stopProcess('${process.id}')">
                    <i class="fas fa-stop"></i> Stop
                </button>
            </div>
        `).join('');
    }

    // Console functions
    appendConsoleLog(log) {
        const consoleOutput = document.getElementById('consoleOutput');
        if (!consoleOutput) return;

        const logElement = document.createElement('div');
        logElement.textContent = log;
        consoleOutput.appendChild(logElement);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    loadConsoleLogs(logs) {
        const consoleOutput = document.getElementById('consoleOutput');
        if (!consoleOutput) return;

        consoleOutput.innerHTML = logs.map(log => `<div>${log}</div>`).join('');
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    clearConsole() {
        const consoleOutput = document.getElementById('consoleOutput');
        if (consoleOutput) {
            consoleOutput.innerHTML = '';
        }
        
        fetch('/api/logs/clear', { method: 'POST' })
            .then(() => this.showToast('Console cleared', 'success'))
            .catch(error => this.showToast('Error clearing console', 'error'));
    }

    downloadLogs() {
        fetch('/api/logs')
            .then(response => response.json())
            .then(logs => {
                const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `console-logs-${new Date().toISOString().slice(0, 19)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(error => this.showToast('Error downloading logs', 'error'));
    }

    // Command execution
    async executeCommand() {
        const commandInput = document.getElementById('commandInput');
        const command = commandInput.value.trim();
        
        if (!command) return;

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, cwd: this.currentDirectory })
            });

            if (response.ok) {
                commandInput.value = '';
                this.showToast('Command executed', 'success');
            } else {
                this.showToast('Error executing command', 'error');
            }
        } catch (error) {
            this.showToast('Error executing command', 'error');
        }
    }

    // Project management
    async runProject(projectPath) {
        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath, mainFile: 'index.js' })
            });

            if (response.ok) {
                this.showToast('Project started', 'success');
                setTimeout(() => this.loadProjects(), 1000);
            } else {
                this.showToast('Error starting project', 'error');
            }
        } catch (error) {
            this.showToast('Error starting project', 'error');
        }
    }

    async stopProject(projectPath) {
        // Find the process ID for this project
        const processId = Array.from(this.runningProcesses.entries())
            .find(([id, process]) => process.projectPath === projectPath)?.[0];

        if (processId) {
            await this.stopProcess(processId);
        }
    }

    async stopProcess(processId) {
        try {
            const response = await fetch(`/api/stop/${processId}`, { method: 'POST' });
            
            if (response.ok) {
                this.showToast('Process stopped', 'success');
                this.runningProcesses.delete(processId);
                this.renderRunningProcesses(Array.from(this.runningProcesses.values()));
                this.loadProjects();
            } else {
                this.showToast('Error stopping process', 'error');
            }
        } catch (error) {
            this.showToast('Error stopping process', 'error');
        }
    }

    // File management
    async createFolder() {
        const folderName = document.getElementById('folderName').value.trim();
        if (!folderName) return;

        try {
            const response = await fetch('/api/files/mkdir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: folderName, parentDir: this.currentDirectory })
            });

            if (response.ok) {
                this.showToast('Folder created', 'success');
                this.closeModal('createFolderModal');
                this.loadFiles();
            } else {
                this.showToast('Error creating folder', 'error');
            }
        } catch (error) {
            this.showToast('Error creating folder', 'error');
        }
    }

    async deleteFile(filePath) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showToast('File deleted', 'success');
                this.loadFiles();
            } else {
                this.showToast('Error deleting file', 'error');
            }
        } catch (error) {
            this.showToast('Error deleting file', 'error');
        }
    }

    // Upload functions
    async uploadProject() {
        const zipFile = document.getElementById('zipFile').files[0];
        if (!zipFile) return;

        const formData = new FormData();
        formData.append('zip', zipFile);

        try {
            const response = await fetch('/api/upload-zip', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast('Project uploaded and extracted', 'success');
                this.closeModal('uploadModal');
                this.loadProjects();
            } else {
                this.showToast('Error uploading project', 'error');
            }
        } catch (error) {
            this.showToast('Error uploading project', 'error');
        }
    }

    async uploadFile() {
        const file = document.getElementById('fileInput').files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.showToast('File uploaded', 'success');
                this.closeModal('uploadFileModal');
                this.loadFiles();
            } else {
                this.showToast('Error uploading file', 'error');
            }
        } catch (error) {
            this.showToast('Error uploading file', 'error');
        }
    }

    // Project creation
    async createNewProject() {
        const projectName = document.getElementById('projectName').value.trim();
        const mainFile = document.getElementById('mainFile').value.trim();
        
        if (!projectName) return;

        try {
            // Create project directory
            const response = await fetch('/api/files/mkdir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: projectName, parentDir: 'projects' })
            });

            if (response.ok) {
                this.showToast('Project created', 'success');
                this.closeModal('newProjectModal');
                this.loadProjects();
            } else {
                this.showToast('Error creating project', 'error');
            }
        } catch (error) {
            this.showToast('Error creating project', 'error');
        }
    }

    // Utility functions
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }

    getTotalProjectsCount() {
        // This would need to be implemented based on your project structure
        return 0;
    }

    // Modal functions
    showUploadModal() {
        document.getElementById('uploadModal').style.display = 'block';
    }

    showNewProjectModal() {
        document.getElementById('newProjectModal').style.display = 'block';
    }

    showCreateFolderModal() {
        document.getElementById('createFolderModal').style.display = 'block';
    }

    showUploadFileModal() {
        document.getElementById('uploadFileModal').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        
        // Clear form inputs
        const modal = document.getElementById(modalId);
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
    }

    // Connection status
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('statusIndicator');
        const dot = indicator.querySelector('.status-dot');
        const text = indicator.querySelector('.status-text');

        if (connected) {
            dot.style.background = 'var(--success-color)';
            text.textContent = 'Connected';
        } else {
            dot.style.background = 'var(--danger-color)';
            text.textContent = 'Disconnected';
        }
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Auto refresh
    startAutoRefresh() {
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadSystemInfo();
            }
        }, 30000); // Refresh every 30 seconds
    }

    // Refresh system info
    refreshSystemInfo() {
        this.loadSystemInfo();
        this.showToast('System info refreshed', 'success');
    }

    // Open project folder
    openProjectFolder(projectPath) {
        this.currentDirectory = projectPath;
        this.switchTab('files');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NodeDeploymentPanel();
});

// Global functions for onclick handlers
window.showUploadModal = () => window.app.showUploadModal();
window.showNewProjectModal = () => window.app.showNewProjectModal();
window.showCreateFolderModal = () => window.app.showCreateFolderModal();
window.showUploadFileModal = () => window.app.showUploadFileModal();
window.closeModal = (modalId) => window.app.closeModal(modalId);
window.clearConsole = () => window.app.clearConsole();
window.downloadLogs = () => window.app.downloadLogs();
window.executeCommand = () => window.app.executeCommand();
window.refreshSystemInfo = () => window.app.refreshSystemInfo();
window.navigateToDirectory = (path) => window.app.navigateToDirectory(path);
window.runProject = (path) => window.app.runProject(path);
window.stopProject = (path) => window.app.stopProject(path);
window.stopProcess = (id) => window.app.stopProcess(id);
window.createFolder = () => window.app.createFolder();
window.deleteFile = (path) => window.app.deleteFile(path);
window.uploadProject = () => window.app.uploadProject();
window.uploadFile = () => window.app.uploadFile();
window.createNewProject = () => window.app.createNewProject();
window.openProjectFolder = (path) => window.app.openProjectFolder(path);