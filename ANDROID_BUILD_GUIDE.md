# 📱 GrowBro CRM - Android Build Guide

Complete guide to building and deploying your GrowBro CRM as an Android application.

---

## 🎯 **Overview**

Your GrowBro CRM is now configured for dual deployment:
- **Static Export** → Android App (via Capacitor)
- **Backend API** → Deployed separately on Vercel/Railway for API routes

---

## ✅ **Prerequisites**

### Required Software:
1. **Node.js 18+** - Already installed ✓
2. **Android Studio** - [Download here](https://developer.android.com/studio)
3. **Java JDK 17** - [Download here](https://www.oracle.com/java/technologies/downloads/#java17)

### Required Accounts:
- Google Play Console (for publishing to Play Store)
- Vercel/Railway account (for backend API)

---

## 📝 **Step 1: Configure Environment Variables**

Add the following to your `.env.local` file:

```env
# Backend API URL (will be deployed on Vercel)
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-url.vercel.app

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Other existing variables...
```

**Important:** Replace `https://your-backend-url.vercel.app` with your actual backend deployment URL.

---

## 🚀 **Step 2: Install Capacitor Packages**

Run these commands in your project root:

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npm install @capacitor/android
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
npm install @capacitor/camera
npm install @capacitor/filesystem
```

---

## 🏗️ **Step 3: Initialize Android Platform**

```bash
# Add Android platform
npm run cap:add

# This creates the android/ directory
```

---

## 🔧 **Step 4: Deploy Backend API (Separate Deployment)**

You need to deploy your Next.js app **WITHOUT** `output: 'export'` for API routes.

### Option A: Deploy on Vercel (Recommended)

1. **Create a separate Git branch** for backend:
   ```bash
   git checkout -b backend-api
   ```

2. **Remove the `output: 'export'` line** from `next.config.mjs`:
   ```javascript
   const nextConfig = {
     // output: 'export',  // ← Comment this out for backend
     trailingSlash: true,
     // ... rest of config
   }
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Copy the deployment URL** (e.g., `https://growbro-crm-api.vercel.app`)

5. **Add URL to `.env.local`**:
   ```env
   NEXT_PUBLIC_BACKEND_API_URL=https://growbro-crm-api.vercel.app
   ```

6. **Switch back to main branch**:
   ```bash
   git checkout main
   ```

### Option B: Use Existing Backend

If you're already using `https://growbro-backend.fly.dev`, you can:
1. Add all your API routes there
2. Set: `NEXT_PUBLIC_BACKEND_API_URL=https://growbro-backend.fly.dev`

---

## 🏗️ **Step 5: Build Android App**

```bash
# Build Next.js and sync to Android
npm run android:build
```

This will:
1. Build your Next.js app to `out/` directory
2. Copy files to Android project
3. Prepare for Android Studio

---

## 📱 **Step 6: Configure Android Settings**

### Open Android Studio:
```bash
npm run android:open
```

### Configure App Details:

1. **Open `android/app/build.gradle`**, update:
   ```gradle
   android {
       defaultConfig {
           applicationId "ai.growbro.crm"
           minSdkVersion 22
           targetSdkVersion 34
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

2. **Open `android/app/src/main/AndroidManifest.xml`**, add permissions:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.CAMERA" />
   ```

3. **Configure Deep Linking** (for Supabase OAuth):
   
   In `AndroidManifest.xml`, add inside `<activity>` tag:
   ```xml
   <intent-filter android:autoVerify="true">
       <action android:name="android.intent.action.VIEW" />
       <category android:name="android.intent.category.DEFAULT" />
       <category android:name="android.intent.category.BROWSABLE" />
       <data android:scheme="https" 
             android:host="growbro.app" />
   </intent-filter>
   
   <intent-filter>
       <action android:name="android.intent.action.VIEW" />
       <category android:name="android.intent.category.DEFAULT" />
       <category android:name="android.intent.category.BROWSABLE" />
       <data android:scheme="ai.growbro.crm" />
   </intent-filter>
   ```

---

## 🎨 **Step 7: Add App Icon & Splash Screen**

### Generate Icons:
1. Go to [icon.kitchen](https://icon.kitchen/)
2. Upload your logo
3. Generate Android icons
4. Replace files in `android/app/src/main/res/`

### Configure Splash Screen:
The splash screen is already configured in `capacitor.config.ts`.

To customize:
1. Create `android/app/src/main/res/drawable/splash.png`
2. Update colors in `android/app/src/main/res/values/styles.xml`

---

## 🔐 **Step 8: Configure Supabase Deep Links**

In your Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add redirect URLs:
   - `https://growbro.app/auth/callback`
   - `ai.growbro.crm://auth/callback`
3. Save changes

---

## ▶️ **Step 9: Run on Emulator/Device**

### Create Android Emulator (First Time Only):
1. In Android Studio: **Tools** → **Device Manager**
2. Click **Create Device**
3. Select **Pixel 6** or similar
4. Download **API 33** system image
5. Create and start emulator

### Run Your App:
```bash
npm run android:run
```

Or click the ▶️ **Run** button in Android Studio.

---

## 📦 **Step 10: Build Release APK**

### For Testing (Debug APK):
```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### For Production (Release APK):

1. **Generate Keystore**:
   ```bash
   keytool -genkey -v -keystore growbro-release.keystore -alias growbro -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Add to `android/gradle.properties`**:
   ```properties
   GROWBRO_RELEASE_STORE_FILE=growbro-release.keystore
   GROWBRO_RELEASE_KEY_ALIAS=growbro
   GROWBRO_RELEASE_STORE_PASSWORD=your_keystore_password
   GROWBRO_RELEASE_KEY_PASSWORD=your_key_password
   ```

3. **Update `android/app/build.gradle`**:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file(GROWBRO_RELEASE_STORE_FILE)
               storePassword GROWBRO_RELEASE_STORE_PASSWORD
               keyAlias GROWBRO_RELEASE_KEY_ALIAS
               keyPassword GROWBRO_RELEASE_KEY_PASSWORD
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

4. **Build Release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🚀 **Step 11: Publish to Google Play Store**

1. **Create App in Google Play Console**
2. **Fill in Store Listing** (screenshots, description, etc.)
3. **Upload Release APK** or use **App Bundles** (AAB):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
4. **Submit for Review**

---

## 🐛 **Troubleshooting**

### Issue: "API calls failing in Android"
**Solution:** Ensure `NEXT_PUBLIC_BACKEND_API_URL` is set in `.env.local` and app is rebuilt.

### Issue: "Supabase auth not working"
**Solution:** 
1. Check deep link configuration in `AndroidManifest.xml`
2. Verify redirect URLs in Supabase Dashboard
3. Use `ai.growbro.crm://auth/callback` scheme

### Issue: "Images not loading"
**Solution:** Add to `AndroidManifest.xml`:
```xml
<application android:usesCleartextTraffic="true">
```

### Issue: "White screen on app launch"
**Solution:** Check browser console in Chrome DevTools:
1. Connect device via USB
2. Open `chrome://inspect` in Chrome
3. Click "Inspect" on your app
4. Check console for errors

### Issue: "Build fails in Android Studio"
**Solution:** 
1. **File** → **Invalidate Caches and Restart**
2. Delete `android/.gradle` and `android/build` folders
3. Sync Gradle again

---

## 📊 **Testing Checklist**

Before publishing, test:

- [ ] Login/Signup with Supabase
- [ ] WhatsApp chat real-time updates
- [ ] Website chat real-time updates
- [ ] File upload (photos, documents)
- [ ] Camera access for profile pictures
- [ ] Push notifications (if implemented)
- [ ] Payment flow (Razorpay)
- [ ] All navigation flows
- [ ] Offline behavior
- [ ] Deep links (email verification, password reset)

---

## 🔄 **Update Workflow**

When you need to update the app:

1. **Make changes** in your Next.js code
2. **Build and sync**:
   ```bash
   npm run android:build
   ```
3. **Test** in emulator/device:
   ```bash
   npm run android:run
   ```
4. **Build release** when ready
5. **Upload to Play Store**

---

## 📚 **Useful Commands**

```bash
# Development
npm run dev                 # Run Next.js dev server
npm run android:build       # Build and sync to Android
npm run android:open        # Open in Android Studio
npm run android:run         # Run on device/emulator
npm run android:sync        # Sync changes without rebuild

# Capacitor
npx cap sync               # Sync all platforms
npx cap update             # Update Capacitor
npx cap doctor             # Check configuration

# Android Studio
./gradlew assembleDebug    # Build debug APK
./gradlew assembleRelease  # Build release APK
./gradlew bundleRelease    # Build release AAB
./gradlew clean            # Clean build
```

---

## 🎉 **Success!**

You now have a production-ready Android app for GrowBro CRM!

For support or questions, check:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developers](https://developer.android.com)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Built with ❤️ using Capacitor + Next.js + Supabase**
