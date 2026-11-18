# Deployment Guide: Workshop House on Render with Hosted PostgreSQL (Neon / Railway)

This guide walks you through deploying **Workshop House** to production on **Render** using a hosted cloud PostgreSQL database (**Neon** or **Railway**).

---

## 1. Prerequisites

- A [Render](https://render.com) account.
- A [Neon](https://neon.tech) account (or [Railway](https://railway.app)).
- Git repository containing the Workshop House code.

---

## 2. Setting Up the Hosted PostgreSQL Database

### Option A: Neon (Recommended – Serverless PostgreSQL)
1. Sign in to [Neon Console](https://console.neon.tech/).
2. Click **New Project**, choose a project name (e.g. `workshop-house-db`), select your nearest AWS region, and click **Create Project**.
3. In the project dashboard under **Connection Details**:
   - Select role and database (defaults to `neondb`).
   - Check **Pooled connection** (recommended for serverless environments).
   - Copy the PostgreSQL connection string. It will look like:
     ```text
     postgresql://<username>:<password>@<endpoint>-pooler.region.aws.neon.tech/neondb?sslmode=require
     ```
   - Save this connection string for the `DATABASE_URL` environment variable.

### Option B: Railway
1. Sign in to [Railway](https://railway.app/).
2. Click **New Project** → **Provision PostgreSQL**.
3. Once the database is provisioned, click on the **Postgres** card and navigate to the **Variables** tab.
4. Copy the `DATABASE_URL` variable value (contains user, password, host, port, and database name with SSL).

---

## 3. Environment Variables Reference

Configure these environment variables in your deployment platform:

| Variable | Type | Default / Required | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | **Required** | Full PostgreSQL connection string (`postgresql://user:pass@host:port/db?sslmode=require`). SSL is automatically enabled when `NODE_ENV=production`. |
| `SESSION_SECRET` | String | **Required** (min 16 chars) | Strong cryptographically random string used to sign session cookies. E.g. generate via `openssl rand -hex 32`. |
| `NODE_ENV` | String | `production` | Sets execution mode to `production`. Enables secure cookies, trust proxy, template caching, and database SSL connection. |
| `PORT` | Number | Auto-assigned (`10000` on Render) | The HTTP port Express listens on. Render automatically injects this. |

---

## 4. Deploying to Render (Web Service)

### Step 1: Create a Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your Git repository (GitHub / GitLab) and select the `feature/deploy` (or `main`) branch.

### Step 2: Configure Service Settings
- **Name**: `workshop-house` (or your choice)
- **Region**: Choose the region closest to your Neon/Railway database.
- **Branch**: `feature/deploy` (or `main`)
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm run build && npm run migrate && npm run seed
  ```
  *(Note: Running `migrate` and `seed` in the build command ensures your hosted database schema and initial demo data are ready before the service starts).*
- **Start Command**:
  ```bash
  npm start
  ```
- **Plan**: `Free` or `Starter`

### Step 3: Add Environment Variables
Scroll to the **Environment Variables** section and add:
- `NODE_ENV` = `production`
- `DATABASE_URL` = `<your-neon-or-railway-connection-string>`
- `SESSION_SECRET` = `<your-32-char-random-secret>`

### Step 4: Health Check Configuration
1. Open **Advanced Settings** at the bottom of the page.
2. Under **Health Check Path**, enter:
   ```text
   /healthz
   ```
   Render will ping `GET /healthz` (which verifies `SELECT 1` on PostgreSQL) to ensure zero-downtime deploys and auto-restart if the database connection drops.

### Step 5: Deploy
Click **Create Web Service**. Render will:
1. Clone the repository.
2. Install dependencies with `npm install`.
3. Run `npm run build` (compiles TypeScript to `dist/` and copies templates/migrations).
4. Run `npm run migrate` (applies all schema migrations to your cloud PostgreSQL).
5. Run `npm run seed` (populates demo courses, sessions, and user accounts).
6. Start the server with `npm start` (`node dist/server.js`).

---

## 5. Reverse Proxy & Cookie Security (Trust Proxy)

In production on Render:
- Client traffic reaches Render via HTTPS.
- Render terminates SSL at its reverse proxy load balancer and forwards the request to Node.js on port 10000.
- Workshop House has `app.set('trust proxy', 1)` configured when `NODE_ENV=production`. This enables Express to read `X-Forwarded-Proto: https` and serve session cookies with `Secure`, `HttpOnly`, and `SameSite=Lax` flags without losing authentication.

---

## 6. Verifying Deployment & Smoke Testing

Once deployment completes and status shows **Live**:

1. **Verify Health Endpoint**:
   ```bash
   curl -i https://<your-service-name>.onrender.com/healthz
   ```
   Expected response:
   ```json
   HTTP/2 200
   content-type: application/json; charset=utf-8

   {"status":"ok","timestamp":"2026-11-18T20:45:00.000Z"}
   ```

2. **Test Demo User Sign In**:
   Navigate to `https://<your-service-name>.onrender.com/auth/login` and test the pre-seeded accounts (password: `Password123!`):
   - **Coordinator**: `coordinator@workshop.test`
   - **Trainer**: `trainer1@workshop.test`
   - **Learner**: `learner1@workshop.test`

3. **Verify Business Rules in Production**:
   - Learner can enroll in open sessions.
   - Trainer can manage check-in and attendance for their own sessions.
   - Coordinator can view the system dashboard and create courses/sessions.
