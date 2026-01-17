# HRMS Developer's Guide

> Complete technical documentation for the Human Resource Management System

**Version:** 2.1
**Last Updated:** January 17, 2026
**Organization:** Infiniti Tech Partners

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Project Structure](#3-project-structure)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [IAM & RBAC System](#8-iam--rbac-system)
9. [Time & Attendance System](#9-time--attendance-system)
10. [Payroll System](#10-payroll-system)
11. [Algorithms Reference](#11-algorithms-reference)
12. [Integrations](#12-integrations)
13. [AI/ML Features](#13-aiml-features)
14. [Environment Variables](#14-environment-variables)
15. [Deployment](#15-deployment)
16. [Testing](#16-testing)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Project Overview

### Architecture

```
+-----------------------------------------------------------------+
|                        FRONTEND (Next.js)                        |
|  +----------+  +----------+  +----------+  +------------------+  |
|  |  Admin   |  | Manager  |  | Employee |  | Shared Components|  |
|  |  Pages   |  |  Pages   |  |  Pages   |  | (UI, Forms, etc) |  |
|  +----------+  +----------+  +----------+  +------------------+  |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|                      API ROUTES (Next.js)                        |
|  /api/auth  /api/attendance  /api/employees  /api/payroll  ...   |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|                    PRISMA ORM + PostgreSQL                       |
|  Users, Employees, Attendance, Leaves, Payroll, Projects, etc.   |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|                      EXTERNAL INTEGRATIONS                       |
|    Azure DevOps    |    Asana    |    Confluence    |   OpenAI   |
+-----------------------------------------------------------------+
```

### Key Features

- **Attendance & Time Tracking** - Punch in/out, breaks, idle detection, bot detection
- **Leave Management** - Applications, approvals, balance tracking
- **Payroll Processing** - Salary calculations, deductions, payslips
- **Project Management** - Projects, tasks, work items from external tools
- **Employee Management** - Profiles, documents, banking details
- **IAM & RBAC** - Custom roles, granular permissions, role assignment
- **AI/ML Engine** - Predictions, chatbot, document processing, recruitment
- **Integrations** - Azure DevOps, Asana, Confluence
- **Sales CRM** - Leads, sales tracking, commission calculation
- **Accounting** - Income/expense tracking, invoices

---

## 2. Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use NeonDB for serverless)
- npm or yarn
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hrms1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (with Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run migrations |
| `npx prisma generate` | Regenerate Prisma client |

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

**Note:** Change default passwords immediately in production!

---

## 3. Project Structure

```
hrms1/
+-- prisma/
|   +-- schema.prisma          # Database schema
+-- public/
|   +-- uploads/               # Uploaded files (documents, images)
+-- src/
|   +-- app/                   # Next.js App Router
|   |   +-- (admin)/          # Admin pages (grouped route)
|   |   |   +-- admin/
|   |   |       +-- dashboard/
|   |   |       +-- employees/
|   |   |       +-- attendance/
|   |   |       +-- time-analytics/
|   |   |       +-- payroll/
|   |   |       +-- projects/
|   |   |       +-- leaves/
|   |   |       +-- ...
|   |   +-- (manager)/        # Manager pages
|   |   +-- (employee)/       # Employee pages
|   |   +-- api/              # API routes
|   |   |   +-- auth/
|   |   |   +-- attendance/
|   |   |   +-- employees/
|   |   |   +-- iam/
|   |   |   +-- payroll/
|   |   |   +-- ...
|   |   +-- login/
|   |   +-- layout.tsx
|   |   +-- page.tsx
|   +-- components/           # React components
|   |   +-- ui/              # Base UI components (shadcn/ui)
|   |   +-- admin/           # Admin-specific components
|   |   +-- employee/        # Employee-specific components
|   |   +-- attendance/      # Attendance components
|   |   +-- iam/             # IAM & RBAC components
|   |   +-- forms/           # Form dialogs
|   |   +-- integrations/    # Integration components
|   |   +-- ai/              # AI components
|   |   +-- shared/          # Shared components
|   +-- lib/                  # Utility libraries
|       +-- db.ts            # Prisma client
|       +-- auth.ts          # Authentication utilities
|       +-- permissions.ts   # RBAC permissions & helpers
|       +-- utils.ts         # General utilities
|       +-- ai/              # AI/ML modules
|       +-- integrations/    # Integration clients
+-- next.config.ts
+-- tailwind.config.ts
+-- tsconfig.json
+-- package.json
```

### Route Groups

| Route Group | Path Prefix | Purpose |
|-------------|-------------|---------|
| `(admin)` | `/admin/*` | Admin dashboard and management |
| `(auth)` | `/login` | Authentication pages |
| `(employee)` | `/employee/*` | Employee self-service portal |
| `(manager)` | `/manager/*` | Manager dashboard |

---

## 4. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Radix UI | - | Headless UI components |
| Lucide React | - | Icon library |
| Recharts | - | Data visualization |
| date-fns | - | Date manipulation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | - | Server-side API |
| Prisma | 6.x | ORM and database toolkit |
| PostgreSQL | - | Primary database |
| bcryptjs | - | Password hashing |
| jose | - | JWT token handling |
| Zod | - | Schema validation |

### AI/ML Stack
| Technology | Purpose |
|------------|---------|
| OpenAI | GPT-4/3.5 for AI features |
| LangChain | LLM orchestration |
| Tesseract.js | OCR for document processing |
| natural | NLP utilities |

---

## 5. Database Schema

### Core Models

#### User
```prisma
model User {
  id          String     @id @default(cuid())
  email       String     @unique
  username    String     @unique
  password    String                    // bcrypt hashed
  role        Role       @default(EMPLOYEE)
  employeeId  String?    @unique
  permissions Json?
  employee    Employee?  @relation(...)
  userRoles   UserRole[]
}
```

#### Employee
```prisma
model Employee {
  id                String   @id @default(cuid())
  employeeId        String   @unique    // Display ID (EMP001)
  name              String
  email             String   @unique
  phone             String
  designation       String
  department        String
  salary            Float
  variablePay       Float?
  dateOfJoining     DateTime
  isActive          Boolean  @default(true)
  reportingHeadId   String?
  // Relations
  attendance        Attendance[]
  leaves            Leave[]
  payroll           Payroll[]
  tasks             Task[]
  user              User?
  bankingDetails    BankingDetails?
}
```

#### Attendance
```prisma
model Attendance {
  id            String   @id @default(cuid())
  employeeId    String
  date          DateTime
  punchIn       DateTime?
  punchOut      DateTime?
  grossHours    Float?    // Total time (punchOut - punchIn)
  totalHours    Float?    // Active work = gross - break - idle
  breakDuration Float?
  idleTime      Float?
  status        AttendanceStatus
  // Relations
  activityLogs  ActivityLog[]
  breaks        Break[]

  @@unique([employeeId, date])
}
```

#### ActivityLog (Heartbeats)
```prisma
model ActivityLog {
  id              String    @id @default(cuid())
  attendanceId    String
  timestamp       DateTime
  active          Boolean   @default(true)
  suspicious      Boolean   @default(false)
  source          String?   // 'client' or 'server'
  patternType     String?
  patternDetails  String?
  ipAddress       String?
  userAgent       String?
}
```

### Time Calculation Formula
```
Gross Hours = Punch Out - Punch In
Break Hours = Sum of all break durations
Idle Hours  = Inactive heartbeats x 5 minutes (excluding breaks)
Active Work = Gross Hours - Break Hours - Idle Hours
```

### All Models Reference

| Model | Description |
|-------|-------------|
| `User` | Login credentials & roles |
| `IAMRole` | Custom roles with permissions |
| `UserRole` | User-role assignments |
| `Permission` | Permission definitions |
| `Employee` | Employee profile & info |
| `Attendance` | Daily attendance records |
| `Break` | Break periods within attendance |
| `ActivityLog` | Activity heartbeats |
| `Leave` | Leave applications |
| `Payroll` | Monthly payroll records |
| `Project` | Project information |
| `Task` | Tasks within projects |
| `Lead` | Sales leads |
| `Sale` | Sales records |
| `Account` | Accounting entries |
| `Invoice` | Client invoices |
| `IntegrationConnection` | External integrations |
| `WorkItem` | External work items |

---

## 6. API Reference

### Authentication

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/login` | POST | User login | Public |
| `/api/auth/logout` | POST | User logout | Auth |
| `/api/auth/me` | GET | Get current user | Auth |

**Login Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "role": "ADMIN",
    "employeeId": "..."
  }
}
```

### Attendance

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attendance` | GET | Get attendance records |
| `/api/attendance` | POST | Punch in/out, break start/end |
| `/api/attendance/heartbeat` | POST | Activity heartbeat |
| `/api/attendance/recalculate-idle` | POST | Recalculate idle time (Admin) |

**Punch In/Out:**
```json
POST /api/attendance
{ "action": "punch-in" }  // or "punch-out", "break-start", "break-end"
```

**Heartbeat:**
```json
POST /api/attendance/heartbeat
{
  "active": true,
  "suspicious": false,
  "patternType": null
}
```

### Employees

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employees` | GET | List all employees |
| `/api/employees` | POST | Create employee (Admin) |
| `/api/employees/[id]` | GET, PUT, DELETE | Single employee CRUD |
| `/api/employees/[id]/documents` | GET, POST | Employee documents |
| `/api/employees/[id]/banking` | GET, POST | Banking details |

### Payroll

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payroll` | GET | Get payroll records |
| `/api/payroll` | POST | Generate payroll (Admin) |
| `/api/payroll/[id]` | PUT | Update payroll status |

### Leaves

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaves` | GET | List leave requests |
| `/api/leaves` | POST | Apply for leave |
| `/api/leaves` | PUT | Approve/reject leave |

### Projects & Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET, POST | Projects CRUD |
| `/api/tasks` | GET, POST | Tasks CRUD |
| `/api/work-items` | GET | External work items |

### Sales & CRM

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | GET, POST | Lead management |
| `/api/sales` | GET, POST | Sales records |
| `/api/invoices` | GET, POST | Invoice management |

### IAM

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/iam/roles` | GET, POST | List/create roles |
| `/api/iam/roles/[id]` | GET, PUT, DELETE | Manage single role |
| `/api/iam/permissions` | GET | List all permissions |
| `/api/iam/users/[id]/roles` | GET, POST, DELETE | Manage user roles |

### Integrations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/connections` | GET, POST | Integration connections |
| `/api/integrations/sync` | POST | Sync external data |

### AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | AI chatbot |
| `/api/ai/predictions` | GET | AI predictions |
| `/api/ai/recruitment` | POST | Resume parsing |
| `/api/ai/documents` | POST | Document processing |

---

## 7. Authentication & Authorization

### JWT Session Management

```typescript
// Session stored in HTTP-only cookie
// 7-day expiration
// Contains: userId, email, role, employeeId, name

export async function getSession(): Promise<SessionData | null>
export async function encrypt(payload: SessionData): Promise<string>
export async function decrypt(token: string): Promise<SessionData>
```

### Role-Based Access Control

**Roles:**
- `ADMIN`: Full system access
- `MANAGER`: Team management, limited admin functions
- `EMPLOYEE`: Personal data and assigned tasks only

**Permission Check Example:**
```typescript
const session = await getSession();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
if (session.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 8. IAM & RBAC System

### Permission Codes

Permissions follow the format: `module.action`

| Module | Actions | Example |
|--------|---------|---------|
| `dashboard` | view | `dashboard.view` |
| `employees` | view, manage, delete | `employees.manage` |
| `attendance` | view, manage, edit | `attendance.edit` |
| `leaves` | view, manage, approve | `leaves.approve` |
| `payroll` | view, process | `payroll.process` |
| `projects` | view, manage | `projects.manage` |
| `iam` | view, manage | `iam.manage` |

### Default System Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | All permissions (full access) |
| **MANAGER** | employees.view, attendance.*, leaves.approve, projects.*, tasks.*, reports.view |
| **EMPLOYEE** | dashboard.view, attendance.view (own), leaves.view (own), tasks.view (assigned) |

### Permission Helpers

```typescript
import { hasPermission, hasAnyPermission, PERMISSIONS } from '@/lib/permissions';

// Check single permission
if (hasPermission(userPermissions, 'employees.manage')) {
  // Can manage employees
}

// Check any of multiple permissions
if (hasAnyPermission(userPermissions, ['leaves.approve', 'leaves.manage'])) {
  // Can handle leaves
}
```

### Creating Custom Roles

```typescript
POST /api/iam/roles
{
  "name": "HR Manager",
  "displayName": "HR Manager",
  "description": "Manages HR operations",
  "permissions": [
    "employees.view",
    "employees.manage",
    "leaves.view",
    "leaves.manage",
    "leaves.approve"
  ],
  "color": "purple"
}
```

---

## 9. Time & Attendance System

### Activity Tracking Flow

```
Employee Punches In
       |
       v
+---------------------------------------+
|     ActivityTracker Component         |
|  - Listens for mouse, keyboard, scroll|
|  - Detects suspicious patterns (bots) |
|  - Sends heartbeat every 5 minutes    |
+---------------------------------------+
       |
       v
+---------------------------------------+
|     POST /api/attendance/heartbeat    |
|  - Records ActivityLog entry          |
|  - active: true/false                 |
|  - suspicious: true/false             |
+---------------------------------------+
       |
       v
Employee Punches Out
       |
       v
+---------------------------------------+
|     Calculate Time on Punch Out       |
|  - grossHours = punchOut - punchIn    |
|  - breakDuration = sum of breaks      |
|  - idleTime = inactive heartbeats x 5m|
|  - totalHours = gross - break - idle  |
+---------------------------------------+
```

### VM/RDP Mode

When employees work in Remote Desktop (RDP) full-screen mode, enable VM Mode to prevent false idle time:

```typescript
// Toggle VM Mode
const toggleVmMode = () => {
  const newValue = !vmMode;
  setVmMode(newValue);
  localStorage.setItem('hrms_vm_mode', newValue.toString());
};
```

### Bot Detection

The system detects:
- **Mouse Jiggler** - Oscillating patterns with exact distances/timing
- **Auto-clicker** - Clicks at exact intervals
- **Auto-typer** - Keystrokes at exact intervals
- **Static Mouse** - Fake movement events without actual movement

---

## 10. Payroll System

### Salary Types

- **FIXED:** Fixed monthly salary
- **VARIABLE:** Base salary + variable component (for sales)

### Payroll Calculation

```
1. Calculate Present Days
   presentDays = fullPresentDays + (0.5 x halfDays)

2. Calculate Basic Payable
   basicPayable = (salary / 30) x presentDays

3. Calculate Variable Payable (Sales only)
   IF achievement >= 100%: variablePayable = variablePay
   ELSE IF achievement >= 50%: variablePayable = variablePay x (achievement/100)
   ELSE: variablePayable = 0

4. Calculate Gross Salary
   grossSalary = basicPayable + variablePayable

5. Calculate Deductions
   totalDeductions = professionalTax + tds + penalties + advance

6. Calculate Net Salary
   netSalary = grossSalary - totalDeductions
```

---

## 11. Algorithms Reference

### Idle Time Calculation

```
idleTime (hours) = inactiveHeartbeats x 0.05
```

Each inactive heartbeat represents 3 minutes of inactivity.

### Attendance Status Decision

| Condition | Status |
|-----------|--------|
| Punched in, worked >= 6 hours | PRESENT |
| Punched in, worked < 6 hours | HALF_DAY |
| No punch in/out | ABSENT |
| Leave approved | LEAVE |
| Saturday/Sunday | WEEKEND |
| Company holiday | HOLIDAY |

### Suspicious Activity Detection

**Keystroke Patterns:**
- Same key pressed 10 times consecutively = REPETITIVE_KEY
- Keys pressed at exact intervals (8/9 within 100ms) = AUTO_TYPER
- Perfect alternation between 2 keys = MACRO

**Mouse Patterns:**
- Linear movement (8/9 within 5 degrees) = MOUSE_JIGGLER
- All positions identical = STATIC_MOUSE

### Sales Commission Tiers

| Achievement % | Commission Rate |
|---------------|-----------------|
| >= 100% | 10% |
| 75% - 99% | 7% |
| 50% - 74% | 5% |
| < 50% | 0% |

### Leave Balance

```
CASUAL_LEAVES = 12 days/year
SICK_LEAVES = 12 days/year
EARNED_LEAVES = 12 days/year
TOTAL = 36 days/year

remaining = totalQuota - usedLeaves
```

### Constants

```
HEARTBEAT_INTERVAL_CLIENT = 30 seconds
HEARTBEAT_INTERVAL_SERVER = 3 minutes
IDLE_THRESHOLD = 5 minutes
WORKING_DAYS_PER_MONTH = 30
PROFESSIONAL_TAX = Rs.200/month
```

---

## 12. Integrations

### Azure DevOps

```typescript
// src/lib/integrations/azure-devops-client.ts

class AzureDevOpsClient {
  async getWorkItems(projectName: string): Promise<WorkItem[]>
  async getCommits(repositoryId: string): Promise<Commit[]>
  async getPullRequests(repositoryId: string): Promise<PullRequest[]>
}
```

**Setup:**
1. Go to Azure DevOps User Settings > Personal Access Tokens
2. Create token with Work Items (Read), Code (Read), Graph (Read)
3. Add connection in Admin > Integrations

### Asana

```typescript
// src/lib/integrations/asana-client.ts

class AsanaClient {
  async getTasks(projectId: string): Promise<Task[]>
  async getProjects(): Promise<Project[]>
}
```

### Confluence

```typescript
// src/lib/integrations/confluence-client.ts

class ConfluenceClient {
  async getPages(spaceKey: string): Promise<Page[]>
  async getPageContent(pageId: string): Promise<string>
}
```

---

## 13. AI/ML Features

### Available AI Modules

| Feature | File | Description |
|---------|------|-------------|
| Document Processing | `document-processing/index.ts` | Resume parsing, OCR |
| Predictive Analytics | `predictive-analytics/index.ts` | Attrition prediction |
| Smart Recruitment | `recruitment/index.ts` | Resume matching, bias detection |
| HR Chatbot | `chatbot/index.ts` | 24/7 HR assistance |
| Sentiment Analysis | `sentiment/index.ts` | Team morale tracking |
| Intelligent Automation | `automation/index.ts` | Auto-approval rules |
| Learning & Development | `learning/index.ts` | Skill gap analysis |
| Advanced Analytics | `analytics/index.ts` | Natural language queries |

### Usage Example

```typescript
import { predictiveAnalytics, smartRecruitment, hrChatbot } from '@/lib/ai';

// Predict attrition
const prediction = await predictiveAnalytics.predictAttrition(employeeId);

// Parse resume
const parsed = await smartRecruitment.parseResume(resumeText);

// Chat with HR bot
const response = await hrChatbot.chat(sessionId, userId, message, employeeId);
```

---

## 14. Environment Variables

### Required

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/hrms"

# Authentication
JWT_SECRET="your-super-secret-key-min-32-chars"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Optional

```env
# Cron Jobs
CRON_SECRET="secret-for-cron-authentication"

# AI Features
OPENAI_API_KEY="sk-..."
AI_DOCUMENT_PROCESSING=true
AI_PREDICTIVE_ANALYTICS=true
AI_CHATBOT=true
```

---

## 15. Deployment

### Build for Production

```bash
npm run build
```

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database Migration

```bash
# Development
npx prisma migrate dev --name migration_name

# Production
npx prisma migrate deploy
```

### Cron Jobs

Set up auto-heartbeat cron (every 3 minutes):
```
POST /api/attendance/auto-heartbeat
Authorization: Bearer {CRON_SECRET}
```

---

## 16. Testing

### Manual Testing Checklist

- [ ] Login/Logout flow
- [ ] Attendance punch in/out
- [ ] Heartbeat tracking (check browser console)
- [ ] Employee status dashboard updates
- [ ] Payroll generation and calculations
- [ ] Leave request approval workflow
- [ ] Permission checks (access admin as employee)

### Test Login

```
Username: admin
Password: admin123
Role: ADMIN
```

---

## 17. Troubleshooting

### Common Issues

**Database connection errors:**
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Check network/firewall rules

**Authentication issues:**
- Verify `JWT_SECRET` is set
- Clear cookies and re-login
- Check token expiration (7 days)

**Activity tracking not working:**
- Check browser console for errors
- Verify employee is punched in
- Check `localStorage` for `hrms_punched_in=true`

**Idle time calculation issues:**
- Run recalculate: POST `/api/attendance/recalculate-idle` with `{"all": true}`
- Check that breaks are properly recorded
- Verify heartbeats are being sent

**Build fails:**
- Check environment variables are set
- Run `npx prisma generate` before build
- Clear `.next` folder and rebuild

---

## Quick Reference

### Adding a New API Endpoint

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await prisma.myModel.findMany();
  return NextResponse.json(data);
}
```

### Adding a New Page

```typescript
// src/app/(admin)/admin/my-page/page.tsx
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }
  return <div>My Page Content</div>;
}
```

### Adding a Database Model

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_my_model`
3. Prisma client is auto-regenerated

---

## Support

For questions or issues, contact the development team.

**Repository:** https://github.com/Tatu1984/hrms

---

*HRMS - Built for Infiniti Tech Partners*
