import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const gitExe = path.join(rootDir, 'tools', 'git', 'cmd', 'git.exe');

function run(cmd) {
  console.log(`> ${cmd}`);
  const out = execSync(`"${gitExe}" ${cmd}`, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (out && out.trim()) console.log(out.trim());
  return out;
}

try {
  console.log('🚀 Initializing Git repository and preparing commit...');
  run('init');
  run('config user.name "Kashan Kamboh"');
  run('config user.email "kashan@gmail.com"');
  run('add -A');
  
  try {
    run('commit -m "feat: complete School ERP with secure authentication, desktop navigation controls and SQLite database"');
  } catch (commitErr) {
    console.log('Commit note:', commitErr.stdout || commitErr.message);
  }

  run('branch -M main');

  // Check remote
  try {
    run('remote remove origin');
  } catch {}

  const repoUrl = 'https://github.com/KashanKamboh/School-Erp-System-2026.git';
  run(`remote add origin ${repoUrl}`);

  console.log(`📤 Pushing to ${repoUrl} (main branch)...`);
  const pushOut = execSync(`"${gitExe}" push -u origin main --force`, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  console.log(pushOut);
  console.log('🎉 Code pushed to GitHub repository successfully!');
} catch (error) {
  console.error('❌ Push error:', error.stderr || error.stdout || error.message);
  process.exit(1);
}
