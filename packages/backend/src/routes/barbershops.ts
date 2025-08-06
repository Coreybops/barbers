import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/barbershops
 * @desc    Get all barbershops
 * @access  Public
 */
router.get('/', optionalAuth, (req, res) => {
  res.json({ message: 'Get all barbershops - TODO: Implement' });
});

/**
 * @route   GET /api/barbershops/:id
 * @desc    Get barbershop by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, (req, res) => {
  res.json({ message: `Get barbershop ${req.params.id} - TODO: Implement` });
});

/**
 * @route   POST /api/barbershops
 * @desc    Create a barbershop
 * @access  Private/Shop Owner
 */
router.post('/', authenticate, authorize(UserRole.SHOP_OWNER, UserRole.ADMIN), (req, res) => {
  res.json({ message: 'Create barbershop - TODO: Implement' });
});

/**
 * @route   PUT /api/barbershops/:id
 * @desc    Update barbershop
 * @access  Private/Shop Owner
 */
router.put('/:id', authenticate, authorize(UserRole.SHOP_OWNER, UserRole.ADMIN), (req, res) => {
  res.json({ message: `Update barbershop ${req.params.id} - TODO: Implement` });
});

export default router;