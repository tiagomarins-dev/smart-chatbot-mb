import { Router } from 'express';
import { 
  getLeads, 
  getLeadById, 
  captureLead, 
  updateLeadStatus,
  updateLead,
  getLeadStats,
  getUtmCounts,
  searchLeads,
  getLeadEventsList
} from '../controllers/leadsController';
import authenticate from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all leads (with optional filters)
router.get('/', getLeads);

// Search leads with advanced filtering
router.get('/search', searchLeads);

// Get UTM parameter summary (counts)
router.get('/utm-counts', getUtmCounts);

// Get lead statistics
router.get('/stats', getLeadStats);

// Get lead by ID
router.get('/:id', getLeadById);

// Capture a new lead
router.post('/', captureLead);

// Update lead (full update)
router.put('/:id', updateLead);

// Update lead status
router.put('/:id/status', updateLeadStatus);

// Get lead events list
router.get('/:id/events-list', getLeadEventsList);

export default router;