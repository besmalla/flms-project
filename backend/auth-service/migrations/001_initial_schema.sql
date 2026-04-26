-- FLMS Database Schema
-- Run once:
--   psql -U postgres -c "CREATE USER flms_user WITH PASSWORD 'flms_password';"
--   psql -U postgres -c "CREATE DATABASE flms_db OWNER flms_user;"
--   psql -U flms_user -d flms_db -f backend/auth-service/migrations/001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'faculty', 'librarian', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE loan_status AS ENUM ('active', 'returned', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'student',
  department    VARCHAR(100),
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(500) NOT NULL,
  author           VARCHAR(300) NOT NULL,
  isbn             VARCHAR(30),
  category         VARCHAR(100),
  year             INTEGER,
  total_copies     INTEGER      NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INTEGER      NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  is_deleted       BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES users(id),
  book_id      UUID        NOT NULL REFERENCES books(id),
  borrowed_at  TIMESTAMPTZ DEFAULT NOW(),
  due_date     TIMESTAMPTZ NOT NULL,
  returned_at  TIMESTAMPTZ,
  status       loan_status NOT NULL DEFAULT 'active',
  renewals_used INTEGER    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id   ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_id   ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status    ON loans(status);
CREATE INDEX IF NOT EXISTS idx_books_isbn      ON books(isbn) WHERE isbn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_deleted   ON books(is_deleted);
CREATE INDEX IF NOT EXISTS idx_books_category  ON books(category) WHERE category IS NOT NULL;

-- Default admin (password: Admin@12345 — change after first login)
-- Hash generated with bcryptjs, 10 rounds
-- To regenerate: node -e "const b=require('bcryptjs');b.hash('Admin@12345',10).then(console.log)"
INSERT INTO users (email, password_hash, first_name, last_name, role, department)
VALUES (
  'admin@flms.edu',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'System', 'Admin', 'admin', 'Administration'
) ON CONFLICT (email) DO NOTHING;

-- Sample books for testing
INSERT INTO books (title, author, isbn, category, year, total_copies, available_copies) VALUES
  ('Introduction to Algorithms',    'Cormen, Leiserson, Rivest', '978-0262033848', 'Computer Science', 2009, 3, 3),
  ('Clean Code',                    'Robert C. Martin',           '978-0132350884', 'Computer Science', 2008, 2, 2),
  ('The Pragmatic Programmer',      'Hunt & Thomas',              '978-0201616224', 'Computer Science', 1999, 2, 2),
  ('Design Patterns',               'Gang of Four',               '978-0201633610', 'Computer Science', 1994, 2, 2),
  ('Database System Concepts',      'Silberschatz et al.',        '978-0078022159', 'Databases',        2019, 3, 3),
  ('Operating System Concepts',     'Silberschatz et al.',        '978-1119456339', 'Operating Systems',2018, 2, 2),
  ('Computer Networks',             'Tanenbaum & Wetherall',      '978-0132126953', 'Networking',       2010, 2, 2),
  ('Artificial Intelligence',       'Russell & Norvig',           '978-0134610993', 'AI/ML',            2020, 3, 3),
  ('Linear Algebra Done Right',     'Sheldon Axler',              '978-3319110806', 'Mathematics',      2015, 2, 2),
  ('Calculus: Early Transcendentals','James Stewart',             '978-1285741550', 'Mathematics',      2015, 4, 4)
ON CONFLICT DO NOTHING;
