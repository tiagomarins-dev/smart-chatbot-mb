import express from 'express';
import automatedMessagesController from '../controllers/automatedMessagesController';
import authenticate from '../middleware/auth';

const router = express.Router();

// Adicionar a autenticação em cada rota individualmente em vez de usar router.use
// Isso evita o erro "Router.use() requires a middleware function"

// Rotas para templates de mensagens
router.get('/projects/:projectId/templates', automatedMessagesController.getTemplates);
router.get('/templates/:id', automatedMessagesController.getTemplateById);
router.post('/templates', automatedMessagesController.createTemplate);
router.put('/templates/:id', automatedMessagesController.updateTemplate);
router.patch('/templates/:id/status', automatedMessagesController.toggleTemplateStatus);
router.delete('/templates/:id', automatedMessagesController.deleteTemplate);

// Rotas para eventos
router.get('/projects/:projectId/events', automatedMessagesController.getEventTriggers);
router.post('/events', automatedMessagesController.createEventTrigger);

// Rotas para histórico de mensagens
router.get('/leads/:leadId/messages', automatedMessagesController.getLeadAutomatedMessages);

export default router;