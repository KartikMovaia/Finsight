# 💎 Finsight — Personal Finance Tracker

A comprehensive personal finance tracker with investments, debt management, projections, and PIN authentication.

## Features

- **Dashboard** — Income, expenses, net worth, portfolio & debt overview
- **Transactions** — Daily/monthly/yearly income & expense tracking
- **Investments** — Portfolio with stocks, ETFs, crypto, bonds, real estate tracking
- **Debts** — Credit cards, loans, mortgages with payoff projections
- **Projections** — 6-month forecast based on spending patterns
- **PIN Auth** — Single-user authentication with session management
- **Persistent Storage** — All data saved to localStorage

## Deploy to Vercel (3 steps)

### Step 1: Push to GitHub

```bash
# In this project folder:
git init
git add .
git commit -m "Initial commit"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/finsight.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `finsight` repository
4. Vercel auto-detects Vite — just click **"Deploy"**
5. Done! Your app is live at `https://finsight-xxxxx.vercel.app`

### Step 3 (Optional): Custom domain

In Vercel dashboard → Settings → Domains → Add your custom domain.

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Tech Stack

- React 18 + Vite
- Pure CSS (no framework)
- localStorage for persistence
- Client-side only (no backend needed)
