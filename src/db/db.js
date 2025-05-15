import pg from "pg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Initialize database
const initDB = async () => {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sql = await fs.readFile(
      path.join(__dirname, "migrations", "001_create_pricelist_table.sql"),
      "utf8"
    );
    await pool.query(sql);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Initialize DB when imported
initDB();

// Add connection status logging
pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
  } else {
    console.log("Successfully connected to the database");
  }
});

export default pool;
