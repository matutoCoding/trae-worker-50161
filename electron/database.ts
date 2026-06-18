import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

let db: Database;
let dbPath: string;
let SQL: any;

export async function initDatabase() {
  SQL = await initSqlJs({
    locateFile: (file: string) =>
      path.join(__dirname, '../node_modules/sql.js/dist', file),
  });

  dbPath = path.join(app.getPath('userData'), 'gym.db');

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  seedData();
  saveDatabase();
}

export function getDb(): Database {
  return db;
}

export function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      specialty TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      gender TEXT,
      birthday DATE,
      family_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      total_purchased INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      course_date DATE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 1,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      course_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coach_id) REFERENCES coaches(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      family_id INTEGER,
      status TEXT NOT NULL DEFAULT 'booked',
      booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checked_in_at DATETIME,
      cancelled_at DATETIME,
      timeout_minutes INTEGER DEFAULT 15,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      family_id INTEGER,
      position INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notified_at DATETIME,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      measure_date DATE NOT NULL,
      height REAL,
      weight REAL,
      bmi REAL,
      body_fat REAL,
      muscle_mass REAL,
      waist REAL,
      hip REAL,
      chest REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS balance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      booking_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );
  `);

  try {
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(course_date)'
    );
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON bookings(schedule_id)'
    );
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id)'
    );
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_waitlist_schedule ON waitlist(schedule_id)'
    );
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_body_measurements_member ON body_measurements(member_id)'
    );
  } catch (e) {
    // 索引可能已存在，忽略错误
  }
}

function seedData() {
  const coachCount = db.exec('SELECT COUNT(*) as count FROM coaches')[0]?.values[0][0];
  if (!coachCount || coachCount === 0) {
    db.run("INSERT INTO coaches (name, phone, specialty) VALUES ('张教练', '13800138001', '力量训练、增肌')");
    db.run("INSERT INTO coaches (name, phone, specialty) VALUES ('李教练', '13800138002', '瑜伽、普拉提')");
    db.run("INSERT INTO coaches (name, phone, specialty) VALUES ('王教练', '13800138003', '有氧训练、减脂')");
  }

  const familyCount = db.exec('SELECT COUNT(*) as count FROM families')[0]?.values[0][0];
  if (!familyCount || familyCount === 0) {
    db.run("INSERT INTO families (name, balance, total_purchased) VALUES ('张伟家庭', 50, 50)");
    db.run("INSERT INTO families (name, balance, total_purchased) VALUES ('李娜家庭', 30, 30)");
  }

  const memberCount = db.exec('SELECT COUNT(*) as count FROM members')[0]?.values[0][0];
  if (!memberCount || memberCount === 0) {
    db.run("INSERT INTO members (name, phone, gender, birthday, family_id) VALUES ('张伟', '13900139001', '男', '1990-05-15', 1)");
    db.run("INSERT INTO members (name, phone, gender, birthday, family_id) VALUES ('王芳', '13900139002', '女', '1992-08-20', 1)");
    db.run("INSERT INTO members (name, phone, gender, birthday, family_id) VALUES ('李娜', '13900139003', '女', '1988-03-10', 2)");
  }

  const scheduleCount = db.exec('SELECT COUNT(*) as count FROM schedules')[0]?.values[0][0];
  if (!scheduleCount || scheduleCount === 0) {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      db.run(
        `INSERT INTO schedules (coach_id, course_date, start_time, end_time, capacity, course_name) VALUES (1, '${dateStr}', '09:00', '10:00', 1, '私教力量课')`
      );
      db.run(
        `INSERT INTO schedules (coach_id, course_date, start_time, end_time, capacity, course_name) VALUES (1, '${dateStr}', '14:00', '15:00', 1, '私教力量课')`
      );
      db.run(
        `INSERT INTO schedules (coach_id, course_date, start_time, end_time, capacity, course_name) VALUES (2, '${dateStr}', '10:00', '11:00', 3, '瑜伽小班课')`
      );
      db.run(
        `INSERT INTO schedules (coach_id, course_date, start_time, end_time, capacity, course_name) VALUES (2, '${dateStr}', '16:00', '17:00', 3, '普拉提课')`
      );
      db.run(
        `INSERT INTO schedules (coach_id, course_date, start_time, end_time, capacity, course_name) VALUES (3, '${dateStr}', '11:00', '12:00', 1, '有氧私教课')`
      );
      db.run(
        `INSERT INTO schedules (coach_id, course_date, start_time, end_time, capacity, course_name) VALUES (3, '${dateStr}', '19:00', '20:00', 1, '有氧私教课')`
      );
    }
  }
}

export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  const columns = stmt.getColumnNames();

  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }

  stmt.free();
  return results;
}

export function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function runSql(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const stmt = db.prepare(sql);
  stmt.run(params);
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0;
  const changes = db.exec('SELECT changes() as c')[0]?.values[0][0] || 0;
  stmt.free();
  saveDatabase();
  return { lastInsertRowid: lastId as number, changes: changes as number };
}

export function transaction(fn: () => void) {
  db.run('BEGIN TRANSACTION');
  try {
    fn();
    db.run('COMMIT');
    saveDatabase();
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}
