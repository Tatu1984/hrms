# Azure DevOps Integration - Requirements & Implementation Guide

## Overview
Integrate your HRMS with Azure DevOps to automatically sync projects, track work items, monitor developer activity, and link actual coding work with attendance/idle time tracking.

---

## What You'll Need from Your Side

### 1. **Azure DevOps Organization Details**
- **Organization URL**: e.g., `https://dev.azure.com/yourcompany`
- **Organization Name**: e.g., `yourcompany`
- **Project Names**: List of projects to sync (or sync all)

### 2. **Authentication Setup**
You have two options:

#### Option A: Personal Access Token (PAT) - Simpler ✅ **Recommended for Start**
**Steps to Create PAT:**
1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Click "New Token"
3. Set expiration (recommend 90 days or custom)
4. Select scopes (permissions):
   - ✅ **Work Items**: Read & Write
   - ✅ **Project and Team**: Read
   - ✅ **Code**: Read (for commit tracking)
   - ✅ **Build**: Read (optional)
   - ✅ **Release**: Read (optional)
5. Generate and copy the token
6. **Store it securely** - you'll only see it once!

**Provide to me:**
- The PAT token (keep it secret!)
- Token expiration date

#### Option B: OAuth 2.0 App - Enterprise Solution
**Steps:**
1. Register an OAuth app in Azure DevOps
2. Get Client ID and Client Secret
3. Set redirect URI for callback
4. Grant organization-wide permissions

**Provide to me:**
- Client ID
- Client Secret
- Tenant ID (if applicable)

---

## What We'll Build Together

### Phase 1: Project Synchronization (Week 1)
**Features:**
- ✅ Import all projects from Azure DevOps
- ✅ One-time sync or scheduled (daily/hourly)
- ✅ Map Azure DevOps projects to HRMS projects
- ✅ Sync project metadata (name, description, dates, status)
- ✅ Sync team members and roles

**Database Changes:**
- Add `azureDevOpsId` field to Project model
- Add `azureDevOpsUrl` field for direct linking
- Add `lastSyncedAt` timestamp

**API Endpoints:**
- `POST /api/integrations/azure/sync-projects` - Manual sync
- `GET /api/integrations/azure/projects` - List synced projects
- `POST /api/integrations/azure/connect` - Initial connection setup

---

### Phase 2: Work Item Synchronization (Week 2)
**Features:**
- ✅ Import user stories, tasks, bugs from Azure Boards
- ✅ Sync work item status (New, Active, Resolved, Closed)
- ✅ Assign work items to employees (map Azure users to HRMS users)
- ✅ Track work item progress
- ✅ Two-way sync: Updates in HRMS reflect in Azure DevOps

**Database Changes:**
- Add `azureDevOpsId` to Task model
- Add `azureDevOpsType` (Story, Task, Bug, Epic)
- Add `azureDevOpsState` field
- Add `azureDevOpsUrl` for direct linking

**Mapping Required:**
- Azure DevOps users → HRMS employees
- We'll create a mapping table: `AzureDevOpsUserMapping`

---

### Phase 3: Commit & Activity Tracking (Week 3) 🔥 **Most Powerful**
**Features:**
- ✅ Track Git commits by each developer
- ✅ Count commits per day as productivity metric
- ✅ Link commits to work items automatically
- ✅ **Reduce idle time** if developer has commits (proof of work!)
- ✅ Show commit history in attendance details
- ✅ Track pull requests (created, reviewed, merged)

**How It Works:**
```
Employee punches in → HRMS tracks activity
Employee has 2 hours idle time detected
BUT employee made 5 commits during that time!
→ System adjusts: "Coding activity detected, idle time reduced"
→ Final idle time: 0.5 hours (adjusted from 2 hours)
```

**Database Changes:**
- New model: `DeveloperCommit`
  - `commitHash`, `message`, `timestamp`
  - `employeeId`, `projectId`
  - `filesChanged`, `linesAdded`, `linesDeleted`
- New model: `PullRequest`
  - `prNumber`, `title`, `status`
  - `createdBy`, `reviewedBy`, `mergedBy`

---

### Phase 4: Sprint & Release Tracking (Week 4)
**Features:**
- ✅ Sync Azure DevOps sprints
- ✅ Track sprint progress in HRMS
- ✅ Sprint burndown charts
- ✅ Release management
- ✅ Sprint-based reporting (velocity, completion rate)

---

## Integration Architecture

### Data Flow:
```
Azure DevOps API
      ↓
  [Webhook Listener]  (Real-time updates)
      ↓
  HRMS Backend API
      ↓
  PostgreSQL Database
      ↓
  HRMS Frontend (React)
```

### Sync Strategy Options:
1. **Manual Sync** - Admin clicks "Sync Now" button
2. **Scheduled Sync** - Cron job runs every hour/day
3. **Webhook-based** - Real-time updates from Azure DevOps
4. **Hybrid** - Scheduled + Webhooks (recommended)

---

## Security Considerations

### 1. Token Storage
- Store PAT encrypted in database
- Use environment variables for sensitive config
- Rotate tokens every 90 days

### 2. Permissions
- Only admins can configure Azure DevOps connection
- Employees can view their own synced work items
- Managers can view team's work items

### 3. Rate Limiting
- Azure DevOps API has rate limits
- Implement exponential backoff
- Cache frequently accessed data

---

## User Experience - How It Will Look

