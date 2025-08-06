import { Router } from 'express';
import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const getEventsSchema = z.object({
  query: z.object({
    start: z.string(),
    end: z.string(),
    barberId: z.string().optional(),
    barberIds: z.string().optional(),
    status: z.string().optional(),
    serviceId: z.string().optional()
  })
});

const createTimeBlockSchema = z.object({
  body: z.object({
    title: z.string(),
    type: z.enum(['break', 'lunch', 'blocked', 'holiday']),
    start: z.string(),
    end: z.string(),
    barberId: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurringPattern: z.object({
      type: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().min(1).max(30),
      endDate: z.string().optional(),
      occurrences: z.number().optional()
    }).optional(),
    color: z.string(),
    notes: z.string().optional()
  })
});

const updateTimeBlockSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    type: z.enum(['break', 'lunch', 'blocked', 'holiday']).optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    barberId: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurringPattern: z.object({
      type: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().min(1).max(30),
      endDate: z.string().optional(),
      occurrences: z.number().optional()
    }).optional(),
    color: z.string().optional(),
    notes: z.string().optional()
  })
});

const exportCalendarSchema = z.object({
  query: z.object({
    format: z.enum(['ical', 'google', 'outlook']),
    start: z.string(),
    end: z.string(),
    includeCustomers: z.string().optional(),
    includeNotes: z.string().optional(),
    barberId: z.string().optional()
  })
});

/**
 * @route   GET /api/calendar/events
 * @desc    Get calendar events (appointments + time blocks)
 * @access  Private
 */
