# ProjectSphere — Full Developer Documentation

Multi-Tenant Project & Task Management SaaS

Version 1.0 · Internal Engineering Reference

---

## 1\. Project Overview

ProjectSphere is a multi-tenant SaaS platform for project and task management, similar to Asana/Trello, supporting multiple organizations ("tenants") on one platform, with strict data isolation between them.

**Roles:**

| Role | Scope | Purpose |
| :---- | :---- | :---- |
| Super Admin | Platform-wide | Manages all organizations, platform settings, billing oversight |
| Org Admin | Single organization | Manages org users, roles, settings, billing |
| Project Manager (PM) | Projects within org | Creates projects, assigns tasks, tracks progress |
| Team Member | Assigned tasks | Works on tasks, updates status, comments |
| Client | Read-only, specific projects | Views progress, approves milestones |

---

## 2\. Tech Stack

### Backend

- **Node.js 20** (runtime)  
- **Express 5** (REST API framework)  
- **MongoDB \+ Mongoose** (database \+ ODM, application-layer tenant isolation via `organizationId`)  
- **Socket.io** (real-time updates)  
- **JWT (jsonwebtoken)** — access \+ refresh tokens  
- **bcrypt** — password hashing  
- **multer \+ cloud storage (S3-compatible)** — file attachments  
- **node-cron** — scheduled cleanup (expired tokens, audit log rotation)  
- **Swagger (swagger-jsdoc \+ swagger-ui-express)** — interactive API docs/testing  
- **Jest \+ Supertest** — unit \+ integration tests  
- **Winston / Morgan** — logging  
- **express-rate-limit \+ helmet \+ cors** — security hardening

### Frontend

- **React 18 \+ TypeScript**  
- **Vite** (build tool)  
- **React Router 7** (routing)  
- **shadcn/ui \+ Tailwind CSS** (UI components/styling)  
- **TanStack Query (React Query)** (server state/caching)  
- **Zustand or Redux Toolkit** (client/global state — auth, UI state)  
- **socket.io-client** (real-time)  
- **@dnd-kit** (Kanban drag-and-drop, actively maintained, accessible)  
- **Recharts** (burndown charts, workload, velocity)  
- **React Hook Form \+ Zod** (forms \+ validation)  
- **date-fns** (calendar/date logic)

### DevOps / Tooling

- **GitHub Actions** (CI: lint, test, build)  
- **Render / Railway / Vercel** (staging deployment — backend on Render/Railway, frontend on Vercel)  
- **MongoDB Atlas** (managed database)  
- **Swagger UI** for manual API testing

---

## 3\. High-Level Architecture

\[React SPA\] \<--REST \+ WebSocket--\> \[Express API\] \<--Mongoose--\> \[MongoDB Atlas\]

                                        |

                                        \+--\> \[Socket.io server\] (real-time)

                                        \+--\> \[S3-compatible storage\] (attachments)

                                        \+--\> \[Redis\] (refresh-token/session store, rate-limit store)

**Multi-tenancy model:** Single database, shared collections, isolated by `organizationId` on every tenant-scoped document. Every query is automatically scoped server-side (never trusted from client input) — enforced via middleware, not per-route logic, so isolation cannot be forgotten in a new route.

---

## 4\. Authentication & Session Security

This section covers the two explicit security requirements: **synchronized login/logout across browser tabs**, and **end-to-end encryption**.

### 4.1 Token Model

- **Access Token (JWT)** — short-lived (15 min), sent in `Authorization: Bearer` header, holds `userId`, `organizationId`, `role`, `permissions`.  
- **Refresh Token** — long-lived (7–30 days), stored as an **httpOnly, Secure, SameSite=Strict cookie** (never in localStorage — prevents XSS token theft). A hashed copy is stored server-side in a `RefreshToken` collection (or Redis) with `userId`, `deviceId`, `expiresAt`, `revoked`.  
- **Rotation:** every refresh request issues a new access \+ refresh token and invalidates the previous refresh token (rotation \+ reuse detection — if a revoked token is reused, all sessions for that user are force-logged-out, indicating possible theft).

### 4.2 Cross-Tab Login/Logout Sync (Requirement)

