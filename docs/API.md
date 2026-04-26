# FLMS API Reference

All endpoints return JSON. Errors follow `{ "error": "message", "status": <code> }`.

---

## Auth Service — `http://localhost:3001`

### Public

#### `POST /api/auth/register`
```json
Body: { "email", "password", "firstName", "lastName", "role": "student|faculty", "department?" }
Returns: { "token", "user" }
Errors: 400 (validation), 409 (duplicate email)
```

#### `POST /api/auth/login`
```json
Body: { "email", "password" }
Returns: { "token", "user" }
Errors: 400 (missing fields), 401 (invalid credentials or deactivated)
```

### Authenticated (Bearer token required)

#### `POST /api/auth/logout`
Blacklists the current token.

#### `GET /api/auth/profile`
Returns `{ "user" }`.

#### `PUT /api/auth/profile`
```json
Body: { "firstName", "lastName", "department?" }
Returns: { "user" }
```

#### `POST /api/auth/reset-password`
```json
Body: { "currentPassword", "newPassword" }
Errors: 400 (wrong current password or short new password)
```

### Admin only

#### `GET /api/admin/users`
Query: `page`, `limit`, `role`, `search`

#### `GET /api/admin/users/:userId`

#### `PATCH /api/admin/users/:userId/role`
```json
Body: { "role": "student|faculty|librarian|admin" }
```

#### `PATCH /api/admin/users/:userId/deactivate`

---

## Loan Service — `http://localhost:3002`

All endpoints require `Authorization: Bearer <token>`.

### Catalog

#### `GET /api/catalog/search`
Query: `q` (title/author/ISBN), `category`, `yearMin`, `yearMax`, `page`, `limit`
```json
Returns: { "data": [...books], "pagination": { "page", "limit", "total", "pages" } }
```

#### `GET /api/catalog/books/:bookId`
Returns `{ "book" }`.

#### `POST /api/catalog/books` _(librarian/admin)_
```json
Body: { "title"*, "author"*, "isbn?", "category?", "year?", "totalCopies?" }
Returns: { "book" } — 201
```

#### `PUT /api/catalog/books/:bookId` _(librarian/admin)_
Same fields as POST (all optional for partial update).

#### `DELETE /api/catalog/books/:bookId` _(librarian/admin)_
Soft-deletes. Fails with 409 if active loans exist.

#### `POST /api/catalog/import` _(librarian/admin)_
```json
Body: { "books": [ { "title"*, "author"*, ... }, ... ] }
Returns: { "imported": N, "books": [...] }
```
All-or-nothing: if any book fails validation the entire import is rejected.

### Loans

#### `POST /api/loans/borrow`
```json
Body: { "bookId" }
Returns: { "loan", "book" } — 201
Errors:
  404 — book not found
  409 — no copies / already borrowed
  429 — borrow quota reached (5 for students, 10 for faculty)
```

#### `POST /api/loans/return`
```json
Body: { "loanId" }
Librarians/admins can return any loan; others only their own.
Errors: 404, 409 (already returned), 403 (not your loan)
```

#### `POST /api/loans/renew`
```json
Body: { "loanId" }
Extends due_date from current due date (not today).
Max 2 renewals per loan.
Errors: 404, 403 (not your loan), 409 (max renewals / not active)
```

#### `GET /api/loans/my-loans`
Returns active loans with computed_status (`active` or `overdue`).

#### `GET /api/loans/history`
Query: `page`, `limit`
Returns returned loans, paginated.

#### `GET /api/loans` _(librarian/admin)_
Query: `page`, `limit`, `status`, `userId`
Returns all loans with borrower details.

---

## Status Codes Summary

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad request / validation error |
| 401  | Unauthenticated (no/expired/revoked token) |
| 403  | Forbidden (insufficient role) |
| 404  | Not found |
| 409  | Conflict (duplicate, already returned, active loans) |
| 429  | Borrow quota exceeded |
| 500  | Internal server error |