### For Employees:
**Dashboard Widget:**
```
┌─────────────────────────────────┐
│ My Azure DevOps Work Items      │
├─────────────────────────────────┤
│ 🔵 Bug #4521: Fix login issue   │
│    Status: In Progress           │
│    Updated: 2 hours ago          │
│                                  │
│ 🟢 Task #4520: Add validation   │
│    Status: Completed             │
│    Commits: 3 today              │
│                                  │
│ [View All in Azure DevOps] →    │
└─────────────────────────────────┘
```

**Attendance Detail:**
```
Work Hours: 8.0h
Idle Time: 2.0h
Commits Today: 7 commits
Active Coding: 4.5h
Adjusted Idle: 0.5h ✅
```

### For Managers/Admins:
**Project Dashboard:**
```
Project: E-Commerce Website
Azure DevOps: [View in DevOps] →

Team Velocity: 45 story points/sprint
Active Work Items: 23
Commits This Week: 142
Top Contributors:
  - John Doe: 45 commits
  - Jane Smith: 38 commits
```

**Attendance Calendar (Enhanced):**
```
Click on date → See employees
Click on employee → See:
  - Work hours & idle time
  - Daily work update
  - Azure DevOps commits (NEW!)
  - Pull requests (NEW!)
  - Work items completed (NEW!)
```

---

## Step-by-Step Implementation Plan

### Week 1: Setup & Basic Sync
**You Provide:**
- [ ] Azure DevOps organization URL
- [ ] Personal Access Token (PAT)
- [ ] List of projects to sync
- [ ] List of Azure DevOps users + corresponding HRMS employees

**I Will Build:**
- [ ] Azure DevOps API client
- [ ] Connection configuration page
- [ ] Manual project sync functionality
- [ ] Project mapping UI
- [ ] Initial database schema changes

### Week 2: Work Items & Assignments
**You Provide:**
- [ ] Confirm user mappings are correct
- [ ] Decide which work item types to sync (Story, Task, Bug, Epic)
- [ ] Decide on sync frequency (hourly, daily)

**I Will Build:**
- [ ] Work item sync engine
- [ ] Task assignment from Azure DevOps
- [ ] Work item status updates
- [ ] Employee dashboard widget
- [ ] Manager/Admin work item views

### Week 3: Commit Tracking & Idle Adjustment
**You Provide:**
- [ ] Confirm repositories to track
- [ ] Decide idle time adjustment formula
  - Example: 1 commit = reduce idle by 15 minutes?
  - Or: Any commit in hour = mark hour as active?

**I Will Build:**
- [ ] Git commit tracking
- [ ] Commit history in attendance details
- [ ] Idle time adjustment algorithm
- [ ] Pull request tracking
- [ ] Code review activity tracking

### Week 4: Advanced Features
**You Decide:**
- [ ] Sprint tracking needed?
- [ ] Burndown charts?
- [ ] Release management?
- [ ] Build/pipeline integration?

---

## Cost & Performance Considerations

### API Rate Limits:
- **Azure DevOps**: ~200 requests per user per hour
- **Our Strategy**: Cache aggressively, batch requests

### Database Impact:
- **Projects**: ~50-100 records (minimal)
- **Work Items**: ~1000-5000 records (moderate)
- **Commits**: ~10,000-50,000 records (significant)
- **Solution**: Implement data retention (keep last 90 days of commits)

### Performance:
- Initial sync: 5-15 minutes (one-time)
- Daily sync: 1-3 minutes
- Real-time webhooks: Instant (<1 second)

---

## FAQ

### Q: Can we sync multiple Azure DevOps organizations?
**A:** Yes! We can configure multiple PATs for different organizations.

### Q: What if employee leaves the company?
**A:** Their Azure DevOps mapping is retained for historical data, marked as "inactive."

### Q: Can we choose which projects to sync?
**A:** Absolutely! You can include/exclude projects individually.

### Q: What about private repositories?
**A:** PAT with "Code: Read" permission can access private repos within your organization.

### Q: Can we sync historical data?
**A:** Yes, but we recommend syncing last 90 days initially to avoid overwhelming the system.

### Q: What if Azure DevOps is down?
**A:** HRMS continues to work normally. Sync resumes automatically when DevOps is back.

### Q: Can employees see other people's commits?
**A:** Managers see their team's commits. Admins see all. Employees see only their own.

---

## Next Steps

1. **Provide Information:**
   - Azure DevOps organization URL
   - Personal Access Token (PAT)
   - List 5-10 projects to test with initially

2. **Review & Approve:**
   - Review this document
   - Confirm which phases you want (recommend Phase 1-3)
   - Set priorities

3. **I'll Start Building:**
   - Once I have the PAT and org details
   - Start with Phase 1 (Project Sync)
   - Deliver incremental updates weekly

---

## Summary

**Azure DevOps Integration Benefits:**
✅ **Automatic Project Import** - No manual data entry
✅ **Real Work Validation** - Commits = proof of productivity
✅ **Reduced False Idle Time** - Coding activity detected
✅ **Better Insights** - Link time tracking to actual deliverables
✅ **Unified View** - HRMS + DevOps in one place
✅ **Client Confidence** - "Here's what they built today"

**What You Need to Provide:**
1. Azure DevOps organization URL
2. Personal Access Token (PAT)
3. User email mapping (Azure → HRMS)

**What I'll Deliver:**
- Complete integration in 3-4 weeks
- Fully functional sync system
- Beautiful UI showing commits & work items
- Idle time adjustment based on coding activity
- Comprehensive admin controls

---

Let's build this! 🚀
