import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting EduPulse School ERP Windows Desktop Installer Build...');

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

// 2. Run electron-builder with signing auto-discovery explicitly disabled
console.log('📦 Executing electron-builder for Windows NSIS x64...');
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
  console.error('❌ Build failed:', error);
  process.exit(1);
}
