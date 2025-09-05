# YouTube to MP3 Converter - Production Deployment

A complete YouTube to MP3 converter web application with Flask backend API and Next.js frontend, containerized with Docker and deployed with Nginx reverse proxy and SSL certificates.

## 🚀 Features

- **Modern Web Interface**: Clean, responsive UI built with Next.js and Tailwind CSS
- **Fast Video Processing**: Backend powered by Flask and yt-dlp
- **Multiple Quality Options**: Support for bitrates from 64kbps to 320kbps
- **Production Ready**: Dockerized with SSL, rate limiting, and monitoring
- **Auto SSL Renewal**: Let's Encrypt certificates with automatic renewal
- **Security Hardened**: Rate limiting, CORS protection, and security headers

## 📋 Prerequisites

- Ubuntu 18.04+ server with Docker and Docker Compose installed
- Domain name pointing to your server IP (yttmp3.com)
- Email address for SSL certificate registration

## 🛠️ Installation

### 1. Clone and Prepare

```bash
# Clone the repository
git clone <your-repo-url>
cd youtube-mp3-youtube-dl

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Quick Deployment

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment (will prompt for email)
./deploy.sh
```

### 3. Manual Deployment Steps

If you prefer manual deployment:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create project directory
sudo mkdir -p /opt/yttmp3
sudo chown $USER:$USER /opt/yttmp3
cp -r . /opt/yttmp3/
cd /opt/yttmp3

# Create necessary directories
mkdir -p {downloads,logs/{nginx,frontend,backend},ssl,ssl-challenge}

# Update email in docker-compose.yml
sed -i "s/your-email@example.com/YOUR_EMAIL/g" docker-compose.yml

# Build and start services
docker-compose build --no-cache
docker-compose up -d

# Setup SSL certificate
docker-compose run --rm certbot

# Restart nginx with SSL
docker-compose restart nginx
```

## 🔧 Management Commands

The deployment script provides several management commands:

```bash
# Check service status
./deploy.sh status

# View logs
./deploy.sh logs

# Restart services
./deploy.sh restart

# Stop services
./deploy.sh stop

# Start services
./deploy.sh start

# Monitor system health
./deploy.sh monitor

# Update application
./deploy.sh update

# Clean up Docker resources
./deploy.sh cleanup
```

## 📁 Project Structure

```
├── app/                    # Next.js frontend
│   ├── config/
│   ├── page.js
│   └── layout.js
├── flask-api/              # Flask backend
│   ├── app.py
│   ├── requirements.txt
│   └── start.sh
├── Dockerfile.frontend     # Frontend Docker image
├── Dockerfile.backend      # Backend Docker image
├── docker-compose.yml      # Multi-container orchestration
├── nginx.conf             # Nginx reverse proxy config
├── deploy.sh              # Deployment automation script
└── .env.example           # Environment variables template
```

## 🔐 Security Features

- **SSL/TLS Encryption**: Automatic Let's Encrypt certificates
- **Rate Limiting**: API and download endpoint protection
- **CORS Protection**: Proper cross-origin resource sharing
- **Security Headers**: HSTS, XSS protection, content type sniffing prevention
- **Firewall Configuration**: UFW rules for necessary ports only

## 📊 Monitoring

The deployment includes:

- **Health Checks**: Automatic service health monitoring
- **Log Rotation**: Automated log management
- **System Monitoring**: CPU, memory, and disk usage tracking
- **SSL Renewal**: Automated certificate renewal

### Monitor Services

```bash
# Check all services
./deploy.sh monitor

# View real-time logs
./deploy.sh logs

# Check Docker containers
docker-compose ps

# Check service health
curl https://yttmp3.com/health
```

## 🔧 Configuration

### Environment Variables

Edit `.env` file to customize:

```env
DOMAIN=yttmp3.com
EMAIL=your-email@example.com
NEXT_PUBLIC_API_URL=https://yttmp3.com/api
NODE_ENV=production
FLASK_ENV=production
```

### Rate Limiting

Modify `nginx.conf` to adjust rate limits:

```nginx
# API rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;

# Download rate limiting
limit_req_zone $binary_remote_addr zone=download:10m rate=2r/m;
```

## 🐛 Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   # Manually request certificate
   docker-compose run --rm certbot
   docker-compose restart nginx
   ```

2. **Service Not Starting**
   ```bash
   # Check logs
   ./deploy.sh logs
   
   # Restart services
   ./deploy.sh restart
   ```

3. **Port Conflicts**
   ```bash
   # Check what's using ports 80/443
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```

4. **Domain Not Accessible**
   - Verify DNS is pointing to server IP
   - Check firewall rules: `sudo ufw status`
   - Verify nginx configuration: `docker-compose exec nginx nginx -t`

### Logs Location

- **Application Logs**: `/opt/yttmp3/logs/`
- **Nginx Logs**: `/opt/yttmp3/logs/nginx/`
- **Backend Logs**: `/opt/yttmp3/logs/backend/`
- **Frontend Logs**: `/opt/yttmp3/logs/frontend/`

## 🔄 Updates

To update the application:

```bash
# Pull latest changes
git pull

# Update and restart
./deploy.sh update
```

## 📝 License

This project is for educational purposes. Please respect YouTube's Terms of Service and copyright laws.

## 🤝 Support

For issues and questions:

1. Check the logs: `./deploy.sh logs`
2. Monitor system: `./deploy.sh monitor`
3. Review nginx config: `cat nginx.conf`
4. Check service status: `./deploy.sh status`

## 🚨 Production Notes

- Change default email in `.env` file
- Review and adjust rate limits based on your needs
- Monitor disk space for downloads directory
- Set up regular backups for configuration files
- Consider using a CDN for better performance
- Monitor server resources and scale as needed
