# Barber Booking SaaS Platform

A modern, full-stack barber appointment booking platform built with React, Node.js, TypeScript, and PostgreSQL. This monorepo contains both the frontend and backend applications for a comprehensive barber booking system.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Appointment Booking**: Real-time appointment scheduling and management
- **Barbershop Management**: Comprehensive barbershop and barber profiles
- **Service Management**: Flexible service offerings with pricing and duration
- **Review System**: Customer reviews and ratings
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS
- **Real-time Updates**: Live appointment status updates
- **Payment Integration**: Ready for Stripe payment integration
- **Admin Dashboard**: Administrative controls and analytics

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Zustand** for state management
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Joi** for validation
- **Helmet** for security
- **Morgan** for logging
- **Rate limiting** for API protection

## Project Structure

```
barber-booking-saas/
├── packages/
│   ├── frontend/          # React frontend application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Page components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── services/      # API service functions
│   │   │   ├── store/         # Zustand state management
│   │   │   ├── types/         # TypeScript type definitions
│   │   │   └── utils/         # Utility functions
│   │   ├── public/            # Public assets
│   │   └── package.json
│   │
│   └── backend/           # Node.js backend API
│       ├── src/
│       │   ├── controllers/   # Request handlers
│       │   ├── middleware/    # Express middleware
│       │   ├── routes/        # API routes
│       │   ├── services/      # Business logic
│       │   ├── types/         # TypeScript types
│       │   └── utils/         # Utility functions
│       ├── prisma/            # Database schema and migrations
│       └── package.json
│
├── package.json           # Root package.json (workspace config)
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
└── README.md             # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd barber-booking-saas
```

### 2. Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm install
```

### 3. Environment Setup

#### Backend Environment
```bash
# Copy the example environment file
cp packages/backend/.env.example packages/backend/.env

# Edit the environment variables
nano packages/backend/.env
```

**Required Environment Variables:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/barber_booking_db"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend Environment
```bash
# Copy the example environment file
cp packages/frontend/.env.example packages/frontend/.env

# Edit if needed (defaults should work for development)
nano packages/frontend/.env
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to your database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start them separately:
npm run dev:backend    # Backend on http://localhost:5000
npm run dev:frontend   # Frontend on http://localhost:3000
```

## Available Scripts

### Root Level Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run lint` - Run ESLint on all packages
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm test` - Run tests in all packages

### Backend Scripts
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Build backend for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

### Frontend Scripts
- `npm run dev:frontend` - Start frontend development server
- `npm run build:frontend` - Build frontend for production
- `npm run preview` - Preview production build locally

## Database Schema

The application uses the following main entities:

- **Users**: Customer, barber, shop owner, and admin accounts
- **Barbershops**: Business locations with details and hours
- **Barbers**: Individual barber profiles linked to barbershops
- **Services**: Available services with pricing and duration
- **Appointments**: Booking records with status tracking
- **Reviews**: Customer feedback and ratings
- **Payments**: Transaction records (ready for Stripe integration)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Barbershops
- `GET /api/barbershops` - List barbershops
- `GET /api/barbershops/:id` - Get barbershop details
- `POST /api/barbershops` - Create barbershop (shop owners)
- `PUT /api/barbershops/:id` - Update barbershop

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

## Development Workflow

### Code Quality
The project includes ESLint and Prettier configurations for consistent code style:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Changes
When making schema changes:

1. Update `packages/backend/prisma/schema.prisma`
2. Generate and apply changes:
   ```bash
   npm run db:generate
   npm run db:push  # For development
   # OR
   npm run db:migrate  # For production
   ```

### Testing
```bash
# Run all tests
npm test

# Run backend tests only
npm run test --workspace=backend

# Run tests in watch mode
npm run test:watch --workspace=backend
```

## Deployment

### Backend Deployment
The backend can be deployed to any Node.js hosting service:

1. Build the application: `npm run build:backend`
2. Set production environment variables
3. Run database migrations: `npm run db:migrate`
4. Start the server: `npm start --workspace=backend`

### Frontend Deployment
The frontend builds to static files and can be deployed to any static hosting service:

1. Build the application: `npm run build:frontend`
2. Deploy the `packages/frontend/dist` folder

### Environment Variables for Production
Make sure to set appropriate production values for:
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Strong, unique secret key
- `NODE_ENV=production`
- Frontend API URL pointing to your backend

## Sample User Accounts

After running `npm run db:seed`, you can use these accounts:

**Admin User:**
- Email: `admin@barberbooking.com`
- Password: `admin123`

**Shop Owner:**
- Email: `owner@example.com`
- Password: `owner123`

**Barber:**
- Email: `mike@example.com`
- Password: `barber123`

**Customer:**
- Email: `customer@example.com`
- Password: `customer123`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@barberbooking.com or create an issue in the repository.

## Roadmap

- [ ] Payment integration with Stripe
- [ ] SMS notifications
- [ ] Advanced scheduling features
- [ ] Mobile app development
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] Loyalty program integration