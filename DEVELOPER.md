# HRMS Developer Guide

> Complete technical documentation for the Human Resource Management System

**Last Updated:** January 2026
**Version:** 2.0
**Tech Stack:** Next.js 16, TypeScript, Prisma, PostgreSQL, TailwindCSS

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Components](#6-components)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Time & Attendance System](#8-time--attendance-system)
9. [Integrations](#9-integrations)
10. [AI/ML Features](#10-aiml-features)
11. [Environment Variables](#11-environment-variables)
12. [Deployment](#12-deployment)

---

## 1. Project Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Admin   │  │ Manager  │  │ Employee │  │  Shared Components│ │
│  │  Pages   │  │  Pages   │  │  Pages   │  │  (UI, Forms, etc) │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                        │
│  /api/auth  /api/attendance  /api/employees  /api/payroll  ...  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRISMA ORM + PostgreSQL                       │
│  Users, Employees, Attendance, Leaves, Payroll, Projects, etc.  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                       │
│    Azure DevOps    │    Asana    │    Confluence    │   OpenAI  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

- **Attendance & Time Tracking** - Punch in/out, breaks, idle detection, bot detection
- **Leave Management** - Applications, approvals, balance tracking
- **Payroll Processing** - Salary calculations, deductions, payslips
- **Project Management** - Projects, tasks, work items from external tools
- **Employee Management** - Profiles, documents, banking details
- **AI/ML Engine** - Predictions, chatbot, document processing, recruitment
- **Integrations** - Azure DevOps, Asana, Confluence
- **Multi-role Access** - Admin, Manager, Employee dashboards

---

## 2. Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

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

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev   # Run migrations
npx prisma generate  # Regenerate Prisma client
```

---

## 3. Project Structure

```
hrms1/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── uploads/               # Uploaded files (documents, images)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (admin)/          # Admin pages (grouped route)
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── employees/
│   │   │       ├── attendance/
│   │   │       ├── time-analytics/
│   │   │       ├── payroll/
│   │   │       ├── projects/
│   │   │       ├── leaves/
│   │   │       └── ...
│   │   ├── (manager)/        # Manager pages
│   │   │   └── manager/
│   │   ├── (employee)/       # Employee pages
│   │   │   └── employee/
│   │   ├── api/              # API routes
│   │   │   ├── auth/
│   │   │   ├── attendance/
│   │   │   ├── employees/
│   │   │   ├── payroll/
│   │   │   └── ...
│   │   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   ├── admin/           # Admin-specific components
│   │   ├── employee/        # Employee-specific components
│   │   ├── attendance/      # Attendance components
│   │   ├── forms/           # Form dialogs
│   │   ├── integrations/    # Integration components
│   │   ├── ai/              # AI components
│   │   └── shared/          # Shared components
│   └── lib/                  # Utility libraries
│       ├── db.ts            # Prisma client
│       ├── auth.ts          # Authentication utilities
│       ├── utils.ts         # General utilities
│       ├── ai/              # AI/ML modules
│       └── integrations/    # Integration clients
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Database Schema

### Core Models

#### User
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  username    String   @unique
  password    String                    // bcrypt hashed
  role        Role     @default(EMPLOYEE)  // ADMIN, MANAGER, EMPLOYEE
  employeeId  String?  @unique
  permissions Json?
  employee    Employee? @relation(fields: [employeeId], references: [id])
}
```

#### Employee
```prisma
model Employee {
  id                String   @id @default(cuid())
  employeeId        String   @unique    // Display ID (EMP001, EMP002, etc.)
  name              String
  email             String   @unique
  phone             String
  address           String
  designation       String
  department        String
  salary            Float
  variablePay       Float?
  dateOfJoining     DateTime
  isActive          Boolean  @default(true)
  reportingHeadId   String?

  // Relations
  reportingHead     Employee?  @relation("ReportingStructure", fields: [reportingHeadId])
  subordinates      Employee[] @relation("ReportingStructure")
  attendance        Attendance[]
  leaves            Leave[]
  payroll           Payroll[]
  tasks             Task[]
  user              User?
  bankingDetails    BankingDetails?
  employeeDocuments EmployeeDocument[]
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
  grossHours    Float?    // Total time in office (punchOut - punchIn)
  totalHours    Float?    // Active work = grossHours - breakDuration - idleTime
  breakDuration Float?    // Total break time
  idleTime      Float?    // Idle time (excluding breaks)
  status        AttendanceStatus  // PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY, WEEKEND
  punchInIp     String?
  punchOutIp    String?

  // Relations
  employee      Employee      @relation(fields: [employeeId], references: [id])
  activityLogs  ActivityLog[]
  breaks        Break[]       // Multiple breaks per day

  @@unique([employeeId, date])
}
```

#### Time Calculation Formula
```
Gross Hours = Punch Out - Punch In
Break Hours = Sum of all break durations
Idle Hours  = Inactive heartbeats × 5 minutes (excluding break periods)
Active Work = Gross Hours - Break Hours - Idle Hours

EQUATION: Gross = Active + Break + Idle
```

#### Break
```prisma
model Break {
  id           String    @id @default(cuid())
  attendanceId String
  startTime    DateTime
  endTime      DateTime?
  duration     Float?    // Duration in hours
  reason       String?

  attendance   Attendance @relation(fields: [attendanceId], references: [id], onDelete: Cascade)
}
```

#### ActivityLog (Heartbeats)
```prisma
model ActivityLog {
  id              String    @id @default(cuid())
  attendanceId    String
  timestamp       DateTime
  active          Boolean   @default(true)   // Was user active?
  suspicious      Boolean   @default(false)  // Bot detection flag
  source          String?   // 'client' or 'server'
  patternType     String?   // Type of suspicious pattern detected
  patternDetails  String?
  confidence      String?
  confidenceScore Float?

  // Device fingerprinting
  ipAddress       String?
  userAgent       String?
  browserName     String?
  osName          String?
  timezone        String?

  attendance      Attendance @relation(fields: [attendanceId], references: [id])
}
```

### Relationships Diagram

```
User ──────────────── Employee
                         │
          ┌──────────────┼──────────────┬──────────────┐
          │              │              │              │
     Attendance       Leave        Payroll         Task
          │
    ┌─────┴─────┐
    │           │
ActivityLog   Break
```

### All Models Reference

| Model | Description | Key Relations |
|-------|-------------|---------------|
| `User` | Login credentials & roles | → Employee |
| `Employee` | Employee profile & info | → User, Attendance, Leave, Payroll |
| `Attendance` | Daily attendance records | → Employee, ActivityLog, Break |
| `Break` | Break periods within attendance | → Attendance |
| `ActivityLog` | Activity heartbeats (5-min intervals) | → Attendance |
| `Leave` | Leave applications | → Employee |
| `Payroll` | Monthly payroll records | → Employee |
| `Project` | Project information | → ProjectMember, Task |
| `Task` | Tasks within projects | → Project, Employee |
| `DailyWorkUpdate` | Daily work updates | → Employee |
| `BankingDetails` | Employee bank accounts | → Employee |
| `EmployeeDocument` | Employee documents | → Employee |
| `Message` | Internal messages | → User |
| `HRDocument` | HR policies & documents | - |
| `Holiday` | Company holidays | - |
| `Invoice` | Client invoices | - |
| `Lead` | Sales leads | → Sale |
| `Sale` | Sales records | → Lead, Project |
| `Account` | Accounting entries | → AccountCategory |
| `IntegrationConnection` | External integrations | → WorkItem, UserMapping |
| `WorkItem` | External work items | → IntegrationConnection |
| `AuditLog` | System audit trail | - |

---

## 5. API Reference

### Authentication

#### POST /api/auth/login
```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "role": "ADMIN",
    "employeeId": "..."
  }
}
// Sets HTTP-only cookie with JWT token (7-day expiry)
```

#### POST /api/auth/logout
```typescript
// Response
{ "success": true }
// Clears session cookie
```

#### GET /api/auth/me
```typescript
// Response
{
  "id": "...",
  "email": "...",
  "role": "ADMIN",
  "employeeId": "...",
  "name": "..."
}
```

---

### Attendance

#### GET /api/attendance
```typescript
// Query params
?employeeId=...    // Filter by employee
?date=2026-01-16   // Filter by date
?startDate=...&endDate=...  // Date range

// Response
[
  {
    "id": "...",
    "employeeId": "...",
    "date": "2026-01-16T00:00:00.000Z",
    "punchIn": "2026-01-16T09:00:00.000Z",
    "punchOut": "2026-01-16T18:00:00.000Z",
    "grossHours": 9,
    "totalHours": 7.5,
    "breakDuration": 1,
    "idleTime": 0.5,
    "status": "PRESENT",
    "employee": { ... },
    "breaks": [ ... ]
  }
]
```

#### POST /api/attendance
```typescript
// Punch In
{ "action": "punch-in" }

// Punch Out
{ "action": "punch-out" }

// Start Break
{ "action": "break-start" }

// End Break
{ "action": "break-end" }

// Response
{
  "id": "...",
  "punchIn": "...",
  "punchOut": "...",
  "totalHours": 8.5,
  ...
}
```

#### POST /api/attendance/heartbeat
```typescript
// Request (sent every 5 minutes by client)
{
  "active": true,           // Was user active in last 5 mins?
  "suspicious": false,      // Bot detection flag
  "patternType": null,      // e.g., "MOUSE_JIGGLER"
  "patternDetails": null
}

// Response
{ "success": true, "message": "Heartbeat recorded" }
```

#### POST /api/attendance/recalculate-idle
```typescript
// Admin only - recalculates idle time for attendance records
// Request
{ "all": true }              // Recalculate all records
// OR
{ "employeeId": "EMP001" }   // Specific employee
// OR
{ "attendanceId": "..." }    // Specific record

// Response
{
  "success": true,
  "message": "Recalculated 247 records, fixed 176",
  "formula": "Active Hours = Gross Hours - Break Duration - Idle Hours",
  "results": [...]
}
```

---

### Employees

#### GET /api/employees
```typescript
// Response
[
  {
    "id": "...",
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john@example.com",
    "designation": "Software Engineer",
    "department": "Engineering",
    "salary": 50000,
    "isActive": true,
    "reportingHead": { "id": "...", "name": "..." },
    "user": { "id": "...", "role": "EMPLOYEE" }
  }
]
```

#### POST /api/employees
```typescript
// Admin only
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "designation": "Software Engineer",
  "department": "Engineering",
  "salary": 50000,
  "dateOfJoining": "2026-01-16",
  "reportingHeadId": "..."  // Optional
}

// Auto-generates employeeId (EMP001, EMP002, etc.)
// Auto-creates User account with default password "12345678"
```

#### DELETE /api/employees/[id]
```typescript
// Admin only - PERMANENTLY deletes employee and ALL related data
// Uses transaction to delete in order:
// 1. ActivityLogs → 2. Breaks → 3. Attendance → 4. DailyWorkUpdates
// 5. Documents → 6. BankingDetails → 7. Leaves → 8. Messages
// 9. Payroll → 10. ProjectMembers → 11. Tasks → 12. User → 13. Employee

// Response
{
  "success": true,
  "message": "Employee John Doe (EMP001) permanently deleted",
  "deletedRecords": { "attendanceRecords": 45 }
}
```

---

### Time Analytics

#### GET /api/time-analytics
```typescript
// Query params
?view=day|week|month
?startDate=2026-01-01
?endDate=2026-01-31
?employeeId=...        // Optional filter
?department=...        // Optional filter

// Response
{
  "summary": {
    "totalGrossHours": 180,
    "totalWorkHours": 150,     // Active work (gross - break - idle)
    "totalBreakHours": 20,
    "totalIdleHours": 10,
    "averageWorkHours": 7.5,
    "employeeCount": 20,
    "daysAnalyzed": 20
  },
  "chartData": {
    "byDate": [
      { "date": "Jan 16", "workHours": 7.5, "breakHours": 1, "idleHours": 0.5 }
    ],
    "byEmployee": [...],
    "distribution": [
      { "category": "Work", "hours": 150, "percentage": 83 },
      { "category": "Break", "hours": 20, "percentage": 11 },
      { "category": "Idle", "hours": 10, "percentage": 6 }
    ]
  },
  "employeeDetails": [...]
}
```

---

### Leaves

#### GET /api/leaves
```typescript
// Response
[
  {
    "id": "...",
    "employeeId": "...",
    "leaveType": "SICK",  // SICK, CASUAL, EARNED, UNPAID
    "startDate": "...",
    "endDate": "...",
    "days": 2,
    "reason": "Medical appointment",
    "status": "PENDING",  // PENDING, APPROVED, REJECTED, CANCELLED, HOLD
    "adminComment": null
  }
]
```

#### POST /api/leaves
```typescript
{
  "leaveType": "SICK",
  "startDate": "2026-01-20",
  "endDate": "2026-01-21",
  "reason": "Medical appointment"
}
```

---

### Payroll

#### GET /api/payroll
```typescript
?month=1&year=2026
?employeeId=...

// Response
[
  {
    "id": "...",
    "employeeId": "...",
    "month": 1,
    "year": 2026,
    "workingDays": 22,
    "daysPresent": 20,
    "daysAbsent": 2,
    "basicSalary": 50000,
    "grossSalary": 48000,
    "totalDeductions": 5000,
    "netSalary": 43000,
    "status": "PENDING"
  }
]
```

---

### Projects & Tasks

#### GET /api/projects
```typescript
// Response
[
  {
    "id": "...",
    "projectId": "PRJ001",
    "name": "Website Redesign",
    "status": "ACTIVE",
    "totalBudget": 100000,
    "startDate": "...",
    "endDate": "...",
    "members": [...],
    "tasks": [...]
  }
]
```

#### GET /api/tasks
```typescript
?projectId=...
?assignedTo=...
?status=PENDING|IN_PROGRESS|COMPLETED

// Response
[
  {
    "id": "...",
    "title": "Design homepage",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "assignedTo": "...",
    "dueDate": "..."
  }
]
```

---

### All API Endpoints Reference

| Endpoint | Methods | Description | Auth |
|----------|---------|-------------|------|
| `/api/auth/login` | POST | User login | Public |
| `/api/auth/logout` | POST | User logout | Auth |
| `/api/auth/me` | GET | Get current user | Auth |
| `/api/attendance` | GET, POST | Attendance records | Auth |
| `/api/attendance/heartbeat` | POST | Activity heartbeat | Auth |
| `/api/attendance/activity` | POST | Activity log | Auth |
| `/api/attendance/recalculate-idle` | POST | Recalculate idle | Admin |
| `/api/employees` | GET, POST | Employees CRUD | Auth/Admin |
| `/api/employees/[id]` | GET, PUT, DELETE | Single employee | Auth/Admin |
| `/api/employees/[id]/toggle-active` | PATCH | Toggle active status | Admin |
| `/api/employees/[id]/documents` | GET, POST | Employee documents | Auth |
| `/api/employees/[id]/banking` | GET, POST | Banking details | Auth |
| `/api/time-analytics` | GET | Time analytics | Auth |
| `/api/leaves` | GET, POST | Leave management | Auth |
| `/api/payroll` | GET, POST | Payroll records | Auth/Admin |
| `/api/payroll-settings` | GET, POST | Payroll config | Admin |
| `/api/projects` | GET, POST | Projects | Auth |
| `/api/tasks` | GET, POST | Tasks | Auth |
| `/api/work-items` | GET, POST | External work items | Auth |
| `/api/daily-work-updates` | GET, POST | Daily updates | Auth |
| `/api/messages` | GET, POST | Internal messaging | Auth |
| `/api/holidays` | GET, POST | Holidays | Auth/Admin |
| `/api/hr-documents` | GET, POST | HR documents | Auth/Admin |
| `/api/leads` | GET, POST | Sales leads | Auth |
| `/api/sales` | GET, POST | Sales records | Auth |
| `/api/invoices` | GET, POST | Invoices | Auth |
| `/api/accounts` | GET, POST | Accounting | Auth |
| `/api/audit-log` | GET | Audit trail | Admin |
| `/api/employee-status` | GET | Employee status | Admin/Manager |
| `/api/integrations/connections` | GET, POST | Integrations | Admin |
| `/api/integrations/sync` | POST | Sync external data | Admin |
| `/api/ai/chat` | POST | AI chatbot | Auth |
| `/api/ai/predictions` | GET | AI predictions | Auth |

---

## 6. Components

### UI Components (src/components/ui/)

Base components built with shadcn/ui and Radix primitives:

| Component | Usage |
|-----------|-------|
| `Button` | `<Button variant="default|destructive|outline|ghost">` |
| `Card` | `<Card><CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card>` |
| `Dialog` | Modal dialogs |
| `Input` | Text inputs |
| `Select` | Dropdown selects |
| `Table` | Data tables |
| `Badge` | Status badges |
| `Tabs` | Tabbed interfaces |
| `Calendar` | Date picker |
| `Tooltip` | Hover tooltips |

### Attendance Components

#### ActivityTracker
```tsx
// src/components/attendance/ActivityTracker.tsx
// Tracks mouse, keyboard, scroll activity
// Sends heartbeats every 5 minutes
// Includes bot detection (mouse jiggler, auto-clicker, auto-typer)

<ActivityTracker isActive={isPunchedIn} />
```

#### AttendanceControls
```tsx
// src/components/employee/AttendanceControls.tsx
// Punch in/out and break controls with VM mode toggle

<AttendanceControls attendance={todayAttendance} />

// Features:
// - Punch In/Out buttons
// - Start/End Break buttons
// - VM Mode toggle (for RDP work)
// - IP address display
```

#### TeamAttendanceCalendar
```tsx
// src/components/attendance/TeamAttendanceCalendar.tsx
// Calendar view of team attendance with activity timeline

<TeamAttendanceCalendar employees={employees} />

// Features:
// - Monthly calendar view
// - Click on date to see employee attendance
// - Activity timeline with heartbeat visualization
// - Break periods displayed
// - Idle time calculation
```

### Form Dialogs

```tsx
// Employee Form
<EmployeeFormDialog
  mode="create" | "edit"
  employee={employee}  // For edit mode
  onSuccess={() => router.refresh()}
/>

// Leave Application
<LeaveApplicationForm onSuccess={handleSuccess} />

// Task Dialog
<TaskDialog
  projectId={projectId}
  task={task}  // For edit
/>
```

### Admin Components

```tsx
// Delete Employee (with confirmation)
<DeleteEmployeeButton
  employeeId={id}
  employeeName={name}
/>
// Requires typing "DELETE" to confirm

// Toggle Employee Active Status
<ToggleEmployeeActiveButton
  employeeId={id}
  isActive={true}
/>
```

---

## 7. Authentication & Authorization

### JWT Session Management

```typescript
// src/lib/auth.ts

// Session stored in HTTP-only cookie
// 7-day expiration
// Contains: userId, email, role, employeeId, name

export async function getSession(): Promise<SessionData | null>
export async function encrypt(payload: SessionData): Promise<string>
export async function decrypt(token: string): Promise<SessionData>
export async function hashPassword(password: string): Promise<string>
export async function comparePasswords(plain: string, hashed: string): Promise<boolean>
```

### Role-Based Access Control

```typescript
// Three roles: ADMIN, MANAGER, EMPLOYEE

// In API routes:
const session = await getSession();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

if (session.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
}
```

### Page-Level Authorization

```typescript
// In page components (server-side)
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN') {
    redirect('/employee/dashboard');
  }

  // ... rest of page
}
```

---

## 8. Time & Attendance System

### Activity Tracking Flow

```
Employee Punches In
       │
       ▼
