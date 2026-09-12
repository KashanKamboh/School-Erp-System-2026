import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const gitExe = path.join(rootDir, 'tools', 'git', 'cmd', 'git.exe');

try {
  console.log('🏷️ Creating and pushing git tag v1.0.1...');
  execSync(`"${gitExe}" tag v1.0.1 -f`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`"${gitExe}" push origin v1.0.1 --force`, { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Tag v1.0.1 pushed to GitHub successfully!');
} catch (err) {
  console.error('Error pushing tag:', err.message);
}