**Behavior required:** if a user logs in on Tab A and switches to Tab B, Tab B should reflect the logged-in state. If the user logs out on Tab A, Tab B (and all other open tabs) must also log out immediately.

**Implementation — `BroadcastChannel` API (primary) \+ `storage` event (fallback):**

// src/lib/authChannel.ts

const authChannel \= new BroadcastChannel("projectsphere-auth");

export function broadcastLogin(user) {

  authChannel.postMessage({ type: "LOGIN", user });

}

export function broadcastLogout() {

  authChannel.postMessage({ type: "LOGOUT" });

}

authChannel.onmessage \= (event) \=\> {

  if (event.data.type \=== "LOGIN") {

    useAuthStore.getState().setUser(event.data.user);

  }

  if (event.data.type \=== "LOGOUT") {

    useAuthStore.getState().clearUser();

    window.location.href \= "/login"; // force redirect on every tab

  }

};

- On successful login, the access token is kept in memory (Zustand/Redux store) — **not localStorage** — and a lightweight, non-sensitive flag (e.g. `authState=active`) is written to `localStorage` purely to trigger the native `storage` event as a fallback for browsers/contexts where `BroadcastChannel` isn't available.  
- On logout: the client calls `POST /api/v1/auth/logout`, which revokes the refresh token server-side, clears the httpOnly cookie, then broadcasts `LOGOUT` to all tabs.  
- Every tab also runs a **silent refresh cycle** (roughly every 12–14 minutes) against `POST /api/v1/auth/refresh`. If the server responds 401 (token revoked/expired), that tab treats it as a logout and broadcasts accordingly — this is what makes **server-side** logout (e.g. "log out of all devices") also propagate across tabs, not just same-tab logout.

### 4.3 "Logout of All Devices"

`POST /api/v1/auth/logout-all` deletes/revokes every `RefreshToken` document for that `userId`. Combined with the silent-refresh check above, every open tab/device is forced out within one refresh cycle.

### 4.4 RBAC — Role \+ Ownership-Based Permissions

Two layers, both enforced server-side:

1. **Role check** — middleware `requireRole(["org_admin", "project_manager"])` gates route access by role.  
2. **Ownership/ resource-level check** — e.g. a Team Member may only update tasks assigned to them; a PM may only manage projects they created or were granted access to. This is enforced by loading the resource, then comparing `resource.organizationId === req.user.organizationId` **and** an ownership/ACL check (e.g. `task.assigneeId === req.user.id` OR `req.user.role` has an elevated override).

// middleware/rbac.js

function requireOwnershipOrRole(resourceLoader, allowedRoles) {

  return async (req, res, next) \=\> {

    const resource \= await resourceLoader(req);

    if (\!resource) return res.status(404).json({ message: "Not found" });

    if (resource.organizationId.toString() \!== req.user.organizationId) {

      return res.status(403).json({ message: "Forbidden: cross-tenant access denied" });

    }

    const isOwner \= resource.assigneeId?.toString() \=== req.user.id;

    const hasRole \= allowedRoles.includes(req.user.role);

    if (\!isOwner && \!hasRole) return res.status(403).json({ message: "Forbidden" });

    req.resource \= resource;

    next();

  };

}

### 4.5 End-to-End Encryption Approach

"End-to-end encrypted" for a project-management app is applied at these layers (true E2EE where only sender/recipient can decrypt is applied specifically to comments/attachments, described below):

- **Transport:** TLS 1.2+/HTTPS enforced everywhere (HSTS header), WebSocket connections over WSS.  
- **At rest:** MongoDB Atlas encryption-at-rest (AES-256) for the database; S3-compatible storage server-side encryption for attachments.  
- **Passwords:** bcrypt (cost factor 12), never reversible.  
- **Sensitive field encryption:** PII fields (e.g. client contact info) encrypted at the application layer with AES-256-GCM using a key from a secrets manager (not committed to the repo), via a Mongoose plugin that transparently encrypts/decrypts on save/read.  
- **True E2EE for comments/attachments (optional advanced mode):** client-side encryption using the Web Crypto API — each project has a symmetric project key, itself encrypted per-user with that user's public key (asymmetric key pair generated client-side on first login, private key never leaves the device/is wrapped with a password-derived key). Comments and file contents are encrypted client-side before upload; the server only ever stores ciphertext. This mode trades off server-side full-text search on comments, so it's recommended as an opt-in per-project setting rather than default, since Super Admin/Org Admin oversight features (audit log content review) become limited for E2EE projects.

