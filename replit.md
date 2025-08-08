# Axolotl Diary Application

## Overview

This is a full-stack diary application with a cute axolotl theme and user authentication system. Users can sign up, log in, and manage their personal diary entries with emotional states represented by axolotl characters. The application features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database support via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

- ✓ Added user authentication system with JWT tokens
- ✓ Implemented PostgreSQL database with user and diary entry tables
- ✓ Created signup and login pages with form validation
- ✓ Added user session management and protected routes
- ✓ Updated diary entries to be user-specific
- ✓ Added logout functionality with user greeting display
- ✓ Migrated database from Neon to Supabase for improved functionality
- ✓ Successfully connected to Supabase PostgreSQL database
- ✓ All existing user data and diary entries preserved during migration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom axolotl-themed color palette
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Client**: Supabase PostgreSQL with postgres-js client
- **Validation**: Zod schemas shared between frontend and backend
- **Development**: Hot reloading with Vite integration

### Data Storage
- **Database**: PostgreSQL configured for use with Supabase
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management
- **Schema Location**: `shared/schema.ts` for shared types between client and server

## Key Components

### Database Schema
The application uses two main tables:
- **Users**: User information (id, username, hashed password, createdAt)
- **Diary Entries**: Main content (id, userId, date, emotion, content, createdAt) - linked to specific users

### API Endpoints

#### Authentication Endpoints
- `POST /api/auth/signup` - User registration with username and password
- `POST /api/auth/login` - User login with credentials
- `GET /api/auth/me` - Get current user information (protected)

#### Diary Endpoints (All Protected)
- `GET /api/diary-entries` - Retrieve user's diary entries
- `GET /api/diary-entries/:id` - Retrieve a specific diary entry
- `POST /api/diary-entries` - Create a new diary entry
- `PUT /api/diary-entries/:id` - Update an existing diary entry
- `DELETE /api/diary-entries/:id` - Delete a diary entry
- `GET /api/diary-entries/search/:query` - Search user's diary entries

### Frontend Features
- **Emotion Selection**: Visual emotion picker with axolotl characters
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Search Functionality**: Filter diary entries by content or emotion
- **Form Validation**: Client-side validation with error handling
- **Toast Notifications**: User feedback for actions

## Data Flow

1. **User Input**: Forms collect diary entry data with emotion selection
2. **Client Validation**: Zod schemas validate data before submission
3. **API Communication**: TanStack Query handles server requests with caching
4. **Server Processing**: Express routes process requests with validation
5. **Database Operations**: Drizzle ORM performs type-safe database queries
6. **Response Handling**: Client updates UI based on server responses

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL client for Neon
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **react-hook-form**: Form handling
- **zod**: Runtime type validation
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Static type checking
- **drizzle-kit**: Database schema management
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations ensure schema is up-to-date

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)

### Scripts
- `npm run dev`: Start development server with hot reloading
- `npm run build`: Build both frontend and backend for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

### Architecture Decisions

**Monorepo Structure**: Chosen for simplified development and deployment, with shared types between client and server in the `shared/` directory.

**Drizzle ORM**: Selected for its TypeScript-first approach and excellent developer experience, providing type safety without runtime overhead.

**In-Memory Storage Fallback**: Implemented `MemStorage` class as a fallback storage mechanism, allowing development without immediate database setup.

**Emotion-Based Design**: The axolotl theme with emotion-based interactions creates an engaging user experience that makes diary writing more enjoyable.

**shadcn/ui**: Chosen for its high-quality, accessible components that can be customized while maintaining consistency.