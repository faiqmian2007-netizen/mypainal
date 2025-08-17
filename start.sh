#!/bin/bash

# Node.js Deployment Panel Startup Script
echo "🚀 Starting Node.js Deployment Panel..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if NPM is installed
if ! command -v npm &> /dev/null; then
    echo "❌ NPM is not installed. Please install NPM first."
    exit 1
fi

# Display versions
echo "📋 Node.js version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create necessary directories
mkdir -p uploads projects

# Start the panel
echo "🚀 Starting the panel on port ${PORT:-3000}..."
echo "📱 Access the panel at: http://localhost:${PORT:-3000}"
echo "🔄 Press Ctrl+C to stop the panel"

# Start the server
npm start