---

## 5\. Backend Documentation

### 5.1 Folder Structure

server/

├── src/

│   ├── config/            \# db.js, env.js, swagger.js

│   ├── models/             \# Mongoose schemas

│   ├── controllers/        \# route handler logic

│   ├── routes/              \# Express routers

│   ├── middleware/         \# auth, rbac, tenantScope, errorHandler, rateLimit

│   ├── services/             \# business logic (email, reports, encryption)

│   ├── sockets/              \# socket.io event handlers

│   ├── utils/                 \# helpers (pagination, aggregation builders)

│   ├── validators/          \# Zod/Joi schemas per route

│   └── app.js

├── tests/

│   ├── unit/

│   └── integration/

└── server.js

### 5.2 Core Data Models

| Model | Key Fields |
| :---- | :---- |
| **Organization** | name, slug, plan, settings, createdAt |
| **User** | organizationId, name, email, passwordHash, role, publicKey (for E2EE), isActive |
| **RefreshToken** | userId, tokenHash, deviceId, expiresAt, revoked |
| **Project** | organizationId, name, description, ownerId (PM), members\[\], clientIds\[\], status, startDate, dueDate |
| **Task** | organizationId, projectId, title, description, status (todo/in-progress/review/done), assigneeId, priority, dueDate, labels\[\], position (for Kanban ordering) |
| **Comment** | organizationId, taskId, authorId, body (or ciphertext for E2EE), createdAt |
| **Attachment** | organizationId, taskId, uploaderId, fileUrl, fileKey (encrypted), mimeType, size |
| **Notification** | organizationId, userId, type, payload, read |
| **AuditLog** | organizationId, actorId, action, targetType, targetId, metadata, ip, timestamp |
| **Milestone** | organizationId, projectId, name, dueDate, status, approvedByClientId |

### 5.3 Middleware Pipeline (applied in order)

1. `helmet()`, `cors()`, `express-rate-limit`  
2. `authenticate` — verifies JWT, attaches `req.user`  
3. `tenantScope` — injects `organizationId` filter automatically into all Mongoose queries for the request (via a scoped query helper), so cross-tenant leakage is structurally prevented, not just checked per-route  
4. `requireRole` / `requireOwnershipOrRole` — per-route  
5. `validate(schema)` — Zod/Joi request validation  
6. Controller  
7. `auditLogger` — logs mutating actions  
8. `errorHandler`

### 5.4 API Endpoints

Base URL: `/api/v1`

#### Auth

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| POST | `/auth/register-org` | Org signup — creates Organization \+ first Org Admin | Public |
| POST | `/auth/login` | Login, returns access token \+ sets refresh cookie | Public |
| POST | `/auth/refresh` | Rotates refresh token, returns new access token | Refresh cookie |
| POST | `/auth/logout` | Revokes current refresh token | Authenticated |
| POST | `/auth/logout-all` | Revokes all refresh tokens for user | Authenticated |
| POST | `/auth/invite` | Invite a user to org (emails invite link) | Org Admin/PM |
| POST | `/auth/accept-invite` | Completes signup via invite token | Public (token) |
| POST | `/auth/forgot-password` | Sends reset email | Public |
| POST | `/auth/reset-password` | Resets password via token | Public (token) |
| GET | `/auth/me` | Returns current user profile | Authenticated |

#### Organizations (Super Admin)

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/organizations` | List all organizations | Super Admin |
| GET | `/organizations/:id` | Org details | Super Admin |
| PATCH | `/organizations/:id` | Update org (plan, status) | Super Admin |
| DELETE | `/organizations/:id` | Suspend/delete org | Super Admin |
| GET | `/organizations/:id/usage` | Usage/billing stats | Super Admin |

#### Org Settings & Users (Org Admin)

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/org/users` | List users in org | Org Admin |
| PATCH | `/org/users/:id/role` | Change a user's role | Org Admin |
| PATCH | `/org/users/:id/status` | Activate/deactivate user | Org Admin |
| DELETE | `/org/users/:id` | Remove user from org | Org Admin |
| GET | `/org/settings` | Get org settings | Org Admin |
| PATCH | `/org/settings` | Update org settings | Org Admin |

