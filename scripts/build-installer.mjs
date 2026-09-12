import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting EduPulse School ERP Windows Desktop Installer Build Pipeline...');

// 0. Ensure no running processes hold release lock
try {
  execSync('taskkill /F /IM "EduPulse School ERP.exe" /T', { stdio: 'ignore' });
} catch (e) {}

// 1. Clean release directory
const releaseDir = path.join(rootDir, 'release');
if (fs.existsSync(releaseDir)) {
  console.log('🧹 Cleaning previous release directory...');
  try {
    fs.rmSync(releaseDir, { recursive: true, force: true });
  } catch (err) {
    console.warn('Warning removing release directory:', err.message);
  }
}

// 2. Build Frontend & Server bundles
console.log('📦 1/4 Building Frontend & Backend bundles...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// 3. Build Electron main & preload
console.log('📦 2/4 Compiling Electron main and preload scripts...');
execSync('npm run electron:build:all', { cwd: rootDir, stdio: 'inherit' });

// 4. Rebuild native SQLite binary for Electron runtime (ABI 132)
console.log('🔨 3/4 Compiling native better-sqlite3 binary for Electron runtime (ABI 132)...');
execSync('npm run rebuild:electron', { cwd: rootDir, stdio: 'inherit' });

// 5. Run electron-builder with signing auto-discovery explicitly disabled
console.log('📦 4/4 Packaging Windows NSIS Installer & Unpacked EXE via electron-builder...');
try {
  execSync('npx electron-builder --win --x64 --publish never', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: 'false',
      WIN_CSC_LINK: '',
      CSC_LINK: '',
    },
  });
  console.log('✅ Windows Setup Installer built successfully!');
} catch (error) {
  console.error('❌ electron-builder failed:', error);
  process.exit(1);
}

// 6. Create portable zip package
console.log('📦 Creating portable zip package...');
try {
  execSync('node scripts/pack-zip.js', { cwd: rootDir, stdio: 'inherit' });
  console.log('🎉 Full build pipeline completed successfully!');
} catch (zipErr) {
  console.warn('Zip package notice:', zipErr);
}

