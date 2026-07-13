# RBAC manual test notes

Use Swagger (`/api-docs`) or curl. Replace `TOKEN`, `PROJECT_ID`, `TASK_ID`, and `OTHER_TASK_ID` with real values from your seeded org.

Base URL: `http://localhost:5000/api/v1`

## Setup

1. Invite or seed users for each role in the **same org**: `org_admin`, `project_manager`, `team_member`, `client`.
2. Log in as `project_manager` and create a project → save `PROJECT_ID`.
3. Create two tasks on that project:
   - Task A: `assigneeId` = team member user id → `TASK_ID`
   - Task B: `assigneeId` = another user → `OTHER_TASK_ID`
4. Optionally create a project in a **second org** for cross-tenant tests → `OTHER_ORG_PROJECT_ID`, `OTHER_ORG_TASK_ID`.

---

## Project routes

### Create project  `POST /projects`

| # | Role | Body | Expected |
|---|------|------|----------|
| 1 | `org_admin` | `{ "name": "RBAC Admin Project" }` | **201** |
| 2 | `project_manager` | `{ "name": "RBAC PM Project" }` | **201** |
| 3 | `team_member` | `{ "name": "Should Fail" }` | **403** `Forbidden: insufficient role` |
| 4 | `client` | `{ "name": "Should Fail" }` | **403** or **401** (if no org context from tenant scope) |

```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"RBAC Test Project"}'
```

### Update project  `PATCH /projects/:id`

| # | Actor | Target | Expected |
|---|--------|--------|----------|
| 5 | `project_manager` (owner) | Own project | **200** |
| 6 | `project_manager` (not owner) | Another PM's project | **403** `Forbidden: insufficient permissions` |
| 7 | `org_admin` | Any project in org | **200** |
| 8 | `team_member` | Any project | **403** |

```bash
curl -X PATCH http://localhost:5000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated"}'
```

### Archive project  `DELETE /projects/:id`

Same rules as PATCH (ownership or `org_admin`). Repeat cases 5–8 with `DELETE`.

### Read projects  `GET /projects`, `GET /projects/:id`

| # | Role | Expected |
|---|------|----------|
| 9 | Any org member (`org_admin`, `project_manager`, `team_member`, `client` with org) | **200** (tenant-scoped list/detail) |

> **TODO (not in this PR):** Clients should only see linked projects once client–project linking exists.

### Cross-org  `PATCH /projects/:id`

| # | Actor | Target | Expected |
|---|--------|--------|----------|
| 10 | User in Org A | Project id from Org B | **404** `Not found` (not 403) |

---

## Task routes

### Create task  `POST /projects/:projectId/tasks`

| # | Role | Expected |
|---|------|----------|
| 11 | `org_admin` | **201** |
| 12 | `project_manager` | **201** |
| 13 | `team_member` | **201** |
| 14 | `client` | **403** |

```bash
curl -X POST http://localhost:5000/api/v1/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"RBAC test task"}'
```

### Update task  `PATCH /tasks/:id`

| # | Actor | Task | Expected |
|---|--------|------|----------|
| 15 | `team_member` | Assigned to self (`TASK_ID`) | **200** |
| 16 | `team_member` | Assigned to someone else (`OTHER_TASK_ID`) | **403** |
| 17 | `project_manager` | Any task in org | **200** |
| 18 | `org_admin` | Any task in org | **200** |

```bash
curl -X PATCH http://localhost:5000/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in-progress"}'
```

### Delete task  `DELETE /tasks/:id`

| # | Role | Expected |
|---|------|----------|
| 19 | `team_member` | **403** |
| 20 | `project_manager` | **200** |
| 21 | `org_admin` | **200** |

### Cross-org  `PATCH /tasks/:id`

| # | Actor | Target | Expected |
|---|--------|--------|----------|
| 22 | User in Org A | Task id from Org B | **404** `Not found` |

---

## Quick pass/fail checklist

- [ ] Team member cannot create projects
- [ ] PM can only PATCH/DELETE own projects; org admin can PATCH/DELETE any
- [ ] Team member can create tasks
- [ ] Team member can PATCH only tasks assigned to them
- [ ] Team member cannot DELETE tasks
- [ ] Cross-org project/task mutations return **404**, not **403**
