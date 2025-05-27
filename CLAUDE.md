# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart-ChatBox is a multi-service WhatsApp CRM system with AI-powered lead management and automated messaging capabilities. The project uses a microservices architecture with TypeScript/Node.js backend, Next.js frontend, Python/FastAPI AI service, and Supabase for authentication and data storage.

## Architecture

### Services and Ports
- **Backend API** (Node.js/Express): Port 9033
- **Frontend** (Next.js): Port 9034  
- **AI Service** (Python/FastAPI): Port 8050 (development) / Port 9035 (Docker)
- **WhatsApp API**: External service (runs separately, not part of this project)
- **Database**: Supabase PostgreSQL
- **Redis Cache**: Port 9036 (for AI service)

### Key Technologies
- **Backend**: TypeScript, Express, Supabase JS Client, WebSocket, Jest
- **Frontend**: Next.js 13, React 18, Bootstrap 5, React Bootstrap
- **AI Service**: FastAPI, OpenAI GPT-3.5/4, Redis caching
- **Infrastructure**: Docker Compose, Supabase
- **Authentication**: JWT (backend custom) + Supabase Auth

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

# Run specific test
npm test -- --testNamePattern="test name"

# Lint code
npm run lint
```

### Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Run development server (port 9034)
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

# Run with Docker (recommended for integration)
docker compose up -d ai-service

# Run tests
pytest

# Test specific endpoint
./test-api.sh
```

### Docker Development
```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up -d backend frontend ai-service

# Rebuild and restart backend
./scripts/service-utils/rebuild-backend.sh

# View logs
docker compose logs -f [service-name]

# Restart specific service
docker compose restart [service-name]

# Stop all services
docker compose down
```

### Database Management
```bash
# Run all migrations
cd supabase && ./run-migrations.sh

# Apply specific migration
psql $DATABASE_URL -f migrations/[migration-file].sql

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM schema_migrations;"
```

## Critical Configuration

### Environment Variables

#### Backend (.env)
```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_JWT_SECRET=[jwt-secret]
JWT_SECRET=[custom-jwt-secret]
AI_SERVICE_URL=http://localhost:9035  # or http://ai-service:8050 in Docker
AI_SERVICE_KEY=[optional-api-key]
SUPABASE_OFFLINE_MODE=false  # Set to true for mock data
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:9033/api
```

#### AI Service (.env)
```
OPENAI_API_KEY=[your-openai-key]
API_KEY=[service-api-key]
REDIS_URL=redis://localhost:9036
```

### Authentication Flow
1. **Login**: User credentials → Supabase Auth → JWT token (custom) + Supabase session
2. **API Requests**: Bearer token (custom JWT) validated by middleware
3. **Supabase Queries**: Service role key for admin operations

## High-level Architecture

### Request Flow
1. **Frontend** → API request with JWT token
2. **Backend** validates token → processes request
3. **Backend** → Supabase for data operations
4. **Backend** → AI Service for analysis (when needed)
5. **AI Service** → OpenAI API for processing
6. **Response** flows back through the chain

### Lead Analysis Pipeline
1. **Event Trigger**: New lead event or manual analysis request
2. **Data Collection**: Fetch lead data, WhatsApp conversations, events
3. **AI Processing**: Send to AI service for sentiment analysis
4. **Score Calculation**: 0-100 lead score based on engagement
5. **Status Update**: Update lead with sentiment status and score
6. **Logging**: Save analysis results to `lead_ai_analysis_logs`

### WhatsApp Integration
1. **External API**: WhatsApp runs as a separate service (not in Docker)
2. **Backend Integration**: Communicates via HTTP requests to WhatsApp API
3. **Message Flow**: WhatsApp API → Backend webhook → Database storage
4. **Storage**: Messages saved to `whatsapp_conversations` table
5. **Smart Chatbot**: Backend analyzes messages and sends responses via WhatsApp API
6. **Lead Association**: Messages linked to leads via phone number matching

## Key Database Operations

### Using executeQuery (Supabase wrapper)
```typescript
// Query with filters
const results = await executeQuery<Type>({
  table: 'table_name',
  select: 'column1, column2',
  filters: [
    { column: 'id', operator: 'eq', value: id }
  ],
  limit: 10,
  offset: 0
});

// Raw SQL query
const results = await executeQuery(
  'SELECT * FROM table WHERE column = $1',
  [value]
);
```

### Common Patterns
```typescript
// Insert data
await insertData('table_name', { column: value });

// Update data
await updateData<Type>(
  'table_name',
  [{ column: 'id', operator: 'eq', value: id }],
  { column: newValue }
);
```

## Testing Approach

### Backend Testing
```bash
# Run all tests
cd backend && npm test

# Test with coverage
npm test -- --coverage

# Test specific controller
npm test -- controllers/leadsController.test.ts
```

