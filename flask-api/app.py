import os
import re
import threading
import time
from datetime import datetime
from flask import Flask, request, send_file, jsonify, after_this_request
from flask_cors import CORS
from dotenv import load_dotenv
import yt_dlp
from pydub import AudioSegment
import uuid
import logging

load_dotenv()
app = Flask(__name__)

# Check if we're in development mode
is_development = os.getenv('FLASK_ENV') == 'development' or os.getenv('FLASK_DEBUG') == 'True'

# Configure CORS with comprehensive settings
if is_development:
    # More permissive CORS for development
    CORS(app, 
         origins="*",
         methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
         allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
         supports_credentials=False,
         max_age=600
    )
else:
    # Restrictive CORS for production
    CORS(app, 
         origins=[
             "https://yttmp3.com",
             "http://yttmp3.com", 
             "http://localhost:3000",
             "http://localhost",
             "https://localhost",
         ],
         methods=["GET", "POST", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
         supports_credentials=True,
         max_age=600
    )

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DOWNLOAD_FOLDER = 'downloads'
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

# Production configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Global dictionary to track download progress
download_progress = {}
download_info = {}

def is_valid_youtube_url(url):
    """Validate YouTube URL to prevent abuse"""
    youtube_regex = re.compile(
        r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|shorts/|.+\?v=)?([^&=%\?]{11})'
    )
    return youtube_regex.match(url) is not None

def cleanup_old_files():
    """Clean up files older than 1 hour"""
    try:
        for filename in os.listdir(DOWNLOAD_FOLDER):
            filepath = os.path.join(DOWNLOAD_FOLDER, filename)
            if os.path.isfile(filepath):
                file_age = time.time() - os.path.getctime(filepath)
                if file_age > 3600:  # 1 hour
                    os.remove(filepath)
                    logger.info(f"Cleaned up old file: {filename}")
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")

def cleanup_file_after_request(filepath):
    """Schedule file cleanup after request"""
    def delayed_cleanup():
        time.sleep(5)  # Wait 5 seconds before cleanup
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Cleaned up file after request: {filepath}")
        except Exception as e:
            logger.error(f"Error cleaning up file {filepath}: {str(e)}")
    
    thread = threading.Thread(target=delayed_cleanup)
    thread.daemon = True
    thread.start()

