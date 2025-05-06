# Deployment Guide

This guide provides instructions for deploying the Smart Chatbot MB application in production.

## Prerequisites

- Docker and Docker Compose installed on the server
- Node.js 18+ (for local development and builds)
- A Supabase account and project
- Domain name with SSL certificate (recommended for production)

## Configuration

1. Copy the example production environment file:

```bash
cp .env.production.example .env.production
```

2. Edit `.env.production` to configure your production settings:
   - Set proper JWT secret
   - Configure Supabase credentials
   - Set API URLs and ports
   - Configure CORS settings

## Manual Deployment

### Using Docker Compose

1. Build and start all services:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

2. Verify the deployment:

```bash
docker-compose ps
```

### Without Docker

#### Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm ci
```

3. Build the application:

```bash
npm run build
```

4. Start the production server:

```bash
NODE_ENV=production npm start
```

#### Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm ci
```

3. Build the application:

```bash
npm run build
```

4. Start the production server:

```bash
npm start
```

## Automated Deployment with GitHub Actions

This project is set up with GitHub Actions for CI/CD. When you push to the main branch, the following happens automatically:

1. Tests run on backend and frontend code
2. Docker images are built and pushed to Docker Hub
3. The images are deployed to the production server

### Required Secrets

Set up these secrets in your GitHub repository for automated deployments:

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token
- `DEPLOY_HOST`: Your deployment server hostname
- `DEPLOY_USERNAME`: SSH username for deployment
- `DEPLOY_KEY`: SSH private key for deployment

## Database Migrations

Supabase migrations are handled separately:

1. Connect to your Supabase instance:

```bash
cd supabase
cp .env.example .env
# Edit .env with your Supabase credentials
```

2. Run migrations:

```bash
./run-migrations.sh
```

## Monitoring and Logs

- Access logs via Docker:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

- Set up log rotation:

```bash
# Example logrotate configuration
cat > /etc/logrotate.d/smart-chatbot-mb << EOF
/var/log/smart-chatbot-mb/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
}
EOF
```

## Troubleshooting

- **API Connection Issues**: Check that your environment variables for API URLs are correct
- **Database Connection Errors**: Verify your Supabase connection details
- **Docker Issues**: Run `docker-compose down -v` and then restart with `docker-compose up -d`