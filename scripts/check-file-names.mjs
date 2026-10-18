import { execFileSync } from 'node:child_process';

const exceptions = new Set([
  'AGENTS.md',
  'ISSUE_TEMPLATE',
  'pull_request_template.md',
]);
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
const invalid = files.filter((file) =>
  file
    .split('/')
    .some(
      (part) =>
        !exceptions.has(part) && !/^\.?[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(part),
    ),
);
if (invalid.length) {
  console.error('Use kebab-case filenames:\n' + invalid.join('\n'));
  process.exitCode = 1;
}
