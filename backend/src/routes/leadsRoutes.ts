import { Router } from 'express';
import { 
  getLeads, 
  getLeadById, 
  captureLead, 
  updateLeadStatus,
  getLeadStats 
} from '../controllers/leadsController';
import authenticate from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all leads (with optional filters)
router.get('/', getLeads);

// Get lead statistics
router.get('/stats', getLeadStats);

// Get lead by ID
router.get('/:id', getLeadById);

// Capture a new lead
router.post('/', captureLead);

// Update lead status
router.put('/:id/status', updateLeadStatus);

export default router;