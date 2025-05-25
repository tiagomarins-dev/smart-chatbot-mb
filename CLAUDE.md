# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart-ChatBox is a multi-service WhatsApp CRM system with AI-powered lead management and automated messaging capabilities. The project uses a microservices architecture with TypeScript/Node.js backend, Next.js frontend, Python/FastAPI AI service, and Supabase for authentication and data storage.

## Architecture

### Services and Ports
- **Backend API** (Node.js/Express): Port 9033
- **Frontend** (Next.js): Port 9034  
- **AI Service** (Python/FastAPI): Port 8050
- **WhatsApp Service**: Integrated with backend
- **Database**: Supabase PostgreSQL

### Key Technologies
- **Backend**: TypeScript, Express, Supabase JS Client, WebSocket
- **Frontend**: Next.js 13, React 18, Bootstrap 5
- **AI Service**: FastAPI, OpenAI, Redis caching
- **Infrastructure**: Docker Compose, Supabase

## Common Development Commands

### Backend Development
```bash
# Install dependencies
cd backend && npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### AI Service Development
```bash
# Create virtual environment
cd ai-service && python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
./start-dev.sh  # Or: uvicorn app.main:app --reload --port 8050

# Run tests
pytest
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# Rebuild and restart backend
./scripts/service-utils/rebuild-backend.sh

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down
```

### Database Management
```bash
# Run migrations
cd supabase && ./run-migrations.sh

# Apply specific migration
psql $DATABASE_URL -f migrations/[migration-file].sql
```

## Critical Configuration

### Environment Variables (.env)
Required environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `OPENAI_API_KEY` (for AI service)

### Service Communication
- Frontend communicates with backend via `/api` endpoints
- Backend integrates with AI service at `http://ai-service:8050`
- All services use Supabase for authentication and data persistence
- WebSocket support for real-time features

## Project Structure Highlights

### Backend Structure
- `/src/controllers/` - Request handlers for each resource
- `/src/services/` - Business logic and integrations
- `/src/middleware/` - Auth and request processing
- `/src/interfaces/` - TypeScript type definitions
- `/src/services/chatbot/` - WhatsApp chatbot integration

### AI Service Structure
- `/app/api/` - FastAPI route handlers
- `/app/services/` - AI processing logic
- `/app/providers/` - AI provider adapters (OpenAI)
- `/app/models/` - Pydantic data models

### Database Schema
Key tables:
- `companies` - Multi-tenant organization data
- `projects` - Campaign/project management
- `leads` - Lead information and tracking
- `lead_events` - Lead activity timeline
- `whatsapp_conversations` - Chat history
- `lead_sentiment_analysis` - AI-powered sentiment tracking
- `automated_messages` - Message automation configuration

## Testing Approach

### Backend Testing
- Jest with TypeScript support
- Test files in `backend/src/__tests__/`
- Mock Supabase client available
- Run: `cd backend && npm test`

### Integration Testing
```bash
# Test Supabase connection
./scripts/test-utils/test-supabase-connection.js

# Test WhatsApp endpoints
./scripts/test-utils/test-whatsapp-endpoints.sh

# Test offline mode
./scripts/test-utils/test-offline-companies.sh
```

## Key Features Implementation

### WhatsApp Integration
- Uses whatsapp-web.js library
- Session persistence in Docker volume
- QR code generation for authentication
- Real-time message capture and storage

### Lead Sentiment Analysis
- Cron job runs every 2 hours (`cron/sentiment-analysis-cron.sh`)
- Analyzes WhatsApp conversations using OpenAI
- Updates lead sentiment scores and analysis

### Automated Messaging
- Event-based triggers for automated responses
- Template management system
- Integration with AI service for dynamic content

### Real-time Features
- WebSocket server for live updates
- Supabase real-time subscriptions
- Frontend real-time notifications

## Development Workflow

1. **Feature Development**: Create feature branches from main
2. **Local Testing**: Use Docker Compose for full stack testing
3. **Database Changes**: Create migration files in `supabase/migrations/`
4. **API Changes**: Update Swagger documentation
5. **AI Service Changes**: Test with example payloads in `ai-service/test_*.json`

## Important Notes

- The project includes legacy PHP components in `projeto_php/` - avoid modifying unless necessary
- WhatsApp session data persists in Docker volumes
- Offline mode utilities available for development without external dependencies
- Sentiment analysis requires valid OpenAI API key
- All new endpoints should include proper authentication middleware