import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { 
  createBarberSchema, 
  updateBarberSchema, 
  searchBarbersSchema,
  assignServicesSchema 
} from '../utils/validation';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/barbers';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `barber-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

/**
 * @route   GET /api/barbers
 * @desc    Get all barbers with search and filter capabilities
 * @access  Public
 */
router.get('/', validateRequest(searchBarbersSchema), async (req, res) => {
  try {
    const {
      search,
      barbershopId,
      specialties,
      isAvailable,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { bio: { contains: search as string, mode: 'insensitive' } },
        { specialties: { hasSome: [search as string] } }
      ];
    }

    if (barbershopId) {
      where.barbershopId = barbershopId as string;
    }

    if (specialties) {
      const specialtiesArray = Array.isArray(specialties) ? specialties : [specialties];
      where.specialties = { hasSome: specialtiesArray };
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating as string) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [barbers, total] = await Promise.all([
      prisma.barber.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          barbershop: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true
            }
          },
          services: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          },
          _count: {
            select: {
              appointments: true,
              reviews: true
            }
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc'
        },
        skip,
        take: Number(limit)
      }),
      prisma.barber.count({ where })
    ]);

    res.json({
      barbers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/barbers/:id
 * @desc    Get barber by ID with detailed information
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await prisma.barber.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        barbershop: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true
          }
        },
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true
          }
        },
        schedules: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true
          }
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            appointments: true,
            reviews: true
          }
        }
      }
    });

    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    res.json(barber);
  } catch (error) {
    console.error('Error fetching barber:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/barbers
 * @desc    Create a new barber
 * @access  Private/Shop Owner
 */
router.post('/', 
  authenticate, 
  authorize(UserRole.SHOP_OWNER, UserRole.ADMIN),
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'portfolio', maxCount: 10 }
  ]),
  validateRequest(createBarberSchema),
  async (req, res) => {
    try {
      const {
        userId,
        barbershopId,
        bio,
        specialties,
        experience,
        hireDate,
        commissionRate,
        hourlyRate,
        certifications,
        languages,
        socialMedia
      } = req.body;

      // Check if user exists and has BARBER role
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role !== UserRole.BARBER) {
        return res.status(400).json({ error: 'User must have BARBER role' });
      }

      // Check if barber already exists for this user
      const existingBarber = await prisma.barber.findUnique({
        where: { userId }
      });

      if (existingBarber) {
        return res.status(400).json({ error: 'Barber profile already exists for this user' });
      }

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let avatarUrl = null;
      let portfolioUrls: string[] = [];

      if (files.avatar) {
        avatarUrl = `/uploads/barbers/${files.avatar[0].filename}`;
      }

      if (files.portfolio) {
        portfolioUrls = files.portfolio.map(file => `/uploads/barbers/${file.filename}`);
      }

      const barber = await prisma.barber.create({
        data: {
          userId,
          barbershopId,
          bio,
          specialties: Array.isArray(specialties) ? specialties : specialties ? [specialties] : [],
          experience: experience ? parseInt(experience) : null,
          avatar: avatarUrl,
          hireDate: hireDate ? new Date(hireDate) : new Date(),
          commissionRate: commissionRate ? parseFloat(commissionRate) : 0.5,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          certifications: Array.isArray(certifications) ? certifications : certifications ? [certifications] : [],
          languages: Array.isArray(languages) ? languages : languages ? [languages] : [],
          portfolio: portfolioUrls,
          socialMedia: socialMedia ? JSON.parse(socialMedia) : null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          barbershop: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(201).json(barber);
    } catch (error) {
      console.error('Error creating barber:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   PUT /api/barbers/:id
 * @desc    Update barber information
 * @access  Private/Shop Owner or Barber (own profile)
 */
router.put('/:id',
  authenticate,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'portfolio', maxCount: 10 }
  ]),
  validateRequest(updateBarberSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Find existing barber
      const existingBarber = await prisma.barber.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existingBarber) {
        return res.status(404).json({ error: 'Barber not found' });
      }

      // Check permissions
      const canUpdate = userRole === UserRole.ADMIN || 
                       userRole === UserRole.SHOP_OWNER || 
                       existingBarber.userId === userId;

      if (!canUpdate) {
        return res.status(403).json({ error: 'Not authorized to update this barber profile' });
      }

      const {
        bio,
        specialties,
        experience,
        hireDate,
        commissionRate,
        hourlyRate,
        certifications,
        languages,
        socialMedia,
        isAvailable,
        isActive
      } = req.body;

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let avatarUrl = existingBarber.avatar;
      let portfolioUrls = existingBarber.portfolio;

      if (files.avatar) {
        // Delete old avatar if it exists
        if (existingBarber.avatar) {
          const oldAvatarPath = path.join(process.cwd(), existingBarber.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        avatarUrl = `/uploads/barbers/${files.avatar[0].filename}`;
      }

      if (files.portfolio) {
        // Add new portfolio images to existing ones
        const newPortfolioUrls = files.portfolio.map(file => `/uploads/barbers/${file.filename}`);
        portfolioUrls = [...portfolioUrls, ...newPortfolioUrls];
      }

      const updateData: any = {};

      if (bio !== undefined) updateData.bio = bio;
      if (specialties !== undefined) {
        updateData.specialties = Array.isArray(specialties) ? specialties : specialties ? [specialties] : [];
      }
      if (experience !== undefined) updateData.experience = parseInt(experience);
      if (hireDate !== undefined) updateData.hireDate = new Date(hireDate);
      if (commissionRate !== undefined) updateData.commissionRate = parseFloat(commissionRate);
      if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate);
      if (certifications !== undefined) {
        updateData.certifications = Array.isArray(certifications) ? certifications : certifications ? [certifications] : [];
      }
      if (languages !== undefined) {
        updateData.languages = Array.isArray(languages) ? languages : languages ? [languages] : [];
      }
      if (socialMedia !== undefined) updateData.socialMedia = JSON.parse(socialMedia);
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true';
      if (isActive !== undefined && (userRole === UserRole.ADMIN || userRole === UserRole.SHOP_OWNER)) {
        updateData.isActive = isActive === 'true';
      }

      updateData.avatar = avatarUrl;
      updateData.portfolio = portfolioUrls;

      const barber = await prisma.barber.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          barbershop: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json(barber);
    } catch (error) {
      console.error('Error updating barber:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   DELETE /api/barbers/:id
 * @desc    Deactivate barber (soft delete)
 * @access  Private/Shop Owner or Admin
 */
router.delete('/:id',
  authenticate,
  authorize(UserRole.SHOP_OWNER, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;

      const barber = await prisma.barber.findUnique({
        where: { id }
      });

      if (!barber) {
        return res.status(404).json({ error: 'Barber not found' });
      }

      // Soft delete by setting isActive to false
      await prisma.barber.update({
        where: { id },
        data: { 
          isActive: false,
          isAvailable: false
        }
      });

      res.json({ message: 'Barber deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating barber:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   POST /api/barbers/:id/services
 * @desc    Assign services to a barber
 * @access  Private/Shop Owner
 */
router.post('/:id/services',
  authenticate,
  authorize(UserRole.SHOP_OWNER, UserRole.ADMIN),
  validateRequest(assignServicesSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { serviceIds } = req.body;

      const barber = await prisma.barber.findUnique({
        where: { id }
      });

      if (!barber) {
        return res.status(404).json({ error: 'Barber not found' });
      }

      // Verify all services exist and belong to the same barbershop
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          barbershopId: barber.barbershopId
        }
      });

      if (services.length !== serviceIds.length) {
        return res.status(400).json({ error: 'Some services not found or do not belong to this barbershop' });
      }

      // Update barber services
      const updatedBarber = await prisma.barber.update({
        where: { id },
        data: {
          services: {
            set: serviceIds.map((serviceId: string) => ({ id: serviceId }))
          }
        },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              category: true
            }
          }
        }
      });

      res.json(updatedBarber);
    } catch (error) {
      console.error('Error assigning services to barber:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route   GET /api/barbers/:id/performance
 * @desc    Get barber performance metrics
 * @access  Private/Shop Owner, Admin, or Barber (own metrics)
 */
router.get('/:id/performance',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const barber = await prisma.barber.findUnique({
        where: { id }
      });

      if (!barber) {
        return res.status(404).json({ error: 'Barber not found' });
      }

      // Check permissions
      const canView = userRole === UserRole.ADMIN || 
                     userRole === UserRole.SHOP_OWNER || 
                     barber.userId === userId;

      if (!canView) {
        return res.status(403).json({ error: 'Not authorized to view this barber\'s performance' });
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const end = endDate ? new Date(endDate as string) : new Date();

      // Get performance metrics
      const [appointments, revenue, reviews] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            barberId: id,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            service: {
              select: { price: true }
            }
          }
        }),
        prisma.appointment.aggregate({
          where: {
            barberId: id,
            status: 'COMPLETED',
            createdAt: {
              gte: start,
              lte: end
            }
          },
          _sum: {
            totalPrice: true
          }
        }),
        prisma.review.findMany({
          where: {
            barberId: id,
            createdAt: {
              gte: start,
              lte: end
            }
          }
        })
      ]);

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED').length;
      const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED').length;
      const totalRevenue = revenue._sum.totalPrice || 0;
      const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
      const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;

      // Commission earned (if commission rate is set)
      const commissionEarned = totalRevenue * barber.commissionRate;

      res.json({
        period: {
          startDate: start,
          endDate: end
        },
        metrics: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          totalRevenue,
          commissionEarned,
          averageRating: Math.round(averageRating * 100) / 100,
          totalReviews: reviews.length
        },
        appointments: appointments.map(apt => ({
          id: apt.id,
          date: apt.date,
          status: apt.status,
          totalPrice: apt.totalPrice,
          serviceName: apt.service?.name
        }))
      });
    } catch (error) {
      console.error('Error fetching barber performance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;