# Sadaqah Express - Digital Product E-commerce Platform

A modern e-commerce platform for selling digital products, software licenses, and streaming subscriptions. Built with React, Express, TypeScript, and Redis.

## Features

- 🛍️ Product catalog with categories (Microsoft, Antivirus, VPN, Streaming, Educational, etc.)
- 🛒 Shopping cart with localStorage persistence
- 📦 Order management system
- 👨‍💼 Admin dashboard for product and order management
- 🌙 Dark/Light theme support
- 📧 Email notifications (order confirmation, admin alerts, delivery notifications)
- 🎨 Modern UI with shadcn/ui components
- 🔄 Real-time updates with TanStack Query

## Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Redis (primary storage)
- **Email Service**: Resend API
- **Build Tool**: esbuild

## Prerequisites

- Node.js 20.x or higher
- Redis instance (local or cloud-hosted)
- Resend API key (for email functionality)

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd MailDeliverShop
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory (see `.env.example` for reference):

```env
# Application Configuration
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# Redis Configuration
REDIS_HOST=your-redis-host.com
REDIS_PORT=12110
REDIS_PASSWORD=your-redis-password

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Build

1. **Build the application**
```bash
npm run build
```

This creates:
- Frontend build in `dist/public/`
- Backend build in `dist/`

2. **Start production server**
```bash
npm start
```

## Project Structure

```
Sadaqah Express/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
│   └── index.html
├── server/                 # Backend Express application
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Redis storage implementation
│   ├── email.ts            # Email service
│   └── vite.ts             # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Zod validation schemas
└── attached_assets/        # Static assets and images
```

## API Endpoints

### Products
- `GET /api/products` - Get all products (optional: `?category=<category>`)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status (admin)

### Authentication
- `POST /api/auth/login` - Admin login

## Database: Redis Storage

The application uses Redis as the primary database with the following storage patterns:

- **Products**: `product:{id}` (hash), `products:list` (set), `products:nextId` (string)
- **Orders**: `order:{id}` (JSON string), `orders:list` (set)
- **Users**: `user:{id}` (hash), `user:{username}` (string mapping)

## Email Notifications

The application sends three types of emails:

1. **Order Confirmation** - Sent to customers after placing an order
2. **Admin Notification** - Sent to admin when new order is received
3. **Product Delivery** - Sent to customers when order is marked as completed

Configure email settings in `.env`:
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM_EMAIL` - Sender email address
- `ADMIN_EMAIL` - Admin email for order notifications

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production!

## Deployment

### Deploy to Any Platform

This application is platform-agnostic and can be deployed to:

- **VPS/Cloud Server** (AWS EC2, DigitalOcean, etc.)
- **Container Platform** (Docker, Kubernetes)
- **PaaS** (Render, Railway, Fly.io, etc.)

### Docker Deployment (Example)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Environment Variables for Production

Make sure to set these environment variables in your deployment platform:

```env
NODE_ENV=production
PORT=5000
BASE_URL=https://yourdomain.com
REDIS_HOST=your-production-redis-host
REDIS_PORT=12110
REDIS_PASSWORD=your-production-redis-password
RESEND_API_KEY=your-production-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

## Security Considerations

- Store sensitive credentials in environment variables
- Use HTTPS in production
- Implement proper password hashing (currently using plain text for demo)
- Add rate limiting for API endpoints
- Implement proper session management
- Validate and sanitize all user inputs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on the GitHub repository.
