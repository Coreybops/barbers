import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const processWaitlistSchema = z.object({
  body: z.object({
    action: z.enum(['notify', 'auto_book', 'expire']),
    entryIds: z.array(z.string()).optional(),
    appointmentId: z.string().optional()
  })
});

/**
 * @route   GET /api/waitlist
 * @desc    Get waitlist entries (admin/shop owner)
 * @access  Private
 */
router.get('/', authenticate, authorize(['ADMIN', 'SHOP_OWNER']), async (req, res) => {
  try {
    const { barbershopId, status, expired, page = '1', limit = '20' } = req.query;
    const userId = req.user!.id;

    const where: any = {};

    // Filter by barbershop if shop owner
    if (req.user!.role === 'SHOP_OWNER') {
      const ownedShops = await prisma.barbershop.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const shopIds = ownedShops.map(shop => shop.id);
      where.barbershopId = { in: shopIds };
    } else if (barbershopId) {
      where.barbershopId = barbershopId as string;
    }

    if (status) {
      where.status = status as string;
    }

    // Handle expired entries
    if (expired === 'true') {
      where.expiresAt = { lt: new Date() };
    } else if (expired === 'false') {
      where.expiresAt = { gte: new Date() };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
          barber: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          },
          service: true,
          barbershop: true,
          appointment: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.waitlistEntry.count({ where })
    ]);

    res.json({
      entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

/**
 * @route   POST /api/waitlist/process
 * @desc    Process waitlist entries when slots become available
 * @access  Private
 */
router.post('/process', authenticate, authorize(['ADMIN', 'SHOP_OWNER', 'BARBER']), 
  validateRequest(processWaitlistSchema), async (req, res) => {
  try {
    const { action, entryIds, appointmentId } = req.body;

    if (action === 'notify' && entryIds) {
      // Notify waitlist entries about available slot
      const entries = await prisma.waitlistEntry.findMany({
        where: {
          id: { in: entryIds },
          status: 'ACTIVE',
          expiresAt: { gte: new Date() }
        },
        include: {
          barbershop: true,
          service: true,
          barber: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      });

      // Update status to NOTIFIED
      await prisma.waitlistEntry.updateMany({
        where: { id: { in: entryIds } },
        data: {
          status: 'NOTIFIED',
          notifiedAt: new Date()
        }
      });

      // TODO: Send notifications via email/SMS
      
      res.json({
        message: `Notified ${entries.length} waitlist entries`,
        entries
      });

    } else if (action === 'auto_book' && appointmentId) {
      // Automatically book the next person on waitlist
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Find suitable waitlist entries
      const suitableEntries = await prisma.waitlistEntry.findMany({
        where: {
          barbershopId: appointment.barbershopId,
          serviceId: appointment.serviceId,
          barberId: appointment.barberId,
          status: 'ACTIVE',
          expiresAt: { gte: new Date() },
          preferredDate: { lte: appointment.date },
          OR: [
            {
              AND: [
                { preferredStartTime: { lte: appointment.startTime } },
                { preferredEndTime: { gte: appointment.endTime } }
              ]
            },
            { flexibleTiming: true }
          ]
        },
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: {
          user: true
        }
      });

      if (suitableEntries.length === 0) {
        return res.json({ message: 'No suitable waitlist entries found' });
      }

      const entry = suitableEntries[0];

      // Update appointment with waitlist customer
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          customerId: entry.userId,
          isGuestBooking: !entry.userId,
          guestName: entry.name,
          guestEmail: entry.email,
          guestPhone: entry.phone
        }
      });

      // Update waitlist entry
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          status: 'BOOKED',
          appointmentId: appointmentId
        }
      });

      res.json({
        message: 'Waitlist entry successfully booked',
        appointment: updatedAppointment,
        waitlistEntry: entry
      });

    } else if (action === 'expire') {
      // Expire old waitlist entries
      const expiredEntries = await prisma.waitlistEntry.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: new Date() }
        },
        data: { status: 'EXPIRED' }
      });

      res.json({
        message: `Expired ${expiredEntries.count} waitlist entries`
      });

    } else {
      res.status(400).json({ error: 'Invalid action or missing parameters' });
    }

  } catch (error) {
    console.error('Error processing waitlist:', error);
    res.status(500).json({ error: 'Failed to process waitlist' });
  }
});

/**
 * @route   DELETE /api/waitlist/:id
 * @desc    Remove entry from waitlist
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const entry = await prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        barbershop: true
      }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    // Permission check
    if (req.user!.role === 'CUSTOMER' && entry.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    } else if (req.user!.role === 'SHOP_OWNER' && entry.barbershop.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.waitlistEntry.delete({
      where: { id }
    });

    res.json({ message: 'Removed from waitlist successfully' });

  } catch (error) {
    console.error('Error removing from waitlist:', error);
    res.status(500).json({ error: 'Failed to remove from waitlist' });
  }
});

/**
 * @route   GET /api/waitlist/opportunities
 * @desc    Check for waitlist opportunities when appointments are cancelled
 * @access  Private
 */
router.get('/opportunities', authenticate, async (req, res) => {
  try {
    const { appointmentId } = req.query;

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId as string }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Find waitlist entries that could fill this slot
    const opportunities = await prisma.waitlistEntry.findMany({
      where: {
        barbershopId: appointment.barbershopId,
        serviceId: appointment.serviceId,
        status: 'ACTIVE',
        expiresAt: { gte: new Date() },
        OR: [
          {
            // Exact match
            barberId: appointment.barberId,
            preferredDate: { lte: appointment.date },
            preferredStartTime: { lte: appointment.startTime },
            preferredEndTime: { gte: appointment.endTime }
          },
          {
            // Flexible timing
            flexibleTiming: true,
            preferredDate: { lte: appointment.date }
          }
        ]
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        },
        barber: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        service: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      opportunities,
      appointment: {
        id: appointment.id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime
      }
    });

  } catch (error) {
    console.error('Error checking waitlist opportunities:', error);
    res.status(500).json({ error: 'Failed to check opportunities' });
  }
});

export default router;