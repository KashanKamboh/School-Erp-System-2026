import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const toolsDir = path.join(rootDir, 'tools');
const gitDir = path.join(toolsDir, 'git');

async function downloadAndExtractMinGit() {
  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
  }

  const gitExe = path.join(gitDir, 'cmd', 'git.exe');
  if (fs.existsSync(gitExe)) {
    console.log('✅ MinGit already installed at:', gitExe);
    return gitExe;
  }

  const zipUrl = 'https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip';
  const zipPath = path.join(toolsDir, 'mingit.zip');

  console.log('📥 Downloading MinGit portable (no admin required)...');
  const res = await fetch(zipUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));
  console.log('📦 MinGit downloaded. Extracting...');

  if (!fs.existsSync(gitDir)) {
    fs.mkdirSync(gitDir, { recursive: true });
  }

  // Extract using PowerShell Expand-Archive
  execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${gitDir}' -Force"`, {
    stdio: 'inherit',
  });

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log('✅ MinGit extracted successfully to:', gitExe);
  return gitExe;
}

downloadAndExtractMinGit()
  .then((exe) => {
    console.log('Testing git version:');
    execSync(`"${exe}" --version`, { stdio: 'inherit' });
  })
  .catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
