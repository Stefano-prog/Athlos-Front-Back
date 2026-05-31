import { Router } from 'express';
import chatController from '../controllers/chat.controller';

const router = Router();

router.get('/history', chatController.getHistory);
router.post('/message', chatController.sendMessage);
router.delete('/history', chatController.clearHistory);

export default router;