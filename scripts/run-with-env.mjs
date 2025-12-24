// Helper script to load .env.local and run another script
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read .env.local file
try {
  const envContent = readFileSync(join(projectRoot, '.env.local'), 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  for (const line of envLines) {
    const match = line.match(/^([^=]+)=['"](.+)['"]$/);
    if (match) {
      const key = match[1];
      const value = match[2];
      process.env[key] = value;
    }
  }
} catch (error) {
  console.error('Error reading .env.local:', error.message);
  process.exit(1);
}

// Get the script to run from command line args
const scriptToRun = process.argv[2];
if (!scriptToRun) {
  console.error('Usage: node scripts/run-with-env.mjs <script-to-run>');
  process.exit(1);
}

// Run the script
const scriptPath = join(projectRoot, scriptToRun);
const child = spawn('node', [scriptPath], {
  stdio: 'inherit',
  env: process.env,
  cwd: projectRoot
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

