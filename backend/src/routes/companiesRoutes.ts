import { Router } from 'express';
import { 
  getCompanies, 
  getCompanyById, 
  createCompany, 
  updateCompany, 
  deactivateCompany 
} from '../controllers/companiesController';
import authenticate from '../middleware/auth';

/**
 * @swagger
 * tags:
 *   name: companies
 *   description: Gerenciamento de empresas
 */

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get companies (with optional filter by ID)
router.get('/', getCompanies);

// Get company by ID
router.get('/:id', getCompanyById);

// Create new company
router.post('/', createCompany);

// Update company
router.put('/:id', updateCompany);

// Deactivate company (soft delete)
router.delete('/:id', deactivateCompany);

export default router;