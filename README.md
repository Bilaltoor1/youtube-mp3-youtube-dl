# YouTube to MP3 Converter - Full Stack Application

A complete full-stack web application for converting YouTube videos to MP3 files with customizable bitrates.

## Architecture

- **Frontend**: Next.js 15 with React and Tailwind CSS
- **Backend**: Flask API with YouTube-DL and FFmpeg
- **Audio Processing**: PyDub and FFmpeg for high-quality conversion

## Features

### Frontend (Next.js)
- Modern, responsive UI with dark mode support
- Real-time API status monitoring
- Progress indicators and error handling
- Automatic file downloads
- Input validation and user feedback

### Backend (Flask API)
- Production-ready with proper error handling
- Anti-bot measures for production deployment
- Automatic file cleanup
- Health check endpoints
- Support for bitrates: 64, 128, 192, 256, 320 kbps
- Video duration limits (30 minutes max)
- URL validation and security measures

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- FFmpeg

### 1. Clone and Setup
```bash
git clone <your-repo>
cd youtube-mp3-youtube-dl
```

### 2. Backend Setup
```bash
cd flask-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install FFmpeg
sudo apt-get update && sudo apt-get install ffmpeg

# Start the API
./start.sh
```

### 3. Frontend Setup
```bash
# In a new terminal, from project root
npm install
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## Production Deployment

### Flask API Production
```bash
cd flask-api
source venv/bin/activate
pip install gunicorn

# Production server
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Next.js Production
```bash
npm run build
npm start
```

### Environment Variables
Create `.env.local` in the root directory:
```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## API Endpoints

### POST /api/convert
Convert YouTube video to MP3

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "bitrate": 128
}
```

**Response:** MP3 file download

### GET /api/health
Check API status

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-05T10:30:00"
}
```

## Security Considerations

- URL validation to prevent abuse
- File size and duration limits
- Automatic cleanup of temporary files
- Input sanitization
- Rate limiting (recommended for production)
- HTTPS in production

## Testing

### Test the API
```bash
cd flask-api
python test_api.py
```

### Test the Full Stack
1. Start both servers
2. Open http://localhost:3000
3. Check API status indicator
4. Test with a short YouTube video

## Production Checklist

- [ ] Set up reverse proxy (nginx)
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Configure firewall rules
- [ ] Set up backup strategy for logs
- [ ] Monitor disk space for downloads directory
- [ ] Set up process manager (PM2/systemd)

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   ```bash
   sudo apt-get install ffmpeg
   ```

2. **YouTube-DL outdated**
   ```bash
   pip install --upgrade youtube-dl
   ```

3. **CORS issues**
   - Ensure Flask-CORS is installed
   - Check API_BASE_URL in config

4. **Downloads failing**
   - Check video availability
   - Verify network connectivity
   - Check disk space

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please respect YouTube's Terms of Service and copyright laws.

## Disclaimer

This tool is for personal use only. Users are responsible for ensuring they have the right to download and convert content. The developers are not responsible for any misuse of this software.
