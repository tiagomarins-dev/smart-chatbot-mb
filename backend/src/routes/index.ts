import { Router } from 'express';
import companiesRoutes from './companiesRoutes';
import contactsRoutes from './contactsRoutes';
import leadsRoutes from './leadsRoutes';
import projectsRoutes from './projectsRoutes';
import authRoutes from './authRoutes';
import apiKeysRoutes from './apiKeysRoutes';
import whatsappRoutes from './whatsappRoutes';
import leadEventsRoutes from './leadEventsRoutes';
import eventCaptureRoutes from './eventCaptureRoutes';
import whatsappConversationsRoutes from './whatsappConversationsRoutes';

const router = Router();

// API health check route
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Register API routes
router.use('/auth', authRoutes);
router.use('/companies', companiesRoutes);
router.use('/contacts', contactsRoutes);
router.use('/leads', leadsRoutes);
router.use('/lead-events', leadEventsRoutes);
router.use('/projects', projectsRoutes);
router.use('/api-keys', apiKeysRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/whatsapp-conversations', whatsappConversationsRoutes);
router.use('/events', eventCaptureRoutes);

export default router;