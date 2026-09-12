import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

const outputDir = path.resolve('release');
const unpackedDir = path.join(outputDir, 'win-unpacked');
const zipPath = path.join(outputDir, 'EduPulse-School-ERP-Windows-x64-Portable.zip');

if (!fs.existsSync(unpackedDir)) {
  console.error('win-unpacked directory does not exist:', unpackedDir);
  process.exit(1);
}

console.log('Packaging', unpackedDir, 'into', zipPath, '...');
const output = fs.createWriteStream(zipPath);
const archive = new ZipArchive({
  zlib: { level: 1 } // level 1 fast compression for fast zip generation
});

output.on('close', function () {
  const bytes = archive.pointer();
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  console.log(`Successfully created ${zipPath} (${mb} MB, ${bytes} bytes)`);
});

archive.on('error', function (err) {
  console.error('Archive error:', err);
  process.exit(1);
});

archive.pipe(output);
archive.directory(unpackedDir, 'EduPulse School ERP');
archive.finalize();