router.get('/events', authenticate, validateRequest(getEventsSchema), async (req, res) => {
  try {
    const { start, end, barberId, barberIds, status, serviceId } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Build appointment query
    const appointmentWhere: any = {};

    // Role-based filtering for appointments
    if (userRole === UserRole.CUSTOMER) {
      appointmentWhere.customerId = userId;
    } else if (userRole === UserRole.BARBER) {
      const barber = await prisma.barber.findUnique({
        where: { userId }
      });
      if (barber) {
        appointmentWhere.barberId = barber.id;
      }
    } else if (userRole === UserRole.SHOP_OWNER) {
      const ownedShops = await prisma.barbershop.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const shopIds = ownedShops.map(shop => shop.id);
      appointmentWhere.barbershopId = { in: shopIds };
    }

    // Date range filtering for appointments
    appointmentWhere.startTime = {
      gte: new Date(start as string),
      lte: new Date(end as string)
    };

    // Additional filters for appointments
    if (barberId) {
      appointmentWhere.barberId = barberId;
    } else if (barberIds) {
      appointmentWhere.barberId = { in: (barberIds as string).split(',') };
    }

    if (status) {
      appointmentWhere.status = { in: (status as string).split(',') };
    }

    if (serviceId) {
      appointmentWhere.serviceId = serviceId;
    }

    // Fetch appointments
    const appointments = await prisma.appointment.findMany({
      where: appointmentWhere,
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

    // Build time block query - this would require a separate TimeBlock model
    // For now, we'll simulate time blocks as a placeholder
    const timeBlocks: any[] = [];

    // Convert appointments to events
    const appointmentEvents = appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.service.name} - ${appointment.customer.firstName} ${appointment.customer.lastName}`,
      start: appointment.startTime,
      end: appointment.endTime,
      type: 'appointment',
      status: appointment.status,
      color: getStatusColor(appointment.status),
      appointment,
      barber: appointment.barber
    }));

    // Convert time blocks to events (placeholder)
    const timeBlockEvents = timeBlocks.map(block => ({
      id: block.id,
      title: block.title,
      start: block.start,
      end: block.end,
      type: block.type,
      status: 'CONFIRMED',
      color: block.color,
      barberId: block.barberId
    }));

    const allEvents = [...appointmentEvents, ...timeBlockEvents];

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

/**
 * @route   GET /api/calendar/time-blocks
 * @desc    Get time blocks for date range
 * @access  Private
 */
router.get('/time-blocks', authenticate, async (req, res) => {
  try {
    const { start, end, barberId } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    // For now, return empty array as we don't have TimeBlock model yet
    // This would be implemented with a proper TimeBlock model
    const timeBlocks: any[] = [];

    res.json(timeBlocks);
  } catch (error) {
    console.error('Error fetching time blocks:', error);
    res.status(500).json({ error: 'Failed to fetch time blocks' });
  }
});

/**
 * @route   POST /api/calendar/time-blocks
 * @desc    Create time block
 * @access  Private (Barber/Shop Owner)
 */
router.post('/time-blocks', authenticate, validateRequest(createTimeBlockSchema), async (req, res) => {
  try {
    const { title, type, start, end, barberId, isRecurring, recurringPattern, color, notes } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Permission check
    if (userRole === UserRole.CUSTOMER) {
      return res.status(403).json({ error: 'Not authorized to create time blocks' });
    }

    // For now, return a mock time block as we don't have the model
    const timeBlock = {
      id: `tb_${Date.now()}`,
      title,
      type,
      start: new Date(start),
      end: new Date(end),
      barberId,
      isRecurring,
      recurringPattern,
      color,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(timeBlock);
  } catch (error) {
    console.error('Error creating time block:', error);
    res.status(500).json({ error: 'Failed to create time block' });
  }
});

/**
 * @route   PUT /api/calendar/time-blocks/:id
 * @desc    Update time block
 * @access  Private (Barber/Shop Owner)
 */
router.put('/time-blocks/:id', authenticate, validateRequest(updateTimeBlockSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Permission check
    if (userRole === UserRole.CUSTOMER) {
      return res.status(403).json({ error: 'Not authorized to update time blocks' });
    }

    // For now, return a mock updated time block
    const timeBlock = {
      id,
      ...updates,
      updatedAt: new Date()
    };

    res.json(timeBlock);
  } catch (error) {
    console.error('Error updating time block:', error);
    res.status(500).json({ error: 'Failed to update time block' });
  }
});

/**
 * @route   DELETE /api/calendar/time-blocks/:id
 * @desc    Delete time block
 * @access  Private (Barber/Shop Owner)
 */
router.delete('/time-blocks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Permission check
    if (userRole === UserRole.CUSTOMER) {
      return res.status(403).json({ error: 'Not authorized to delete time blocks' });
    }

    // For now, just return success
    res.json({ message: 'Time block deleted successfully' });
  } catch (error) {
    console.error('Error deleting time block:', error);
    res.status(500).json({ error: 'Failed to delete time block' });
  }
});

/**
 * @route   GET /api/calendar/stats
 * @desc    Get calendar statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { start, end, barberId } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    // Build query based on user role and filters
    const where: any = {
      startTime: {
        gte: new Date(start as string),
        lte: new Date(end as string)
      }
    };

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
      const ownedShops = await prisma.barbershop.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const shopIds = ownedShops.map(shop => shop.id);
      where.barbershopId = { in: shopIds };
    }

    if (barberId) {
      where.barberId = barberId;
    }

    const [appointments, totalAppointments] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          service: true
        }
      }),
      prisma.appointment.count({ where })
    ]);

    const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const cancelledAppointments = appointments.filter(a => a.status === AppointmentStatus.CANCELLED);
    
    const revenue = completedAppointments.reduce((sum, appointment) => sum + appointment.totalPrice, 0);
    
    const totalDuration = appointments.reduce((sum, appointment) => {
      const duration = appointment.service.duration;
      return sum + duration;
    }, 0);

    const averageAppointmentDuration = appointments.length > 0 
      ? totalDuration / appointments.length 
      : 0;

    // Calculate utilization rate (simplified)
    const dateRange = new Date(end as string).getTime() - new Date(start as string).getTime();
    const totalPossibleMinutes = dateRange / (1000 * 60); // Convert to minutes
    const utilizationRate = totalPossibleMinutes > 0 
      ? (totalDuration / totalPossibleMinutes) * 100 
      : 0;

    const stats = {
      totalAppointments,
      completedAppointments: completedAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      revenue,
      utilizationRate: Math.min(utilizationRate, 100), // Cap at 100%
      averageAppointmentDuration
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ error: 'Failed to fetch calendar stats' });
  }
});

/**
 * @route   GET /api/calendar/export
 * @desc    Export calendar data
 * @access  Private
 */
router.get('/export', authenticate, validateRequest(exportCalendarSchema), async (req, res) => {
  try {
    const { format, start, end, includeCustomers, includeNotes, barberId } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Build query
    const where: any = {
      startTime: {
        gte: new Date(start as string),
        lte: new Date(end as string)
      }
    };

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
      const ownedShops = await prisma.barbershop.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
      const shopIds = ownedShops.map(shop => shop.id);
      where.barbershopId = { in: shopIds };
    }

    if (barberId) {
      where.barberId = barberId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        barber: {
          include: { user: true }
        },
        service: true,
        barbershop: true
      }
    });

    let exportData = '';

    if (format === 'ical') {
      exportData = generateICalExport(appointments, {
        includeCustomers: includeCustomers === 'true',
        includeNotes: includeNotes === 'true'
      });
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename=appointments.ics');
    } else {
      return res.status(400).json({ error: 'Unsupported export format' });
    }

    res.send(exportData);
  } catch (error) {
    console.error('Error exporting calendar:', error);
    res.status(500).json({ error: 'Failed to export calendar' });
  }
});

/**
 * @route   GET /api/calendar/next-available
 * @desc    Get next available appointment slot
 * @access  Private
 */
router.get('/next-available', authenticate, async (req, res) => {
  try {
    const { barberId, serviceId, duration, startDate } = req.query;

    if (!barberId || !serviceId || !duration) {
      return res.status(400).json({ error: 'barberId, serviceId, and duration are required' });
    }

    const serviceDuration = parseInt(duration as string);
    const searchStartDate = startDate ? new Date(startDate as string) : new Date();

    // Get barber's schedule
    const barber = await prisma.barber.findUnique({
      where: { id: barberId as string },
      include: {
        schedules: true
      }
    });

    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    // Find next available slot (simplified implementation)
    const nextSlot = await findNextAvailableSlot(
      barberId as string,
      serviceDuration,
      searchStartDate,
      barber.schedules
    );

    if (nextSlot) {
      res.json({
        start: nextSlot.start,
        end: nextSlot.end
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error finding next available slot:', error);
    res.status(500).json({ error: 'Failed to find next available slot' });
  }
});

// Helper functions
function getStatusColor(status: AppointmentStatus): string {
  const colors = {
    PENDING: '#f59e0b',
    CONFIRMED: '#10b981',
    IN_PROGRESS: '#3b82f6',
    COMPLETED: '#6b7280',
    CANCELLED: '#ef4444',
    NO_SHOW: '#dc2626'
  };
  return colors[status] || '#6b7280';
}

function generateICalExport(appointments: any[], options: { includeCustomers: boolean; includeNotes: boolean }) {
  const now = new Date();
  const icalHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:BarberBooking Calendar',
    'X-WR-CALNAME:Barber Appointments',
    'X-WR-CALDESC:Barber appointment calendar'
  ].join('\r\n');

  const icalEvents = appointments.map(appointment => {
    const start = appointment.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = appointment.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const created = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let title = appointment.service.name;
    if (options.includeCustomers) {
      title += ` - ${appointment.customer.firstName} ${appointment.customer.lastName}`;
    }

    let description = `Service: ${appointment.service.name}\\nBarber: ${appointment.barber.user.firstName} ${appointment.barber.user.lastName}`;
    if (options.includeCustomers) {
      description += `\\nCustomer: ${appointment.customer.firstName} ${appointment.customer.lastName}`;
      if (appointment.customer.phone) {
        description += `\\nPhone: ${appointment.customer.phone}`;
      }
    }
    if (options.includeNotes && appointment.notes) {
      description += `\\nNotes: ${appointment.notes}`;
    }

    return [
      'BEGIN:VEVENT',
      `UID:${appointment.id}@barberbooking.com`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `DTSTAMP:${created}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `STATUS:${appointment.status}`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  return [icalHeader, icalEvents, 'END:VCALENDAR'].join('\r\n');
}

async function findNextAvailableSlot(
  barberId: string,
  duration: number,
  startDate: Date,
  schedules: any[]
): Promise<{ start: Date; end: Date } | null> {
  // Simplified implementation - would need more sophisticated logic
  // This is just a placeholder
  const nextSlot = new Date(startDate);
  nextSlot.setHours(9, 0, 0, 0); // Start at 9 AM
  
  const endSlot = new Date(nextSlot);
  endSlot.setMinutes(nextSlot.getMinutes() + duration);

  return {
    start: nextSlot,
    end: endSlot
  };
}

export default router;