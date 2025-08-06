import { Router } from 'express';
import { PrismaClient, AppointmentStatus, PaymentStatus } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const guestBookingSchema = z.object({
  body: z.object({
    // Barbershop and service selection
    barbershopId: z.string(),
    serviceId: z.string(),
    barberId: z.string().optional(), // Optional - can be "any available"
    
    // Appointment timing
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    
    // Guest information
    guestName: z.string().min(2, 'Name must be at least 2 characters'),
    guestEmail: z.string().email('Valid email is required'),
    guestPhone: z.string().min(10, 'Valid phone number is required'),
    
    // Additional information
    notes: z.string().optional(),
    specialRequests: z.string().optional(),
    marketingOptIn: z.boolean().default(false)
  })
});

const availabilityCheckSchema = z.object({
  query: z.object({
    barbershopId: z.string(),
    serviceId: z.string(),
    date: z.string(),
    barberId: z.string().optional()
  })
});

const waitlistSchema = z.object({
  body: z.object({
    barbershopId: z.string(),
    serviceId: z.string(),
    barberId: z.string().optional(),
    preferredDate: z.string(),
    preferredStartTime: z.string(),
    preferredEndTime: z.string(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    flexibleTiming: z.boolean().default(false),
    maxWaitDays: z.number().min(1).max(30).default(7)
  })
});

/**
 * @route   GET /api/guest-booking/availability
 * @desc    Check available time slots for a service
 * @access  Public
 */
router.get('/availability', validateRequest(availabilityCheckSchema), async (req, res) => {
  try {
    const { barbershopId, serviceId, date, barberId } = req.query;

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId as string },
      include: {
        barbershop: {
          include: {
            barbers: {
              where: {
                isActive: true,
                isAvailable: true,
                ...(barberId && { id: barberId as string })
              },
              include: {
                schedules: true,
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();

    // Get available barbers for this service
    const availableBarbers = service.barbers.filter(barber => 
      barber.schedules.some(schedule => 
        schedule.dayOfWeek === dayOfWeek && schedule.isActive
      )
    );

    if (availableBarbers.length === 0) {
      return res.json({
        availableSlots: [],
        message: 'No barbers available on this day'
      });
    }

    // Get existing appointments for the date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        barbershopId: barbershopId as string,
        date: targetDate,
        barberId: barberId ? barberId as string : { in: availableBarbers.map(b => b.id) },
        status: { not: AppointmentStatus.CANCELLED }
      },
      select: {
        barberId: true,
        startTime: true,
        endTime: true
      }
    });

    const availableSlots: any[] = [];

    // Generate time slots for each available barber
    for (const barber of availableBarbers) {
      const schedule = barber.schedules.find(s => s.dayOfWeek === dayOfWeek && s.isActive);
      if (!schedule) continue;

      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

      const workStart = new Date(targetDate);
      workStart.setHours(startHour, startMinute, 0, 0);

      const workEnd = new Date(targetDate);
      workEnd.setHours(endHour, endMinute, 0, 0);

      // Generate 30-minute time slots
      const current = new Date(workStart);
      while (current < workEnd) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(current.getMinutes() + service.duration);

        if (slotEnd <= workEnd) {
          // Check if this slot conflicts with existing appointments
          const hasConflict = existingAppointments.some(apt => 
            apt.barberId === barber.id &&
            ((apt.startTime <= current && apt.endTime > current) ||
             (apt.startTime < slotEnd && apt.endTime >= slotEnd) ||
             (apt.startTime >= current && apt.endTime <= slotEnd))
          );

          if (!hasConflict) {
            availableSlots.push({
              barberId: barber.id,
              barberName: `${barber.user.firstName} ${barber.user.lastName}`,
              startTime: current.toISOString(),
              endTime: slotEnd.toISOString(),
              displayTime: current.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            });
          }
        }

        current.setMinutes(current.getMinutes() + 30);
      }
    }

    // Sort slots by time
    availableSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    res.json({
      availableSlots,
      service: {
        name: service.name,
        duration: service.duration,
        price: service.price
      }
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

/**
 * @route   POST /api/guest-booking/book
 * @desc    Create a guest booking
 * @access  Public
 */
router.post('/book', validateRequest(guestBookingSchema), async (req, res) => {
  try {
    const {
      barbershopId,
      serviceId,
      barberId,
      date,
      startTime,
      endTime,
      guestName,
      guestEmail,
      guestPhone,
      notes,
      specialRequests,
      marketingOptIn
    } = req.body;

    // Get service details for pricing
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        barbershop: true
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // If no specific barber selected, find an available one
    let selectedBarberId = barberId;
    if (!barberId) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      const availableBarbers = await prisma.barber.findMany({
        where: {
          barbershopId,
          isActive: true,
          isAvailable: true,
          services: {
            some: { id: serviceId }
          },
          schedules: {
            some: {
              dayOfWeek,
              isActive: true
            }
          }
        }
      });

      if (availableBarbers.length === 0) {
        return res.status(404).json({ error: 'No available barbers for this service' });
      }

      // Simple selection: first available barber
      selectedBarberId = availableBarbers[0].id;
    }

    // Check for conflicts
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        barberId: selectedBarberId,
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
        status: { not: AppointmentStatus.CANCELLED }
      }
    });

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({ error: 'Time slot is no longer available' });
    }

    // Create or update guest user record
    const guestUser = await prisma.guestUser.upsert({
      where: { email: guestEmail },
      update: {
        name: guestName,
        phone: guestPhone,
        allowMarketing: marketingOptIn,
        totalBookings: { increment: 1 }
      },
      create: {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        allowMarketing: marketingOptIn,
        totalBookings: 1
      }
    });

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        barbershopId,
        serviceId,
        barberId: selectedBarberId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalPrice: service.price,
        isGuestBooking: true,
        guestName,
        guestEmail,
        guestPhone,
        notes,
        specialRequests,
        status: AppointmentStatus.CONFIRMED, // Guest bookings are auto-confirmed
        paymentStatus: PaymentStatus.PENDING
      },
      include: {
        barber: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        service: true,
        barbershop: true
      }
    });

    // TODO: Send confirmation email/SMS

    res.status(201).json({
      appointment,
      message: 'Booking confirmed! You will receive a confirmation email shortly.'
    });

  } catch (error) {
    console.error('Error creating guest booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

/**
 * @route   POST /api/guest-booking/waitlist
 * @desc    Join waitlist for unavailable time slots
 * @access  Public
 */
router.post('/waitlist', validateRequest(waitlistSchema), async (req, res) => {
  try {
    const {
      barbershopId,
      serviceId,
      barberId,
      preferredDate,
      preferredStartTime,
      preferredEndTime,
      name,
      email,
      phone,
      flexibleTiming,
      maxWaitDays
    } = req.body;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + maxWaitDays);

    // If specific barber not selected, use first available
    let selectedBarberId = barberId;
    if (!barberId) {
      const availableBarbers = await prisma.barber.findMany({
        where: {
          barbershopId,
          isActive: true,
          services: {
            some: { id: serviceId }
          }
        },
        take: 1
      });

      if (availableBarbers.length === 0) {
        return res.status(404).json({ error: 'No barbers available for this service' });
      }

      selectedBarberId = availableBarbers[0].id;
    }

    const waitlistEntry = await prisma.waitlistEntry.create({
      data: {
        barbershopId,
        serviceId,
        barberId: selectedBarberId,
        preferredDate: new Date(preferredDate),
        preferredStartTime: new Date(preferredStartTime),
        preferredEndTime: new Date(preferredEndTime),
        name,
        email,
        phone,
        flexibleTiming,
        maxWaitDays,
        expiresAt
      },
      include: {
        barber: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        service: true,
        barbershop: true
      }
    });

    res.status(201).json({
      waitlistEntry,
      message: 'You have been added to the waitlist. We will notify you if a slot becomes available.'
    });

  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ error: 'Failed to add to waitlist' });
  }
});

/**
 * @route   GET /api/guest-booking/appointment/:id
 * @desc    Get guest appointment details
 * @access  Public (with appointment ID)
 */
router.get('/appointment/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true }
            }
          }
        },
        service: true,
        barbershop: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Only allow access to guest bookings or if email matches
    if (!appointment.isGuestBooking) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(appointment);

  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

/**
 * @route   PUT /api/guest-booking/appointment/:id/cancel
 * @desc    Cancel guest appointment
 * @access  Public (with email verification)
 */
router.put('/appointment/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for verification' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!appointment.isGuestBooking || appointment.guestEmail !== email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    // Check cancellation policy (e.g., minimum 24 hours notice)
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      return res.status(400).json({ 
        error: 'Cancellations must be made at least 24 hours in advance' 
      });
    }

    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED
      }
    });

    // Update guest user stats
    await prisma.guestUser.update({
      where: { email: appointment.guestEmail! },
      data: {
        totalCancellations: { increment: 1 }
      }
    });

    // TODO: Check waitlist for this slot and notify next person

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: cancelledAppointment
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;