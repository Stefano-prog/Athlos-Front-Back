import { Router } from 'express';
import {
  deletePlans,
  generatePlan,
  getPlan,
  getPlans,
  createManual,
} from '../controllers/plan.controller';

const router = Router();
router.get('/', getPlans);
router.delete('/', deletePlans);
router.post('/manual', createManual);
router.get('/:id', getPlan);
router.post('/generate', generatePlan);

export default router;
