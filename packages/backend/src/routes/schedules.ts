import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { createScheduleSchema, updateScheduleSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/schedules
 * @desc    Get schedules by barber ID
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { barberId } = req.query;

    if (!barberId) {
      return res.status(400).json({ error: 'Barber ID is required' });
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        barberId: barberId as string,
        isActive: true
      },
      orderBy: {
        dayOfWeek: 'asc'
      }
    });

    // Convert to weekly schedule format
    const weeklySchedule = Array.from({ length: 7 }, (_, dayOfWeek) => {
      const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      return {
        dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        isActive: daySchedule?.isActive || false,
        startTime: daySchedule?.startTime || null,
        endTime: daySchedule?.endTime || null,
        scheduleId: daySchedule?.id || null
      };
    });

    res.json(weeklySchedule);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/schedules
 * @desc    Create or update barber schedule for a specific day
 * @access  Private/Shop Owner, Admin, or Barber (own schedule)
 */
router.post('/',
  authenticate,
  validateRequest(createScheduleSchema),
  async (req, res) => {
    try {
      const { barberId, dayOfWeek, startTime, endTime } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Check if barber exists
      const barber = await prisma.barber.findUnique({
        where: { id: barberId }
      });

      if (!barber) {
        return res.status(404).json({ error: 'Barber not found' });
      }

      // Check permissions
      const canModify = userRole === UserRole.ADMIN || 
                       userRole === UserRole.SHOP_OWNER || 
                       barber.userId === userId;

      if (!canModify) {
        return res.status(403).json({ error: 'Not authorized to modify this schedule' });
      }

      // Validate time format (startTime should be before endTime)
      if (startTime >= endTime) {
        return res.status(400).json({ error: 'Start time must be before end time' });
      }

      // Check if schedule already exists for this day
      const existingSchedule = await prisma.schedule.findUnique({
        where: {
          barberId_dayOfWeek: {
            barberId,
            dayOfWeek
          }
        }
      });

      let schedule;
      if (existingSchedule) {
        // Update existing schedule
        schedule = await prisma.schedule.update({
          where: { id: existingSchedule.id },
          data: {
            startTime,
            endTime,
            isActive: true
          }
        });
      } else {
        // Create new schedule
        schedule = await prisma.schedule.create({
          data: {
            barberId,
            dayOfWeek,
            startTime,
            endTime,
            isActive: true
          }
        });
      }

      res.json(schedule);
    } catch (error) {
      console.error('Error creating/updating schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   PUT /api/schedules/:id
 * @desc    Update specific schedule
 * @access  Private/Shop Owner, Admin, or Barber (own schedule)
 */
router.put('/:id',
  authenticate,
  validateRequest(updateScheduleSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { startTime, endTime, isActive } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Find existing schedule
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id },
        include: {
          barber: true
        }
      });

      if (!existingSchedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Check permissions
      const canModify = userRole === UserRole.ADMIN || 
                       userRole === UserRole.SHOP_OWNER || 
                       existingSchedule.barber.userId === userId;

      if (!canModify) {
        return res.status(403).json({ error: 'Not authorized to modify this schedule' });
      }

      const updateData: any = {};

      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Validate time format if both times are provided
      const finalStartTime = startTime || existingSchedule.startTime;
      const finalEndTime = endTime || existingSchedule.endTime;

      if (finalStartTime >= finalEndTime) {
        return res.status(400).json({ error: 'Start time must be before end time' });
      }

      const schedule = await prisma.schedule.update({
        where: { id },
        data: updateData
      });

      res.json(schedule);
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Delete schedule (set to inactive)
 * @access  Private/Shop Owner, Admin, or Barber (own schedule)
 */
router.delete('/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Find existing schedule
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id },
        include: {
          barber: true
        }
      });

      if (!existingSchedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Check permissions
      const canModify = userRole === UserRole.ADMIN || 
                       userRole === UserRole.SHOP_OWNER || 
                       existingSchedule.barber.userId === userId;

      if (!canModify) {
        return res.status(403).json({ error: 'Not authorized to modify this schedule' });
      }

      // Set schedule to inactive instead of deleting
      await prisma.schedule.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({ message: 'Schedule deactivated successfully' });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   POST /api/schedules/bulk
 * @desc    Bulk update barber's weekly schedule
 * @access  Private/Shop Owner, Admin, or Barber (own schedule)
 */
router.post('/bulk',
  authenticate,
  async (req, res) => {
    try {
      const { barberId, weeklySchedule } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!barberId || !Array.isArray(weeklySchedule)) {
        return res.status(400).json({ error: 'Barber ID and weekly schedule array are required' });
      }

      // Check if barber exists
      const barber = await prisma.barber.findUnique({
        where: { id: barberId }
      });

      if (!barber) {
        return res.status(404).json({ error: 'Barber not found' });
      }

      // Check permissions
      const canModify = userRole === UserRole.ADMIN || 
                       userRole === UserRole.SHOP_OWNER || 
                       barber.userId === userId;

      if (!canModify) {
        return res.status(403).json({ error: 'Not authorized to modify this schedule' });
      }

      // Validate weekly schedule format
      if (weeklySchedule.length !== 7) {
        return res.status(400).json({ error: 'Weekly schedule must contain 7 days' });
      }

      // Process each day
      const updatedSchedules = [];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const daySchedule = weeklySchedule[dayOfWeek];
        
        if (!daySchedule) continue;

        const { isActive, startTime, endTime } = daySchedule;

        if (isActive && (!startTime || !endTime)) {
          return res.status(400).json({ 
            error: `Start time and end time are required for active schedule on day ${dayOfWeek}` 
          });
        }

        if (isActive && startTime >= endTime) {
          return res.status(400).json({ 
            error: `Start time must be before end time for day ${dayOfWeek}` 
          });
        }

        // Find existing schedule for this day
        const existingSchedule = await prisma.schedule.findUnique({
          where: {
            barberId_dayOfWeek: {
              barberId,
              dayOfWeek
            }
          }
        });

        let schedule;
        if (existingSchedule) {
          // Update existing schedule
          schedule = await prisma.schedule.update({
            where: { id: existingSchedule.id },
            data: {
              startTime: isActive ? startTime : existingSchedule.startTime,
              endTime: isActive ? endTime : existingSchedule.endTime,
              isActive: Boolean(isActive)
            }
          });
        } else if (isActive) {
          // Create new schedule only if it's active
          schedule = await prisma.schedule.create({
            data: {
              barberId,
              dayOfWeek,
              startTime,
              endTime,
              isActive: true
            }
          });
        }

        if (schedule) {
          updatedSchedules.push(schedule);
        }
      }

      res.json(updatedSchedules);
    } catch (error) {
      console.error('Error bulk updating schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   GET /api/schedules/:barberId/availability
 * @desc    Get barber's availability for a specific date range
 * @access  Public
 */
router.get('/:barberId/availability',
  async (req, res) => {
    try {
      const { barberId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Get barber's schedules
      const schedules = await prisma.schedule.findMany({
        where: {
          barberId,
          isActive: true
        }
      });

      // Get existing appointments in the date range
      const appointments = await prisma.appointment.findMany({
        where: {
          barberId,
          date: {
            gte: start,
            lte: end
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        select: {
          date: true,
          startTime: true,
          endTime: true
        }
      });

      // Generate availability for each day in the range
      const availability = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

        if (daySchedule) {
          // Get appointments for this specific date
          const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === currentDate.toDateString();
          });

          availability.push({
            date: new Date(currentDate),
            dayOfWeek,
            isAvailable: true,
            workingHours: {
              startTime: daySchedule.startTime,
              endTime: daySchedule.endTime
            },
            bookedSlots: dayAppointments.map(apt => ({
              startTime: apt.startTime,
              endTime: apt.endTime
            }))
          });
        } else {
          availability.push({
            date: new Date(currentDate),
            dayOfWeek,
            isAvailable: false,
            workingHours: null,
            bookedSlots: []
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;