┌─────────────────────────────────────────┐
│     ActivityTracker Component           │
│  - Listens for mouse, keyboard, scroll  │
│  - Detects suspicious patterns (bots)   │
│  - Sends heartbeat every 5 minutes      │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│     POST /api/attendance/heartbeat      │
│  - Records ActivityLog entry            │
│  - active: true/false                   │
│  - suspicious: true/false               │
└─────────────────────────────────────────┘
       │
       ▼
Employee Punches Out
       │
       ▼
┌─────────────────────────────────────────┐
│     Calculate Time on Punch Out         │
│  - grossHours = punchOut - punchIn      │
│  - breakDuration = sum of breaks        │
│  - idleTime = inactive heartbeats × 5m  │
│    (excluding break periods)            │
│  - totalHours = gross - break - idle    │
└─────────────────────────────────────────┘
```

### Idle Time Calculation

```typescript
// src/app/api/attendance/route.ts

async function calculateIdleTime(attendanceId: string): Promise<number> {
  // 1. Get all breaks for this attendance
  const breaks = await prisma.break.findMany({
    where: { attendanceId },
  });

  // 2. Get all inactive heartbeats
  const inactiveHeartbeats = await prisma.activityLog.findMany({
    where: {
      attendanceId,
      active: false,
      source: 'client',
    },
  });

  // 3. Filter out heartbeats during break periods
  const idleHeartbeats = inactiveHeartbeats.filter(heartbeat => {
    const heartbeatTime = new Date(heartbeat.timestamp).getTime();

    for (const brk of breaks) {
      const breakStart = new Date(brk.startTime).getTime();
      const breakEnd = brk.endTime ? new Date(brk.endTime).getTime() : Date.now();

      if (heartbeatTime >= breakStart && heartbeatTime <= breakEnd) {
        return false; // Exclude - during break
      }
    }
    return true; // Include - genuine idle
  });

  // 4. Calculate idle hours (5 minutes per heartbeat)
  return (idleHeartbeats.length * 5) / 60;
}
```

### VM/RDP Mode

When employees work in Remote Desktop (RDP) full-screen mode, their browser is minimized and no activity is detected. The VM Mode feature prevents false idle time:

```typescript
// In AttendanceControls.tsx
const toggleVmMode = () => {
  const newValue = !vmMode;
  setVmMode(newValue);
  localStorage.setItem('hrms_vm_mode', newValue.toString());
};

