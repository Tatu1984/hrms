# HRMS User Manual

> Human Resource Management System - User Guide

**Version:** 2.1
**Last Updated:** January 17, 2026
**Organization:** Infiniti Tech Partners

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Quick Start](#2-quick-start)
3. [Deployment Guide](#3-deployment-guide)
4. [User Roles](#4-user-roles)
5. [Admin Guide](#5-admin-guide)
6. [Employee Guide](#6-employee-guide)
7. [Manager Guide](#7-manager-guide)
8. [System Features](#8-system-features)
9. [Integrations Setup](#9-integrations-setup)
10. [Security Best Practices](#10-security-best-practices)
11. [Troubleshooting](#11-troubleshooting)
12. [FAQ](#12-faq)

---

## 1. Introduction

### What is HRMS?

HRMS (Human Resource Management System) is a comprehensive enterprise application designed to manage all aspects of human resources, including:

- **Employee Management** - Complete employee profiles with documents
- **Attendance Tracking** - Real-time punch in/out with idle detection
- **Leave Management** - Leave applications and approvals
- **Payroll Processing** - Automated salary calculations
- **Project Management** - Projects and task tracking
- **Sales CRM** - Lead and sales management
- **Accounts** - Income/expense tracking with invoicing
- **AI Features** - 8 AI-powered modules for intelligent HR operations
- **Integrations** - Azure DevOps, Asana, Confluence

### Key Benefits

- Centralized HR data management
- Automated attendance and payroll
- Real-time activity monitoring
- Multi-role access control
- External tool integrations
- AI-powered insights

---

## 2. Quick Start

### Fastest Deployment (5 Minutes)

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial HRMS deployment"
git remote add origin https://github.com/YOUR_USERNAME/hrms.git
git push -u origin main
```

#### Step 2: Deploy to Vercel (FREE)
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Click "Deploy"

#### Step 3: Add Environment Variables
In Vercel Dashboard > Settings > Environment Variables:
```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-secure-random-string
```

Generate secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Step 4: Login
- URL: `https://your-project.vercel.app`
- Username: `admin`
- Password: `admin123`

**Change the default password immediately!**

---

## 3. Deployment Guide

### Recommended: Vercel + Supabase (FREE)

#### Why This Combo?
- **Vercel:** FREE hosting, best Next.js performance
- **Supabase:** FREE PostgreSQL database (500MB)
- **Total cost:** $0/month for getting started

#### Setup Steps

1. **Deploy to Vercel** (as described in Quick Start)

2. **Create Supabase Database:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy PostgreSQL connection string from Settings > Database

3. **Update Environment Variables:**
   - Add `DATABASE_URL` with Supabase connection string
   - Redeploy

4. **Run Database Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### Alternative Platforms

| Platform | Cost | Best For |
|----------|------|----------|
| Vercel | FREE | Easiest, fastest |
| Railway | $5/mo | All-in-one |
| Render | FREE/$7 | Budget-friendly |
| DigitalOcean | $5/mo | Scalability |

### Connecting Your Domain

#### For Subdomain (Recommended)
In your DNS provider, add CNAME record:
```
Type: CNAME
Host: hrms
Points to: cname.vercel-dns.com
TTL: 3600
```

#### For Root Domain
Add A record pointing to Vercel's IP address (shown in Vercel dashboard).

**Note:** DNS changes take 24-48 hours to propagate.

---

## 4. User Roles

### Role Permissions

| Role | Access Level | Key Permissions |
|------|--------------|-----------------|
| **ADMIN** | Full Access | All modules, system configuration, user management |
| **MANAGER** | Team Level | Team attendance, leave approvals, project management |
| **EMPLOYEE** | Self Only | Personal dashboard, attendance, leave requests |

### Default Login

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

**Important:** Change default passwords immediately in production!

---

## 5. Admin Guide

### Dashboard Overview

Access: `/admin/dashboard`

The admin dashboard provides:
- Employee count and status
- Today's attendance summary
- Pending leave requests
- Sales pipeline metrics
- Quick entry section for common actions

### Employee Management

Access: `/admin/employees`

**Add New Employee:**
1. Click "Add Employee" button
2. Fill required fields: Name, Email, Phone, Department, Designation, Salary
3. Click "Create Employee"
4. Employee ID auto-generates (EMP001, EMP002...)

**Create Login for Employee:**
1. Find employee in table
2. Click "Create Login" button
3. Enter username, password, and role
4. Click "Create Login"

**Employee Profile Features:**
- Personal information
- KYC documents (Aadhar, PAN)
- Bank account details
- Reporting structure
- Active/Inactive status

### Attendance Management

Access: `/admin/attendance`

**View Attendance:**
- Calendar view with color-coded status
- Click any date to see detailed records
- Filter by employee or department

**Edit Attendance:**
- Go to `/admin/attendance/edit`
- Select date and employee
- Modify punch times, break duration, status
- Save changes

**Employee Status Dashboard:**
- Go to `/admin/employee-status`
- Real-time view of all employee status:
  - ACTIVE (green) - Activity in last 5 minutes
  - IDLE (yellow) - 5-15 minutes since activity
  - AWAY (orange) - 15+ minutes since activity
  - OFFLINE (gray) - Not punched in

### Payroll Management

Access: `/admin/payroll`

**Generate Payroll:**
1. Select month and year
2. Click "Generate Payroll"
3. System calculates based on attendance
4. Review and approve payslips

**Payroll Components:**
- Basic salary (pro-rated by attendance)
- Variable pay (for sales roles)
- Deductions: P.Tax, TDS, penalties, advance
- Net salary calculation

**Print Payslips:**
- Select employees
- Click "Print Payslips"
- 3 payslips per A4 page

### Leave Management

Access: `/admin/leaves`

**Approve/Reject Leaves:**
1. View pending requests
2. Click on leave request
3. Add admin comment (optional)
4. Click "Approve" or "Reject"

**Leave Types:**
- Sick Leave (12 days/year)
- Casual Leave (12 days/year)
- Earned Leave (12 days/year)
- Unpaid Leave

### IAM & Security

Access: `/admin/security/iam`

**Initialize Roles (First Time):**
1. Click "Initialize Roles"
2. System creates ADMIN, MANAGER, EMPLOYEE roles

**Create Custom Roles:**
1. Go to Roles tab
2. Click "Create Role"
3. Enter name, description
4. Select permissions
5. Save role

**Assign Roles to Users:**
1. Go to Users tab
2. Find user
3. Click "Manage Roles"
4. Assign/remove roles

---

## 6. Employee Guide

### Dashboard

Access: `/employee/dashboard`

View:
- Today's attendance status
- Work hours summary
- Leave balance
- Assigned tasks
- Recent messages

### Attendance

**Punch In:**
1. Click "Punch In" button
2. System records time and IP
3. Activity tracking starts

**Punch Out:**
1. Click "Punch Out" button
2. System calculates total hours
3. Breaks and idle time deducted

**Taking Breaks:**
1. Click "Start Break"
2. Break timer starts
3. Click "End Break" when returning
4. Break duration recorded

**VM Mode (for Remote Desktop):**
If working in RDP/Remote Desktop:
1. Toggle "VM Mode" ON
2. Prevents false idle detection
3. Toggle OFF when back to normal work

### Leave Application

**Apply for Leave:**
1. Go to `/employee/leaves`
2. Click "Apply Leave"
3. Select leave type
4. Choose dates
5. Enter reason
6. Submit

**Track Status:**
- PENDING - Awaiting approval
- APPROVED - Leave granted
- REJECTED - Leave denied (check comment)
- HOLD - Under review

### Tasks

Access: `/employee/tasks`

View assigned tasks with:
- Title and description
- Priority (Low, Medium, High, Urgent)
- Due date
- Status

Update task status as you progress.

### Daily Work Updates

Submit daily updates about work completed:
1. Go to Work Updates
2. Enter today's accomplishments
3. Submit

---

## 7. Manager Guide

### Team Dashboard

Access: `/manager/dashboard`

View:
- Team attendance overview
- Pending leave requests
- Team tasks status
- Project progress

### Leave Approvals

1. View pending leave requests
2. Check leave balance and history
3. Approve or reject with comment

### Team Attendance

View and monitor:
- Real-time team status
- Attendance calendar
- Time analytics

### Task Assignment

1. Create tasks for team members
2. Set priority and due dates
3. Monitor progress

---

## 8. System Features

### Attendance System

**How It Works:**
1. Employee punches in
2. Browser sends heartbeat every 30 seconds (if active)
3. Server detects gaps > 3.5 minutes = idle time
4. Punch out calculates: Total = Gross - Breaks - Idle

**Activity Detection:**
- Mouse movement
- Keyboard input
- Clicking
- Scrolling

**Bot Detection:**
The system detects automation tools:
- Mouse jigglers (linear patterns)
- Auto-clickers (regular intervals)
- Auto-typers (repetitive keystrokes)

### Payroll Calculation

**For Fixed Salary:**
```
Basic Payable = (Monthly Salary / 30) x Days Present
Net Salary = Basic Payable - Deductions
```

**For Variable Salary (Sales):**
```
Basic Payable = (Monthly Salary / 30) x Days Present
Variable Payable = Based on target achievement
Net Salary = Basic + Variable - Deductions
```

**Target Achievement Tiers:**
| Achievement | Variable Pay |
|-------------|--------------|
| >= 100% | Full variable |
| 50-99% | Proportional |
| < 50% | None |

### Sales CRM

**Lead Pipeline:**
1. NEW - Fresh lead
2. COLD_CALL_BACK - Initial contact made
3. WARM - Interested
4. PROSPECT - Negotiating
5. SALE_MADE - Closed
6. CONVERTED - Project created

**Sales Commission:**
| Achievement | Rate |
|-------------|------|
| >= 100% | 10% |
| 75-99% | 7% |
| 50-74% | 5% |
| < 50% | 0% |

### Accounts & Invoicing

**Account Entries:**
- Income and expense tracking
- Category-based organization
- Automatic sync from sales (optional)

**Invoice Generation:**
1. Click "Generate Invoice"
2. Enter client details
3. Add line items
4. Generate and send

---

## 9. Integrations Setup

### Azure DevOps

**Get Personal Access Token:**
1. Go to Azure DevOps
2. User Settings > Personal Access Tokens
3. Create token with scopes:
   - Work Items (Read)
   - Code (Read)
   - Graph (Read)

**Add Connection:**
1. Admin > Integrations
2. Click "Add Connection"
3. Select Azure DevOps
4. Enter Organization URL and Token
5. Test and Save

### Asana

**Get Personal Access Token:**
1. Go to Asana
2. My Profile Settings > Apps
3. Create new access token

**Add Connection:**
1. Admin > Integrations
2. Click "Add Connection"
3. Select Asana
4. Enter Token
5. Test and Save

### Confluence

**Get API Token:**
1. Go to Atlassian Account
2. Security > API Tokens
3. Create new token

**Add Connection:**
1. Admin > Integrations
2. Click "Add Connection"
3. Select Confluence
4. Enter Base URL, Email, Token
5. Test and Save

### User Mapping

External platform users are automatically mapped to HRMS employees by email address.

### Syncing Data

1. Go to Admin > Integrations
2. Click "Sync Now" on connection
3. Work items sync to HRMS
4. Employees see tasks in their dashboard

---

## 10. Security Best Practices

### Password Security

1. **Change Default Password** - Immediately after first login
2. **Use Strong Passwords** - Minimum 8 characters, mix of letters/numbers/symbols
3. **Never Share Passwords** - Each user should have their own account

### Token Security

1. **Generate Strong JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. **Never Commit Secrets** - Keep .env out of version control
3. **Rotate Tokens** - Regularly update API tokens

### Access Control

1. **Principle of Least Privilege** - Give minimum required access
2. **Regular Audits** - Review user roles periodically
3. **Disable Inactive Accounts** - Remove access for terminated employees

### Data Protection

1. **HTTPS Only** - Always use HTTPS in production
2. **Regular Backups** - Enable automated database backups
3. **Audit Logs** - Monitor system activity

---

## 11. Troubleshooting

### Login Issues

**Can't login:**
- Check username and password (case-sensitive)
- Clear browser cookies
- Try incognito mode

**Session expired:**
- Session lasts 7 days
- Login again to refresh

### Attendance Issues

**Heartbeat not working:**
- Check browser console for errors
- Ensure you're punched in
- Verify `hrms_punched_in=true` in localStorage

**High idle time:**
- VM Mode might be needed for Remote Desktop
- Check if breaks were properly started/ended

**Activity not tracking:**
- Ensure browser tab is active
- Check if ad blockers are interfering

### Payroll Issues

**Wrong calculations:**
- Verify attendance records first
- Check employee salary settings
- Review deduction entries

**Missing employees:**
- Confirm employee is active
- Check date of joining

### Database Issues

**Connection errors:**
- Verify DATABASE_URL format
- Check database is accessible
- Review firewall rules

### Build/Deploy Issues

**Build fails:**
- Run `npx prisma generate` first
- Check all environment variables
- Clear `.next` folder and retry

---

## 12. FAQ

**Q: How do I reset a user's password?**
A: Admin > Employees > Find user > Edit Access > Enter new password

**Q: How is idle time calculated?**
A: Inactive heartbeats (no activity for 3+ minutes) x 3 minutes

**Q: Can employees edit their attendance?**
A: No, only admins can edit attendance records

**Q: How do I add a new department?**
A: Admin > Settings > Departments > Add Department

**Q: What happens on weekends?**
A: Weekends are automatically marked and counted as paid days

**Q: How do leaves affect payroll?**
A: Approved leaves are counted as present days for salary calculation

**Q: Can I integrate with other tools?**
A: Currently supports Azure DevOps, Asana, and Confluence. More coming soon.

**Q: How do I backup data?**
A: Use your database provider's backup feature (Supabase, Neon have automated backups)

**Q: Is the system mobile-friendly?**
A: Yes, responsive design works on tablets and phones

**Q: How many users can the free tier handle?**
A: Vercel free tier handles ~25,000 requests/month, suitable for small teams (<10 users)

---

## Support

**For Deployment Help:**
- Quick Start: See section 2
- Full Guide: See section 3

**For Technical Issues:**
- Check Troubleshooting: Section 11
- Review FAQ: Section 12

**Contact:**
- Repository: https://github.com/Tatu1984/hrms
- Email: tech@infinititechpartners.com

---

## Version History

### v2.1 (January 2026)
- Added IAM & custom roles
- Enhanced attendance system
- Improved payroll calculations
- New integrations support
- AI features added

### v2.0 (December 2025)
- Project management module
- Sales CRM module
- Accounting module
- Azure DevOps integration

### v1.0 (November 2025)
- Initial release
- Employee management
- Attendance tracking
- Payroll processing
- Leave management

---

*HRMS - Human Resource Management System*
*Built for Infiniti Tech Partners*
