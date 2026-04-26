# Faculty Library Management System (FLMS)

A full-stack library management system for academic institutions.

## User Roles

| Role          | Description                     | Permissions                                                      |
| ------------- | ------------------------------- | ---------------------------------------------------------------- |
| **Student**   | Undergraduate/graduate students | Browse catalog, borrow/return books, view own loans              |
| **Faculty**   | Professors and academic staff   | Same as students + renew loans                                   |
| **Librarian** | Library staff                   | All student/faculty permissions + manage books (add/edit/delete) |
| **Admin**     | System administrators           | All permissions + manage users (view, change roles, deactivate)  |

## Architecture

| Service      | Port | Description                                                                |
| ------------ | ---- | -------------------------------------------------------------------------- |
| auth-service | 3001 | User authentication, registration, profile management, admin user controls |
| loan-service | 3002 | Book catalog, loan management, book CRUD operations                        |
| auth-ui      | 5173 | User login/register, profile management, admin panel                       |
| catalog-ui   | 5174 | Book browsing, loan operations, book management (librarians)               |

All four services can run independently and in parallel.

---

## Quick Start (30 minutes)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Database Setup

```bash
# Create database user and database
psql -U postgres -c "CREATE USER flms_user WITH PASSWORD 'flms_password';"
psql -U postgres -c "CREATE DATABASE flms_db OWNER flms_user;"
psql -U flms_user -d flms_db -f backend/auth-service/migrations/001_initial_schema.sql
```

**Default admin account:** `admin@flms.edu` / `Admin@12345`

### 2. Backend Services

#### Auth Service (Port 3001)

```bash
cd backend/auth-service
cp .env.example .env        # Configure DATABASE_URL and JWT_SECRET
npm install
npm start
```

#### Loan Service (Port 3002)

```bash
cd backend/loan-service
cp .env.example .env        # Same DATABASE_URL + JWT_SECRET as auth-service
npm install
npm start
```

### 3. Frontend Applications

#### Auth UI (Port 5173) - User Management

```bash
cd frontend/auth-ui
npm install
npm run dev
```

- User registration and login
- Profile management
- Admin panel (user management)

#### Catalog UI (Port 5174) - Library Operations

```bash
cd frontend/catalog-ui
npm install
npm run dev
```

- Browse and search books
- Borrow/return/renew books
- Book management (librarians)
- View loan history

---

## Usage Guide

### For Students & Faculty

1. Register at http://localhost:5173/register or login at http://localhost:5173/login
2. Go to http://localhost:5174 to browse the catalog
3. Search for books, borrow available copies
4. View your loans and return books when done

### For Librarians

- All student/faculty permissions
- Add new books, edit book details, remove books
- Manage book inventory and availability

### For Admins

- All permissions across the system
- Access admin panel at http://localhost:5173/admin (after login)
- View all users, change user roles, deactivate accounts
- Full access to catalog and book management

## API Documentation

See [API.md](docs/API.md) for detailed endpoint documentation.

## Architecture Details

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design and component interactions.

---

## Team Feature Branches

```
git checkout -b dev1/auth-service
git checkout -b dev2/loan-service
git checkout -b dev3/auth-ui
git checkout -b dev4/catalog-ui
```

See `docs/SETUP.md` for detailed installation and `docs/API.md` for all endpoints.
