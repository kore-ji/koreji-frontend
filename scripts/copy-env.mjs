import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const examplePath = resolve(process.cwd(), '.env.example');
const envPath = resolve(process.cwd(), '.env');

if (!existsSync(examplePath)) {
  console.error('Missing .env.example template. Nothing to copy.');
  process.exit(1);
}

if (existsSync(envPath)) {
  console.log('.env already exists; skipping copy.');
  process.exit(0);
}

copyFileSync(examplePath, envPath);
console.log('Created .env from .env.example');
