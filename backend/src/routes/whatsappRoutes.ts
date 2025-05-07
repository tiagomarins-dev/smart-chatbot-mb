import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getStatus,
  getQRCode,
  connect,
  disconnect,
  sendMessage,
  getMessages,
  getContactMessages,
  clearMessages,
  webhookHandler
} from '../controllers/whatsappController';

const router = Router();

// Public route for webhooks
router.post('/webhooks/whatsapp', webhookHandler);

// Routes (temporarily public for testing)
router.get('/status', getStatus);
router.get('/qrcode', getQRCode);
router.post('/connect', connect);
router.post('/disconnect', disconnect);
router.post('/send', sendMessage);
router.get('/messages', getMessages);
router.get('/messages/:number', getContactMessages);
router.delete('/messages', clearMessages);

export default router;