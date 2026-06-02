# ACL / RBAC System

## Setup

```bash
cd crm-backend
npm run migrate
```

Creates tables: `roles`, `modules`, `role_modules`, `user_module_overrides` and extends **`crm_signup`** with `role_id` + `is_active` (no separate `users` table).

Run all migrations including `20260525120000-rbac-use-crm-signup` if you already applied an older RBAC migration that created `users`.

## Seed users

| Email | Password | Role |
|-------|----------|------|
| admin@crm.local | Admin@123 | admin (all modules) |
| manager@crm.local | Manager@123 | manager |
| viewer@crm.local | Viewer@123 | viewer (dashboard + profile) |

All authentication and ACL use **`crm_signup`** (`name`, `email`, `password_hash`, `role_id`, `is_active`). Role names come from the `roles` table via `role_id`.

## API

### Auth
- `POST /api/auth/login` — returns `{ token, user, access: { modules, overrides } }`
- `GET /api/auth/me` — refresh session + access (Bearer token)

### ACL admin (requires `admin_acl` module)
- `GET/POST/PUT/DELETE /api/roles`
- `GET/POST/PUT/DELETE /api/modules`
- `GET/PUT /api/roles/:id/modules`
- `GET /api/users`, `PUT /api/users/:id/role`
- `GET/POST /api/users/:id/overrides`, `DELETE /api/overrides/:id`

## Access priority

1. User override **DENY**
2. User override **ALLOW**
3. Role module assignment
4. Default **DENY**

## Middleware

- `authenticateToken` — JWT validation
- `requireModuleAccess('module_key')` — route-level guard

## Frontend

- Admin UI: `/admin/acl`
- Hooks: `useACL()`, `hasAccess()`, `<ProtectedRoute>`, `<CanAccess>`
