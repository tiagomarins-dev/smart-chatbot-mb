import { Router } from 'express';
import { 
  getLeadEventsList,
  getLeadEventsSummaryController,
  createLeadEventController
} from '../controllers/leadEventsController';
import authenticate from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Obter todos os eventos de um lead (com filtros opcionais)
router.get('/:id/events', getLeadEventsList);

// Obter um resumo de eventos por tipo e origem
router.get('/:id/events/summary', getLeadEventsSummaryController);

// Criar um novo evento para um lead
router.post('/:id/events', createLeadEventController);

export default router;