// In ActivityHeartbeat.tsx (sendHeartbeat)
const isVmModeEnabled = localStorage.getItem('hrms_vm_mode') === 'true';
const wasActive = isVmModeEnabled || (hadRecentActivity && !isBot);
```

### Bot Detection

The system detects various automation tools:

- **Mouse Jiggler** - Oscillating patterns with exact distances/timing
- **Auto-clicker** - Clicks at exact intervals
- **Auto-typer** - Keystrokes at exact intervals
- **Static Mouse** - Fake movement events without actual movement

```typescript
// Detection thresholds
const DETECTION_CONFIG = {
  MIN_MOUSE_SAMPLES: 15,
  MIN_KEYSTROKE_SAMPLES: 10,
  MAX_BOT_DISTANCE_VARIANCE: 3,     // pixels
  MAX_BOT_INTERVAL_VARIANCE: 25,    // ms
  SUSPICIOUS_THRESHOLD: 10,
};
```

---

## 9. Integrations

### Azure DevOps

```typescript
// src/lib/integrations/azure-devops-client.ts

class AzureDevOpsClient {
  // Fetch work items (user stories, bugs, tasks)
  async getWorkItems(projectName: string): Promise<WorkItem[]>

  // Fetch commits
  async getCommits(repositoryId: string): Promise<Commit[]>

