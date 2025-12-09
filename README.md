# Invoice SaaS - Complete Billing Application

A production-ready invoice/billing SaaS application built with Next.js 14 (App Router), MongoDB, and Shadcn UI components. Features complete invoicing, customer management, analytics, PDF generation, and subscription management.

## Features

### Core Features
- **Invoice Management**
  - Create, edit, duplicate, and delete invoices
  - Multiple invoice statuses (Draft, Sent, Paid, Overdue, Cancelled)
  - Line items with automatic calculations
  - Tax and discount support
  - PDF generation with 3 professional templates (Modern, Classic, Minimal)
  - Bulk operations and CSV export

- **Business Management**
  - Multiple business profiles per account
  - Business details, logo, and branding
  - Default business selection

- **Customer Management**
  - Customer database with contact details
  - Customer-specific invoicing history
  - Top customers analytics

- **Analytics & Reports**
  - Dashboard with revenue charts
  - Invoice status breakdown
  - Customer insights
  - Business trends and AI-powered insights
  - Export reports to CSV

### Subscription System
- **Plan Tiers**
  - FREE: 5 invoices/month, 1 business
  - BASIC (Rs. 999/mo): 50 invoices/month, 2 businesses
  - PRO (Rs. 1,999/mo): Unlimited invoices, 5 businesses, custom branding
  - ENTERPRISE (Rs. 4,999/mo): Unlimited everything

- **Subscription Features**
  - 14-day free trial
  - Usage tracking and limits
  - Plan upgrade/downgrade
  - Manual payment verification

### User Features
- **Authentication**
  - User registration with email/password
  - JWT token management (access + refresh tokens)
  - Password reset functionality
  - Role-based access control (user/admin)

- **Settings**
  - Profile management
  - Invoice defaults (due days, tax rate, currency)
  - PDF template customization
  - Brand colors
  - Notification preferences

- **Notifications**
  - In-app notification center
  - Email notification preferences
  - Payment reminders

### Security
- bcrypt password hashing
- JWT access tokens (15 min expiry)
- HTTP-only refresh token cookies (7 day expiry)
- Session management in MongoDB

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **UI Components**: Shadcn UI (custom implementation)
- **Styling**: Module.CSS + Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **PDF Generation**: jsPDF + jspdf-autotable
- **Date Utilities**: date-fns
- **Export**: PapaParse (CSV), xlsx (Excel)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/route.js
│   │       ├── login/route.js
│   │       ├── logout/route.js
│   │       ├── me/route.js
│   │       ├── refresh/route.js
│   │       └── forgot-password/route.js
│   ├── admin/
│   ├── dashboard/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   └── ui/
│       ├── button.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── card.jsx
│       ├── alert.jsx
│       ├── avatar.jsx
│       └── dropdown-menu.jsx
├── context/
│   └── AuthContext.jsx
├── lib/
│   ├── db.js
│   ├── jwt.js
│   ├── utils.js
│   └── validations/
│       └── auth.js
├── middleware/
│   └── auth.js
└── models/
    ├── User.js
    └── Session.js
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
cd invoice-project
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/invoice-saas
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/logout` | Logout and invalidate session |
| GET | `/api/auth/me` | Get current user details |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | Get all invoices (with filters) |
| POST | `/api/invoices` | Create new invoice |
| GET | `/api/invoices/[id]` | Get single invoice |
| PUT | `/api/invoices/[id]` | Update invoice |
| DELETE | `/api/invoices/[id]` | Delete invoice |
| PATCH | `/api/invoices/[id]/status` | Update invoice status |
| POST | `/api/invoices/[id]/duplicate` | Duplicate invoice |
| GET | `/api/invoices/[id]/pdf` | Get invoice PDF data |
| GET | `/api/invoices/stats` | Get invoice statistics |
| POST | `/api/invoices/bulk` | Bulk operations |

### Businesses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/businesses` | Get all businesses |
| POST | `/api/businesses` | Create new business |
| GET | `/api/businesses/[id]` | Get single business |
| PUT | `/api/businesses/[id]` | Update business |
| DELETE | `/api/businesses/[id]` | Delete business |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | Get all customers |
| POST | `/api/customers` | Create new customer |
| GET | `/api/customers/[id]` | Get single customer |
| PUT | `/api/customers/[id]` | Update customer |
| DELETE | `/api/customers/[id]` | Delete customer |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard analytics |
| GET | `/api/analytics/revenue` | Revenue data |
| GET | `/api/analytics/customers` | Customer analytics |
| GET | `/api/analytics/trends` | Business trends |

### Subscription

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Get current subscription |
| GET | `/api/subscription/plans` | Get all plans |
| POST | `/api/subscription/upgrade` | Upgrade plan |
| POST | `/api/subscription/cancel` | Cancel subscription |
| GET | `/api/subscription/usage` | Get usage stats |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/user/profile` | User profile |
| PUT | `/api/user/password` | Change password |
| GET/PUT | `/api/settings/preferences` | User preferences |
| GET/PUT | `/api/settings/notifications` | Notification settings |
| GET/POST | `/api/notifications` | In-app notifications |

## User Roles

- **user**: Standard user with access to dashboard
- **admin**: Full access including admin panel

The first user to register with the `ADMIN_EMAIL` will automatically be assigned the admin role.

## Schemas

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['user', 'admin'],
  subscriptionPlan: ['free', 'basic', 'pro', 'enterprise'],
  trialEndDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Session Schema
```javascript
{
  userId: ObjectId,
  refreshToken: String,
  userAgent: String,
  ipAddress: String,
  isValid: Boolean,
  expiresAt: Date,
  createdAt: Date
}
```

## Security Notes

- Change JWT secrets in production
- Use HTTPS in production
- Consider rate limiting for auth endpoints
- Implement email verification for production use

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | User login |
| `/register` | User registration |
| `/forgot-password` | Password reset |
| `/pricing` | Subscription plans |
| `/dashboard` | Main dashboard with analytics |
| `/dashboard/invoices` | Invoice listing |
| `/dashboard/invoices/new` | Create new invoice |
| `/dashboard/invoices/[id]` | Invoice details |
| `/dashboard/invoices/[id]/edit` | Edit invoice |
| `/dashboard/businesses` | Business management |
| `/dashboard/customers` | Customer management |
| `/dashboard/reports` | Reports & analytics |
| `/dashboard/settings` | User settings |
| `/admin` | Admin panel |

## License

MIT

---

**SECTION TOKEN: USER_FEATURES_COMPLETE**
