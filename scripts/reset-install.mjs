import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.join(process.cwd(), 'server', 'edupulse.sqlite');
const dbUsersPath = path.join(process.cwd(), 'server', 'db_users.json');

const db = new Database(dbPath);
const tx = db.transaction(() => {
  const tables = [
    'attendance_records', 'fee_payments', 'fee_voucher_items', 'fee_vouchers',
    'fee_structures', 'fee_categories', 'students', 'classes', 'exam_results',
    'exam_schedules', 'exams', 'timetable_slots', 'homework_submissions', 'homework'
  ];
  for (const t of tables) {
    try {
      db.prepare(`DELETE FROM ${t}`).run();
    } catch (e) {
      console.warn(`Could not clear table ${t}:`, e.message);
    }
  }
  try {
    db.prepare("DELETE FROM system_settings WHERE key != 'initialized'").run();
    db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('system_setup_completed', 'false', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(new Date().toISOString());
  } catch (e) {
    console.warn('System settings reset warning:', e.message);
  }
});
tx();

fs.writeFileSync(dbUsersPath, '[]', 'utf8');

console.log('✅ ERP system reset successfully. Fresh installation wizard is ready.');
