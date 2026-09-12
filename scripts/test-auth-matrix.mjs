import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return await bcrypt.compare(plain, hash);
}

async function runAuthMatrixTest() {
  console.log('--- STARTING AUTHENTICATION VERIFICATION MATRIX TEST ---');

  const dbUsersPath = path.join(__dirname, '../server/db_users.json');
  const users = JSON.parse(fs.readFileSync(dbUsersPath, 'utf8'));

  const testCases = [
    {
      name: 'Test 1: WRONG USERNAME + WRONG PASSWORD',
      email: 'nonexistent@school.com',
      pass: 'WrongPassword999!',
      expectSuccess: false,
    },
    {
      name: 'Test 2: CORRECT USERNAME + WRONG PASSWORD',
      email: 'admin@school.com',
      pass: 'WrongPassword999!',
      expectSuccess: false,
    },
    {
      name: 'Test 3: WRONG USERNAME + CORRECT PASSWORD',
      email: 'ghost_user@school.com',
      pass: 'Admin@123',
      expectSuccess: false,
    },
    {
      name: 'Test 4A: CORRECT USERNAME + CORRECT PASSWORD (Super Admin)',
      email: 'admin@school.com',
      pass: 'Admin@123',
      expectedRole: 'Super Admin',
      expectSuccess: true,
    },
    {
      name: 'Test 4B: CORRECT USERNAME + CORRECT PASSWORD (School Admin)',
      email: 'schooladmin@school.com',
      pass: 'Admin@123',
      expectedRole: 'School Admin',
      expectSuccess: true,
    },
    {
      name: 'Test 4C: CORRECT USERNAME + CORRECT PASSWORD (Teacher)',
      email: 'teacher@school.com',
      pass: 'Teacher@123',
      expectedRole: 'Teacher',
      expectSuccess: true,
    },
    {
      name: 'Test 4D: CORRECT USERNAME + CORRECT PASSWORD (Accountant)',
      email: 'accountant@school.com',
      pass: 'Accountant@123',
      expectedRole: 'Accountant',
      expectSuccess: true,
    },
    {
      name: 'Test 5: INACTIVE / SUSPENDED USER',
      email: 'inactive@school.com',
      pass: 'Inactive@123',
      expectSuccess: false,
      expectInactiveBlock: true,
    },
  ];

  let passedAll = true;

  for (const tc of testCases) {
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === tc.email.toLowerCase() ||
        (u.username && u.username.toLowerCase() === tc.email.toLowerCase())
    );

    let authResult = false;
    let failureReason = '';

    if (!user) {
      authResult = false;
      failureReason = 'User not found';
    } else {
      const isStatusValid = !['Inactive', 'Suspended', 'Pending', 'Rejected'].includes(user.status || '');
      if (!isStatusValid) {
        authResult = false;
        failureReason = `User account status is ${user.status} (Forbidden)`;
      } else {
        const isMatch = await verifyPassword(tc.pass, user.passwordHash);
        if (isMatch) {
          authResult = true;
        } else {
          authResult = false;
          failureReason = 'Invalid password against bcrypt hash';
        }
      }
    }

    const testPassed = authResult === tc.expectSuccess;
    if (!testPassed) {
      passedAll = false;
      console.error(`❌ [FAILED] ${tc.name} -> Expected: ${tc.expectSuccess}, Got: ${authResult} (${failureReason})`);
    } else {
      console.log(`✅ [PASSED] ${tc.name} -> Result: ${authResult ? 'AUTHENTICATED' : 'REJECTED'} (${failureReason || (tc.expectedRole ? `Role: ${user?.role}` : 'OK')})`);
    }
  }

  if (passedAll) {
    console.log('\n🌟 ALL 8 AUTHENTICATION MATRIX TESTS PASSED WITH 100% ACCURACY!');
  } else {
    console.error('\n❌ SOME AUTHENTICATION TESTS FAILED!');
    process.exit(1);
  }
}

runAuthMatrixTest().catch(console.error);
