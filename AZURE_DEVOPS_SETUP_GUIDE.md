# Azure DevOps Integration Setup Guide

## 🎯 Complete Step-by-Step Guide to Connect Your Azure DevOps

This guide will help you connect:
1. **Your own Azure DevOps** organization
2. **Your client's Azure DevOps** organization

---

## 📋 Prerequisites

Before you begin, make sure you have:
- ✅ Admin access to your HRMS system
- ✅ Access to your Azure DevOps organization
- ✅ Access to your client's Azure DevOps organization (with their permission)
- ✅ Permission to create Personal Access Tokens (PATs)

---

## Part 1: Connect Your Own Azure DevOps

### Step 1: Get Your Organization URL

1. Go to [https://dev.azure.com](https://dev.azure.com)
2. Sign in with your Microsoft account
3. You'll see your organizations listed
4. Your organization URL will be: `https://dev.azure.com/{YourOrgName}`

**Example**: If your organization is "infinititech", the URL is:
```
https://dev.azure.com/infinititech
```

### Step 2: Create Personal Access Token (PAT)

1. Click on **User Settings** (gear icon) in the top right
2. Select **Personal Access Tokens**
3. Click **+ New Token**
4. Fill in the form:

   **Name**: `HRMS Integration - My Azure DevOps`

   **Organization**: Select your organization (or "All accessible organizations")

   **Expiration**: Choose duration
   - Recommended: **90 days** or **Custom defined** (1 year)
   - You'll need to regenerate when it expires

   **Scopes**: Click **"Show all scopes"** and select:
   - ✅ **Work Items** → **Read**
   - ✅ **Code** → **Read**
   - ✅ **Graph** → **Read** (for user information)

   ⚠️ **Important**: Only select READ permissions, never WRITE!

5. Click **Create**
6. **COPY THE TOKEN IMMEDIATELY** - you won't see it again!

Example token (fake):
```
abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz
```

### Step 3: Add Connection in HRMS

1. **Login to your HRMS** as Admin
2. Navigate to **Admin Dashboard** → **Integrations**
   - URL: `http://localhost:3000/admin/integrations` (dev)
   - URL: `https://your-domain.vercel.app/admin/integrations` (prod)

3. Click **"+ Add Connection"**

4. Select **Azure DevOps** (blue tile)

5. Fill in the form:
   - **Connection Name**: `My Azure DevOps`
   - **Organization URL**: `https://dev.azure.com/infinititech`
   - **Personal Access Token**: Paste the token you copied

6. Click **"Test Connection"**
   - ✅ If successful: Green success message appears
   - ❌ If failed: Check URL and token are correct

7. Click **"Create Connection"**

8. Done! Your Azure DevOps is now connected ✅

---

## Part 2: Connect Your Client's Azure DevOps

### Step 1: Get Access from Client

**Email template to send to your client**:

```
Subject: Azure DevOps Integration for Project Management

Hi [Client Name],

To better track our work and provide you with real-time updates, we'd like to integrate our HRMS with your Azure DevOps.

This will allow us to:
- Automatically sync work items assigned to our team
- Track commits and pull requests
- Provide detailed productivity reports
- Link code changes to tasks

What we need from you:
1. Your Azure DevOps organization URL (e.g., https://dev.azure.com/yourcompany)
2. A Personal Access Token with READ-ONLY access to:
   - Work Items
   - Code/Repositories
   - User information

Steps to create the token:
1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Create new token with READ permissions only
3. Share the token with us securely

The token will only be used to READ data, not modify anything.

Best regards,
[Your Name]
```

### Step 2: Receive Credentials from Client

Client should provide:
1. **Organization URL**: `https://dev.azure.com/clientcompany`
2. **Personal Access Token**: `xyz123abc456def789...`

⚠️ **Security Note**: Ask client to share PAT securely (encrypted email, secure file transfer, or password manager)

### Step 3: Add Client's Connection in HRMS

1. **Login to HRMS** as Admin
2. Go to **Admin** → **Integrations**
3. Click **"+ Add Connection"**
4. Select **Azure DevOps**
5. Fill in:
   - **Connection Name**: `Client Name - Azure DevOps`
   - **Organization URL**: Paste client's URL
   - **Personal Access Token**: Paste client's token
6. Click **"Test Connection"**
7. If successful, click **"Create Connection"**

### Step 4: Map Users

After connection is created:

1. Navigate to **Integrations** page
2. Click on the client's connection
3. Go to **"User Mappings"** (if available) or let system auto-map

**Auto-mapping** (default):
- System matches users by email address
- Client's Azure user: `john@clientcompany.com`
- Your HRMS employee: `john@yourcompany.com`
- If emails match, they're automatically linked

**Manual mapping** (if emails differ):
- You'll need to manually map each user
- Example:
  - Azure DevOps user: `john.doe@clientcompany.com`
  - Maps to HRMS employee: `John Doe (john@infinititech.com)`

---

## Part 3: Sync and View Work Items

### Sync Data

1. Go to **Admin** → **Integrations**
2. Find your connection
3. Click **"Sync Now"** button
4. Wait for sync to complete (usually 10-60 seconds)
5. Check sync status:
   - ✅ **Success**: Green badge
   - ⚠️ **Partial**: Yellow badge (some data synced)
   - ❌ **Failed**: Red badge (check error message)

### View Synced Work Items

**As Admin/Manager**:
1. Go to **Admin Dashboard** → **Work Items**
2. Filter by:
   - Platform: Azure DevOps
   - Connection: Select connection
   - Employee: Select employee

**As Employee**:
1. Go to **Employee Dashboard** → **Work Items**
2. See all your assigned tasks from Azure DevOps
3. Click on any item to see:
   - Full description
   - Status and priority
   - Related commits
   - Direct link to Azure DevOps

---

## 🔐 Security Best Practices

### Token Security

1. **Never commit tokens to Git**
   - Tokens are stored encrypted in database
   - Never include in code or config files

2. **Use minimum permissions**
   - Only READ access needed
   - Never grant WRITE or DELETE

3. **Set expiration**
   - Recommend 90 days to 1 year
   - Create calendar reminder to regenerate

4. **Rotate tokens regularly**
   - Every 6-12 months
   - Update in HRMS when rotated

5. **Revoke if compromised**
   - Immediately revoke in Azure DevOps
   - Delete connection in HRMS
   - Create new token

### Access Control

**Who can add connections?**
- Only ADMIN role users

**Who can sync data?**
- ADMIN and MANAGER roles

**Who can view work items?**
- Employees see only their assigned items
- Managers see team's items
- Admins see all items

---

## 🔧 Troubleshooting

### Issue: "Connection test failed"

**Possible causes**:
1. **Wrong URL format**
   - ✅ Correct: `https://dev.azure.com/orgname`
   - ❌ Wrong: `https://orgname.visualstudio.com`
   - ❌ Wrong: `dev.azure.com/orgname` (missing https://)

2. **Expired or invalid token**
   - Check token hasn't expired
   - Generate new token
   - Make sure you copied the entire token

3. **Insufficient permissions**
   - Token needs Work Items (Read) and Code (Read)
   - Recreate token with correct scopes

### Issue: "No work items synced"

**Check**:
1. Are there work items in Azure DevOps?
2. Are work items assigned to mapped users?
3. Check date range (syncs last 30 days by default)
4. Check sync status for errors

**Solution**:
```bash
# In HRMS:
1. Go to Integrations
2. Click connection
3. Check "Last Sync Error" message
4. Fix the issue mentioned
5. Click "Sync Now" again
```

### Issue: "Employee not showing work items"

**Check**:
1. Is employee email same in HRMS and Azure DevOps?
2. Has sync completed successfully?
3. Are work items actually assigned to that user in Azure DevOps?

**Solution**:
```sql
-- Check user mapping in database
SELECT
  employeeEmail,
  externalEmail,
  externalName
FROM "IntegrationUserMapping"
WHERE connectionId = 'your-connection-id';
```

### Issue: "Commits not linking to work items"

**Commit message format matters!**

✅ **Correct formats**:
```bash
git commit -m "Fix login bug #123"
git commit -m "Complete feature AB#456"
git commit -m "Update API #789 and #790"
```

❌ **Won't link**:
```bash
git commit -m "Fix bug 123"  # Missing #
git commit -m "Fix bug"       # No work item mentioned
```

Azure DevOps automatically links commits that mention `#123` or `AB#123`.

---

## 📊 What Gets Synced

### Work Items
- ✅ User Stories
- ✅ Tasks
- ✅ Bugs
- ✅ Epics
- ✅ Features
- ✅ Custom work item types

**Fields synced**:
- ID, Title, Description
- Status, Priority
- Assigned To
- Created/Modified dates
- Area Path, Iteration Path
- Story Points
- Tags
- Custom fields

### Commits
- ✅ Commit hash and message
- ✅ Author (matched to HRMS employee)
- ✅ Date and time
- ✅ Files changed count
- ✅ Lines added/deleted
- ✅ Repository name
- ✅ Branch name
- ✅ Linked work items (from commit message)

### Pull Requests
- ✅ PR number and title
- ✅ Description
- ✅ Status (Active, Completed, Abandoned)
- ✅ Source and target branches
- ✅ Reviewers
- ✅ Dates (created, completed, merged)
- ✅ Commit count

---

## 🎯 Use Cases

### 1. Track Developer Productivity

**Problem**: Need to prove developer was working during "idle" time.

**Solution**:
```
1. Check attendance idle time alert
2. Go to Work Items → Filter by employee
3. Check commits during idle period
4. If commits exist → Developer was coding ✅
```

### 2. Client Reporting

**Problem**: Client wants weekly progress report.

**Solution**:
```
1. Sync client's Azure DevOps
2. Generate report showing:
   - Work items completed
   - Commits made
   - Pull requests merged
3. Export data or take screenshots
```

### 3. Team Performance Review

**Problem**: Need to review team's work for sprint.

**Solution**:
```
1. Go to Work Items
2. Filter by: Date range (last 2 weeks)
3. Filter by: Team members
4. View completed items and commits
5. Use for performance discussions
```

---

## 🔄 Sync Frequency

### Manual Sync (Current)
- Click "Sync Now" button whenever needed
- Recommended: Once per day

### Automatic Sync (Future Feature)
Options you'll be able to configure:
- **Hourly**: Syncs every hour
- **Daily**: Syncs once per day (morning)
- **Real-time**: Webhook-based (instant)

---

## 📞 Support

### Getting Help

**Connection Issues**:
1. Check URL format
2. Verify token hasn't expired
3. Check permissions (Read access)
4. Try with new token

**Data Issues**:
1. Check sync status and errors
2. Verify user email mapping
3. Check work items exist in Azure DevOps
4. Look at HRMS server logs

**Contact**:
- Check [INTEGRATIONS_GUIDE.md](INTEGRATIONS_GUIDE.md)
- Check browser console for errors (F12)
- Check server logs for API errors

---

## ✅ Checklist

### Your Azure DevOps
- [ ] Got organization URL
- [ ] Created PAT with correct scopes
- [ ] Added connection in HRMS
- [ ] Tested connection successfully
- [ ] Synced data successfully
- [ ] Verified work items appear

### Client's Azure DevOps
- [ ] Requested access from client
- [ ] Received organization URL
- [ ] Received PAT from client
- [ ] Added connection in HRMS
- [ ] Tested connection successfully
- [ ] Synced data successfully
- [ ] Mapped users correctly
- [ ] Verified work items appear

---

## 🎉 Success!

Once connected, you'll be able to:
- ✅ See all work items in one place
- ✅ Track commits and code changes
- ✅ Prove productivity during idle time
- ✅ Generate reports for clients
- ✅ Monitor team performance
- ✅ Link code to tasks automatically

**Next**: Set up Asana integration (see [ASANA_SETUP_GUIDE.md](ASANA_SETUP_GUIDE.md))
