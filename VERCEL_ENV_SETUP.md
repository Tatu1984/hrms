# Vercel Environment Variables Setup Guide

## 🚀 Complete Setup Instructions

### Step 1: Access Vercel Project Settings

1. Go to: https://vercel.com/dashboard
2. Click on your **HRMS** project
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left sidebar

---

## 📝 Environment Variables to Add

Copy each variable below and add it to Vercel:

### 1. DATABASE_URL (Required)
```
Variable Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_0axlOWdPmtT8@ep-falling-math-a82t3qs3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development (check all 3)
```

### 2. DIRECT_URL (Required)
```
Variable Name: DIRECT_URL
Value: postgresql://neondb_owner:npg_0axlOWdPmtT8@ep-falling-math-a82t3qs3.eastus2.azure.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development (check all 3)
```

### 3. JWT_SECRET (Required)
```
Variable Name: JWT_SECRET
Value: your-super-secret-jwt-key-change-in-production-12345678
Environment: Production, Preview, Development (check all 3)
```

### 4. CRON_SECRET (Required)
```
Variable Name: CRON_SECRET
Value: hrms-daily-cron-secret-change-in-production-98765
Environment: Production, Preview, Development (check all 3)
```

---

## 🔧 Step 2: Save Environment Variables

1. Click **"Save"** after adding each variable
2. Make sure you check **ALL THREE** environment checkboxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

---

## 🔄 Step 3: Redeploy Your Application

After adding all environment variables:

### Option A: Using Vercel Dashboard
1. Go to **"Deployments"** tab
2. Click the **three dots (...)** on the latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"** - UNCHECK THIS
5. Click **"Redeploy"**

### Option B: Push a New Commit (Recommended)
```bash
git commit --allow-empty -m "Trigger Vercel redeploy with env vars"
git push
```

---

## ✅ Step 4: Verify Deployment

1. Wait 3-5 minutes for deployment to complete
2. Check deployment logs for any errors
3. Visit your live site
4. Test the following features:
   - ✅ Employee add with emergency contact fields
   - ✅ Employee edit
   - ✅ Employee view
   - ✅ Heartbeat tracking on login
   - ✅ IP address display

---

## 🐛 Troubleshooting

### If Build Still Fails:

1. **Check Build Logs:**
   - Go to Deployments tab
   - Click on the failed deployment
   - Check "Build Logs" for errors

2. **Common Issues:**
   - ❌ Missing DATABASE_URL → Add it in Settings
   - ❌ Prisma error → Make sure `prisma db push` runs in build
   - ❌ Timeout → Neon database might be sleeping, redeploy again

3. **Force Fresh Build:**
   - Settings → General → Scroll to bottom
   - Click "Redeploy" and UNCHECK "Use existing Build Cache"

---

## 📦 What the Build Does Now

The updated build script (`package.json`) now:

1. ✅ Runs `prisma db push --accept-data-loss` to update database schema
2. ✅ Runs `prisma generate` to create Prisma Client with new fields
3. ✅ Runs `next build` to build the application

This ensures your production database has all the new fields:
- altEmail
- emergencyContactName
- emergencyContactPhone
- emergencyContactRelation

---

## 🎯 Expected Result

After successful deployment, you should see:

✅ New employee fields available in production
✅ Employee view working correctly
✅ Employee edit working correctly
✅ Heartbeat tracking on login
✅ IP address tracking displayed
✅ All local features working on live site

---

## 📞 Need Help?

If deployment still fails after following all steps:
1. Check Vercel deployment logs
2. Verify all 4 environment variables are added
3. Make sure DATABASE_URL is correct
4. Try redeploying with fresh build cache disabled
