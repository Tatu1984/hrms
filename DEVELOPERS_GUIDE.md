# HRMS Developer's Guide
## Infiniti Tech Partners - Human Resource Management System

**Version:** 1.0.0
**Last Updated:** December 29, 2025
**Repository:** https://github.com/Tatu1984/hrms

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [AI/ML Features](#7-aiml-features)
8. [Frontend Components](#8-frontend-components)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Third-Party Integrations](#10-third-party-integrations)
11. [Deployment](#11-deployment)
12. [Troubleshooting](#12-troubleshooting)

---

# 1. Project Overview

## 1.1 What is HRMS?

HRMS (Human Resource Management System) is a comprehensive enterprise application designed to manage all aspects of human resources, including:

- **Employee Management** - Complete employee lifecycle management
- **Attendance Tracking** - Real-time punch-in/out with activity monitoring
- **Leave Management** - Leave applications, approvals, and balance tracking
- **Payroll Processing** - Salary calculation, deductions, and payslip generation
- **Project Management** - Project tracking with milestones and task assignments
- **Sales CRM** - Lead management and sales pipeline
- **Accounts** - Income/expense tracking with invoice management
- **AI Features** - 8 AI-powered modules for intelligent HR operations

## 1.2 Key Features

| Module | Description |
|--------|-------------|
| Employee Portal | Self-service for employees to view attendance, apply leaves, view payslips |
| Manager Dashboard | Team management, leave approvals, daily updates review |
| Admin Console | Full system administration with all HR controls |
| AI Hub | 8 AI-powered features for intelligent automation |
| Integrations | Azure DevOps, Asana, Confluence integration |
| Reports | Comprehensive reporting with export capabilities |

## 1.3 User Roles

| Role | Access Level | Key Permissions |
|------|--------------|-----------------|
| ADMIN | Full Access | All modules, system configuration, user management |
| MANAGER | Team Level | Team attendance, leave approvals, project management |
| EMPLOYEE | Self Only | Personal dashboard, attendance, leave requests |

---

# 2. Tech Stack

## 2.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.7 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Prisma** | 6.17.1 | ORM for database operations |
| **PostgreSQL** | - | Production database (NeonDB) |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |

## 2.2 AI/ML Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **OpenAI** | 6.15.0 | GPT-4/3.5 for AI features |
| **LangChain** | 1.2.3 | LLM orchestration |
| **@ai-sdk/openai** | 3.0.1 | Vercel AI SDK |
| **Tesseract.js** | 7.0.0 | OCR for document processing |
| **natural** | 8.1.0 | NLP utilities |

## 2.3 UI Components

| Technology | Purpose |
|------------|---------|
| **Radix UI** | Headless UI primitives |
| **Lucide React** | Icon library |
| **Recharts** | Data visualization |
| **date-fns** | Date manipulation |
| **react-day-picker** | Calendar component |

## 2.4 Authentication

| Technology | Purpose |
|------------|---------|
| **jose** | JWT handling |
| **bcryptjs** | Password hashing |

---

# 3. Project Structure

```
hrms1/
├── prisma/
│   └── schema.prisma          # Database schema (1300+ lines)
├── public/                    # Static assets
├── scripts/
│   └── seed.ts               # Database seeding script
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (admin)/          # Admin routes (protected)
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (dashboard)/      # General dashboard routes
│   │   ├── (employee)/       # Employee portal routes
│   │   ├── (manager)/        # Manager portal routes
│   │   ├── api/              # API routes
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page (redirect)
│   ├── components/           # React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── ai/               # AI feature components
│   │   ├── attendance/       # Attendance components
│   │   ├── documentation/    # Documentation viewer
│   │   ├── forms/            # Form dialogs
│   │   ├── invoices/         # Invoice components
│   │   ├── settings/         # Settings components
│   │   ├── tasks/            # Task components
│   │   └── ui/               # Shadcn UI components
│   ├── lib/                  # Utility libraries
│   │   ├── ai/               # AI modules (8 features)
│   │   ├── integrations/     # Third-party integrations
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Prisma client
│   │   └── utils.ts          # General utilities
│   ├── middleware.ts         # Route protection middleware
│   └── types/                # TypeScript type definitions
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## 3.1 Route Groups Explained

| Route Group | Path Prefix | Purpose |
|-------------|-------------|---------|
| `(admin)` | `/admin/*` | Admin dashboard and management |
| `(auth)` | `/login` | Authentication pages |
| `(employee)` | `/employee/*` | Employee self-service portal |
| `(manager)` | `/manager/*` | Manager dashboard |
| `(dashboard)` | `/ai/*` | Shared AI features |

---

# 4. Getting Started

## 4.1 Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (or use NeonDB for serverless)
- OpenAI API key (for AI features)

## 4.2 Installation

```bash
# Clone the repository
git clone https://github.com/Tatu1984/hrms.git
cd hrms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
npx prisma db push

# Seed initial data
npm run seed

# Start development server
npm run dev
```

## 4.3 Environment Variables

```env
# Required
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Optional - App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional - Cron Job Secret
CRON_SECRET="random-secret-for-cron-jobs"

# AI Features (Required for AI functionality)
OPENAI_API_KEY="sk-your-openai-api-key"

# AI Feature Flags
AI_DOCUMENT_PROCESSING="true"
AI_PREDICTIVE_ANALYTICS="true"
AI_SMART_RECRUITMENT="true"
AI_CHATBOT="true"
AI_SENTIMENT_ANALYSIS="true"
AI_INTELLIGENT_AUTOMATION="true"
AI_LEARNING_DEVELOPMENT="true"
AI_ADVANCED_ANALYTICS="true"
```

## 4.4 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run seed` | Seed database with initial data |
| `npm run studio` | Open Prisma Studio (database GUI) |
| `npm run migrate:dev` | Run database migrations |

## 4.5 Default Login Credentials

After seeding, use these credentials:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | 12345678 |
| Manager | manager | 12345678 |
| Employee | employee1 | 12345678 |

---

# 5. Database Schema

## 5.1 Core Models

### User & Employee

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  username    String    @unique
  password    String    // bcrypt hashed
  role        Role      // ADMIN | MANAGER | EMPLOYEE
  employeeId  String?   @unique
  permissions Json?     // Custom permissions
  employee    Employee?
}

model Employee {
  id              String   @id @default(cuid())
  employeeId      String   @unique  // E.g., "EMP001"
  name            String
  email           String   @unique
  phone           String
  designation     String
  department      String
  salary          Float
  dateOfJoining   DateTime
  isActive        Boolean  @default(true)
  reportingHeadId String?  // Self-referencing for hierarchy
  // ... banking, documents, etc.
}
```

### Attendance

```prisma
model Attendance {
  id           String           @id
  employeeId   String
  date         DateTime
  punchIn      DateTime?
  punchOut     DateTime?
  totalHours   Float?
  status       AttendanceStatus // PRESENT | ABSENT | HALF_DAY | LEAVE | HOLIDAY
  activityLogs ActivityLog[]    // Real-time activity tracking

  @@unique([employeeId, date])
}
```

### Leave Management

```prisma
model Leave {
  id         String      @id
  employeeId String
  leaveType  LeaveType   // SICK | CASUAL | EARNED | UNPAID
  startDate  DateTime
  endDate    DateTime
  days       Int
  reason     String
  status     LeaveStatus // PENDING | APPROVED | REJECTED | CANCELLED | HOLD
}
```

## 5.2 AI Models

| Model | Purpose |
|-------|---------|
| `AIDocumentExtraction` | Stores extracted document data (OCR) |
| `AIPrediction` | Employee attrition/performance predictions |
| `AIChatSession` | Chat conversation sessions |
| `AIChatMessage` | Individual chat messages |
| `AISentimentAnalysis` | Sentiment analysis results |
| `AIResumeAnalysis` | Parsed resume data |
| `AISkillGap` | Employee skill gap analysis |
| `AIAutomationRule` | Automation rules configuration |
| `AIAutomationLog` | Automation execution logs |
| `AIAnomaly` | Detected anomalies |
| `AIInsight` | Generated insights |
| `AINLQuery` | Natural language query logs |
| `AILearningRecommendation` | Course recommendations |
| `AIMentorMatch` | Mentor-mentee matching |

## 5.3 Enums Reference

```prisma
enum Role { ADMIN, MANAGER, EMPLOYEE }
enum AttendanceStatus { PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY, WEEKEND }
enum LeaveType { SICK, CASUAL, EARNED, UNPAID }
enum LeaveStatus { PENDING, APPROVED, REJECTED, CANCELLED, HOLD }
enum ProjectStatus { ACTIVE, COMPLETED, ON_HOLD, CANCELLED }
enum TaskStatus { PENDING, IN_PROGRESS, HOLD, COMPLETED }
enum Priority { LOW, MEDIUM, HIGH, URGENT }
enum InvoiceStatus { DRAFT, SENT, PAID, OVERDUE, CANCELLED }
enum AccountType { INCOME, EXPENSE }
enum PayrollStatus { PENDING, APPROVED, PAID }
```

---

# 6. API Reference

## 6.1 Authentication APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login, returns JWT |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Get current user info |

### Login Request
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "12345678"
}
```

### Login Response
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "username": "admin",
    "role": "ADMIN",
    "employeeId": "clx..."
  }
}
```

## 6.2 Employee APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employees` | GET | List all employees |
| `/api/employees` | POST | Create employee |
| `/api/employees/[id]` | GET | Get employee details |
| `/api/employees/[id]` | PUT | Update employee |
| `/api/employees/[id]` | DELETE | Delete employee |
| `/api/employees/[id]/toggle-active` | PUT | Toggle active status |
| `/api/employees/[id]/banking` | PUT | Update banking details |
| `/api/employees/[id]/documents` | GET/POST | Employee documents |

## 6.3 Attendance APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attendance` | GET | Get attendance records |
| `/api/attendance` | POST | Create attendance (punch in/out) |
| `/api/attendance/heartbeat` | POST | Activity heartbeat |
| `/api/attendance/activity` | POST | Log activity |
| `/api/attendance/auto-heartbeat` | POST | Auto heartbeat (cron) |

### Punch In Request
```json
POST /api/attendance
{
  "action": "punchIn",
  "ipAddress": "192.168.1.1"
}
```

## 6.4 Leave APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaves` | GET | List leave requests |
| `/api/leaves` | POST | Apply for leave |
| `/api/leaves` | PUT | Update leave status |

### Apply Leave Request
```json
POST /api/leaves
{
  "leaveType": "CASUAL",
  "startDate": "2025-01-15",
  "endDate": "2025-01-16",
  "reason": "Personal work"
}
```

## 6.5 Payroll APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payroll` | GET | List payroll records |
| `/api/payroll` | POST | Generate payroll |
| `/api/payroll/[id]` | GET | Get payroll details |
| `/api/payroll/[id]` | PUT | Update payroll |
| `/api/payroll-settings` | GET/PUT | Payroll configuration |

## 6.6 Project & Task APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET/POST | List/Create projects |
| `/api/projects/[id]` | GET/PUT/DELETE | Project CRUD |
| `/api/tasks` | GET/POST | List/Create tasks |
| `/api/daily-work-updates` | GET/POST | Daily work updates |

## 6.7 Sales & CRM APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | GET/POST | Lead management |
| `/api/sales` | GET/POST | Sales records |
| `/api/invoices` | GET/POST | Invoice management |
| `/api/invoices/[id]` | GET/PUT/DELETE | Invoice CRUD |
| `/api/invoices/upload` | POST | Upload invoice file |

## 6.8 Account APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/accounts` | GET/POST | Account entries |
| `/api/company-profile` | GET/PUT | Company profile |
| `/api/company-bank-accounts` | GET/POST | Company bank accounts |

## 6.9 User & Settings APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET/POST | User management |
| `/api/users/[id]` | GET/PUT/DELETE | User CRUD |
| `/api/users/[id]/permissions` | PUT | Update permissions |
| `/api/users/[id]/messaging-permissions` | PUT | Messaging permissions |
| `/api/departments` | GET/POST | Department management |
| `/api/designations` | GET/POST | Designation management |
| `/api/holidays` | GET/POST | Holiday management |

## 6.10 Integration APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/connections` | GET/POST | Integration connections |
| `/api/integrations/connections/test` | POST | Test connection |
| `/api/integrations/sync` | POST | Trigger sync |
| `/api/integrations/work-items` | GET | Get work items |
| `/api/integrations/user-mappings` | GET/POST | User mappings |
| `/api/integrations/azure-devops/project` | GET | Azure DevOps projects |

## 6.11 AI APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | GET/POST | AI Chatbot |
| `/api/ai/predictions` | GET/POST | Predictive analytics |
| `/api/ai/recruitment` | POST | Resume parsing, matching |
| `/api/ai/sentiment` | POST | Sentiment analysis |
| `/api/ai/automation` | GET/POST | Automation rules |
| `/api/ai/learning` | GET/POST | Learning recommendations |
| `/api/ai/analytics` | POST | Natural language queries |
| `/api/ai/documents` | POST | Document processing |

### AI Chat Request
```json
POST /api/ai/chat
{
  "sessionId": "uuid",
  "message": "What is my leave balance?"
}
```

### AI Chat Response
```json
{
  "response": "Your leave balance is: Sick: 10, Casual: 8, Earned: 12",
  "suggestions": ["Apply for leave", "View attendance", "Contact HR"]
}
```

## 6.12 Utility APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | File upload |
| `/api/reports` | GET | Generate reports |
| `/api/audit-log` | GET | Audit logs |
| `/api/browser-activity` | POST | Browser activity logging |
| `/api/employee-status` | GET | Real-time employee status |
| `/api/currency/convert` | GET | Currency conversion |
| `/api/cron/daily-attendance` | POST | Daily attendance cron |

---

# 7. AI/ML Features

## 7.1 Overview

The HRMS includes 8 AI-powered features located in `src/lib/ai/`:

```
src/lib/ai/
├── config.ts                 # OpenAI configuration
├── types.ts                  # TypeScript types (500+ lines)
├── index.ts                  # Module exports
├── analytics/index.ts        # Advanced Analytics
├── automation/index.ts       # Intelligent Automation
├── chatbot/index.ts          # HR Chatbot
├── document-processing/index.ts  # Document Processing
├── learning/index.ts         # Learning & Development
├── predictive-analytics/index.ts # Predictions
├── recruitment/index.ts      # Smart Recruitment
└── sentiment/index.ts        # Sentiment Analysis
```

## 7.2 Feature Details

### 7.2.1 Intelligent Document Processing
**File:** `src/lib/ai/document-processing/index.ts`

Features:
- Resume parsing and data extraction
- ID document extraction (Aadhar, PAN)
- Contract analysis
- OCR support via Tesseract.js

```typescript
// Usage
import { documentProcessor } from '@/lib/ai';

const result = await documentProcessor.extractFromDocument(
  fileBuffer,
  'resume',
  'application/pdf'
);
```

### 7.2.2 Predictive Analytics
**File:** `src/lib/ai/predictive-analytics/index.ts`

Features:
- Employee attrition risk prediction
- Performance forecasting
- Workload prediction
- Team health scoring

```typescript
// Usage
import { predictiveAnalytics } from '@/lib/ai';

const prediction = await predictiveAnalytics.predictAttrition(employeeId);
// Returns: { riskScore: 0.35, riskLevel: 'MEDIUM', factors: [...] }
```

### 7.2.3 Smart Recruitment
**File:** `src/lib/ai/recruitment/index.ts`

Features:
- AI resume parsing with skill extraction
- Candidate-job matching with scoring
- Job description bias detection
- Interview question generation

```typescript
// Usage
import { smartRecruitment } from '@/lib/ai';

// Parse resume
const parsed = await smartRecruitment.parseResume(resumeText);

// Match candidates
const match = await smartRecruitment.matchCandidate(resumeData, jobRequirements);

// Check for bias
const bias = await smartRecruitment.detectBias(jobDescription);
```

### 7.2.4 Conversational AI (HR Chatbot)
**File:** `src/lib/ai/chatbot/index.ts`

Features:
- 24/7 HR query assistance
- Leave application help
- Policy information lookup
- Action handling (check balance, apply leave)

```typescript
// Usage
import { hrChatbot } from '@/lib/ai';

const response = await hrChatbot.chat(
  sessionId,
  userId,
  "How do I apply for leave?",
  employeeId
);
```

### 7.2.5 Sentiment Analysis
**File:** `src/lib/ai/sentiment/index.ts`

Features:
- Text sentiment scoring (-1 to 1)
- Aspect-based analysis
- Emotion detection
- Team morale tracking
- Critical sentiment alerts

```typescript
// Usage
import { sentimentAnalyzer } from '@/lib/ai';

const result = await sentimentAnalyzer.analyzeSentiment(feedbackText);
// Returns: { sentiment: 'positive', score: 0.75, emotions: [...] }

const teamReport = await sentimentAnalyzer.analyzeTeamSentiment('Engineering');
```

### 7.2.6 Intelligent Automation
**File:** `src/lib/ai/automation/index.ts`

Features:
- Smart leave auto-approval
- Attendance anomaly detection
- Expense anomaly detection
- Compliance monitoring
- Notification prioritization

```typescript
// Usage
import { intelligentAutomation } from '@/lib/ai';

// Evaluate leave request
const decision = await intelligentAutomation.evaluateLeaveRequest(leaveId);
// Returns: { action: 'approve', reason: '...', confidence: 0.9 }

// Detect anomalies
const anomalies = await intelligentAutomation.detectAttendanceAnomalies(employeeId);
```

### 7.2.7 Learning & Development
**File:** `src/lib/ai/learning/index.ts`

Features:
- Skill gap analysis
- Personalized learning paths
- AI mentor matching
- Course recommendations

```typescript
// Usage
import { learningDevelopment } from '@/lib/ai';

// Analyze skill gaps
const gaps = await learningDevelopment.analyzeSkillGaps(employeeId, 'Senior Developer');

// Find mentor match
const mentors = await learningDevelopment.findMentorMatch(menteeId);
```

### 7.2.8 Advanced Analytics
**File:** `src/lib/ai/analytics/index.ts`

Features:
- Natural language queries ("Show employees with >90% attendance")
- Auto-generated insights
- What-if scenario analysis
- Smart visualization suggestions

```typescript
// Usage
import { advancedAnalytics } from '@/lib/ai';

// Natural language query
const result = await advancedAnalytics.processNLQuery(
  "Show me employees who took more than 5 sick leaves this year"
);

// Get insights
const insights = await advancedAnalytics.generateInsights();
```

## 7.3 AI Configuration

**File:** `src/lib/ai/config.ts`

```typescript
// Model configurations
export const AI_MODELS = {
  GPT4: 'gpt-4-turbo-preview',
  GPT4_VISION: 'gpt-4-vision-preview',
  GPT35: 'gpt-3.5-turbo',
  EMBEDDING: 'text-embedding-3-small',
};

// Feature flags
export const AI_FEATURES = {
  DOCUMENT_PROCESSING: process.env.AI_DOCUMENT_PROCESSING === 'true',
  PREDICTIVE_ANALYTICS: process.env.AI_PREDICTIVE_ANALYTICS === 'true',
  // ... etc
};
```

---

# 8. Frontend Components

## 8.1 UI Components (Shadcn)

Located in `src/components/ui/`:

| Component | File | Description |
|-----------|------|-------------|
| Button | `button.tsx` | Button with variants |
| Card | `card.tsx` | Card container |
| Dialog | `dialog.tsx` | Modal dialogs |
| Input | `input.tsx` | Form input |
| Select | `select.tsx` | Dropdown select |
| Table | `table.tsx` | Data tables |
| Tabs | `tabs.tsx` | Tab navigation |
| Badge | `badge.tsx` | Status badges |
| Calendar | `calendar.tsx` | Date picker |
| Checkbox | `checkbox.tsx` | Checkboxes |
| Alert | `alert.tsx` | Alert messages |
| Avatar | `avatar.tsx` | User avatars |
| Progress | `progress.tsx` | Progress bars |
| ScrollArea | `scroll-area.tsx` | Scrollable areas |
| Tooltip | `tooltip.tsx` | Tooltips |
| DropdownMenu | `dropdown-menu.tsx` | Dropdown menus |
| AlertDialog | `alert-dialog.tsx` | Confirmation dialogs |

## 8.2 AI Components

Located in `src/components/ai/`:

| Component | File | Description |
|-----------|------|-------------|
| AIChatBot | `ChatBot.tsx` | Floating chat widget |
| InsightsCard | `InsightsCard.tsx` | AI insights display |
| PredictionsCard | `PredictionsCard.tsx` | Team health predictions |
| NLQueryBox | `NLQueryBox.tsx` | Natural language query input |

### Usage Example
```tsx
import { AIChatBot, InsightsCard, PredictionsCard, NLQueryBox } from '@/components/ai';

// In your page
<AIChatBot />
<InsightsCard insights={[...]} />
<PredictionsCard teamId="engineering" />
<NLQueryBox onQuery={(q) => handleQuery(q)} />
```

## 8.3 Form Dialogs

Located in `src/components/forms/`:

| Component | File | Purpose |
|-----------|------|---------|
| EmployeeDialog | `employee-dialog.tsx` | Add/Edit employee |
| ProjectDialog | `project-dialog.tsx` | Add/Edit project |
| TaskDialog | `task-dialog.tsx` | Add/Edit task |
| PayrollDialog | `payroll-dialog.tsx` | Process payroll |
| InvoiceDialog | `invoice-dialog.tsx` | Create invoice |
| LeadDialog | `lead-dialog.tsx` | Add/Edit lead |
| SaleDialog | `sale-dialog.tsx` | Record sale |
| AccountEntryDialog | `account-entry-dialog.tsx` | Add account entry |

## 8.4 Attendance Components

Located in `src/components/attendance/`:

| Component | Purpose |
|-----------|---------|
| AttendanceCalendar | Monthly calendar view |
| AttendanceCalendarView | Detailed calendar view |
| AttendanceDateDetailModal | Daily detail modal |
| TeamAttendanceCalendar | Team view calendar |
| ActivityTracker | Real-time activity tracking |

---

# 9. Authentication & Authorization

## 9.1 Authentication Flow

```
1. User submits credentials to /api/auth/login
2. Server validates credentials against User table
3. Server generates JWT token with jose
4. Token stored in httpOnly cookie named 'session'
5. Middleware validates token on protected routes
6. Token contains: userId, username, role, employeeId
```

## 9.2 Middleware

**File:** `src/middleware.ts`

```typescript
// Protected routes configuration
const protectedRoutes = ['/admin', '/manager', '/employee'];

// Role-based access
'/admin/*' -> requires ADMIN role
'/manager/*' -> requires MANAGER or ADMIN role
'/employee/*' -> requires any authenticated user
```

## 9.3 Auth Utilities

**File:** `src/lib/auth.ts`

```typescript
// Key functions
export async function encrypt(payload: JWTPayload): Promise<string>
export async function decrypt(token: string): Promise<JWTPayload | null>
export async function getSession(): Promise<JWTPayload | null>
export async function verifyAuth(request: Request): Promise<JWTPayload | null>
export function isAdmin(role: string): boolean
export function isManagerOrAbove(role: string): boolean
```

## 9.4 JWT Payload Structure

```typescript
interface JWTPayload {
  userId: string;
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  employeeId?: string;
  exp: number;
}
```

---

# 10. Third-Party Integrations

## 10.1 Azure DevOps

**File:** `src/lib/integrations/azure-devops-client.ts`

Features:
- Work item synchronization
- Commit tracking
- Pull request monitoring

```typescript
import { AzureDevOpsClient } from '@/lib/integrations/azure-devops-client';

const client = new AzureDevOpsClient(accessToken, organizationUrl);
const workItems = await client.getWorkItems(projectName);
```

## 10.2 Asana

**File:** `src/lib/integrations/asana-client.ts`

Features:
- Task synchronization
- Project mapping
- User mapping

## 10.3 Confluence

**File:** `src/lib/integrations/confluence-client.ts`

Features:
- Page synchronization
- Documentation import
- Space management

## 10.4 Sync Service

**File:** `src/lib/integrations/sync-service.ts`

Orchestrates synchronization across all integrations.

---

# 11. Deployment

## 11.1 Vercel Deployment

The project is configured for Vercel deployment:

```json
// package.json
{
  "scripts": {
    "vercel-build": "prisma generate && next build"
  }
}
```

### Environment Variables for Vercel

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) |
| `OPENAI_API_KEY` | For AI | OpenAI API key |
| `CRON_SECRET` | Optional | Cron job authentication |

## 11.2 Database (NeonDB)

Using NeonDB for serverless PostgreSQL:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require"
```

## 11.3 CI/CD Pipeline

**File:** `.github/workflows/r-and-d-ci.yml`

GitHub Actions workflow for:
- Lint checking
- Type checking
- Build verification
- Automated deployment to Vercel

---

# 12. Troubleshooting

## 12.1 Common Issues

### Database Connection Errors

```bash
# Regenerate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database in browser
npx prisma studio
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Full rebuild
npm run build
```

### AI Features Not Working

1. Check `OPENAI_API_KEY` is set correctly
2. Verify API key starts with `sk-`
3. Check feature flags are set to `true`
4. Review console for error messages

### Authentication Issues

1. Clear browser cookies
2. Check JWT_SECRET is consistent
3. Verify user exists in database
4. Check password is correct (default: `12345678`)

## 12.2 Debug Mode

Add to `.env`:
```env
NODE_ENV=development
```

This enables detailed error messages and stack traces.

## 12.3 Logs

- **Development**: Check terminal output
- **Production**: Check Vercel logs in dashboard
- **Database**: Use Prisma Studio for data inspection

---

# Appendix A: Quick Reference

## API Response Format

All APIs follow this format:

```typescript
// Success
{ data: {...}, message?: string }

// Error
{ error: string, details?: string }
```

## Date Formats

- API: ISO 8601 (`2025-01-15T10:30:00.000Z`)
- Display: `date-fns` format functions

## File Upload Limits

- Max file size: 10MB
- Supported formats: PDF, DOCX, PNG, JPG, XLSX

---

# Appendix B: Contact & Support

- **Repository**: https://github.com/Tatu1984/hrms
- **Issues**: https://github.com/Tatu1984/hrms/issues

---

*This document is auto-generated and maintained for the HRMS project.*