  // Fetch pull requests
  async getPullRequests(repositoryId: string): Promise<PullRequest[]>
}
```

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

### Setting Up Integrations

1. Go to Admin → Integrations
2. Click "Add Connection"
3. Select platform (Azure DevOps, Asana, Confluence)
4. Enter credentials:
   - Azure: Organization URL, Personal Access Token
   - Asana: Personal Access Token
   - Confluence: Base URL, Username, API Token
5. Map users (HRMS employees ↔ External users)
6. Enable sync

---

## 10. AI/ML Features

### Configuration

```typescript
// src/lib/ai/config.ts

// Enable AI features via environment variables
AI_DOCUMENT_PROCESSING=true
AI_PREDICTIVE_ANALYTICS=true
AI_SMART_RECRUITMENT=true
AI_CHATBOT=true
AI_SENTIMENT_ANALYSIS=true
AI_INTELLIGENT_AUTOMATION=true
AI_LEARNING_DEVELOPMENT=true
AI_ADVANCED_ANALYTICS=true

OPENAI_API_KEY=sk-...
```

### Chatbot

```typescript
// POST /api/ai/chat
{
  "message": "Show me employees with high attrition risk",
  "sessionId": "..."  // Optional
}

// Response
{
  "response": "Based on our predictive model, here are...",
  "intent": "QUERY_EMPLOYEES",
  "action": { "type": "SHOW_LIST", "data": [...] }
}
```

### Predictions

```typescript
// GET /api/ai/predictions?employeeId=...

