# Firebase Deployment — Step-by-Step

## Overview

You've chosen Firebase. Perfect. This is the enterprise-grade path with full Google Cloud integration, Firestore auth, and serverless functions.

**Time to live: 15 minutes**

---

## Step 1: Create Firebase Project (2 minutes)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Project name: `milo-maps` (or your choice)
4. Select your Google Cloud project (where you'll get API keys)
5. Enable Google Analytics: **No** (optional, not needed)
6. Click **"Create project"**

⏳ Wait 1-2 minutes for initialization...

Once complete, you'll see: **"Project milo-maps is ready"**

Note your **Project ID** (e.g., `milo-maps-abc123`) — you'll need this.

---

## Step 2: Install Firebase CLI (1 minute)

```bash
npm install -g firebase-tools
firebase login
```

A browser will open. Sign in with the Google account that owns your Firebase project.

Verify:
```bash
firebase projects:list
# Should show your project
```

---

## Step 3: Initialize Firebase in Your Project (2 minutes)

In your `milo-maps` directory:

```bash
firebase init
```

**When prompted:**

1. **Which Firebase CLI features do you want to set up?**
   - Press Space to select: ✓ Hosting, ✓ Functions, ✓ Firestore
   - Press Enter

2. **Select a default Firebase project**
   - Choose: `milo-maps` (or your project ID)

3. **What do you want to use as your public directory?**
   - Enter: `dist`

4. **Configure as a single-page app?**
   - Enter: `y` (yes)

5. **Automatically try to build and deploy on every push to a GitHub branch?**
   - Enter: `n` (no — we'll do this manually for now)

6. **File dist/index.html already exists. Overwrite?**
   - Enter: `n` (no)

7. **What language would you like to use to write Cloud Functions?**
   - Select: `JavaScript`

8. **Do you want to use ESLint?**
   - Enter: `n` (no)

9. **Do you want to install dependencies now?**
   - Enter: `y` (yes)

✅ Firebase is now initialized in your project.

---

## Step 4: Set Server Secrets (2 minutes)

The Gemini API key must be stored as a Firebase secret (not in code):

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

When prompted:
- Paste your Gemini API key (from https://ai.google.dev/)
- Press Enter

Verify:
```bash
firebase functions:secrets:list
# Should show GEMINI_API_KEY
```

---

## Step 5: Create Environment File (1 minute)

```bash
cp .env.example .env
```

Edit `.env` and add your **Maps API key** (browser key):

```bash
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key-here
```

Optional — if using Firestore auth:
```bash
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=milo-maps-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=milo-maps-abc123
VITE_FIREBASE_APP_ID=your-app-id
```

(Get these from Firebase Console → Project Settings → General)

---

## Step 6: Build (2 minutes)

```bash
npm run build
```

Expected output:
```
✓ src compiled successfully
✓ vite v6.3.5 building for production
✓ 2 modules transformed
✓ dist/index.html          10.5 kB
✓ dist/assets/index-xxx.js 150.2 kB
✓ build complete
✓ Functions ready
```

Verify `dist/` folder was created:
```bash
ls -lh dist/index.html
# Should show the file
```

---

## Step 7: Deploy (3 minutes)

```bash
firebase deploy
```

This deploys:
- ✅ Hosting (dist/ folder → CDN)
- ✅ Functions (functions/index.js → serverless backend)
- ✅ Firestore Rules (firestore.rules → database security)

Expected output:
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/milo-maps-abc123
Hosting URL: https://milo-maps-abc123.web.app
```

🎉 **Your site is now live!**

---

## Step 8: Restrict API Keys to Domain (3 minutes)

**CRITICAL:** Restrict your Maps key to your production domain to prevent abuse.

1. Go to **https://console.cloud.google.com/apis/credentials**
2. Click your **browser Maps API key**
3. Under "Application restrictions" → select **"HTTP referrers"**
4. Add your domain:
   ```
   https://milo-maps-abc123.web.app/*
   ```
5. Under "API restrictions" → ensure only these are selected:
   - ✓ Maps JavaScript API
   - ✓ Places API
   - ✓ Routes API
6. Click **Save**

✅ Your key is now protected.

---

## Step 9: Enable App Check (1 minute) — Optional but Recommended

App Check protects your backend from abuse:

```bash
firebase appcheck:activate recaptchav3
```

Select `web` when prompted.

---

## Step 10: Set Budget Alert (2 minutes) — IMPORTANT

Prevent surprise bills:

1. Go to **https://console.cloud.google.com/billing**
2. Select your billing account
3. Click **"Budgets and alerts"** on the left
4. Click **"Create budget"**
5. Set:
   - Budget name: `Milo Maps`
   - Budget amount: `$50` (adjust as needed)
   - Set alerts at: 50%, 90%, 100%
6. Click **Create budget**

✅ You'll get email alerts if spending approaches your limit.

---

## 🎉 You're Live!

Your site is now running at:

```
https://milo-maps-abc123.web.app
```

---

## ✅ Verification Checklist

- [ ] Site loads without errors
- [ ] Maps display (if VITE_GOOGLE_MAPS_API_KEY is set)
- [ ] Geolocation works or defaults to Chicago
- [ ] "Ask Milo" button visible
- [ ] Try asking a question
- [ ] Sources display with attribution
- [ ] No error in browser console (F12)

---

## 📊 Monitor Your Deployment

### View Logs
```bash
firebase functions:log
```

### Firebase Console
```
https://console.firebase.google.com/project/milo-maps-abc123
```

- **Hosting:** View traffic, errors, performance
- **Functions:** View execution time, memory usage, errors
- **Firestore:** View read/write operations (if using auth)

### Google Cloud Console
```
https://console.cloud.google.com/billing
```

- Track API usage and costs
- View budget alerts

---

## 🚀 Next: Setup Continuous Deployment (Optional)

Want automatic deployments on every push to `main`?

1. Create GitHub environment: Settings → Environments → New → `firebase-prod`
2. Add secrets:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (get from Firebase)
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CI_TOKEN` (run: `firebase login:ci`)
3. GitHub Actions will deploy automatically

See `.github/workflows/deploy-firebase.yml` for details.

---

## 🆘 Troubleshooting

### "Maps not showing"
```bash
# Check Maps key is set
echo $VITE_GOOGLE_MAPS_API_KEY
# Should print your key

# Verify key is restricted to your domain
# Go to console.cloud.google.com/apis/credentials
# Click your key → Check HTTP referrers include your domain
```

### "Gemini not responding"
```bash
# Check secret is set
firebase functions:secrets:list
# Should show GEMINI_API_KEY

# Check logs
firebase functions:log
# Look for error messages
```

### "Firebase deploy fails"
```bash
# Try these
firebase logout
firebase login
firebase use milo-maps-abc123
firebase deploy --only hosting
firebase deploy --only functions
```

### "Build fails locally"
```bash
rm -rf node_modules dist functions/node_modules
npm ci
npm run build
```

---

## 📞 Need Help?

- Firebase docs: https://firebase.google.com/docs
- Google Maps: https://developers.google.com/maps
- Gemini API: https://ai.google.dev/
- Your repo: https://github.com/NextGenAILLC/milo-maps

---

## 🎯 What's Next?

### Immediate
- ✅ Site is live
- ✅ You have monitoring
- ✅ Budget alerts protect you

### Short-term (This Week)
- [ ] Test all features thoroughly
- [ ] Share with team
- [ ] Monitor logs for errors
- [ ] Check budget usage

### Medium-term (Next Week)
- [ ] Add custom domain (optional)
- [ ] Enable App Check (already shown above)
- [ ] Setup Slack notifications (optional)
- [ ] Create marketing plan

### Long-term
- [ ] Analyze user feedback
- [ ] Add new features
- [ ] Scale infrastructure
- [ ] Expand to mobile app

---

## 🏆 Deployment Complete!

**Your milo-maps is now live on Firebase.**

All future pushes to your repo will trigger automatic builds (if you setup GitHub Actions).

Monitor the Firebase Console regularly to ensure everything is running smoothly.

**You did it!** 🚀

