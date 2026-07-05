import { Router } from 'express';
import { getCatalog, redeemReward } from '../controllers/store.controller';

const router = Router();
router.get('/catalog', getCatalog);
router.post('/redeem', redeemReward);
export default router;
