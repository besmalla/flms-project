'use strict';
// Run: node scripts/seed.js
// Creates/resets the admin account with a known password.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const password = 'Admin@12345';
  const hash = await bcrypt.hash(password, 10);

  await pool.query(`
    INSERT INTO users (email, password_hash, first_name, last_name, role, department)
    VALUES ($1, $2, 'System', 'Admin', 'admin', 'Administration')
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_active = true
  `, ['admin@flms.edu', hash]);

  console.log('Seed complete.');
  console.log('  Admin email:    admin@flms.edu');
  console.log('  Admin password: Admin@12345');
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
