/**
 * Rotas para mensagens automatizadas
 */

import express from 'express';
import * as automatedMessagesController from '../../controllers/automatedMessages';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// Aplicar middleware de autenticação
router.use(authMiddleware);

// Rotas para templates de mensagens automatizadas
router.post('/templates', automatedMessagesController.createAutomatedMessageTemplate);
router.get('/templates', automatedMessagesController.getAutomatedMessageTemplates);
router.get('/templates/:id', automatedMessagesController.getAutomatedMessageTemplate);
router.put('/templates/:id', automatedMessagesController.updateAutomatedMessageTemplate);
router.patch('/templates/:id/toggle', automatedMessagesController.toggleAutomatedMessageTemplate);
router.delete('/templates/:id', automatedMessagesController.deleteAutomatedMessageTemplate);

// Rota para processamento de eventos
router.post('/events', automatedMessagesController.processEvent);

// Rota para testar mensagem automatizada
router.post('/test', automatedMessagesController.testAutomatedMessage);

export default router;
EOF < /dev/null