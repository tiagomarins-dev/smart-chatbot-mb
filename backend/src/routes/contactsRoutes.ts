import { Router } from 'express';
import { 
  getContacts, 
  getContactById, 
  getContactByPhone,
  createContact, 
  updateContact, 
  deleteContact 
} from '../controllers/contactsController';
import authenticate from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all contacts (with pagination and filters)
router.get('/', getContacts);

// Get contact by phone number
router.get('/phone', getContactByPhone);

// Get contact by ID
router.get('/:id', getContactById);

// Create new contact
router.post('/', createContact);

// Update contact
router.put('/:id', updateContact);

// Delete contact
router.delete('/:id', deleteContact);

export default router;