def progress_hook(d):
    """Progress hook for yt-dlp"""
    if 'task_id' in d:
        task_id = d['task_id']
        if d['status'] == 'downloading':
            percent = d.get('_percent_str', '0%').strip()
            speed = d.get('_speed_str', 'N/A').strip()
            eta = d.get('_eta_str', 'N/A').strip()
            
            download_progress[task_id] = {
                'status': 'downloading',
                'percent': percent,
                'speed': speed,
                'eta': eta,
                'timestamp': datetime.now().isoformat()
            }
        elif d['status'] == 'finished':
            download_progress[task_id] = {
                'status': 'processing',
                'percent': '100%',
                'speed': 'N/A',
                'eta': 'Processing...',
                'timestamp': datetime.now().isoformat()
            }

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    """Get video information without downloading"""
    try:
        if not request.json:
            return jsonify({'error': 'JSON payload required'}), 400
        
        data = request.json
        url = data.get('url', '').strip()
        
        # Validate URL
        if not url or not is_valid_youtube_url(url):
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        # yt-dlp options for info extraction only
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
            'age_limit': 99,  # Allow all ages
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        }
        
        logger.info(f"Extracting info for URL: {url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract relevant information
            video_info = {
                'id': info.get('id', 'unknown'),
                'title': info.get('title', 'Unknown Title'),
                'uploader': info.get('uploader', 'Unknown'),
                'duration': info.get('duration', 0),
                'duration_string': info.get('duration_string', 'Unknown'),
                'view_count': info.get('view_count', 0),
                'upload_date': info.get('upload_date', 'Unknown'),
                'description': info.get('description', '')[:500] + ('...' if len(info.get('description', '')) > 500 else ''),
                'thumbnail': info.get('thumbnail', ''),
                'webpage_url': info.get('webpage_url', url),
                'formats_available': len(info.get('formats', [])),
                'is_live': info.get('is_live', False)
            }
            
            # Check duration limit
            duration = video_info['duration']
            if duration and duration > 1800:  # 30 minutes
                video_info['duration_warning'] = 'Video exceeds 30-minute limit'
            
            logger.info(f"Info extracted successfully: {video_info['title']}")
            return jsonify(video_info)
        
    except yt_dlp.DownloadError as e:
        logger.error(f"yt-dlp error during info extraction: {str(e)}")
        return jsonify({'error': 'Failed to extract video info. Video may be private or unavailable.'}), 400
    except Exception as e:
        logger.error(f"Unexpected error during info extraction: {str(e)}")
        return jsonify({'error': 'Failed to extract video information'}), 500

# Backward compatibility routes without /api/ prefix
@app.route('/video-info', methods=['POST'])
def get_video_info_compat():
    """Backward compatibility route for video-info without /api/ prefix"""
    return get_video_info()

@app.route('/convert', methods=['POST'])
def convert_compat():
    """Backward compatibility route for convert without /api/ prefix"""
    return convert()

@app.route('/health', methods=['GET'])
def health_compat():
    """Backward compatibility route for health without /api/ prefix"""
    return health_check()

@app.route('/api/progress/<task_id>', methods=['GET'])
def get_progress(task_id):
    """Get download progress for a specific task"""
    if task_id not in download_progress:
        return jsonify({'error': 'Task not found'}), 404
    
    progress_data = download_progress[task_id]
    
    # Include video info if available
    if task_id in download_info:
        progress_data['video_info'] = download_info[task_id]
    
    return jsonify(progress_data)

@app.route('/api/download/<task_id>', methods=['GET'])
def download_file(task_id):
    """Download completed file by task ID"""
    if task_id not in download_progress:
        return jsonify({'error': 'Task not found'}), 404
    
    progress = download_progress[task_id]
    if progress['status'] != 'completed':
        return jsonify({'error': 'Download not completed yet'}), 400
    
    output_path = os.path.join(DOWNLOAD_FOLDER, f"{task_id}.mp3")
    if not os.path.exists(output_path):
        return jsonify({'error': 'File not found'}), 404
    
    # Get video info for filename
    video_info = download_info.get(task_id, {})
    video_title = video_info.get('title', 'Unknown')
    filename = f"{video_title[:50]}.mp3".replace('/', '-').replace('\\', '-')
    
    @after_this_request
    def cleanup(response):
        cleanup_file_after_request(output_path)
        # Clean up progress tracking
        if task_id in download_progress:
            del download_progress[task_id]
        if task_id in download_info:
            del download_info[task_id]
        return response
    
    return send_file(
        output_path,
        as_attachment=True,
        download_name=filename,
        mimetype='audio/mpeg'
    )

@app.route('/health', methods=['GET'])
def health():
    """Simple health check endpoint"""
    return jsonify({'status': 'ok'})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/convert', methods=['POST'])
def convert():
    """Convert YouTube video to MP3 with specified bitrate"""
    try:
        # Validate input
        if not request.json:
            return jsonify({'error': 'JSON payload required'}), 400
        
        data = request.json
        url = data.get('url', '').strip()
        bitrate = data.get('bitrate', 128)
        
        # Validate URL
        if not url or not is_valid_youtube_url(url):
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        # Validate bitrate
        try:
            bitrate = int(bitrate)
            if not (64 <= bitrate <= 320):
                return jsonify({'error': 'Bitrate must be between 64 and 320 kbps'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid bitrate format'}), 400
        
        # Generate unique ID and paths
        temp_id = str(uuid.uuid4())
        output_path = os.path.join(DOWNLOAD_FOLDER, f"{temp_id}.mp3")
        
        # YouTube-DLP options with production considerations
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(DOWNLOAD_FOLDER, f'{temp_id}.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': str(bitrate)
            }],
            'quiet': True,
            'no_warnings': True,
            'extractaudio': True,
            'audioformat': 'mp3',
            'prefer_ffmpeg': True,
            'age_limit': 99,  # Allow all ages
            # Anti-bot measures for production
            'sleep_interval': 1,
            'max_sleep_interval': 5,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        }
        
        # Download and convert
        logger.info(f"Starting conversion for URL: {url} at {bitrate}kbps")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info first to validate
            info = ydl.extract_info(url, download=False)
            video_title = info.get('title', 'Unknown')
            duration = info.get('duration', 0)
            
            # Limit duration to prevent abuse (30 minutes max)
            if duration and duration > 1800:
                return jsonify({'error': 'Video too long (max 30 minutes)'}), 400
            
            # Download the video
            ydl.download([url])
        
        # Verify output file exists
        if not os.path.exists(output_path):
            return jsonify({'error': 'Conversion failed'}), 500
        
        # Optional: Re-encode to ensure exact bitrate
        try:
            audio = AudioSegment.from_file(output_path)
            audio.export(output_path, format="mp3", bitrate=f"{bitrate}k")
        except Exception as e:
            logger.warning(f"Re-encoding failed, using original: {str(e)}")
        
        # Schedule cleanup and return file
        @after_this_request
        def cleanup(response):
            cleanup_file_after_request(output_path)
            return response
        
        filename = f"{video_title[:50]}.mp3".replace('/', '-').replace('\\', '-')
        logger.info(f"Conversion successful: {video_title}")
        
        return send_file(
            output_path, 
            as_attachment=True,
            download_name=filename,
            mimetype='audio/mpeg'
        )
        
    except yt_dlp.DownloadError as e:
        logger.error(f"yt-dlp error: {str(e)}")
        return jsonify({'error': 'Failed to download video. Video may be private or unavailable.'}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        # Clean up old files periodically
        cleanup_old_files()

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({'error': 'Request too large'}), 413

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/cors-test', methods=['GET', 'POST', 'OPTIONS'])
def cors_test():
    """Simple endpoint to test CORS configuration"""
    if request.method == 'OPTIONS':
        # Preflight response
        response = jsonify({'message': 'CORS preflight successful'})
        return response
    
    return jsonify({
        'message': 'CORS test successful',
        'method': request.method,
        'origin': request.headers.get('Origin', 'No origin header'),
        'user_agent': request.headers.get('User-Agent', 'No user agent'),
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Run cleanup on startup
    cleanup_old_files()
    
    # Development server
    app.run(host='0.0.0.0', port=5000, debug=False)
