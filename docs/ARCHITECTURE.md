# FLMS Architecture

## Overview

FLMS is split into 4 independent services that communicate only through HTTP APIs and a shared PostgreSQL database. Each service is owned by one developer and can be started, tested, and deployed independently.

```
Browser ──→ auth-ui (5173)      ──→ auth-service (3001)  ──┐
            catalog-ui (5174)   ──→ loan-service (3002)  ──┤
                                                            ↓
                                                    PostgreSQL (flms_db)
```

---

## Why 2 backends?

| Concern            | auth-service            | loan-service                   |
|--------------------|-------------------------|--------------------------------|
| Responsibility     | Identity & access       | Books & borrow logic           |
| Database tables    | `users`                 | `books`, `loans` (+ joins users)|
| Sensitive data     | password_hash, JWT      | None                           |
| Scaling profile    | Low writes, high reads  | Higher write volume            |

Both services share the same PostgreSQL instance in development. In production they can move to separate databases if needed.

---

## JWT Strategy

- Tokens are signed with a shared `JWT_SECRET` (must be identical in both `.env` files).
- Payload: `{ userId, email, role, iat, exp }`.
- loan-service validates tokens locally (no network hop to auth-service).
- Logout blacklists the token in auth-service's in-memory Set. The loan-service does not check the blacklist — blacklisted tokens remain valid in loan-service until they expire (24h). For production use a shared Redis blacklist.

---

## Atomic Borrow (Race Condition Safety)

`LoanService.borrowBook` uses PostgreSQL `SERIALIZABLE` isolation + `SELECT ... FOR UPDATE`:

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT ... FROM books WHERE id = $1 FOR UPDATE;   -- row lock
SELECT COUNT(*) FROM loans WHERE user_id = $1 AND status = 'active'; -- quota check
INSERT INTO loans ...;
UPDATE books SET available_copies = available_copies - 1 ...;
COMMIT;
```

If two requests race for the last copy, one will get the lock and succeed; the other will block, re-read `available_copies = 0`, and return 409. No overselling is possible.

---

## Database Design Decisions

- `available_copies` is **never** updated directly by API clients. It changes only inside `borrowBook` (−1) and `returnBook` (+1) transactions.
- Books are soft-deleted (`is_deleted = true`) so loan history remains intact.
- `loan.status` stores `active` or `returned`. The `overdue` label is computed on read (`due_date < NOW()`), not written, so there is no background job needed.
- Renewals extend `due_date` from the **current due date**, not from today, to prevent gaming the system.

---

## Frontend Architecture

Both React apps use the same token stored in `localStorage` under the key `flms_token`. This lets a user log in once via auth-ui and browse catalog-ui without re-authenticating.

The two apps navigate between each other via `window.location.href` (full-page redirect) rather than a shared router, keeping them truly independent. In production both would live under the same domain with a reverse proxy.

---

## Folder Ownership

```
backend/auth-service/   → Dev 1 (feature branch: dev1/auth-service)
backend/loan-service/   → Dev 2 (feature branch: dev2/loan-service)
frontend/auth-ui/       → Dev 3 (feature branch: dev3/auth-ui)
frontend/catalog-ui/    → Dev 4 (feature branch: dev4/catalog-ui)
```

Merge order: Dev 1 → Dev 2 (loan-service depends on user table) → Dev 3/4 in parallel.
