import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deactivateProject 
} from '../controllers/projectsController';
import authenticate from '../middleware/auth';

/**
 * @swagger
 * tags:
 *   name: projects
 *   description: API para gerenciamento de projetos
 */

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all projects (with optional filters)
router.get('/', getProjects);

// Get project by ID
router.get('/:id', getProjectById);

// Create a new project
router.post('/', createProject);

// Update project
router.put('/:id', updateProject);

// Deactivate project (soft delete)
router.delete('/:id', deactivateProject);

export default router;