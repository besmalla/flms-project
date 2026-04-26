"use strict";
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error(`[${new Date().toISOString()}] DB pool error:`, err.message);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const ms = Date.now() - start;
    if (ms > 200) {
      console.warn(
        `[${new Date().toISOString()}] Slow DB query (${ms}ms): ${text.trim().slice(0, 80)}`,
      );
    }
    return result;
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] DB error (${Date.now() - start}ms):`,
      err.message,
    );
    throw err;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
