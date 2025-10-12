# 🚀 Android Quick Start (5 Minutes)

Get your GrowBro CRM Android app running in 5 minutes!

---

## ⚡ **Essential Steps Only**

### 1️⃣ **Add Backend URL to `.env.local`**

Open `.env.local` and add this line:

```env
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-url.vercel.app
```

**For now, you can skip this** and deploy the backend later. The app will work in dev mode without it.

---

### 2️⃣ **Install Capacitor**

```bash
npm install @capacitor/core @capacitor/android @capacitor/splash-screen @capacitor/status-bar @capacitor/camera @capacitor/filesystem
npm install -D @capacitor/cli
```

---

### 3️⃣ **Add Android Platform**

```bash
npm run cap:add
```

This creates the `android/` directory.

---

### 4️⃣ **Build & Sync**

```bash
npm run android:build
```

---

### 5️⃣ **Open in Android Studio**

```bash
npm run android:open
```

**Wait for Gradle sync** (2-5 minutes first time).

---

### 6️⃣ **Run the App**

In Android Studio:
1. Click **Device Manager** → **Create Device** (if no emulator exists)
2. Select **Pixel 6** → **API 33**
3. Click ▶️ **Run**

Or from terminal:
```bash
npm run android:run
```

---

## 🎉 **That's It!**

Your app should now be running on the emulator!

---

## 🐛 **Issues?**

### "No emulator found"
Create one: **Tools** → **Device Manager** → **Create Device**

### "Gradle sync failed"
**File** → **Invalidate Caches and Restart**

### "API calls not working"
Don't worry! Deploy the backend later. For now, test the UI and navigation.

---

## 📖 **What's Next?**

1. **Deploy Backend API** (see `ANDROID_BUILD_GUIDE.md` Step 4)
2. **Configure App Icon** (Step 7)
3. **Build Release APK** (Step 10)
4. **Publish to Play Store** (Step 11)

---

**Read the full guide:** `ANDROID_BUILD_GUIDE.md`