#### Projects

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/projects` | List projects (scoped to org \+ membership) | Authenticated |
| POST | `/projects` | Create project | PM/Org Admin |
| GET | `/projects/:id` | Project details | Member/Client(read) |
| PATCH | `/projects/:id` | Update project | PM (owner)/Org Admin |
| DELETE | `/projects/:id` | Archive/delete project | PM (owner)/Org Admin |
| POST | `/projects/:id/members` | Add member | PM/Org Admin |
| DELETE | `/projects/:id/members/:userId` | Remove member | PM/Org Admin |

#### Tasks (Kanban)

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/projects/:projectId/tasks` | List tasks (Kanban columns) | Member/Client(read) |
| POST | `/projects/:projectId/tasks` | Create task | PM/Member |
| GET | `/tasks/:id` | Task detail | Member(assigned)/PM |
| PATCH | `/tasks/:id` | Update task fields | PM/Assignee(ownership) |
| PATCH | `/tasks/:id/move` | Update status/position (drag-drop) | PM/Assignee |
| DELETE | `/tasks/:id` | Delete task | PM |
| POST | `/tasks/:id/comments` | Add comment | Member(assigned)/PM |
| GET | `/tasks/:id/comments` | List comments | Member/PM/Client(read) |
| POST | `/tasks/:id/attachments` | Upload attachment | Member/PM |
| DELETE | `/attachments/:id` | Delete attachment | Uploader/PM |

#### Calendar

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/projects/:id/calendar` | Tasks \+ milestones by date range | Member/Client(read) |

#### Milestones (Client Approvals)

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/projects/:id/milestones` | List milestones | Member/Client |
| POST | `/projects/:id/milestones` | Create milestone | PM |
| PATCH | `/milestones/:id/approve` | Client approves milestone | Client |

#### Notifications (Real-time \+ REST fallback)

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/notifications` | List notifications | Authenticated |
| PATCH | `/notifications/:id/read` | Mark as read | Authenticated |
| PATCH | `/notifications/read-all` | Mark all read | Authenticated |

#### Reports / Analytics (Aggregation Pipelines)

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/projects/:id/reports/burndown` | Burndown chart data | PM/Org Admin/Client(read) |
| GET | `/projects/:id/reports/velocity` | Velocity per sprint/week | PM/Org Admin |
| GET | `/projects/:id/reports/workload` | Workload per team member | PM/Org Admin |
| GET | `/org/reports/overview` | Org-wide KPI dashboard | Org Admin |
| GET | `/platform/reports/overview` | Platform-wide KPI dashboard | Super Admin |

#### Audit Log

| Method | Endpoint | Description | Access |
| :---- | :---- | :---- | :---- |
| GET | `/org/audit-logs` | Paginated audit trail | Org Admin |
| GET | `/platform/audit-logs` | Platform-wide audit trail | Super Admin |

### 5.5 Socket.io Events

| Event | Direction | Payload | Purpose |
| :---- | :---- | :---- | :---- |
| `task:created` | server→client | task | New task added to board |
| `task:updated` | server→client | task | Field change |
| `task:moved` | server→client | {taskId, status, position} | Kanban drag-drop live sync |
| `comment:new` | server→client | comment | Live comment feed |
| `notification:new` | server→client | notification | Bell icon live update |
| `presence:join` / `presence:leave` | bidirectional | userId, projectId | "who's viewing this board" |
| `auth:forceLogout` | server→client | {reason} | Pushes logout to all connected sockets for a user (server-initiated revoke) |

Rooms are namespaced per organization and per project (`org:{orgId}`, `project:{projectId}`) — the server validates room-join requests against the user's actual membership before allowing a socket to join, preventing cross-tenant event leakage.

### 5.6 Swagger (API Testing)

Install:

npm install swagger-jsdoc swagger-ui-express \--save

`config/swagger.js`:

import swaggerJsdoc from "swagger-jsdoc";

