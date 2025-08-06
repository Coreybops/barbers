import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barberbooking.com' },
    update: {},
    create: {
      email: 'admin@barberbooking.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  // Create shop owner
  const ownerPassword = await bcrypt.hash('owner123', 12);
  const shopOwner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: ownerPassword,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567890',
      role: UserRole.SHOP_OWNER,
      emailVerified: true,
    },
  });

  // Create barbershop
  const barbershop = await prisma.barbershop.upsert({
    where: { id: 'sample-barbershop-id' },
    update: {},
    create: {
      id: 'sample-barbershop-id',
      name: 'Premium Cuts Barbershop',
      description: 'A modern barbershop offering premium grooming services',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '+1234567890',
      email: 'info@premiumcuts.com',
      website: 'https://premiumcuts.com',
      images: [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500',
      ],
      latitude: 40.7589,
      longitude: -73.9851,
      businessHours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '20:00' },
        friday: { open: '09:00', close: '20:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: { open: '10:00', close: '16:00' },
      },
      ownerId: shopOwner.id,
    },
  });

  // Create barber users
  const barberPassword = await bcrypt.hash('barber123', 12);
  const barberUser1 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      password: barberPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+1234567891',
      role: UserRole.BARBER,
      emailVerified: true,
    },
  });

  const barberUser2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      password: barberPassword,
      firstName: 'Sarah',
      lastName: 'Davis',
      phone: '+1234567892',
      role: UserRole.BARBER,
      emailVerified: true,
    },
  });

  // Create barber profiles
  const barber1 = await prisma.barber.upsert({
    where: { userId: barberUser1.id },
    update: {},
    create: {
      userId: barberUser1.id,
      barbershopId: barbershop.id,
      bio: 'Experienced barber specializing in classic cuts and modern styles',
      specialties: ['Classic Cuts', 'Beard Trimming', 'Hot Towel Shaves'],
      experience: 8,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    },
  });

  const barber2 = await prisma.barber.upsert({
    where: { userId: barberUser2.id },
    update: {},
    create: {
      userId: barberUser2.id,
      barbershopId: barbershop.id,
      bio: 'Creative stylist with expertise in modern trends and color',
      specialties: ['Modern Styles', 'Hair Coloring', 'Styling'],
      experience: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300',
    },
  });

  // Create services
  const services = [
    {
      name: 'Classic Haircut',
      description: 'Traditional haircut with precision and style',
      duration: 30,
      price: 25.00,
      category: 'Haircuts',
    },
    {
      name: 'Beard Trim',
      description: 'Professional beard shaping and trimming',
      duration: 20,
      price: 15.00,
      category: 'Grooming',
    },
    {
      name: 'Hot Towel Shave',
      description: 'Luxurious hot towel shave experience',
      duration: 45,
      price: 35.00,
      category: 'Shaving',
    },
    {
      name: 'Hair Wash & Style',
      description: 'Complete hair wash and styling service',
      duration: 25,
      price: 20.00,
      category: 'Styling',
    },
  ];

  for (const serviceData of services) {
    await prisma.service.upsert({
      where: { id: `${barbershop.id}-${serviceData.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `${barbershop.id}-${serviceData.name.toLowerCase().replace(/\s+/g, '-')}`,
        barbershopId: barbershop.id,
        ...serviceData,
        barbers: {
          connect: [{ id: barber1.id }, { id: barber2.id }],
        },
      },
    });
  }

  // Create schedules for barbers
  const weekDays = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
  for (const barber of [barber1, barber2]) {
    for (const day of weekDays) {
      await prisma.schedule.upsert({
        where: {
          barberId_dayOfWeek: {
            barberId: barber.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          barberId: barber.id,
          dayOfWeek: day,
          startTime: day === 6 ? '08:00' : '09:00', // Saturday starts earlier
          endTime: day >= 4 ? '20:00' : '18:00', // Thu-Fri end later
        },
      });
    }
  }

  // Create sample customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+1234567893',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Admin user created: ${admin.email}`);
  console.log(`Shop owner created: ${shopOwner.email}`);
  console.log(`Barbershop created: ${barbershop.name}`);
  console.log(`Barbers created: ${barber1.id}, ${barber2.id}`);
  console.log(`Customer created: ${customer.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });