# DB Gas - LPG Retail & Wholesale Website

## Overview

This is a full-stack eCommerce web application for DB Gas, an LPG (Liquid Petroleum Gas) retail and wholesale company operating in Zimbabwe. The application provides a professional multi-page website with online shopping capabilities, inventory management, user authentication, and payment processing integration.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

This is a **monorepo fullstack application** using a modern TypeScript-based stack:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query for server state, custom hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect with Replit Auth integration
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Key Tables**: products, users, orders, inquiries, inventory_movements, stock_alerts, sessions
- **Migration Strategy**: Drizzle Kit for schema migrations

## Key Components

### Product Management
- Product catalog with categories (LPG products and accessories)
- Stock quantity tracking with low-stock alerts
- Inventory movement logging for audit trails
- Automated reorder level notifications

### eCommerce Features
- Shopping cart with localStorage persistence
- User authentication required for checkout
- Order processing with multiple payment methods
- Real-time inventory updates

### User Management
- Replit-based authentication system
- User profile management
- Order history tracking
- Admin-level inventory management access

### Payment Integration
- Paynow payment gateway for Zimbabwe market
- Support for EcoCash, USD Cash, and Bank Transfer
- Order status tracking and management

### Safety & Compliance
- ZERA (Zimbabwe Energy Regulatory Authority) compliance information
- Downloadable safety guides and installation manuals
- Storage checklists and safety protocols

## Data Flow

1. **User Authentication**: Users authenticate via Replit's OpenID Connect flow
2. **Product Browsing**: Products are fetched from PostgreSQL via REST API
3. **Shopping Cart**: Cart state managed locally with React hooks, persisted in localStorage
4. **Checkout Process**: Authentication check → Order creation → Payment processing → Inventory updates
5. **Inventory Management**: Real-time stock tracking with automatic alerts for low inventory
6. **Order Fulfillment**: Order status updates through admin interface

## External Dependencies

### Production Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Payment**: Paynow payment gateway for Zimbabwe
- **Authentication**: Replit OpenID Connect provider
- **UI Components**: Radix UI primitives with shadcn/ui
- **Email**: Contact form submissions (API endpoint)

### Development Tools
- **Vite**: Development server with HMR
- **TypeScript**: Type checking and compilation
- **Tailwind CSS**: Utility-first styling
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Build Process
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: esbuild bundles Node.js server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key
- **REPL_ID**: Replit environment identifier
- **ISSUER_URL**: OpenID Connect issuer URL

### Production Deployment
- Server runs on Node.js with Express serving both API and static files
- PostgreSQL database handles all persistent data
- Sessions stored in database for scalability
- Static assets served from `dist/public`

### Development Setup
- `npm run dev`: Starts development server with hot reload
- `npm run build`: Builds production bundle
- `npm run db:push`: Applies database schema changes
- Database automatically provisioned in Replit environment

The application is designed specifically for the Zimbabwe market with local payment methods, regulatory compliance information, and business requirements tailored to DB Gas operations.