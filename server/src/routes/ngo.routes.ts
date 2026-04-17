import { Router } from 'express';
import { createNgo, getAllNgos } from '../controllers/ngo.controller';

const router = Router();

router.get('/', getAllNgos);     // Fetch for dropdowns
router.post('/', createNgo);     // Admin action

export default router;