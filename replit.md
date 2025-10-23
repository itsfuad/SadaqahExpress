# BD TechPark - Digital Product Subscription Platform

## Overview

BD TechPark is an e-commerce platform for selling digital products, software licenses, and streaming subscriptions. The platform features a product catalog with categories (Microsoft, Antivirus, VPN, Streaming, Educational, Editing, Music, Utilities), shopping cart functionality, order processing, and an admin dashboard for managing products and orders. The application is built with a modern React frontend and Express backend, emphasizing a clean, accessible user interface with dark mode support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- **Framework**: React 18+ with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system

**Design System**
- **Component Library**: shadcn/ui "new-york" style variant
- **Typography**: Google Fonts - Inter (UI/body), DM Sans (headings), JetBrains Mono (monospace)
- **Color Scheme**: Dark mode primary with HSL-based color system, neutral base color
- **Theme Support**: Light/dark mode toggle with localStorage persistence via ThemeProvider

**Key Frontend Patterns**
- Component-based architecture with reusable UI components in `/client/src/components/ui`
- Custom business components (Header, Footer, ProductCard, ShoppingCart, etc.) in `/client/src/components`
- Page-level components in `/client/src/pages`
- Shopping cart state persisted to localStorage
- Form validation using react-hook-form with Zod schemas

### Backend Architecture

**Technology Stack**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Build Tool**: Vite for frontend, esbuild for backend

**API Structure**
- RESTful API endpoints under `/api` prefix
- Product management: GET /api/products, GET /api/products/:id, POST /api/products
- Order management: GET /api/orders, POST /api/orders, PATCH /api/orders/:id/status
- Admin authentication: POST /api/auth/login

**Data Storage**
- In-memory storage implementation (MemStorage) for development/testing
- Designed to be swapped with PostgreSQL via Drizzle ORM
- Schema definitions in `/shared/schema.ts` with Zod validation
- Database migrations configured in `drizzle.config.ts`

**Session Management**
- Cookie-based sessions with connect-pg-simple (PostgreSQL session store)
- Admin authentication stored in localStorage (client-side)

### Build and Development

**Development Mode**
- Vite dev server with HMR (Hot Module Replacement)
- Express backend runs on same server using Vite middleware mode
- Replit-specific plugins for error overlay, cartographer, and dev banner

**Production Build**
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server code to `dist` as ESM module
- Static file serving from build output

**Module System**
- ESNext modules throughout (type: "module" in package.json)
- Path aliases: `@/` for client src, `@shared/` for shared code, `@assets/` for assets
- TypeScript with strict mode enabled

## External Dependencies

### Third-Party Services

**Email Service**
- **Provider**: Resend
- **Purpose**: Send order confirmation emails to customers
- **Configuration**: API key and from email stored in Replit Connectors
- **Implementation**: `/server/email.ts` handles email delivery with credentials fetched from Replit Connectors API

**Database**
- **Provider**: Neon (PostgreSQL serverless)
- **Connection**: Via `@neondatabase/serverless` driver
- **Configuration**: DATABASE_URL environment variable required
- **ORM**: Drizzle ORM with schema migrations support

### Key NPM Packages

**UI and Styling**
- Radix UI component primitives (20+ packages for dialogs, dropdowns, etc.)
- Tailwind CSS with PostCSS
- class-variance-authority and clsx for conditional styling
- embla-carousel-react for carousels

**Forms and Validation**
- react-hook-form for form management
- @hookform/resolvers for Zod integration
- zod for schema validation
- drizzle-zod for database schema validation

**State Management**
- @tanstack/react-query for server state and caching
- React Context for theme and sidebar state

**Development Tools**
- Replit-specific Vite plugins (@replit/vite-plugin-*)
- tsx for TypeScript execution in development
- drizzle-kit for database migrations

### Assets and Resources

**Images**
- Product images stored in `/attached_assets/generated_images/`
- Hero carousel images for Windows 10 Pro, Office 2021, YouTube Premium
- Placeholder images for product cards

**Fonts**
- Loaded from Google Fonts CDN (Inter, DM Sans, JetBrains Mono)
- Preconnect hints for performance optimization