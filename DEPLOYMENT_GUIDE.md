# 🚀 FindNest Free Tier Deployment Guide

This guide walks you step-by-step through deploying **FindNest** (Frontend, Backend, Database, AI Embeddings, and Email) completely **FREE of charge** using top-tier developer platforms.

---

## 📋 Free Architecture Overview

| Component | Platform | Free Tier Quota | Why This Platform? |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Unlimited deploys, 100GB bandwidth | Fast global CDN, zero-config for Vite/React, free SSL |
| **Backend** | [Render](https://render.com) | 750 free instance hrs/month | Auto-builds FastAPI from GitHub, free HTTPS |
| **Database** | [Supabase](https://supabase.com) or [Neon](https://neon.tech) | 500MB PostgreSQL, 2 free projects | Permanent free PostgreSQL (does not expire in 30 days) |
| **AI Embeddings** | [Google AI Studio](https://aistudio.google.com) | 15 RPM / 1M TPM / 1500 RPD | 100% free API key for `gemini-embedding-2` |
| **File Storage** | [Firebase Storage](https://firebase.google.com) | 5GB storage, 1GB/day transfer | Google Cloud Free Spark plan |
| **Email Alerts** | [Resend](https://resend.com) | 3,000 emails/month (100/day) | Modern transactional email API (optional) |

---

## Step 1: Set Up Free PostgreSQL Database (Supabase)

1. Go to [Supabase](https://supabase.com) and click **"Start your project"** (Sign up with GitHub).
2. Click **"New Project"**, name it `findnest-db`, and choose a strong Database Password.
3. Select the closest region to your users (e.g., *East US* or *South Asia*).
4. Once created, go to **Project Settings** (gear icon) ➔ **Database**.
5. Scroll to **Connection string** ➔ select **URI** tab:
   - Choose **Session Pooler** (Port `5432` or `6543`) or Direct URI:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```
   *(Save this URI — this is your `DATABASE_URL`)*.
   > **Note:** FindNest's backend automatically creates all database tables (`User`, `LostItem`, `FoundItem`, `Notification`) upon startup!

---

## Step 2: Get Free Google Gemini AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com).
2. Sign in with your Google account.
3. Click **"Get API key"** in the top-left sidebar.
4. Click **"Create API key"** and choose or create a Google Cloud project.
5. Copy your API key. *(This will be your `GEMINI_API_KEY`)*.

---

## Step 3: Deploy Backend on Render (Free Web Service)

1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "Configure cloud deployment"
   git push origin main
   ```
2. Go to [Render.com](https://render.com) and sign in with GitHub.
3. In the Render Dashboard, click **"New +"** ➔ **"Web Service"**.
4. Connect your repository: `gurucharangattupalli04/Lost-and-found`.
5. Configure the service settings:
   - **Name:** `findnest-backend` (or your preferred name)
   - **Region:** Nearest to your database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free` (512 MB RAM)
6. Under **Advanced** ➔ **Environment Variables**, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | *Your Supabase PostgreSQL URI from Step 1* | Ensure `?sslmode=require` is at the end |
   | `JWT_SECRET_KEY` | *Generate a 32+ character random secret string* | e.g. `openssl rand -hex 32` |
   | `GEMINI_API_KEY` | *Your Gemini API key from Step 2* | |
   | `CORS_ORIGINS` | `*` *(or your Vercel URL later)* | Allows frontend to communicate |
   | `PROJECT_NAME` | `FindNest API` | |
   | `EMAIL_PROVIDER` | `console` *(or `resend`)* | Set `resend` if you configure Resend |
7. Click **"Deploy Web Service"**.
8. Wait 2–3 minutes for the build to finish. Once live, Render will give you a public URL (e.g., `https://findnest-backend.onrender.com`).
9. Test by opening `https://findnest-backend.onrender.com/api/health` in your browser. You should see `{"status":"healthy","database":"connected"}`!

---

## Step 4: Deploy Frontend on Vercel (Free)

1. Go to [Vercel](https://vercel.com) and log in with GitHub.
2. Click **"Add New..."** ➔ **"Project"**.
3. Import your repository: `gurucharangattupalli04/Lost-and-found`.
4. Configure Project Settings:
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** `./` (default root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://<YOUR-RENDER-BACKEND-URL>/api/v1`
   *(Example: `https://findnest-backend.onrender.com/api/v1`)*
6. Click **"Deploy"**.
7. In ~1 minute, your site will be live at `https://<your-project-name>.vercel.app`!

---

## Step 5: (Optional) Free Email Notifications with Resend

1. Go to [Resend](https://resend.com) and sign up for free.
2. Go to **API Keys** ➔ Click **Create API Key**.
3. In your **Render Backend Dashboard** ➔ **Environment Variables**:
   - Set `EMAIL_PROVIDER` to `resend`
   - Set `RESEND_API_KEY` to your Resend key
   - Set `EMAIL_FROM` to `FindNest Alerts <onboarding@resend.dev>`
   - Set `FRONTEND_URL` to your Vercel URL (e.g., `https://find-nest-jade.vercel.app`)
4. Save changes. Render will automatically redeploy with email alerts enabled!

---

## 💡 Important Tips for Free Hosting

1. **Render Free Tier Spin-Down**:
   Render's free tier services "sleep" after 15 minutes of inactivity. When a new visitor accesses your site, the first request may take 30–45 seconds to wake up the server. After waking up, subsequent requests are instant.
   - *Free Solution:* You can use a free uptime monitor like [Cron-Job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) to ping `https://<your-backend>.onrender.com/api/health` every 10 minutes to keep it awake!

2. **CORS Configuration**:
   Once your Vercel frontend URL is finalized, update `CORS_ORIGINS` in Render environment variables to include your exact frontend URL (or leave it as `*`).
