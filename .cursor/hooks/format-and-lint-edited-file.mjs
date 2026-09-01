import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_PATH_SEGMENTS = ['/docs/', '/guide/', '/.cursor/', '/openspec/'];

const PACKAGES = [
  {
    dir: 'client',
    prettierExts: new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json']),
  },
  {
    dir: 'server',
    prettierExts: new Set(['.ts']),
  },
  {
    dir: 'dope-lyrics/client',
    prettierExts: new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json']),
  },
  {
    dir: 'dope-lyrics/server',
    prettierExts: new Set(['.ts']),
  },
];

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

function resolveProjectRoot(input) {
  const roots = input?.workspace_roots;
  if (Array.isArray(roots) && typeof roots[0] === 'string' && roots[0]) {
    return roots[0];
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
}

function resolveFilePath(input, projectRoot) {
  const raw = input?.file_path;
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  if (path.isAbsolute(raw)) {
    return path.normalize(raw);
  }
  return path.normalize(path.resolve(projectRoot, raw));
}

function findPackage(relativePosix) {
  const matches = PACKAGES.filter((pkg) => {
    const prefix = `${pkg.dir}/`;
    return relativePosix === pkg.dir || relativePosix.startsWith(prefix);
  });
  return matches.sort((a, b) => b.dir.length - a.dir.length)[0] ?? null;
}

function localBin(pkgRoot, name) {
  const bin = process.platform === 'win32' ? `${name}.cmd` : name;
  const full = path.join(pkgRoot, 'node_modules', '.bin', bin);
  return existsSync(full) ? full : null;
}

function run(bin, args, cwd) {
  if (!bin) {
    return 0;
  }
  const result = spawnSync(bin, args, {
    cwd,
    stdio: 'pipe',
    windowsHide: true,
    env: process.env,
  });
  if (result.stderr?.length) {
    process.stderr.write(result.stderr);
  }
  return result.status ?? 1;
}

function main() {
  const input = readInput();
  const projectRoot = resolveProjectRoot(input);
  const filePath = resolveFilePath(input, projectRoot);
  if (!filePath || !existsSync(filePath)) {
    process.exit(0);
  }

  const relativePosix = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  if (SKIP_PATH_SEGMENTS.some((segment) => relativePosix.includes(segment))) {
    process.exit(0);
  }
  const pkg = findPackage(relativePosix);
  if (!pkg) {
    process.exit(0);
  }

  const ext = path.extname(filePath);
  const pkgRoot = path.join(projectRoot, pkg.dir);
  if (!existsSync(path.join(pkgRoot, 'node_modules'))) {
    process.exit(0);
  }

  if (pkg.prettierExts.has(ext)) {
    run(localBin(pkgRoot, 'prettier'), ['--write', filePath], pkgRoot);
  }

  if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
    run(localBin(pkgRoot, 'eslint'), ['--fix', filePath], pkgRoot);
  }

  process.exit(0);
}

main();
