import { Router } from 'express';
import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const availabilitySchema = z.object({
  query: z.object({
    barbershopId: z.string(),
    serviceId: z.string().optional(),
    barberId: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    duration: z.string().optional() // in minutes
  })
});

const bulkAvailabilitySchema = z.object({
  body: z.object({
    barbershopId: z.string(),
    serviceIds: z.array(z.string()).optional(),
    barberIds: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }),
    timePreferences: z.object({
      preferredTimes: z.array(z.string()).optional(), // ["09:00", "14:00"]
      avoidTimes: z.array(z.string()).optional(),
      flexibleDuration: z.boolean().default(false)
    }).optional()
  })
});

/**
 * @route   GET /api/availability/real-time
 * @desc    Get real-time availability for specific criteria
 * @access  Public
 */
router.get('/real-time', validateRequest(availabilitySchema), async (req, res) => {
  try {
    const { barbershopId, serviceId, barberId, startDate, endDate, duration } = req.query;

    const startDateObj = new Date(startDate as string);
    const endDateObj = endDate ? new Date(endDate as string) : new Date(startDate as string);
    
    // Get service details if specified
    let serviceDuration = duration ? parseInt(duration as string) : 60;
    let service = null;
    
    if (serviceId) {
      service = await prisma.service.findUnique({
        where: { id: serviceId as string }
      });
      if (service) {
        serviceDuration = service.duration;
      }
    }

    // Get barbershop and barbers
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId as string },
      include: {
        barbers: {
          where: {
            isActive: true,
            isAvailable: true,
            ...(barberId && { id: barberId as string }),
            ...(serviceId && {
              services: {
                some: { id: serviceId as string }
              }
            })
          },
          include: {
            schedules: {
              where: { isActive: true }
            },
            user: {
              select: { firstName: true, lastName: true, avatar: true }
            }
          }
        }
      }
    });

    if (!barbershop) {
      return res.status(404).json({ error: 'Barbershop not found' });
    }

    const availabilityMap: any = {};

    // Generate availability for each day in the range
    const currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Get existing appointments for this date
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          barbershopId,
          date: new Date(currentDate),
          barberId: barberId ? barberId as string : { in: barbershop.barbers.map(b => b.id) },
          status: { not: AppointmentStatus.CANCELLED }
        },
        select: {
          barberId: true,
          startTime: true,
          endTime: true
        }
      });

      availabilityMap[dateKey] = {
        date: dateKey,
        dayOfWeek,
        barbers: []
      };

      // Check each barber's availability
      for (const barber of barbershop.barbers) {
        const schedule = barber.schedules.find(s => s.dayOfWeek === dayOfWeek);
        
        if (!schedule) {
          availabilityMap[dateKey].barbers.push({
            barberId: barber.id,
            barberName: `${barber.user.firstName} ${barber.user.lastName}`,
            avatar: barber.user.avatar,
            available: false,
            reason: 'Not working this day',
            slots: []
          });
          continue;
        }

        // Generate time slots
        const slots = generateTimeSlots(
          currentDate,
          schedule.startTime,
          schedule.endTime,
          serviceDuration,
          existingAppointments.filter(apt => apt.barberId === barber.id)
        );

        availabilityMap[dateKey].barbers.push({
          barberId: barber.id,
          barberName: `${barber.user.firstName} ${barber.user.lastName}`,
          avatar: barber.user.avatar,
          available: slots.length > 0,
          workingHours: {
            start: schedule.startTime,
            end: schedule.endTime
          },
          slots: slots.map(slot => ({
            startTime: slot.startTime.toISOString(),
            endTime: slot.endTime.toISOString(),
            displayTime: slot.startTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            available: true
          }))
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      availability: availabilityMap,
      service: service ? {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price
      } : null,
      barbershop: {
        id: barbershop.id,
        name: barbershop.name,
        businessHours: barbershop.businessHours
      }
    });

  } catch (error) {
    console.error('Error fetching real-time availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

/**
 * @route   POST /api/availability/bulk-check
 * @desc    Check availability for multiple services/barbers
 * @access  Public
 */
router.post('/bulk-check', validateRequest(bulkAvailabilitySchema), async (req, res) => {
  try {
    const { barbershopId, serviceIds, barberIds, dateRange, timePreferences } = req.body;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Get services if specified
    const services = serviceIds ? await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    }) : [];

    // Get barbers
    const barbers = await prisma.barber.findMany({
      where: {
        barbershopId,
        isActive: true,
        isAvailable: true,
        ...(barberIds && { id: { in: barberIds } }),
        ...(serviceIds && {
          services: {
            some: { id: { in: serviceIds } }
          }
        })
      },
      include: {
        schedules: { where: { isActive: true } },
        user: {
          select: { firstName: true, lastName: true, avatar: true }
        },
        services: serviceIds ? {
          where: { id: { in: serviceIds } }
        } : true
      }
    });

    const results: any[] = [];

    // Check availability for each service-barber combination
    for (const barber of barbers) {
      const barberServices = serviceIds 
        ? barber.services.filter(s => serviceIds.includes(s.id))
        : services.length > 0 
          ? services.filter(s => barber.services.some(bs => bs.id === s.id))
          : barber.services;

      for (const service of barberServices) {
        const availability = await checkServiceBarberAvailability(
          barbershopId,
          barber.id,
          service.id,
          startDate,
          endDate,
          timePreferences
        );

        results.push({
          barberId: barber.id,
          barberName: `${barber.user.firstName} ${barber.user.lastName}`,
          avatar: barber.user.avatar,
          serviceId: service.id,
          serviceName: service.name,
          duration: service.duration,
          price: service.price,
          availability
        });
      }
    }

    // Sort by availability score (most available first)
    results.sort((a, b) => {
      const aScore = a.availability.reduce((sum: number, day: any) => sum + day.availableSlots, 0);
      const bScore = b.availability.reduce((sum: number, day: any) => sum + day.availableSlots, 0);
      return bScore - aScore;
    });

    res.json({
      results,
      summary: {
        totalCombinations: results.length,
        dateRange: { start: dateRange.start, end: dateRange.end },
        averageAvailability: results.length > 0 
          ? results.reduce((sum, r) => sum + r.availability.reduce((s: number, d: any) => s + d.availableSlots, 0), 0) / results.length
          : 0
      }
    });

  } catch (error) {
    console.error('Error in bulk availability check:', error);
    res.status(500).json({ error: 'Failed to check bulk availability' });
  }
});

