import fs from 'node:fs';
import path from 'node:path';

function files(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

for (const file of files('Screens').filter((name) => /connected\.tsx$|ticket-scanner\.tsx$/.test(name))) {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, index) => {
    if (/[^\x00-\x7F]/.test(line)) console.log(`${file}:${index + 1}:${line.trim()}`);
  });
}
