#!/bin/bash

# YouTube to MP3 Converter Deployment Script
# For Ubuntu server with Docker and Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="yttmp3.com"
EMAIL="your-email@example.com"  # Change this to your email
PROJECT_DIR="/opt/yttmp3"
SERVICE_NAME="yttmp3"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi
}

# Check if Docker is installed
check_docker() {
    log_info "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker is installed"
}

# Create project directory and copy files
setup_project() {
    log_info "Setting up project directory..."
    
    # Create project directory
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    
    # Copy project files
    if [ -d "$(pwd)" ]; then
        cp -r . $PROJECT_DIR/
        cd $PROJECT_DIR
    else
        log_error "Please run this script from the project directory"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p {downloads,logs/{nginx,frontend,backend},ssl,ssl-challenge}
    
    log_success "Project setup complete"
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget nginx-common
    log_success "System updated"
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    # Update email in docker-compose.yml
    sed -i "s/your-email@example.com/$EMAIL/g" docker-compose.yml
    
    # Create initial SSL certificate
    log_info "Creating SSL certificate for $DOMAIN..."
    
    # First, start nginx temporarily for verification
    docker-compose up -d nginx
    sleep 10
    
    # Get SSL certificate
    docker-compose run --rm certbot || {
        log_warning "SSL certificate creation failed. Will retry after deployment."
    }
    
    log_success "SSL setup attempted"
}

# Setup firewall
setup_firewall() {
    log_info "Configuring firewall..."
    
    # Install ufw if not installed
    sudo apt install -y ufw
    
    # Configure firewall rules
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Enable firewall
    sudo ufw --force enable
    
    log_success "Firewall configured"
}

# Build and deploy the application
deploy_application() {
    log_info "Building and deploying application..."
    
    # Stop any existing containers
    docker-compose down --remove-orphans || true
    
    # Build and start services
    log_info "Building Docker images..."
    docker-compose build --no-cache
    
    log_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Check service health
    check_services
    
    log_success "Application deployed"
}

# Check if services are healthy
check_services() {
    log_info "Checking service health..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        # Check backend health
        if docker-compose exec -T backend curl -f http://localhost:5000/health > /dev/null 2>&1; then
            log_success "Backend service is healthy"
            break
        else
            log_warning "Backend not ready yet, waiting..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Backend service failed to start properly"
        docker-compose logs backend
        exit 1
    fi
    
    # Check if domain is accessible
    log_info "Checking domain accessibility..."
    if curl -k -f https://$DOMAIN/health > /dev/null 2>&1; then
        log_success "Domain is accessible"
    else
        log_warning "Domain may not be accessible yet. DNS propagation might be needed."
    fi
}

# Setup log rotation
setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/yttmp3 > /dev/null <<EOF
$PROJECT_DIR/logs/*/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        docker-compose -f $PROJECT_DIR/docker-compose.yml restart nginx
    endscript
}
EOF
    
    log_success "Log rotation configured"
}

# Setup monitoring script
setup_monitoring() {
    log_info "Setting up monitoring script..."
    
    cat > $PROJECT_DIR/monitor.sh <<'EOF'
#!/bin/bash

# Simple monitoring script for yttmp3 services
PROJECT_DIR="/opt/yttmp3"
cd $PROJECT_DIR

echo "=== YouTube to MP3 Converter Status ==="
echo "Date: $(date)"
echo

# Check Docker containers
echo "Docker Containers:"
docker-compose ps

echo
echo "Service Health:"

# Check backend health
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✓ Backend API: Healthy"
else
    echo "✗ Backend API: Unhealthy"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend: Healthy"
else
    echo "✗ Frontend: Unhealthy"
fi

# Check nginx
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✓ Nginx: Healthy"
else
    echo "✗ Nginx: Unhealthy"
fi

echo
echo "Disk Usage:"
df -h $PROJECT_DIR

echo
echo "Memory Usage:"
free -h

echo
echo "Recent logs (last 10 lines):"
echo "Backend:"
docker-compose logs --tail=10 backend

echo "Frontend:"
docker-compose logs --tail=10 frontend
EOF

    chmod +x $PROJECT_DIR/monitor.sh
    
    # Create cron job for monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * $PROJECT_DIR/monitor.sh >> $PROJECT_DIR/logs/monitor.log 2>&1") | crontab -
    
    log_success "Monitoring setup complete"
}

# Setup auto-renewal for SSL certificates
setup_ssl_renewal() {
    log_info "Setting up SSL certificate auto-renewal..."
    
    # Create renewal script
    cat > $PROJECT_DIR/renew-ssl.sh <<EOF
#!/bin/bash
cd $PROJECT_DIR
docker-compose run --rm certbot renew
docker-compose restart nginx
EOF
    
    chmod +x $PROJECT_DIR/renew-ssl.sh
    
    # Add to crontab for auto-renewal (runs twice daily)
    (crontab -l 2>/dev/null; echo "0 0,12 * * * $PROJECT_DIR/renew-ssl.sh >> $PROJECT_DIR/logs/ssl-renewal.log 2>&1") | crontab -
    
    log_success "SSL auto-renewal configured"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up Docker system..."
    docker system prune -f
    docker volume prune -f
    log_success "Cleanup complete"
}

# Main deployment function
main() {
    log_info "Starting YouTube to MP3 Converter deployment..."
    
    # Get user email for SSL
    if [ "$EMAIL" = "your-email@example.com" ]; then
        read -p "Enter your email for SSL certificate: " EMAIL
        if [ -z "$EMAIL" ]; then
            log_error "Email is required for SSL certificate"
            exit 1
        fi
    fi
    
    check_root
    check_docker
    update_system
    setup_project
    setup_firewall
    deploy_application
    setup_ssl
    setup_log_rotation
    setup_monitoring
    setup_ssl_renewal
    cleanup
    
    log_success "Deployment completed successfully!"
    echo
    echo "=== Deployment Summary ==="
    echo "Domain: https://$DOMAIN"
    echo "Project Directory: $PROJECT_DIR"
    echo "Logs Directory: $PROJECT_DIR/logs"
    echo
    echo "Useful Commands:"
    echo "- Check status: cd $PROJECT_DIR && docker-compose ps"
    echo "- View logs: cd $PROJECT_DIR && docker-compose logs -f"
    echo "- Restart services: cd $PROJECT_DIR && docker-compose restart"
    echo "- Monitor: $PROJECT_DIR/monitor.sh"
    echo
    echo "Visit https://$DOMAIN to test your application!"
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    restart)
        cd $PROJECT_DIR
        docker-compose restart
        log_success "Services restarted"
        ;;
    stop)
        cd $PROJECT_DIR
        docker-compose down
        log_success "Services stopped"
        ;;
    start)
        cd $PROJECT_DIR
        docker-compose up -d
        log_success "Services started"
        ;;
    logs)
        cd $PROJECT_DIR
        docker-compose logs -f
        ;;
    status)
        cd $PROJECT_DIR
        docker-compose ps
        ;;
    monitor)
        $PROJECT_DIR/monitor.sh
        ;;
    update)
        cd $PROJECT_DIR
        git pull
        docker-compose build --no-cache
        docker-compose up -d
        log_success "Application updated"
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|restart|stop|start|logs|status|monitor|update|cleanup}"
        exit 1
        ;;
esac
