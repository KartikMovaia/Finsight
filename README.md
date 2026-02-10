# 💎 Finsight — Personal Finance Tracker

Cloud-synced finance tracker with investments, debt management, projections, and Google/Email auth.

**Your data syncs across all devices** — phone, laptop, tablet.

## Features

- 🔐 Email/Password + Google Sign-In (Firebase Auth)
- ☁️ Cloud Firestore — data accessible from any device
- 📊 Dashboard with net worth, portfolio & debt overview
- 💰 Daily/monthly/yearly income & expense tracking
- 📈 Investment portfolio (stocks, ETFs, crypto, bonds, etc.)
- 💳 Debt tracking with payoff projections
- 🔮 6-month spending forecast
- 📤 JSON export/import backup

---

## Setup Guide

### 1. Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. **Create a project** → name it `finsight` → Create

### 2. Enable Authentication

1. **Build → Authentication → Get started**
2. Enable **Email/Password** → Save
3. Enable **Google** → select support email → Save

### 3. Create Firestore Database

1. **Build → Firestore Database → Create database**
2. Select **production mode** → choose nearest region → Create

### 4. Set Security Rules

In Firestore → **Rules**, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

### 5. Get Firebase Config

1. **Project Settings** (gear icon) → scroll to **Your apps** → click `</>`
2. Name: `finsight` → Register
3. Copy the config values

### 6. Configure

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase values.

### 7. Deploy to Vercel

```bash
npm install
npm run dev          # test locally at localhost:5173

git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOU/finsight.git
git push -u origin main
```

On [vercel.com](https://vercel.com):
1. Import repo → Add **Environment Variables** (all `VITE_FIREBASE_*` values)
2. Deploy

### 8. Authorize Domain

In Firebase → **Auth → Settings → Authorized domains** → add your `finsight-xxx.vercel.app` domain.

**Done!** ✅

---

## Local Dev

```bash
npm install
npm run dev
```
