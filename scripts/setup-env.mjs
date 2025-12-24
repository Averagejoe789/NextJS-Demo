// Script to properly create .env.local from service account JSON
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, '..', '..', 'Downloads', 'menu-ai-7888e-firebase-adminsdk-fbsvc-9bac8de0d1.json');
const envPath = join(__dirname, '..', '.env.local');

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  const compactJson = JSON.stringify(serviceAccount);
  
  // Write to .env.local with proper escaping
  const envContent = `FIREBASE_SERVICE_ACCOUNT='${compactJson.replace(/'/g, "'\\''")}'\n`;
  writeFileSync(envPath, envContent);
  
  console.log('✅ Created .env.local file');
  console.log('   Project ID:', serviceAccount.project_id);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