### Integration Testing
```bash
# Test authentication flow
curl -X POST http://localhost:9033/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test lead analysis
curl -X POST http://localhost:9033/api/leads/{id}/analyze \
  -H "Authorization: Bearer {token}"

# Test AI service
curl -X POST http://localhost:9035/v1/analyze-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {api-key}" \
  -d @test_lead.json
```

## Key Features Implementation

### AI-Powered Lead Analysis
- **Endpoint**: `POST /api/leads/:id/analyze`
- **Automatic Triggers**: On new lead events via `leadEventsController`
- **Sentiment Categories**: interessado, sem interesse, compra futura, achou caro, quer desconto, parcelamento, indeterminado
- **Lead Scoring**: 0-100 based on engagement and intent
- **High-Intent Events**: abandoned_cart (75+), clicked_payment_link (70+)

### WhatsApp Smart Chatbot
- **Auto-responds** to common project questions (price, location, delivery date)
- **Project Detection**: Matches project names in messages
- **Response Categories**: Price, delivery, location, size/layout, general info
- **Conversation Tracking**: All messages stored with timestamps and analysis

### Automated Messaging System
- **Event-based Triggers**: Lead creation, status change, custom events
- **Template Management**: Create and manage message templates
- **Personalization**: Dynamic content based on lead data
- **Scheduling**: Time-based message delivery

### Real-time Features
- **WebSocket Server**: For live updates (port 9033)
- **Supabase Realtime**: Database change notifications
- **Frontend Updates**: React components with real-time data

## Testing Approach

### Backend Testing
```bash
# Run all tests
cd backend && npm test

# Test with coverage
npm test -- --coverage

# Test specific controller
npm test -- controllers/leadsController.test.ts

# Run specific test by name pattern
npm test -- --testNamePattern="should create a new lead"
```

### Frontend Testing
```bash
# No test script configured - use manual testing
# Run development server and test features
cd frontend && npm run dev
```

### AI Service Testing
```bash
# Run all tests
cd ai-service && pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Test specific file
pytest app/tests/test_api.py

# Test specific function
pytest -k "test_analyze_lead"
```

### Integration Testing
```bash
# Test authentication flow
curl -X POST http://localhost:9033/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test lead analysis
curl -X POST http://localhost:9033/api/leads/{id}/analyze \
  -H "Authorization: Bearer {token}"

# Test AI service
curl -X POST http://localhost:9035/v1/analyze-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {api-key}" \
  -d @test_lead.json
```

## Key Features Implementation

### AI-Powered Lead Analysis
- **Endpoint**: `POST /api/leads/:id/analyze`
- **Automatic Triggers**: On new lead events via `leadEventsController`
- **Sentiment Categories**: interessado, sem interesse, compra futura, achou caro, quer desconto, parcelamento, indeterminado
- **Lead Scoring**: 0-100 based on engagement and intent
- **High-Intent Events**: abandoned_cart (75+), clicked_payment_link (70+)

### WhatsApp Smart Chatbot
- **Auto-responds** to common project questions (price, location, delivery date)
- **Project Detection**: Matches project names in messages
- **Response Categories**: Price, delivery, location, size/layout, general info
- **Conversation Tracking**: All messages stored with timestamps and analysis

### Automated Messaging System
- **Event-based Triggers**: Lead creation, status change, custom events
- **Template Management**: Create and manage message templates
- **Personalization**: Dynamic content based on lead data
- **Scheduling**: Time-based message delivery

### Real-time Features
- **WebSocket Server**: For live updates (port 9033)
- **Supabase Realtime**: Database change notifications
- **Frontend Updates**: React components with real-time data

## Development Workflow

1. **Feature Development**: 
   - Create feature branch from main
   - Update tests for new functionality
   - Run linting before commits (backend only: `npm run lint`)

2. **Database Changes**:
   - Create migration file in `supabase/migrations/`
   - Test migration locally first
   - Update TypeScript interfaces

3. **API Changes**:
   - Update controller with JSDoc/Swagger comments
   - Add/update tests
   - Update route definitions

4. **AI Service Changes**:
   - Test with example payloads
   - Update prompt engineering in adapters
   - Monitor token usage

## Important Notes

- **Authentication**: Backend uses custom JWT, not Supabase JWT directly
- **AI Service URL**: Use `http://localhost:9035` for local development
- **Database Queries**: Prefer `executeQuery` over direct Supabase client
- **Error Handling**: Always use try-catch with proper error responses
- **Offline Mode**: Set `SUPABASE_OFFLINE_MODE=true` for mock data
- **Lead Analysis Logs**: All AI analyses are logged in `lead_ai_analysis_logs`
- **WhatsApp API**: External service - do NOT include in Docker or install dependencies
- **Frontend Build**: .next directory should not be committed to Git
- **Frontend Linting**: No ESLint configured - ensure code quality manually
- **Test Setup**: Backend uses Jest with ts-jest, mocks in `src/__mocks__`
- **Jest Config**: Tests run from `src/` directory, coverage excludes mocks and index files
- **Important**: See IMPORTANT_NOTES.md for critical architecture decisions