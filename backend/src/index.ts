import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import RealtimeService from './services/realtimeService';
import WebSocketService from './services/websocketService';
import swaggerSpec from './swagger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize services
const realtimeService = RealtimeService.getInstance();
const websocketService = WebSocketService.getInstance();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API documentation (Swagger)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
  }
}));

// API json specification endpoint
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'API Server is running',
    documentation: '/api/docs',
    swagger_json: '/api/swagger.json',
    version: '1.0.0',
    realtime: true
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize WebSocket server
websocketService.initialize(server);

// Set up Supabase Realtime subscription events
// This connects Supabase realtime events to our WebSocket server
const setupRealtimeSubscriptionHandlers = () => {
  // Set up handlers for companies table
  const companiesChannel = realtimeService.getChannel('companies');
  companiesChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'companies' }, (payload) => {
    websocketService.handleDatabaseChange('companies', 'INSERT', payload.new);
  });
  companiesChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'companies' }, (payload) => {
    websocketService.handleDatabaseChange('companies', 'UPDATE', payload.new);
  });
  companiesChannel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'companies' }, (payload) => {
    websocketService.handleDatabaseChange('companies', 'DELETE', payload.old);
  });

  // Set up handlers for leads table
  const leadsChannel = realtimeService.getChannel('leads');
  leadsChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
    websocketService.handleDatabaseChange('leads', 'INSERT', payload.new);
  });
  leadsChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
    websocketService.handleDatabaseChange('leads', 'UPDATE', payload.new);
  });
  leadsChannel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, (payload) => {
    websocketService.handleDatabaseChange('leads', 'DELETE', payload.old);
  });

  // Set up handlers for contacts table
  const contactsChannel = realtimeService.getChannel('contacts');
  contactsChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, (payload) => {
    websocketService.handleDatabaseChange('contacts', 'INSERT', payload.new);
  });
  contactsChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts' }, (payload) => {
    websocketService.handleDatabaseChange('contacts', 'UPDATE', payload.new);
  });
  contactsChannel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'contacts' }, (payload) => {
    websocketService.handleDatabaseChange('contacts', 'DELETE', payload.old);
  });
};

// Set up subscription handlers
setupRealtimeSubscriptionHandlers();

// Start server and listen on all interfaces (0.0.0.0) for Docker compatibility
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`http://localhost:${port}/`);
  console.log('WebSocket server initialized');
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  realtimeService.unsubscribeAll();
  server.close(() => {
    console.log('Server shut down successfully');
    process.exit(0);
  });
});

export default app;