import swaggerUi from "swagger-ui-express";

const options \= {

  definition: {

    openapi: "3.0.0",

    info: { title: "ProjectSphere API", version: "1.0.0" },

    servers: \[{ url: "/api/v1" }\],

    components: {

      securitySchemes: {

        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },

      },

    },

    security: \[{ bearerAuth: \[\] }\],

  },

  apis: \["./src/routes/\*.js"\], // reads JSDoc @openapi comments per route

};

export const swaggerSpec \= swaggerJsdoc(options);

export const swaggerServe \= swaggerUi.serve;

export const swaggerSetup \= swaggerUi.setup(swaggerSpec);

Mount in `app.js`:

app.use("/api-docs", swaggerServe, swaggerSetup);

Then every route file documents endpoints with `@openapi` JSDoc blocks, and the full interactive testing UI is available at `GET /api-docs` — auth by pasting a bearer token into the "Authorize" button, then every endpoint above can be tried directly from the browser.

---

## 6\. Frontend Documentation

### 6.1 Folder Structure

client/

├── src/

│   ├── pages/               \# route-level pages (below)

│   ├── components/          \# shared UI (shadcn-based)

│   ├── features/            \# feature-sliced: kanban/, tasks/, reports/, auth/

│   ├── hooks/                 \# useAuth, useSocket, useTenantQuery

│   ├── lib/                     \# authChannel.ts, apiClient.ts, socket.ts

│   ├── store/                 \# Zustand slices (auth, ui)

│   └── routes/                \# route config \+ role guards

### 6.2 Full Page Map (by role)

**Public / Auth Pages**

- `/` — Landing page (marketing)  
- `/pricing` — Pricing page  
- `/login` — Login  
- `/register` — Org signup (creates Organization \+ Org Admin)  
- `/invite/:token` — Accept invite (join existing org)  
- `/forgot-password`, `/reset-password/:token`

**Super Admin Dashboard** (`/super-admin`)

- `/super-admin` — Platform overview (org count, active users, MRR-style KPIs)  
- `/super-admin/organizations` — All organizations list  
  - `/super-admin/organizations/:id` — Org detail (plan, usage, suspend/delete)  
- `/super-admin/users` — Cross-org user search  
- `/super-admin/audit-logs` — Platform-wide audit trail  
- `/super-admin/settings` — Platform configuration

**Org Admin Dashboard** (`/admin`)

- `/admin` — Org overview (active projects, team size, KPI widgets)  
- `/admin/users` — Team members list  
  - `/admin/users/invite` — Invite user modal/page  
  - `/admin/users/:id` — User detail/role edit  
- `/admin/projects` — All org projects (management view)  
- `/admin/reports` — Org-wide analytics (workload, velocity across projects)  
- `/admin/audit-logs` — Org audit trail  
- `/admin/settings` — Org settings (name, branding, security policy)  
- `/admin/billing` — Subscription/billing

**Project Manager Dashboard** (`/pm` or shared `/dashboard`)

- `/dashboard` — My projects overview  
- `/projects/:id/board` — **Kanban board** (drag & drop, columns: To Do / In Progress / Review / Done)  
- `/projects/:id/tasks/:taskId` — **Task detail view** (description, assignee, comments, attachments, activity log)  
- `/projects/:id/calendar` — **Calendar view** (tasks \+ milestones by date)  
- `/projects/:id/reports` — Burndown / velocity / workload charts  
- `/projects/:id/team` — Project members management  
- `/projects/:id/milestones` — Milestone tracker  
- `/projects/new` — Create project wizard

**Team Member Views**

- `/dashboard` — My assigned tasks (across projects)  
- `/projects/:id/board` — Kanban (same board, restricted actions: can only move/edit own tasks)  
- `/projects/:id/tasks/:taskId` — Task detail (update status, comment, attach files)  
- `/notifications` — Notification center

**Client Portal** (`/portal`, external, read-only)

- `/portal` — Client's project list (only projects they're linked to)  
- `/portal/projects/:id` — Read-only progress view (Kanban read-only, % complete)  
- `/portal/projects/:id/milestones` — Milestones list with **Approve** action  
- `/portal/projects/:id/reports` — Read-only high-level progress charts

