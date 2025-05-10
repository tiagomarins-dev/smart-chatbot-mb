import { Router } from 'express';
import authenticate from '../middleware/auth';
import {
  getLeadConversations,
  getConversationById,
  getLeadConversationStats,
  getLeadConversationTimeline,
  updateConversationAnalysis
} from '../controllers/whatsappConversationsController';

const router = Router();

// Apply authentication to all routes individually
router.get('/leads/:leadId/conversations', authenticate, getLeadConversations);
router.get('/leads/:leadId/conversations/stats', authenticate, getLeadConversationStats);
router.get('/leads/:leadId/conversations/timeline', authenticate, getLeadConversationTimeline);
router.get('/conversations/:id', authenticate, getConversationById);
router.patch('/conversations/:id/analysis', authenticate, updateConversationAnalysis);

export default router;