import { Router } from 'express';
import { getUserProfile, updateTaxProfile, createUser, getUserByClerkId, updateUserRole, getPendingCelebrities } from '../controllers/user.controller';

const router = Router();

// Endpoints
router.get('/pending', getPendingCelebrities); // Admin Queue
router.post('/', createUser); // For testing setup
router.get('/:userId', getUserProfile);
router.get('/clerk/:clerkId', getUserByClerkId);
router.put('/clerk/:clerkId/role', updateUserRole); // DEV ONLY
router.put('/:userId/tax-profile', updateTaxProfile);
export default router;