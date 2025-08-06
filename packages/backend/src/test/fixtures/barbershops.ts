export const barbershopFixtures = {
  validBarbershop: {
    name: 'The Great Barbershop',
    description: 'A premium barbershop experience',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94101',
    phone: '415-555-0123',
    email: 'info@greatbarbershop.com',
    website: 'https://greatbarbershop.com',
    businessHours: {
      monday: { open: '09:00', close: '19:00', closed: false },
      tuesday: { open: '09:00', close: '19:00', closed: false },
      wednesday: { open: '09:00', close: '19:00', closed: false },
      thursday: { open: '09:00', close: '19:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false },
    },
  },
  anotherBarbershop: {
    name: 'Classic Cuts',
    description: 'Traditional barbering services',
    address: '456 Oak Avenue',
    city: 'Oakland',
    state: 'CA',
    zipCode: '94602',
    phone: '510-555-0456',
    email: 'hello@classiccuts.com',
  },
  invalidBarbershopData: [
    {
      // Missing name
      description: 'A barbershop',
      address: '123 Main St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      phone: '555-0123',
    },
    {
      // Missing address
      name: 'Test Shop',
      description: 'A barbershop',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      phone: '555-0123',
    },
    {
      // Invalid phone format
      name: 'Test Shop',
      description: 'A barbershop',
      address: '123 Main St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      phone: 'invalid-phone',
    },
  ],
};