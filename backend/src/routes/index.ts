import { Router } from 'express';
import companiesRoutes from './companiesRoutes';
import contactsRoutes from './contactsRoutes';
import leadsRoutes from './leadsRoutes';
import projectsRoutes from './projectsRoutes';
import authRoutes from './authRoutes';
import apiKeysRoutes from './apiKeysRoutes';

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
router.use('/projects', projectsRoutes);
router.use('/api-keys', apiKeysRoutes);

export default router;