/**
 * @route   GET /api/availability/next-available
 * @desc    Find the next available slot for a service
 * @access  Public
 */
router.get('/next-available', async (req, res) => {
  try {
    const { barbershopId, serviceId, barberId, fromDate, maxDays = '30' } = req.query;

    if (!barbershopId || !serviceId) {
      return res.status(400).json({ error: 'barbershopId and serviceId are required' });
    }

    const fromDateObj = fromDate ? new Date(fromDate as string) : new Date();
    const maxDaysNum = parseInt(maxDays as string);
    
    const service = await prisma.service.findUnique({
      where: { id: serviceId as string }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Get available barbers
    const barbers = await prisma.barber.findMany({
      where: {
        barbershopId: barbershopId as string,
        isActive: true,
        isAvailable: true,
        ...(barberId && { id: barberId as string }),
        services: {
          some: { id: serviceId as string }
        }
      },
      include: {
        schedules: { where: { isActive: true } },
        user: {
          select: { firstName: true, lastName: true, avatar: true }
        }
      }
    });

    if (barbers.length === 0) {
      return res.json({ nextAvailable: null, message: 'No barbers available for this service' });
    }

    // Search for next available slot
    const currentDate = new Date(fromDateObj);
    const endDate = new Date(fromDateObj);
    endDate.setDate(endDate.getDate() + maxDaysNum);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      for (const barber of barbers) {
        const schedule = barber.schedules.find(s => s.dayOfWeek === dayOfWeek);
        if (!schedule) continue;

        // Get existing appointments
        const existingAppointments = await prisma.appointment.findMany({
          where: {
            barberId: barber.id,
            date: new Date(currentDate),
            status: { not: AppointmentStatus.CANCELLED }
          },
          select: { startTime: true, endTime: true }
        });

        // Generate slots for this barber on this day
        const slots = generateTimeSlots(
          currentDate,
          schedule.startTime,
          schedule.endTime,
          service.duration,
          existingAppointments
        );

        if (slots.length > 0) {
          // Return the first available slot
          const nextSlot = slots[0];
          return res.json({
            nextAvailable: {
              date: currentDate.toISOString().split('T')[0],
              startTime: nextSlot.startTime.toISOString(),
              endTime: nextSlot.endTime.toISOString(),
              displayTime: nextSlot.startTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              barber: {
                id: barber.id,
                name: `${barber.user.firstName} ${barber.user.lastName}`,
                avatar: barber.user.avatar
              },
              service: {
                id: service.id,
                name: service.name,
                duration: service.duration,
                price: service.price
              }
            }
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ 
      nextAvailable: null, 
      message: `No availability found in the next ${maxDaysNum} days` 
    });

  } catch (error) {
    console.error('Error finding next available slot:', error);
    res.status(500).json({ error: 'Failed to find next available slot' });
  }
});

// Helper function to generate time slots
function generateTimeSlots(
  date: Date, 
  startTime: string, 
  endTime: string, 
  duration: number, 
  existingAppointments: any[]
) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const workStart = new Date(date);
  workStart.setHours(startHour, startMinute, 0, 0);

  const workEnd = new Date(date);
  workEnd.setHours(endHour, endMinute, 0, 0);

  const current = new Date(workStart);
  const slotDuration = Math.max(duration, 30); // Minimum 30-minute slots

  while (current < workEnd) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(current.getMinutes() + slotDuration);

    if (slotEnd <= workEnd) {
      // Check for conflicts
      const hasConflict = existingAppointments.some(apt => 
        (apt.startTime <= current && apt.endTime > current) ||
        (apt.startTime < slotEnd && apt.endTime >= slotEnd) ||
        (apt.startTime >= current && apt.endTime <= slotEnd)
      );

      if (!hasConflict) {
        slots.push({
          startTime: new Date(current),
          endTime: new Date(slotEnd)
        });
      }
    }

    current.setMinutes(current.getMinutes() + 30); // 30-minute increments
  }

  return slots;
}

// Helper function to check availability for specific service-barber combination
async function checkServiceBarberAvailability(
  barbershopId: string,
  barberId: string,
  serviceId: string,
  startDate: Date,
  endDate: Date,
  timePreferences?: any
) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: {
      schedules: { where: { isActive: true } }
    }
  });

  if (!service || !barber) return [];

  const availability = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateKey = currentDate.toISOString().split('T')[0];
    const schedule = barber.schedules.find(s => s.dayOfWeek === dayOfWeek);

    if (!schedule) {
      availability.push({
        date: dateKey,
        available: false,
        availableSlots: 0,
        reason: 'Barber not working'
      });
    } else {
      // Get existing appointments
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          barberId,
          date: new Date(currentDate),
          status: { not: AppointmentStatus.CANCELLED }
        },
        select: { startTime: true, endTime: true }
      });

      const slots = generateTimeSlots(
        currentDate,
        schedule.startTime,
        schedule.endTime,
        service.duration,
        existingAppointments
      );

      // Filter by time preferences if provided
      let filteredSlots = slots;
      if (timePreferences?.preferredTimes) {
        filteredSlots = slots.filter(slot => {
          const slotTime = slot.startTime.toTimeString().substring(0, 5);
          return timePreferences.preferredTimes.some((prefTime: string) => {
            const timeDiff = Math.abs(
              parseTime(slotTime).getTime() - parseTime(prefTime).getTime()
            );
            return timeDiff <= 30 * 60 * 1000; // Within 30 minutes
          });
        });
      }

      availability.push({
        date: dateKey,
        available: filteredSlots.length > 0,
        availableSlots: filteredSlots.length,
        workingHours: {
          start: schedule.startTime,
          end: schedule.endTime
        }
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availability;
}

// Helper function to parse time string to Date object
function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default router;