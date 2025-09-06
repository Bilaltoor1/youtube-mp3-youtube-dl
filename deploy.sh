#!/bin/bash

# YouTube MP3 Converter - Production Deployment Script
# This script handles container deployment for yttmp3.com

set -e

echo "🚀 Starting YouTube MP3 Converter deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="yttmp3.com"
EMAIL="bilaltoor786786@gmail.com"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${BLUE}[SUCCESS]${NC} $1"
}

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Stopping and removing existing containers..."
docker compose down --remove-orphans --volumes || true

print_status "Cleaning up Docker system..."
docker system prune -f || true

print_status "Building Docker images..."
docker compose build --no-cache

print_status "Starting services (backend, frontend, nginx)..."
docker compose up -d backend frontend nginx

print_status "Waiting for services to start..."
sleep 30

# Health check for backend
print_status "Checking backend health..."
for i in {1..10}; do
    if docker compose exec -T backend curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "✅ Backend is running successfully!"
        break
    else
        if [ $i -eq 10 ]; then
            print_error "❌ Backend health check failed after 10 attempts."
            print_status "Backend logs:"
            docker compose logs --tail=20 backend
        else
            print_warning "Backend health check attempt $i failed, retrying in 5 seconds..."
            sleep 5
        fi
    fi
done

# Health check for frontend
print_status "Checking frontend health..."
for i in {1..10}; do
    # Check if frontend container is running and check via nginx proxy
    if docker compose ps frontend | grep -q "Up" && curl -f http://localhost > /dev/null 2>&1; then
        print_success "✅ Frontend is running successfully!"
        break
    elif docker compose logs frontend 2>/dev/null | grep -q "ready\|started\|listening"; then
        print_success "✅ Frontend is running successfully!"
        break
    else
        if [ $i -eq 10 ]; then
            print_error "❌ Frontend health check failed after 10 attempts."
            print_status "Frontend logs:"
            docker compose logs --tail=20 frontend
            print_status "Frontend container status:"
            docker compose ps frontend
        else
            print_warning "Frontend health check attempt $i failed, retrying in 5 seconds..."
            sleep 5
        fi
    fi
done

# Setup SSL if needed
print_status "Setting up SSL certificate..."
docker compose run --rm certbot || {
    print_warning "SSL certificate creation failed. Will continue without SSL for now."
}

# Final domain check
print_status "Checking domain accessibility..."
if curl -k -f https://$DOMAIN/api/health > /dev/null 2>&1; then
    print_success "✅ Domain is accessible at https://$DOMAIN"
elif curl -f http://$DOMAIN > /dev/null 2>&1; then
    print_success "✅ Domain is accessible at http://$DOMAIN (SSL pending)"
else
    print_warning "⚠️ Domain may not be accessible yet. DNS propagation might be needed."
fi

print_success "🎉 Deployment completed!"
print_status "🌐 Your YouTube MP3 converter should be available at: https://$DOMAIN"
print_status "📊 Check container status with: docker compose ps"
print_status "📋 View logs with: docker compose logs -f [service-name]"
print_status "🔄 Restart services with: docker compose restart"

# Show running containers
print_status "Current running containers:"
docker compose ps
