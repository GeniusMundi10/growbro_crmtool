# 🔧 Backend API Deployment Guide

Deploy your Next.js backend API separately to support the Android app.

---

## 🎯 **Why Separate Backend?**

Your Android app uses **static export** (no server), so API routes won't work. We need to deploy the backend separately to handle:
- `/api/conversations/*` - Chat management
- `/api/account/*` - User account operations  
- `/api/payments/*` - Razorpay payments
- `/api/whatsapp/*` - WhatsApp integration
- `/api/notifications/*` - Push notifications
- Other API routes

---

## 🚀 **Deployment Options**

### **Option 1: Vercel (Recommended) - Easiest**

Perfect for Next.js apps. Supports all API routes out of the box.

### **Option 2: Use Existing Backend**

If you already have `https://growbro-backend.fly.dev`, migrate API routes there.

### **Option 3: Railway**

Similar to Vercel, great for Next.js with database.

---

## 📋 **Option 1: Deploy on Vercel**

### **Step 1: Create Separate Branch**

```bash
# Create a new branch for backend
git checkout -b backend-api

# Stay on this branch for deployment
```

### **Step 2: Modify next.config.mjs**

In the `backend-api` branch, update `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ Remove or comment out this line
  // output: 'export',
  
  // Keep these
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

### **Step 3: Install Vercel CLI**

```bash
npm install -g vercel
```

### **Step 4: Deploy to Vercel**

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

Follow the prompts:
- **Project name:** `growbro-crm-api`
- **Directory:** `.` (current directory)
- **Override settings:** No

### **Step 5: Copy Deployment URL**

After deployment, Vercel will show:
```
✅ Production: https://growbro-crm-api.vercel.app
```

Copy this URL!

### **Step 6: Add Environment Variables on Vercel**

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all your `.env.local` variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - All other variables from `.env.local`

### **Step 7: Update Android App**

Switch back to main branch:
```bash
git checkout main
```

Add to `.env.local`:
```env
NEXT_PUBLIC_BACKEND_API_URL=https://growbro-crm-api.vercel.app
```

Rebuild Android app:
```bash
npm run android:build
```

---

## 📋 **Option 2: Use Existing Backend (Fly.dev)**

If you're already using `https://growbro-backend.fly.dev`:

### **Step 1: Add API Routes to Backend**

Copy your `/api` directory to your Fly.dev backend project.

### **Step 2: Update Backend Code**

Make sure your backend:
1. Has CORS enabled for Android app
2. Handles all API routes from your Next.js app
3. Uses same environment variables

### **Step 3: Update Android App**

Add to `.env.local`:
```env
NEXT_PUBLIC_BACKEND_API_URL=https://growbro-backend.fly.dev
```

---

## 🔐 **Important: CORS Configuration**

Your backend MUST allow requests from your Android app.

### For Next.js API Routes:

Create `middleware.ts` in your backend project:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Allow requests from Android app
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 🧪 **Testing Backend**

Test your backend API:

```bash
# Test health endpoint
curl https://growbro-crm-api.vercel.app/api/health

# Test with authentication
curl -X POST https://growbro-crm-api.vercel.app/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

---

## 📊 **Monitoring**

### Vercel Dashboard:
- View logs: **Deployments** → Click deployment → **Logs**
- Monitor usage: **Analytics** → **API Routes**
- Check errors: **Monitoring** → **Errors**

---

## 🔄 **Update Workflow**

When you update API code:

### For Vercel:
```bash
# Switch to backend branch
git checkout backend-api

# Make changes to API routes
# ... edit files ...

# Commit changes
git add .
git commit -m "Update API routes"

# Deploy
vercel --prod
```

### For Fly.dev:
```bash
# Make changes
# ... edit files ...

# Deploy
fly deploy
```

---

## 🐛 **Troubleshooting**

### "API calls return 404"
- Verify `NEXT_PUBLIC_BACKEND_API_URL` is correct
- Check the endpoint exists on backend
- Look at Vercel logs for errors

### "CORS errors in Android"
- Add CORS middleware (see above)
- Redeploy backend
- Clear Android app cache and rebuild

### "Environment variables not working"
- Check they're added in Vercel Dashboard
- Redeploy after adding variables
- Don't use `NEXT_PUBLIC_` prefix for server-side variables

---

## 💡 **Pro Tips**

1. **Keep branches in sync:**
   ```bash
   # Periodically merge main into backend-api
   git checkout backend-api
   git merge main
   ```

2. **Use environment-specific configs:**
   - Development: Uses Next.js dev server API routes
   - Android: Uses Vercel backend
   - Web Production: Can use either

3. **Monitor costs:**
   - Vercel free tier: 100GB bandwidth, 100GB-hours compute
   - Upgrade if you exceed limits

---

## ✅ **Verification Checklist**

Before connecting Android app to backend:

- [ ] Backend deployed successfully
- [ ] All environment variables added
- [ ] CORS configured correctly
- [ ] API routes responding (test with curl)
- [ ] `NEXT_PUBLIC_BACKEND_API_URL` added to `.env.local`
- [ ] Android app rebuilt with new URL
- [ ] Test API calls from Android app

---

## 🎉 **Success!**

Your backend is now deployed and ready to serve your Android app!

---

**Next:** Update your Android app's `.env.local` and rebuild with `npm run android:build`
