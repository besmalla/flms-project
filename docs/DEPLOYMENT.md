# Deployment Guide

This guide covers deploying FLMS to **Vercel** (frontends) and **Render** (backends + database). Both are free-tier friendly.

---

## Architecture overview

| Service | Platform | Notes |
|---|---|---|
| PostgreSQL database | Render (managed DB) | One shared DB for both services |
| auth-service | Render (web service) | Node/Express |
| loan-service | Render (web service) | Node/Express |
| auth-ui | Vercel | React/Vite SPA |
| catalog-ui | Vercel | React/Vite SPA |

---

## Step 1 — Push your code to GitHub

```bash
cd flms-project
git init
git add .
git commit -m "initial commit"
# Create a new repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/flms-project.git
git push -u origin main
```

---

## Step 2 — Database on Render

1. Go to [render.com](https://render.com) → **New → PostgreSQL**
2. Name it `flms-db`, choose the free tier, click **Create Database**
3. Once created, copy the **Internal Database URL** (used by services on the same Render network) and the **External Database URL** (used for running migrations from your machine)
4. Run the migration from your machine:

```bash
psql "YOUR_EXTERNAL_DATABASE_URL" -f backend/auth-service/migrations/001_initial_schema.sql
```

---

## Step 3 — Auth Service on Render

1. **New → Web Service** → connect your GitHub repo
2. **Root Directory:** `backend/auth-service`
3. **Build command:** `npm install`
4. **Start command:** `node src/index.js`
5. **Environment variables:**

| Key | Value |
|---|---|
| `DATABASE_URL` | Internal Database URL from Step 2 |
| `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 32`) |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

6. After deploy, copy the **service URL** (e.g. `https://flms-auth.onrender.com`)

---

## Step 4 — Loan Service on Render

1. **New → Web Service** → same repo
2. **Root Directory:** `backend/loan-service`
3. **Build command:** `npm install`
4. **Start command:** `node src/index.js`
5. **Environment variables:**

| Key | Value |
|---|---|
| `DATABASE_URL` | Same Internal Database URL |
| `JWT_SECRET` | **Same value** as auth-service |
| `AUTH_SERVICE_URL` | Auth service URL from Step 3 |
| `NODE_ENV` | `production` |
| `PORT` | `3002` |

6. Copy the **service URL** (e.g. `https://flms-loans.onrender.com`)

---

## Step 5 — Auth UI on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. **Root Directory:** `frontend/auth-ui`
3. **Framework Preset:** Vite (auto-detected)
4. **Environment variables:**

| Key | Value |
|---|---|
| `VITE_API_AUTH_URL` | Auth service URL from Step 3 |
| `VITE_API_LOAN_URL` | Loan service URL from Step 4 |
| `VITE_CATALOG_UI_URL` | Catalog UI Vercel URL (set after Step 6, then redeploy) |

5. Deploy → copy the **Vercel URL** (e.g. `https://flms-auth.vercel.app`)

---

## Step 6 — Catalog UI on Vercel

1. **New Project** → same repo, different root directory
2. **Root Directory:** `frontend/catalog-ui`
3. **Framework Preset:** Vite (auto-detected)
4. **Environment variables:**

| Key | Value |
|---|---|
| `VITE_API_LOAN_URL` | Loan service URL from Step 4 |
| `VITE_API_AUTH_URL` | Auth service URL from Step 3 |
| `VITE_AUTH_UI_URL` | Auth UI Vercel URL from Step 5 |

5. Deploy → copy the **Vercel URL** (e.g. `https://flms-catalog.vercel.app`)

---

## Step 7 — Wire up cross-app URLs

Go back to the **auth-ui** Vercel project → **Settings → Environment Variables** → set:

```
VITE_CATALOG_UI_URL = https://flms-catalog.vercel.app
```

Trigger a redeploy (Vercel dashboard → **Deployments → Redeploy**).

---

## Step 8 — Seed the admin account

```bash
# From the auth-service directory
DATABASE_URL="YOUR_EXTERNAL_DATABASE_URL" node scripts/seed.js
```

Default admin: `admin@flms.edu` / `Admin@12345`

---

## CORS checklist

Both backend services must allow requests from the Vercel domains. Check the `cors` config in each service's `src/index.js` and add your production URLs to the allowed origins list if they're not already using a wildcard.

---

## Free-tier gotchas

- **Render free tier spins down after 15 minutes of inactivity** — the first request after sleep takes ~30 seconds. Upgrade to a paid instance or use a cron job (e.g. [cron-job.org](https://cron-job.org)) to ping the services every 10 minutes.
- **Render free PostgreSQL expires after 90 days** — export your data regularly with `pg_dump`.
