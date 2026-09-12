import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

async function seedAdmin() {
  const dbUsersPath = path.join(process.cwd(), 'server', 'db_users.json');
  const dbPath = path.join(process.cwd(), 'server', 'edupulse.sqlite');

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const users = [
    {
      id: 'usr-superadmin-kashan',
      name: 'KASHAN TARIQ',
      email: 'kashan@gmail.com',
      passwordHash: passwordHash,
      role: 'Super Admin',
      status: 'Active',
      department: 'Executive Administration',
      phone: '+92 300 1234567',
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdAt: '2026-09-01',
      twoFactorEnabled: false,
      permissions: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
        print: true,
        approve: true,
      },
    },
    {
      id: 'usr-superadmin-default',
      name: 'Super Administrator',
      email: 'admin@school.com',
      passwordHash: passwordHash,
      role: 'Super Admin',
      status: 'Active',
      department: 'Executive Administration',
      phone: '',
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdAt: '2026-09-01',
      twoFactorEnabled: false,
      permissions: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
        print: true,
        approve: true,
      },
    }
  ];

  fs.writeFileSync(dbUsersPath, JSON.stringify(users, null, 2), 'utf8');

  const db = new Database(dbPath);
  const now = new Date().toISOString();
  
  const schoolConfig = {
    schoolName: 'EduPulse Model High School & College',
    name: 'EduPulse Model High School & College',
    schoolCode: 'EDP-2026',
    affiliationNumber: 'BISE-7890',
    email: 'kashan@gmail.com',
    phone: '+92 300 1234567',
    address: 'Campus 1, Academic Avenue',
    city: 'Lahore',
    state: 'Punjab',
    country: 'Pakistan',
    website: 'https://edupulse.school',
    currentSession: '2026-2027',
    principalName: 'Kashan Tariq',
    currency: 'PKR',
    currencySymbol: 'Rs.',
  };

  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('system_setup_completed', 'true', ?)
    ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = ?
  `).run(now, now);

  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('school_config', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(JSON.stringify(schoolConfig), now);

  console.log('✅ kashan@gmail.com initialized as Super Admin with password Admin@123 (and admin123).');
}

seedAdmin();