**Shared**

- `/profile` — Account settings, password change, "log out of all devices" button  
- `/404`, `/403` — Error pages

### 6.3 Routing & Role Guards

// routes/ProtectedRoute.tsx

function ProtectedRoute({ allowedRoles, children }) {

  const { user, isLoading } \= useAuth();

  if (isLoading) return \<FullPageSpinner /\>;

  if (\!user) return \<Navigate to="/login" replace /\>;

  if (allowedRoles && \!allowedRoles.includes(user.role)) {

    return \<Navigate to="/403" replace /\>;

  }

  return children;

}

Each dashboard's sub-routes are nested under a layout route that renders the sidebar/navbar for that role and re-validates the role guard, so directly visiting a deep URL (e.g. `/admin/users`) without the right role redirects to `/403` rather than flashing protected content.

### 6.4 How Key Functionality Works

**Kanban Board (`@dnd-kit`):**

- Tasks are fetched via React Query (`useQuery(["tasks", projectId])`), grouped client-side into columns by `status`.  
- Drag end handler computes a new `position` value (fractional indexing between neighboring tasks, avoiding a full re-index of every task on every drop) and calls `PATCH /tasks/:id/move` optimistically (UI updates immediately, rolls back on error).  
- Simultaneously listens for `task:moved` socket events from other users to keep the board live without polling.

**Real-time layer:**

- `useSocket()` hook establishes one socket connection per session, joins `project:{id}` room on mount of a board/task page, leaves on unmount.  
- Incoming events (`task:updated`, `comment:new`) invalidate the relevant React Query cache key, so the UI re-renders from a single source of truth rather than manually patching local state in two places.

**Reports/Analytics:**

- Burndown/velocity/workload are computed server-side via MongoDB aggregation pipelines (not client-side), returned as ready-to-chart arrays, rendered with Recharts.

**Cross-tab auth (frontend half — see section 4.2):**

- `useAuth()` hook subscribes to the Zustand auth store, which is kept in sync by `authChannel.ts` (BroadcastChannel) so every tab's UI reflects login/logout state instantly without a page reload.

---

## 7\. Multi-Tenant Data Isolation Summary

- Every tenant-scoped Mongoose model has a required `organizationId` field, indexed.  
- The `tenantScope` middleware injects `organizationId: req.user.organizationId` into every query automatically at the query-builder level — controllers never manually filter by org, which removes the most common source of accidental data leaks (a developer forgetting a `.find({ organizationId })` filter in a new endpoint).  
- Cross-org access attempts (e.g. guessing another org's project ID in the URL) return `403`, logged to the audit trail as a potential security event.

---

## 8\. Testing

- **Unit tests (Jest):** models (validation), services (encryption, report aggregation logic), utils.  
- **Integration tests (Jest \+ Supertest):** full request/response cycles per endpoint, including a dedicated "cross-tenant isolation" test suite that asserts Org A's token can never read/write Org B's data.  
- **Frontend:** React Testing Library for component behavior, Playwright/Cypress for e2e flows (login → create project → drag task → logout-all-tabs).

---

## 9\. Local Setup

\# Backend

cd server

npm install

cp .env.example .env   \# set MONGO\_URI, JWT\_SECRET, JWT\_REFRESH\_SECRET, ENCRYPTION\_KEY

npm run dev             \# starts Express \+ Socket.io on :5000

\# Swagger UI: http://localhost:5000/api-docs

\# Frontend

cd client

npm install

cp .env.example .env   \# set VITE\_API\_URL=http://localhost:5000/api/v1

npm run dev             \# Vite dev server on :5173

---

## 10\. Deployment (Staging)

- **Backend:** Render/Railway (Node service) \+ MongoDB Atlas (managed) \+ Redis (managed, for refresh tokens/sessions) \+ S3-compatible bucket for attachments.  
- **Frontend:** Vercel, environment variable `VITE_API_URL` pointed at the staging backend URL; WSS URL configured for Socket.io in production (`wss://api-staging.projectsphere.app`).  
- **CI (GitHub Actions):** lint → test (unit \+ integration against a Dockerized MongoDB) → build → deploy on merge to `staging` branch.

