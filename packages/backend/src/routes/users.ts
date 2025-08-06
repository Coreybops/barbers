import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), (req, res) => {
  res.json({ message: 'Get all users - TODO: Implement' });
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, (req, res) => {
  res.json({ message: `Get user ${req.params.id} - TODO: Implement` });
});

export default router;