import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getStatus,
  getQRCode,
  getQRCodePlain,
  connect,
  disconnect,
  sendMessage,
  getMessages,
  getContactMessages,
  clearMessages,
  webhookHandler,
  getPhone,
  mockAuthenticate
} from '../controllers/whatsappController';
import cors from 'cors';

const router = Router();

// Enable CORS for all WhatsApp routes
router.use(cors({
  origin: '*', // Temporariamente permitir qualquer origem para debugging
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Public route for webhooks
router.post('/webhooks/whatsapp', webhookHandler);

// Routes (temporarily public for testing)
router.get('/status', getStatus);
router.get('/qrcode', getQRCode);
router.get('/qrcode/plain', getQRCodePlain);
router.post('/connect', connect);
router.post('/disconnect', disconnect);
router.post('/send', sendMessage);
router.get('/messages', getMessages);
router.get('/messages/:number', getContactMessages);
router.delete('/messages', clearMessages);
router.get('/phone', getPhone);

// Mock routes for testing
router.post('/mock/authenticate', mockAuthenticate);

export default router;