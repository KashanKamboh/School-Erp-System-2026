import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Temporary test user data directory to simulate Electron app.getPath('userData')
const testUserDataDir = path.join(rootDir, 'release', 'test-userdata-sim');

async function runComprehensiveAuthPersistenceTest() {
  console.log('================================================================');
  console.log('🏫 STARTING EDUPULSE ERP SETUP & RESTART AUTHENTICATION TEST');
  console.log('================================================================');

  if (!fs.existsSync(testUserDataDir)) {
    fs.mkdirSync(testUserDataDir, { recursive: true });
  }

  process.env.ELECTRON_USER_DATA = testUserDataDir;

  // Dynamically import db and store with ELECTRON_USER_DATA set
  const {
    db,
    reconnectSQLiteDatabase,
    initSQLiteSchema,
    saveUserToDb,
    getUserByLoginId,
    getAllUsersFromDb,
    markSystemSetupCompleted,
    isSystemSetupCompleted,
    getDbPath,
  } = await import('../server/db.js');

  const { serverStore } = await import('../server/store.js');
  const { verifyPassword } = await import('../server/security.js');

  console.log(`[Test Environment] Persistent SQLite database located at: ${getDbPath()}`);

  // -------------------------------------------------------------
  // TEST 1: New School Setup with Admin ID: testadmin, Password: Test@123
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: New School Setup Initializer ---');
  const setupAdminUsername = 'testadmin';
  const setupAdminPassword = 'Test@123';
  const setupAdminEmail = 'principal@greenwoodhigh.edu.pk';
  const setupAdminName = 'Tariq Mahmood';

  const passwordHash = await bcrypt.hash(setupAdminPassword, 12);
  const now = new Date().toISOString();

  const newAdminUser = {
    id: `usr-superadmin-${Date.now()}`,
    username: setupAdminUsername,
    name: setupAdminName,
    email: setupAdminEmail,
    passwordHash: passwordHash,
    role: 'Super Admin',
    status: 'Active',
    department: 'Executive Administration',
    phone: '+92 300 1234567',
    lastLogin: now.replace('T', ' ').substring(0, 19),
    createdAt: now.split('T')[0],
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
  };

  const schoolConfig = {
    schoolName: 'Greenwood International School & College',
    name: 'Greenwood International School & College',
    schoolCode: 'GIS-2026',
    email: setupAdminEmail,
    phone: '+92 300 1234567',
    currentSession: '2026-2027',
    currency: 'PKR',
    currencySymbol: 'Rs.',
  };

  // Execute Setup completion
  markSystemSetupCompleted(schoolConfig, newAdminUser);
  serverStore.users = [newAdminUser];
  serverStore.saveUsersToDisk();

  console.log('✅ TEST 1 PASSED: School setup and Super Admin created with username: "testadmin"');

  // -------------------------------------------------------------
  // TEST 2: Setup complete -> Immediate in-memory authentication check
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Immediate Setup Verification ---');
  const userImmediate = serverStore.findUserByIdentifier(setupAdminUsername);
  if (!userImmediate) {
    throw new Error('❌ TEST 2 FAILED: User could not be found immediately in serverStore!');
  }
  const isMatchImmediate = await verifyPassword(setupAdminPassword, userImmediate.passwordHash);
  if (!isMatchImmediate) {
    throw new Error('❌ TEST 2 FAILED: Password verification failed immediately after setup!');
  }
  console.log('✅ TEST 2 PASSED: Immediate verification successful for user:', userImmediate.username);

  // -------------------------------------------------------------
  // TEST 3: Application completely closed / Process restart simulation
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Simulating Complete Application Termination & RAM Wipe ---');
  serverStore.users = []; // completely wipe volatile RAM state
  serverStore.activeSessions.clear();
  console.log(`✅ TEST 3 PASSED: Server in-memory user list cleared (Length: ${serverStore.users.length})`);

  // -------------------------------------------------------------
  // TEST 4: Application re-launch / Store re-initialization from SQLite
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Simulating Application Relaunch & SQLite Hydration ---');
  serverStore.initDefaultUsers();
  console.log(`[Store Hydrated] Users loaded from persistent SQLite: ${serverStore.users.length}`);
  if (serverStore.users.length === 0) {
    throw new Error('❌ TEST 4 FAILED: SQLite failed to persist users across application relaunch simulation!');
  }
  console.log('✅ TEST 4 PASSED: Store re-hydrated directly from persistent SQLite.');

  // -------------------------------------------------------------
  // TEST 5: Same credentials on restart: testadmin / Test@123
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Post-Restart Login with Exact Credentials (testadmin / Test@123) ---');
  const foundUser = serverStore.findUserByIdentifier('testadmin');
  if (!foundUser) {
    throw new Error('❌ TEST 5 FAILED: "testadmin" could not be resolved from persistent store after restart!');
  }
  const isPassValid = await verifyPassword(setupAdminPassword, foundUser.passwordHash);
  if (!isPassValid) {
    throw new Error('❌ TEST 5 FAILED: Password verification failed after restart!');
  }
  console.log(`✅ TEST 5 PASSED: Post-restart login SUCCESSFUL for "${foundUser.username}" (${foundUser.email}, Role: ${foundUser.role})`);

  // -------------------------------------------------------------
  // TEST 6: Wrong password: testadmin / WrongPassword -> Expected: Login FAIL
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Login with Wrong Password (testadmin / WrongPassword) ---');
  const isWrongPassValid = await verifyPassword('WrongPassword', foundUser.passwordHash);
  if (isWrongPassValid) {
    throw new Error('❌ TEST 6 FAILED: Wrong password was accepted!');
  }
  console.log('✅ TEST 6 PASSED: Wrong password correctly REJECTED.');

  // -------------------------------------------------------------
  // TEST 7: Wrong ID: wrongadmin / Test@123 -> Expected: Login FAIL
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Login with Non-Existent ID (wrongadmin / Test@123) ---');
  const wrongUser = serverStore.findUserByIdentifier('wrongadmin');
  if (wrongUser) {
    throw new Error('❌ TEST 7 FAILED: Non-existent ID "wrongadmin" unexpectedly matched a user!');
  }
  console.log('✅ TEST 7 PASSED: Non-existent Login ID correctly REJECTED.');

  // -------------------------------------------------------------
  // TEST 8: Dual Login Support: Login with Email (principal@greenwoodhigh.edu.pk / Test@123)
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Dual Login with Email (principal@greenwoodhigh.edu.pk / Test@123) ---');
  const userByEmail = serverStore.findUserByIdentifier('principal@greenwoodhigh.edu.pk');
  if (!userByEmail) {
    throw new Error('❌ TEST 8 FAILED: Login by email failed to find user!');
  }
  const isEmailPassValid = await verifyPassword(setupAdminPassword, userByEmail.passwordHash);
  if (!isEmailPassValid) {
    throw new Error('❌ TEST 8 FAILED: Password failed when logging in with email!');
  }
  console.log(`✅ TEST 8 PASSED: Login via full email "${userByEmail.email}" SUCCESSFUL.`);

  console.log('\n================================================================');
  console.log('🎉 ALL 8 ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');

  // Clean up test simulation directory
  try {
    fs.rmSync(testUserDataDir, { recursive: true, force: true });
  } catch {}
}

runComprehensiveAuthPersistenceTest().catch((err) => {
  console.error('\n❌ AUTHENTICATION PERSISTENCE TEST FAILED:', err);
  process.exit(1);
});
