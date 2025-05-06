import { Router } from 'express';
import {
  getApiKeys,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  deleteApiKey
} from '../controllers/apiKeysController';
import authenticate from '../middleware/auth';

/**
 * @swagger
 * tags:
 *   name: api-keys
 *   description: Gerenciamento de chaves de API
 */

const router = Router();

// All API key routes require authentication
router.use(authenticate);

// API key routes
router.get('/', getApiKeys);
router.post('/', createApiKey);
router.put('/:id', updateApiKey);
router.put('/:id/revoke', revokeApiKey);
router.delete('/:id', deleteApiKey);

export default router;