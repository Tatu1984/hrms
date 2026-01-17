# HRMS - Human Resource Management System

A comprehensive, modern HRMS built with Next.js 16, TypeScript, Prisma, and Tailwind CSS.

## Features

- **Employee Management** - Complete employee profiles with KYC documents
- **Attendance Tracking** - Real-time with idle detection and bot detection
- **Leave Management** - Applications, approvals, balance tracking
- **Payroll Processing** - Automated salary calculations with payslips
- **Project & Task Management** - Projects, milestones, task assignments
- **Sales CRM** - Lead management and sales pipeline
- **Accounts & Invoicing** - Income/expense tracking, invoice generation
- **AI Features** - 8 AI-powered modules for intelligent HR operations
- **Integrations** - Azure DevOps, Asana, Confluence
- **IAM & RBAC** - Custom roles with granular permissions

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Default Login
- **Username:** admin
- **Password:** admin123

## Documentation

| Document | Description |
|----------|-------------|
| [DEVELOPERS_GUIDE.md](./DEVELOPERS_GUIDE.md) | Complete technical documentation for developers |
| [USER_MANUAL.md](./USER_MANUAL.md) | User guide for deployment and usage |
| [.env.example](./.env.example) | Environment variables reference |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS 4
- **UI:** Radix UI Components
- **Auth:** JWT with jose

## Project Structure

```
hrms1/
+-- prisma/             # Database schema
+-- src/
|   +-- app/            # Next.js App Router
|   |   +-- (admin)/    # Admin routes
|   |   +-- (employee)/ # Employee routes
|   |   +-- (manager)/  # Manager routes
|   |   +-- api/        # API routes
|   +-- components/     # React components
|   +-- lib/            # Utilities
+-- public/             # Static files
```

## Deployment

**Recommended:** Deploy to Vercel (FREE)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

Full deployment guide: [USER_MANUAL.md](./USER_MANUAL.md#3-deployment-guide)

## Security

- JWT authentication with httpOnly cookies
- Password hashing with bcryptjs
- Role-based access control (Admin, Manager, Employee)
- Granular permission system
- SQL injection prevention (Prisma ORM)
- Complete audit logging

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run seed         # Seed initial data
npm run studio       # Open Prisma Studio
```

## Environment Variables

Required:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

Optional (for AI features):
```env
OPENAI_API_KEY="sk-..."
```

## Support

- **Developer Guide:** [DEVELOPERS_GUIDE.md](./DEVELOPERS_GUIDE.md)
- **User Manual:** [USER_MANUAL.md](./USER_MANUAL.md)
- **Repository:** https://github.com/Tatu1984/hrms

---

**Built for Infiniti Tech Partners**
