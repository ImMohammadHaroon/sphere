# ProjectSphere (ml-sphere)

Multi-tenant project management SaaS for organizations that need role-based dashboards, custom Kanban workflows, real-time collaboration, and a client portal — all with strict tenant isolation.

## Features

- **Custom Kanban boards** — Define column templates per project (names, colors, done states) and drag tasks with `@dnd-kit`
- **Real-time updates** — Socket.io syncs board moves, status changes, and presence indicators
- **Role-based dashboards** — Tailored experiences for Super Admin, Org Admin, Project Manager, Team Member, and Client
- **Project management** — Tasks, milestones, comments, attachments, and calendar views
- **Reports & analytics** — Burndown, velocity, workload, and role breakdown charts
- **Notifications** — In-app alerts for assignments, completions, invites, and org registrations
- **Client portal** — Read-only project visibility for external stakeholders
- **Security** — JWT auth with refresh tokens, tenant scoping, rate limiting, and encrypted file storage

## Tech stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, TanStack Query, Zustand, Recharts, Motion |
| Backend  | Node.js 20+, Express 5, MongoDB (Mongoose), Socket.io, Zod |
| Auth     | JWT (access + refresh cookies), bcrypt |
| API docs | Swagger UI at `/api-docs` |

## Project structure

```
ml-sphere/
├── backend/          # Express REST API (Vercel serverless in production)
│   ├── api/index.js  # Vercel serverless entry
│   ├── server.js     # Local dev entry point
│   ├── vercel.json
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── sockets/
│   └── tests/
└── frontend/         # React SPA (JavaScript — .js/.jsx only)
    ├── vercel.json
    └── src/
        ├── components/
        ├── features/
        ├── pages/
        └── lib/
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [MongoDB](https://www.mongodb.com/) (local instance or Atlas cluster)
- SMTP credentials (optional for local dev; required for email flows like invites and password reset)

## Getting started

### 1. Clone and install

```bash
git clone <repository-url>
cd ml-sphere

cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend environment

Create `backend/.env`:

```env
# Required
MONGO_URI=mongodb://127.0.0.1:27017/projectsphere
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
FILE_ENCRYPTION_KEY=<base64-encoded-32-byte-key>

# Optional (defaults shown)
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Stripe billing (test mode — https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_TRIAL_DAYS=14

# After running `npm run seed:stripe-products`, add the printed Price IDs:
# STRIPE_PRICE_STARTER_MONTHLY=price_...
# STRIPE_PRICE_STARTER_YEARLY=price_...
# STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
# STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
# STRIPE_PRICE_BUSINESS_MONTHLY=price_...
# STRIPE_PRICE_BUSINESS_YEARLY=price_...

# Email (needed for invites, password reset, org verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Generate a file encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Frontend environment (optional)

Create `frontend/.env` only if you need to override defaults:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_ENABLE_SOCKETS=true
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

In development, Vite proxies `/api` to `http://localhost:5000` automatically.

### Stripe local webhook forwarding

With the API running, forward Stripe events to your local webhook endpoint:

```bash
stripe listen --forward-to localhost:5000/api/v1/billing/webhook
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `backend/.env`, then restart the API.

**Test cards:** `4242 4242 4242 4242` (success), any future expiry, any CVC.

### Billing flow overview

1. Landing page **Pricing** section → choose plan → register with 14-day trial
2. After email verification, Stripe customer + trialing subscription are created (when Stripe keys are configured)
3. Org admin opens **Profile → Billing** to add a card, switch monthly/yearly, or change plan
4. Plan limits (users/projects) are enforced on invites and project creation

### 4. Seed the Super Admin (first run)

```bash
cd backend
npm run seed:super-admin
```

This creates a platform Super Admin account if one does not already exist. Change the password immediately after first login.

### 5. Run locally

In separate terminals:

```bash
# Terminal 1 — API
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

| Service    | URL |
|------------|-----|
| Frontend   | http://localhost:5173 |
| API        | http://localhost:5000 |
| Swagger UI | http://localhost:5000/api-docs |
| Health     | http://localhost:5000/health |

## User roles

| Role             | Scope |
|------------------|-------|
| `super_admin`    | Platform-wide — organizations, settings, cross-tenant reports |
| `org_admin`      | Organization — members, invites, Kanban templates, org reports |
| `project_manager`| Projects — tasks, milestones, calendar, analytics |
| `team_member`    | Assigned work — personal dashboard, Kanban, task updates |
| `client`         | Shared projects only — read-only progress and milestones |

## Scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with file watching |
| `npm start` | Start API (production) |
| `npm test` | Run tests |
| `npm run seed:super-admin` | Create initial Super Admin user |
| `npm run seed:stripe-products` | Create Stripe test Products/Prices and print env vars |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Testing

```bash
cd backend
npm test
```

Tests use `mongodb-memory-server` and a test env setup in `backend/tests/setupEnv.js`.

## Deployment

Both the frontend and backend are deployed on [Vercel](https://vercel.com) as **two separate projects**:

| Project  | Root directory | Config |
|----------|----------------|--------|
| Frontend | `frontend/`    | `frontend/vercel.json` — SPA rewrites to `index.html` |
| Backend  | `backend/`       | `backend/vercel.json` — routes all traffic to the serverless handler at `api/index.js` |

### Backend (Vercel)

1. Create a Vercel project with **Root Directory** set to `backend`.
2. Add all required environment variables from the [backend env section](#2-backend-environment) in **Project Settings → Environment Variables**.
3. Set production cookie options for a cross-origin frontend:
   - `COOKIE_SECURE=true`
   - `COOKIE_SAME_SITE=none`
4. Set `CLIENT_URL` to your frontend Vercel URL (comma-separated if you have multiple origins).

The API runs as a serverless function via `backend/api/index.js`, which lazy-loads the Express app from `src/app.js`.

### Frontend (Vercel)

1. Create a Vercel project with **Root Directory** set to `frontend`.
2. Set build settings: **Build Command** `npm run build`, **Output Directory** `dist`.
3. Add environment variables:
   - `VITE_API_URL` — your backend Vercel URL (e.g. `https://your-api.vercel.app`)
   - `VITE_ENABLE_SOCKETS=false` — recommended on Vercel (see below)

### Production notes

- **Socket.io** is not available on Vercel serverless. Real-time board sync is disabled in production by default; the app falls back to standard HTTP polling/refetch.
- If frontend and backend are on different `*.vercel.app` subdomains, cookies require `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` on the backend.
- Swagger UI is available at `https://<your-api>.vercel.app/api-docs` after deploy.

## API

All REST endpoints are prefixed with `/api/v1`. Interactive documentation is available at `/api-docs` when the backend is running.

## License

Private — all rights reserved unless otherwise specified by the repository owner.
