# FLMS Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

---

## Database Setup

```bash
# Create user and database
psql -U postgres <<SQL
CREATE USER flms_user WITH PASSWORD 'flms_password';
CREATE DATABASE flms_db OWNER flms_user;
GRANT ALL PRIVILEGES ON DATABASE flms_db TO flms_user;
SQL

# Run migrations
psql -U flms_user -d flms_db -f backend/auth-service/migrations/001_initial_schema.sql
```

The migration creates tables, indexes, a seed admin user, and 10 sample books.

### Default admin login
- Email: `admin@flms.edu`
- Password: `Admin@12345`

To regenerate the admin password hash:
```bash
cd backend/auth-service
npm install
node scripts/seed.js
```

---

## Environment Variables

Copy each `.env.example` to `.env` and update `JWT_SECRET` (must match across both services).

### auth-service `.env`
```
DATABASE_URL=postgresql://flms_user:flms_password@localhost:5432/flms_db
JWT_SECRET=change_this_in_production
JWT_EXPIRY=24h
PORT=3001
```

### loan-service `.env`
```
DATABASE_URL=postgresql://flms_user:flms_password@localhost:5432/flms_db
JWT_SECRET=change_this_in_production
PORT=3002
```

### auth-ui `.env`
```
VITE_API_AUTH_URL=http://localhost:3001
VITE_API_LOAN_URL=http://localhost:3002
```

### catalog-ui `.env`
```
VITE_API_LOAN_URL=http://localhost:3002
VITE_API_AUTH_URL=http://localhost:3001
```

---

## Running Services

### Individual (recommended for development)

```bash
# Terminal 1
cd backend/auth-service && npm install && npm run dev

# Terminal 2
cd backend/loan-service && npm install && npm run dev

# Terminal 3
cd frontend/auth-ui && npm install && npm run dev

# Terminal 4
cd frontend/catalog-ui && npm install && npm run dev
```

### All at once

```bash
npm install   # root — installs concurrently
npm run dev
```

---

## Testing the System

### 1. Register a student
```
POST http://localhost:3001/api/auth/register
{ "email": "student@test.edu", "password": "Pass@1234", "firstName": "Jane", "lastName": "Doe", "role": "student" }
```

### 2. Login
```
POST http://localhost:3001/api/auth/login
{ "email": "student@test.edu", "password": "Pass@1234" }
→ copy token from response
```

### 3. Browse books
```
GET http://localhost:3002/api/catalog/search
Authorization: Bearer <token>
```

### 4. Borrow a book
```
POST http://localhost:3002/api/loans/borrow
Authorization: Bearer <token>
{ "bookId": "<uuid from search>" }
```

### 5. Check active loans
```
GET http://localhost:3002/api/loans/my-loans
Authorization: Bearer <token>
```

---

## Health Checks

```
GET http://localhost:3001/health
GET http://localhost:3002/health
```

---

## Deployment

| Layer    | Platform            |
|----------|---------------------|
| Frontend | Vercel              |
| Backend  | Railway / Render    |
| Database | Railway PostgreSQL  |

Set environment variables on the platform and update `VITE_API_*` URLs in frontend `.env`.
