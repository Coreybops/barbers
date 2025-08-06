import { Router } from 'express';
import { PrismaClient, UserRole, AppointmentStatus, PaymentStatus } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const getAppointmentsSchema = z.object({
  query: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    barberId: z.string().optional(),
    barberIds: z.string().optional(),
    status: z.string().optional(),
    serviceId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional()
  })
});

const createAppointmentSchema = z.object({
  body: z.object({
    customerId: z.string(),
    barberId: z.string(),
    serviceId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    notes: z.string().optional(),
    recurring: z.object({
      type: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().min(1).max(30),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      endDate: z.string().optional(),
      occurrences: z.number().optional()
    }).optional()
  })
});

const updateAppointmentSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    notes: z.string().optional(),
    barberId: z.string().optional(),
    serviceId: z.string().optional()
  })
});

const moveAppointmentSchema = z.object({
  body: z.object({
    startTime: z.string(),
    endTime: z.string(),
    barberId: z.string().optional()
  })
});

/**
 * @route   GET /api/appointments
 * @desc    Get appointments with filtering
 * @access  Private
 */
router.get('/', authenticate, validateRequest(getAppointmentsSchema), async (req, res) => {
  try {
    const { start, end, barberId, barberIds, status, serviceId, page = '1', limit = '50' } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Build where clause based on user role and filters
    const where: any = {};

    // Role-based filtering
    if (userRole === UserRole.CUSTOMER) {
      where.customerId = userId;
    } else if (userRole === UserRole.BARBER) {
      const barber = await prisma.barber.findUnique({
        where: { userId }
      });
      if (barber) {
        where.barberId = barber.id;
      }
    } else if (userRole === UserRole.SHOP_OWNER) {
      // Get appointments for barbers in shops owned by this user
      const ownedShops = await prisma.barbershop.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const shopIds = ownedShops.map(shop => shop.id);
      where.barbershopId = { in: shopIds };
    }

    // Date range filtering
    if (start || end) {
      where.date = {};
      if (start) where.date.gte = new Date(start);
      if (end) where.date.lte = new Date(end);
    }

    // Barber filtering
    if (barberId) {
      where.barberId = barberId;
    } else if (barberIds) {
      where.barberId = { in: barberIds.split(',') };
    }

    // Status filtering
    if (status) {
      where.status = { in: status.split(',') };
    }

    // Service filtering
    if (serviceId) {
      where.serviceId = serviceId;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: true,
          barber: {
            include: {
              user: true
            }
          },
          service: true,
          barbershop: true,
          payment: true
        },
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limitNum
      }),
      prisma.appointment.count({ where })
    ]);

    res.json({
      appointments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * @route   POST /api/appointments
 * @desc    Create appointment
 * @access  Private
 */
router.post('/', authenticate, validateRequest(createAppointmentSchema), async (req, res) => {
  try {
    const { customerId, barberId, serviceId, date, startTime, endTime, notes, recurring } = req.body;

    // Get service details for pricing
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check for conflicts
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        barberId,
        date: new Date(date),
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } }
            ]
          }
        ],
        status: {
          not: AppointmentStatus.CANCELLED
        }
      }
    });

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    // Get barbershop for the appointment
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: { barbershop: true }
    });

    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        barberId,
        serviceId,
        barbershopId: barber.barbershopId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalPrice: service.price,
        notes,
        status: AppointmentStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      },
      include: {
        customer: true,
        barber: {
          include: {
            user: true
          }
        },
        service: true,
        barbershop: true
      }
    });

    // TODO: Handle recurring appointments if specified

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 * @access  Private
 */
router.put('/:id', authenticate, validateRequest(updateAppointmentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if appointment exists and user has permission
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: {
          include: { user: true }
        },
        barbershop: true
      }
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Permission check
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    if (userRole === UserRole.CUSTOMER && existingAppointment.customerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    } else if (userRole === UserRole.BARBER && existingAppointment.barber.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    } else if (userRole === UserRole.SHOP_OWNER && existingAppointment.barbershop.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (updates.date) updateData.date = new Date(updates.date);
    if (updates.startTime) updateData.startTime = new Date(updates.startTime);
    if (updates.endTime) updateData.endTime = new Date(updates.endTime);
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.barberId) updateData.barberId = updates.barberId;
    if (updates.serviceId) {
      updateData.serviceId = updates.serviceId;
      // Update price if service changed
      const service = await prisma.service.findUnique({
        where: { id: updates.serviceId }
      });
      if (service) {
        updateData.totalPrice = service.price;
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        barber: {
          include: {
            user: true
          }
        },
        service: true,
        barbershop: true
      }
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

/**
 * @route   PATCH /api/appointments/:id/move
 * @desc    Move appointment (drag and drop)
 * @access  Private
 */
router.patch('/:id/move', authenticate, validateRequest(moveAppointmentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, barberId } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: {
          include: { user: true }
        },
        barbershop: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Permission check
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    if (userRole === UserRole.CUSTOMER && appointment.customerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    } else if (userRole === UserRole.BARBER && appointment.barber.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    } else if (userRole === UserRole.SHOP_OWNER && appointment.barbershop.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check for conflicts at new time
    const targetBarberId = barberId || appointment.barberId;
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        id: { not: id },
        barberId: targetBarberId,
        date: newStartTime, // Assuming same day move
        OR: [
          {
            AND: [
              { startTime: { lte: newStartTime } },
              { endTime: { gt: newStartTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: newEndTime } },
              { endTime: { gte: newEndTime } }
            ]
          }
        ],
        status: {
          not: AppointmentStatus.CANCELLED
        }
      }
    });

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
        date: newStartTime,
        ...(barberId && { barberId })
      },
      include: {
        customer: true,
        barber: {
          include: {
            user: true
          }
        },
        service: true,
        barbershop: true
      }
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error moving appointment:', error);
    res.status(500).json({ error: 'Failed to move appointment' });
  }
});

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel appointment
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: {
          include: { user: true }
        },
        barbershop: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Permission check
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    if (userRole === UserRole.CUSTOMER && appointment.customerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    } else if (userRole === UserRole.BARBER && appointment.barber.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    } else if (userRole === UserRole.SHOP_OWNER && appointment.barbershop.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark as cancelled instead of deleting
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED
      },
      include: {
        customer: true,
        barber: {
          include: {
            user: true
          }
        },
        service: true,
        barbershop: true
      }
    });

    res.json({ message: 'Appointment cancelled successfully', appointment: cancelledAppointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

/**
 * @route   GET /api/appointments/:id/conflicts
 * @desc    Check for appointment conflicts
 * @access  Private
 */
router.get('/conflicts', authenticate, async (req, res) => {
  try {
    const { barberId, start, end, exclude } = req.query;

    if (!barberId || !start || !end) {
      return res.status(400).json({ error: 'barberId, start, and end are required' });
    }

    const where: any = {
      barberId: barberId as string,
      OR: [
        {
          AND: [
            { startTime: { lte: new Date(start as string) } },
            { endTime: { gt: new Date(start as string) } }
          ]
        },
        {
          AND: [
            { startTime: { lt: new Date(end as string) } },
            { endTime: { gte: new Date(end as string) } }
          ]
        }
      ],
      status: {
        not: AppointmentStatus.CANCELLED
      }
    };

    if (exclude) {
      where.id = { not: exclude as string };
    }

    const conflicts = await prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        service: true
      }
    });

    res.json({
      hasConflict: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: 'Failed to check conflicts' });
  }
});

export default router;