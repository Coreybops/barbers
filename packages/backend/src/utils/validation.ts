import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('CUSTOMER', 'BARBER', 'SHOP_OWNER').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().optional(),
  avatar: Joi.string().uri().optional(),
});

export const appointmentSchema = Joi.object({
  barberId: Joi.string().required(),
  serviceId: Joi.string().required(),
  date: Joi.date().iso().required(),
  startTime: Joi.date().iso().required(),
  notes: Joi.string().max(500).optional(),
});

export const updateAppointmentSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW').optional(),
  notes: Joi.string().max(500).optional(),
});

export const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional(),
});

// Barber validation schemas
export const createBarberSchema = Joi.object({
  userId: Joi.string().required(),
  barbershopId: Joi.string().required(),
  bio: Joi.string().max(1000).optional(),
  specialties: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  experience: Joi.number().integer().min(0).max(50).optional(),
  hireDate: Joi.date().iso().optional(),
  commissionRate: Joi.number().min(0).max(1).optional(),
  hourlyRate: Joi.number().min(0).optional(),
  certifications: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  languages: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  socialMedia: Joi.string().optional(), // JSON string
});

export const updateBarberSchema = Joi.object({
  bio: Joi.string().max(1000).optional(),
  specialties: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  experience: Joi.number().integer().min(0).max(50).optional(),
  hireDate: Joi.date().iso().optional(),
  commissionRate: Joi.number().min(0).max(1).optional(),
  hourlyRate: Joi.number().min(0).optional(),
  certifications: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  languages: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  socialMedia: Joi.string().optional(), // JSON string
  isAvailable: Joi.string().valid('true', 'false').optional(),
  isActive: Joi.string().valid('true', 'false').optional(),
});

export const searchBarbersSchema = Joi.object({
  search: Joi.string().optional(),
  barbershopId: Joi.string().optional(),
  specialties: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  isAvailable: Joi.string().valid('true', 'false').optional(),
  minRating: Joi.number().min(1).max(5).optional(),
  sortBy: Joi.string().valid('createdAt', 'rating', 'firstName', 'lastName', 'experience').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const assignServicesSchema = Joi.object({
  serviceIds: Joi.array().items(Joi.string()).min(1).required(),
});

// Schedule validation schemas
export const createScheduleSchema = Joi.object({
  barberId: Joi.string().required(),
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
});

export const updateScheduleSchema = Joi.object({
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  isActive: Joi.boolean().optional(),
});