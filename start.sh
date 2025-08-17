#!/bin/bash

# Node.js Deployment Panel Startup Script
# This script makes it easy to start the panel on various platforms

echo "🚀 Starting Node.js Deployment Panel..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "📖 Visit: https://nodejs.org/ for installation instructions"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ NPM is not installed. Please install NPM first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "⚠️  Warning: Node.js version $(node -v) detected."
    echo "📖 Recommended: Node.js 16.0.0 or higher"
    echo "🔧 Continuing anyway..."
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p uploads projects

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables
export PORT=${PORT:-3000}
export NODE_ENV=${NODE_ENV:-development}

echo "🌐 Starting panel on port $PORT..."
echo "📱 Access the panel at: http://localhost:$PORT"
echo "🖥️  Press Ctrl+C to stop the panel"

# Start the panel
npm start