// Response
{
  "predictions": [
    {
      "type": "ATTRITION",
      "riskScore": 0.75,
      "riskLevel": "HIGH",
      "factors": ["low_engagement", "no_promotion_2_years"],
      "recommendations": ["Schedule 1:1", "Discuss career path"]
    }
  ]
}
```

### Document Processing

```typescript
// POST /api/ai/documents
// FormData with file upload

// Extracts:
// - Text from PDFs
// - Data from invoices
// - Information from resumes
// - Details from ID documents
```

---

## 11. Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/hrms"

# Authentication
JWT_SECRET="your-super-secret-key-min-32-chars"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Optional Variables

```env
# Cron Jobs
CRON_SECRET="secret-for-cron-authentication"

# AI Features (set to 'true' to enable)
OPENAI_API_KEY="sk-..."
AI_DOCUMENT_PROCESSING=true
AI_PREDICTIVE_ANALYTICS=true
AI_SMART_RECRUITMENT=true
AI_CHATBOT=true
AI_SENTIMENT_ANALYSIS=true
AI_INTELLIGENT_AUTOMATION=true
AI_LEARNING_DEVELOPMENT=true
AI_ADVANCED_ANALYTICS=true
```

---

## 12. Deployment

### Build for Production

```bash
npm run build
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Start the application

### Health Checks

- `/api/auth/me` - Returns 401 if not authenticated, 200 with user data if OK
- Database connection is tested on first request

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create file in `src/app/api/[endpoint]/route.ts`
2. Export async functions for HTTP methods (GET, POST, PUT, DELETE)
3. Use `getSession()` for authentication
4. Use Prisma for database operations

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

1. Create folder in appropriate route group (`(admin)`, `(manager)`, `(employee)`)
2. Create `page.tsx` file
3. Add authentication check
4. Use server components for data fetching

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

### Adding a New Database Model

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_my_model`
3. Prisma client is auto-regenerated

---

## Troubleshooting

### Common Issues

**Database connection errors**
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Check network/firewall rules

**Authentication issues**
- Verify `JWT_SECRET` is set
- Clear cookies and re-login
- Check token expiration (7 days)

**Activity tracking not working**
- Check browser console for errors
- Verify employee is punched in
- Check `localStorage` for `hrms_punched_in=true`

**Idle time calculation issues**
- Run recalculate: POST `/api/attendance/recalculate-idle` with `{"all": true}`
- Check that breaks are properly recorded
- Verify heartbeats are being sent (check ActivityLog table)

---

## Contact & Support

For questions or issues, contact the development team or create an issue in the repository.
