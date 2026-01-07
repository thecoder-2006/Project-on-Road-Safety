import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      damage_score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

export default db;
