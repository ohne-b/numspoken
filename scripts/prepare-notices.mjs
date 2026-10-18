import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'public/licenses');
await mkdir(output, { recursive: true });
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const index = [
  '# Distributed third-party licenses',
  '',
  'Project: PolyForm Noncommercial 1.0.0. See project-license.md and project-notice.md.',
  '',
];
for (const [location, metadata] of Object.entries(lock.packages)) {
  if (!location || metadata.dev || metadata.link) continue;
  const packageRoot = path.join(root, location);
  const info = JSON.parse(
    await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
  );
  const files = (await readdir(packageRoot)).filter((name) =>
    /^(licen[cs]e|copying|notice|ofl)(\.|$)/i.test(name),
  );
  if (!files.length) throw new Error(`Missing license file for ${info.name}`);
  const folder = info.name.replaceAll('/', '__').replaceAll('@', '');
  await mkdir(path.join(output, folder), { recursive: true });
  index.push(
    `## ${info.name} ${info.version}`,
    '',
    `License: ${info.license ?? metadata.license ?? 'see license file'}`,
    '',
  );
  for (const file of files) {
    await cp(path.join(packageRoot, file), path.join(output, folder, file));
    index.push(`- [${file}](${folder}/${file})`);
  }
  index.push('');
}
await cp('license.md', path.join(output, 'project-license.md'));
await cp('notice.md', path.join(output, 'project-notice.md'));
await writeFile(path.join(output, 'index.md'), index.join('\n'));
