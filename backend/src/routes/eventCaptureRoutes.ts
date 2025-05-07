import { Router } from 'express';
import { captureEvent } from '../controllers/eventCaptureController';

const router = Router();

// Esta rota pode ser pública ou protegida, dependendo do seu caso de uso
router.post('/', captureEvent);

export default router;