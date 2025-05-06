# CRM Backend

A TypeScript Express API for managing companies, projects, and leads, with Supabase integration.

## Setup

### Prerequisites

- Node.js 18+
- Supabase account and project

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Update the `.env` file with your Supabase credentials and other configuration.

## Development

Start the development server:

```bash
npm run dev
```

The server will run at http://localhost:3000 by default (or the port specified in your `.env` file).

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Verify authentication token
- `GET /api/auth/user` - Get authenticated user info

### Companies

- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create a new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Deactivate company (soft delete)

### Projects

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Deactivate project (soft delete)

### Leads

- `GET /api/leads` - List all leads
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Capture a new lead
- `PUT /api/leads/:id/status` - Update lead status
- `GET /api/leads/stats` - Get lead statistics

## Building for Production

Build the TypeScript code:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Testing

Run the test suite:

```bash
npm test
```

## Directory Structure

```
/backend
├── src/
│   ├── controllers/    - Request handlers
│   ├── interfaces/     - TypeScript interfaces
│   ├── middleware/     - Express middleware
│   ├── routes/         - API routes
│   ├── services/       - Business logic and data services
│   ├── utils/          - Utility functions
│   └── index.ts        - Application entry point
├── dist/               - Compiled JavaScript (built)
├── .env                - Environment variables
└── tsconfig.json       - TypeScript configuration
```