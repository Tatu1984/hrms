# Asana Integration Setup Guide

## 🎯 Complete Step-by-Step Guide to Connect Asana

This guide will help you connect:
1. **Your own Asana** workspace
2. **Your client's Asana** workspace

---

## 📋 Prerequisites

Before you begin:
- ✅ Admin access to your HRMS system
- ✅ Access to your Asana workspace
- ✅ Access to your client's Asana workspace (with permission)
- ✅ Ability to create Personal Access Tokens

---

## Part 1: Connect Your Own Asana

### Step 1: Get Your Workspace

1. Go to [https://app.asana.com](https://app.asana.com)
2. Sign in with your account
3. Look at the top left - you'll see your workspace name
4. Click the workspace dropdown to see all workspaces you have access to

**Note**: You can be in multiple workspaces. The HRMS will ask which one to use, or auto-detect the first one.

### Step 2: Create Personal Access Token (PAT)

1. Click your **profile photo** in the top right
2. Select **My Settings**
3. Click the **Apps** tab
4. Scroll down to **Personal Access Tokens** section
5. Click **"+ New access token"**

6. Fill in the form:
   **Token name**: `HRMS Integration - My Asana`

   **Description** (optional): `Read-only access for HRMS work item sync`

7. Click **Create token**

8. **COPY THE TOKEN IMMEDIATELY** - you won't see it again!

Example token (fake):
```
0/1234567890abcdef1234567890abcdef
```

⚠️ **Important**: Asana tokens are READ-ONLY by default (can't modify data) ✅

### Step 3: Add Connection in HRMS

1. **Login to HRMS** as Admin
2. Go to **Admin Dashboard** → **Integrations**
   - Dev URL: `http://localhost:3000/admin/integrations`
   - Prod URL: `https://your-domain.vercel.app/admin/integrations`

3. Click **"+ Add Connection"**

4. Select **Asana** (pink tile)

5. Fill in the form:
   - **Connection Name**: `My Asana`
   - **Personal Access Token**: Paste your token
   - **Workspace ID**: Leave empty (auto-detects) or paste workspace GID

6. Click **"Test Connection"**
   - ✅ Success: Green message "Connection successful!"
   - ❌ Failed: Check token is correct

7. Click **"Create Connection"**

8. Done! Your Asana is connected ✅

---

## Part 2: Connect Your Client's Asana

### Step 1: Get Access from Client

**Email template to send**:

```
Subject: Asana Integration for Project Tracking

Hi [Client Name],

To streamline our collaboration and provide better visibility, we'd like to integrate our HRMS with your Asana workspace.

Benefits:
- See all tasks assigned to our team in one place
- Track progress automatically
- Generate detailed status reports
- Link task completion to work hours

What we need:
1. Access to your Asana workspace (invite us as guest/member)
2. A Personal Access Token from your workspace

Steps to create token:
1. In Asana, go to Profile → My Settings → Apps
2. Under "Personal Access Tokens", create new token
3. Name it "HRMS Integration - [Your Company]"
4. Share the token with us securely

The token is READ-ONLY - we cannot modify your data.

Alternatively, you can create the token using one of your team member's accounts who has our email addresses assigned to tasks.

Best regards,
[Your Name]
```

### Step 2: Two Options for Client Integration

#### Option A: Client Creates Token (Recommended)

**Client provides**:
- Asana Personal Access Token

**You need**:
- Token from client
- Workspace will auto-detect

#### Option B: Client Invites You to Workspace

**Client invites you**:
1. Client goes to Workspace → Members
2. Invites your email as **Guest** or **Member**
3. You accept invitation

**You create token**:
1. Use your own Asana account (now with access to client workspace)
2. Create PAT in your settings
3. Select client's workspace when connecting in HRMS

### Step 3: Add Client's Connection in HRMS

1. **Login to HRMS** as Admin
2. Go to **Admin** → **Integrations**
3. Click **"+ Add Connection"**
4. Select **Asana** (pink tile)
5. Fill in:
   - **Connection Name**: `Client Name - Asana`
   - **Personal Access Token**: Paste token
   - **Workspace ID**: Leave empty or paste specific workspace GID
6. Click **"Test Connection"**
7. If successful, click **"Create Connection"**

### Step 4: Map Users

**Auto-mapping** (default):
- System matches by email address
- Client's Asana user: `john@clientcompany.com`
- Your HRMS employee: `john@clientcompany.com`
- If emails match → Automatically linked ✅

**Manual mapping** (if needed):
- Map client's Asana users to your HRMS employees
- Example:
  - Asana user: `john.doe@clientcompany.com`
  - Maps to: `John Doe (employee@yourcompany.com)`

---

## Part 3: Sync and View Tasks

### Sync Data

1. Go to **Admin** → **Integrations**
2. Find your Asana connection
3. Click **"Sync Now"**
4. Wait for completion (10-60 seconds)
5. Check status:
   - ✅ **Success**: Tasks synced successfully
   - ⚠️ **Partial**: Some tasks synced
   - ❌ **Failed**: Check error message

### View Synced Tasks

**As Admin/Manager**:
1. Go to **Admin** → **Work Items**
2. Filter by:
   - Platform: Asana
   - Connection: Select connection
   - Employee: Select team member

**As Employee**:
1. Go to **Employee Dashboard** → **Work Items**
2. See all Asana tasks assigned to you
3. Click task to view:
   - Full description
   - Status and section
   - Tags and custom fields
   - Due date
   - Direct link to Asana

---

## 🎨 What Gets Synced

### Tasks
- ✅ Task name and description
- ✅ Assignee (matched to HRMS employee)
- ✅ Status (To Do, In Progress, Completed, etc.)
- ✅ Section (task board column)
- ✅ Tags
- ✅ Custom fields
- ✅ Due date
- ✅ Completed date
- ✅ Project/Board name
- ✅ Created/modified dates

### Projects
- ✅ Project names
- ✅ Sections within projects
- ✅ Project color
- ✅ Project owner

### Not Synced
- ❌ Comments (future feature)
- ❌ Attachments (future feature)
- ❌ Subtasks (synced as separate tasks)
- ❌ Dependencies (future feature)

---

## 🔐 Security & Permissions

### Token Security

1. **Read-only by default**
   - Asana PATs are read-only
   - Cannot modify tasks
   - Cannot delete data
   - Safe for integration ✅

2. **Store securely**
   - Tokens encrypted in database
   - Never committed to code
   - Only admins can view connections

3. **Revoke if needed**
   - Go to Asana → Settings → Apps
   - Find token in list
   - Click "Revoke" button
   - Delete connection in HRMS

### Access Control in HRMS

**Add connections**: ADMIN only
**Trigger sync**: ADMIN and MANAGER
**View tasks**: All employees (own tasks only)

---

## 🔧 Troubleshooting

### Issue: "Connection test failed"

**Causes**:
1. **Invalid token**
   - Token might be revoked
   - Check you copied entire token
   - No extra spaces before/after

2. **Network issue**
   - Check internet connection
   - Try again in a few minutes

**Solution**:
```bash
# Generate new token:
1. Asana → Settings → Apps → Personal Access Tokens
2. Create new token
3. Copy token
4. Test in HRMS again
```

### Issue: "No tasks synced"

**Check**:
1. Are there tasks in Asana workspace?
2. Are tasks assigned to users?
3. Is workspace selected correctly?
4. Check sync error message

**Solution**:
```
1. Go to Asana workspace
2. Verify tasks exist and are assigned
3. Check task dates (syncs last 30 days by default)
4. Sync again in HRMS
```

### Issue: "Employee not seeing tasks"

**Check**:
1. Is employee's email same in HRMS and Asana?
2. Are tasks actually assigned to that email in Asana?
3. Has sync completed successfully?

**Check email mapping**:
```sql
-- In database:
SELECT
  employeeEmail,
  externalEmail,
  externalName
FROM "IntegrationUserMapping"
WHERE connectionId = 'asana-connection-id'
  AND employeeId = 'employee-id';
```

### Issue: "Multiple workspaces, wrong one connected"

**Solution**:
1. Get correct Workspace GID:
   - In Asana, go to workspace
   - Look at URL: `https://app.asana.com/0/WORKSPACE_GID/...`
   - Copy the WORKSPACE_GID

2. Edit connection in HRMS:
   - Delete old connection
   - Create new connection
   - Paste specific Workspace ID in form

---

## 📊 Use Cases

### 1. Client Task Tracking

**Scenario**: Client uses Asana, you use HRMS.

**Solution**:
```
1. Connect client's Asana to HRMS
2. Tasks assigned to your team sync automatically
3. Employees see tasks in HRMS
4. No need to switch between systems
```

### 2. Unified Task View

**Scenario**: Team works on both Azure DevOps and Asana projects.

**Solution**:
```
1. Connect both Azure DevOps and Asana
2. Employee dashboard shows ALL tasks
3. Filter by platform if needed
4. Single source of truth ✅
```

### 3. Work Hours Justification

**Scenario**: Track which tasks were worked on during the day.

**Solution**:
```
1. Employee punches in
2. Works on Asana tasks
3. Daily work update links to Asana tasks
4. Manager can verify work done
```

---

## 🎨 Asana UI Theme in HRMS

The HRMS displays Asana tasks with their signature pink theme:

**Visual Elements**:
- 🩷 **Pink primary color** (#F06A6A)
- 📋 **Section-based organization** (like Asana boards)
- 🏷️ **Tags** with colors
- ✅ **Completion status** clearly marked
- 📅 **Due dates** highlighted

**Task Card Example**:
```
┌─────────────────────────────────────┐
│ 🩷 AS  Client Name - Asana          │
│                                     │
│ Update website homepage design     │
│                                     │
│ [In Progress] [Design] [High Priority]
│                                     │
│ Project: Website Redesign           │
│ Section: In Progress                │
│ Due: Nov 15                         │
│ Assigned: John Doe                  │
└─────────────────────────────────────┘
```

---

## 🔄 Sync Behavior

### What Happens During Sync

1. **Fetch tasks** from Asana workspace
2. **Match users** by email to HRMS employees
3. **Save tasks** with sections, tags, custom fields
4. **Update existing** tasks if already synced
5. **Mark as completed** if completed in Asana

### Sync Frequency

**Current**: Manual sync (click "Sync Now")
**Recommended**: Once per day

**Future**: Automatic options
- Hourly
- Daily (morning)
- Real-time (webhooks)

---

## 💡 Tips & Best Practices

### For Better Integration

1. **Use same emails**
   - Keep email addresses consistent
   - HRMS: `john@yourcompany.com`
   - Asana: `john@yourcompany.com`
   - Auto-mapping works seamlessly ✅

2. **Organize with sections**
   - Asana sections become status in HRMS
   - "To Do" → Shows as "To Do" status
   - "In Progress" → Shows as "In Progress"
   - "Done" → Shows as "Completed"

3. **Use tags for categorization**
   - Tags sync to HRMS
   - Use for: Priority, Type, Client, etc.
   - Visible in task details

4. **Set due dates**
   - Due dates sync and show in HRMS
   - Helps with workload planning
   - Overdue tasks highlighted

### For Client Projects

1. **Create separate project**
   - Don't mix internal and client tasks
   - Easier to filter and report

2. **Assign clearly**
   - Assign tasks to specific team members
   - Use email addresses known to HRMS

3. **Update regularly**
   - Sync HRMS daily
   - Keep Asana tasks up to date
   - Mark completed tasks

---

## 📞 Support

### Common Questions

**Q: Can I connect multiple Asana workspaces?**
A: Yes! Create separate connections for each workspace.

**Q: Will syncing slow down Asana?**
A: No, syncing only reads data and doesn't affect Asana performance.

**Q: Can employees update tasks from HRMS?**
A: Not currently. HRMS is read-only. Future feature planned.

**Q: What happens if I revoke the token?**
A: Sync will fail. Delete connection in HRMS and create new one with new token.

**Q: How often should I sync?**
A: Recommend once per day. More frequent if tasks change often.

### Getting Help

**Connection Issues**:
1. Verify token is valid (not revoked)
2. Check copied entire token
3. Try with new token

**Data Issues**:
1. Check sync status and errors
2. Verify email mapping
3. Check tasks exist in Asana
4. Look at browser console (F12)

**Documentation**:
- [INTEGRATIONS_GUIDE.md](INTEGRATIONS_GUIDE.md) - Main integration guide
- [AZURE_DEVOPS_SETUP_GUIDE.md](AZURE_DEVOPS_SETUP_GUIDE.md) - Azure DevOps guide

---

## ✅ Checklist

### Your Asana
- [ ] Got workspace name/ID
- [ ] Created Personal Access Token
- [ ] Added connection in HRMS
- [ ] Tested connection successfully
- [ ] Synced data successfully
- [ ] Verified tasks appear in HRMS

### Client's Asana
- [ ] Requested access from client
- [ ] Received PAT or workspace invitation
- [ ] Added connection in HRMS
- [ ] Tested connection successfully
- [ ] Synced data successfully
- [ ] Verified user mapping
- [ ] Confirmed tasks appear correctly

---

## 🎉 Success!

Once connected, you'll have:
- ✅ All Asana tasks in HRMS
- ✅ Unified view with Azure DevOps items
- ✅ No need to switch between platforms
- ✅ Better productivity tracking
- ✅ Easier client reporting
- ✅ Single dashboard for all work

**Next Steps**:
1. Sync regularly (daily recommended)
2. Check employee feedback
3. Generate reports for clients
4. Monitor team workload

**Related Guides**:
- [AZURE_DEVOPS_SETUP_GUIDE.md](AZURE_DEVOPS_SETUP_GUIDE.md) - Connect Azure DevOps
- [INTEGRATIONS_GUIDE.md](INTEGRATIONS_GUIDE.md) - Integration overview
