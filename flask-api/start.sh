#!/bin/bash

# YouTube to MP3 Flask API Startup Script

# Navigate to flask-api directory
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is required but not installed."
    echo "Please install it with: sudo apt-get install ffmpeg"
    exit 1
fi

# Set production environment variables
export FLASK_ENV=production
export FLASK_DEBUG=False

# Create downloads directory if it doesn't exist
mkdir -p downloads

# Start the Flask application
echo "Starting YouTube to MP3 API server..."
echo "Server will be available at http://localhost:5000"
echo "API endpoint: http://localhost:5000/api/convert"
echo "Health check: http://localhost:5000/api/health"

python app.py
