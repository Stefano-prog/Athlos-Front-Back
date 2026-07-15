import { Router } from 'express';
import {
  deletePlans,
  generatePlan,
  getPlan,
  getPlans,
  getRoutines,
  createManual,
} from '../controllers/plan.controller';

const router = Router();
router.get('/', getPlans);
router.delete('/', deletePlans);
router.get('/routines', getRoutines);
router.post('/manual', createManual);
router.get('/:id', getPlan);
router.post('/generate', generatePlan);

export default router;
