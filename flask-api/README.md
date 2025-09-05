# YouTube to MP3 Converter API

A production-ready Flask API for converting YouTube videos to MP3 files at various bitrates (64-320 kbps).

## Features

- YouTube video to MP3 conversion
- Selectable bitrates: 64, 128, 192, 256, 320 kbps
- Production-ready with proper error handling
- Anti-bot measures for production use
- Automatic file cleanup
- Input validation and security measures
- Health check endpoint

## Installation

1. **Create and activate virtual environment:**
```bash
cd flask-api
python3 -m venv venv
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Install system dependencies:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

## Usage

### Development
```bash
./start.sh
```

### Production with Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Production with systemd service
Create `/etc/systemd/system/youtube-mp3-api.service`:
```ini
[Unit]
Description=YouTube MP3 API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/your/flask-api
Environment=PATH=/path/to/your/flask-api/venv/bin
ExecStart=/path/to/your/flask-api/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

## API Endpoints

### Convert Video
**POST** `/api/convert`

**Request body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "bitrate": 128
}
```

**Response:** MP3 file download

### Health Check
**GET** `/api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-05T10:30:00"
}
```

## Production Considerations

1. **Rate Limiting**: Consider adding rate limiting (Flask-Limiter)
2. **Authentication**: Add API key authentication for production
3. **CDN**: Use a CDN for serving converted files
4. **Queue System**: Use Celery/Redis for background processing
5. **Monitoring**: Add logging and monitoring
6. **SSL**: Use HTTPS in production

## Security Features

- YouTube URL validation
- File size limits
- Video duration limits (30 minutes max)
- Automatic file cleanup
- Input sanitization
- Error handling without exposing internals

## Environment Variables

See `.env` file for configuration options.

## Troubleshooting

- Ensure ffmpeg is installed and accessible
- Check that the downloads directory is writable
- Verify YouTube-DL is up to date
- Monitor disk space for the downloads directory
