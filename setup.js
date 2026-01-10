#!/usr/bin/env node

/**
 * Cross-platform setup script for Strelitzia
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = __dirname;

console.log('🚀 Strelitzia Setup Script');
console.log('==========================\n');

// Detect OS
const platform = process.platform;
const isWindows = platform === 'win32';

console.log(`✓ Detected platform: ${platform}`);
console.log(`✓ Node version: ${process.version}`);
console.log(`✓ NPM version: ${getVersion('npm')}\n`);

// Check Node version
const nodeVersion = parseInt(process.version.split('.')[0].slice(1));
if (nodeVersion < 18) {
  console.error('❌ Node 18.17.0 or higher required');
  process.exit(1);
}

// Functions
function getVersion(cmd) {
  try {
    return execSync(`${cmd} --version`, { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function runCommand(cmd, cwd, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(cmd, {
      cwd,
      stdio: 'inherit',
      shell: isWindows ? 'cmd.exe' : '/bin/bash',
    });
    console.log(`✓ ${description} completed`);
  } catch (error) {
    console.error(`✗ ${description} failed`);
    throw error;
  }
}

// Setup steps
try {
  // 1. Install web dependencies
  runCommand('npm install', path.join(projectRoot, 'web'), 'Installing web dependencies');

  // 2. Install API dependencies
  runCommand('npm install', path.join(projectRoot, 'api'), 'Installing API dependencies');

  // 3. Install transcoder dependencies
  runCommand('npm install', path.join(projectRoot, 'transcoder'), 'Installing transcoder dependencies');

  // 4. Generate Prisma client
  runCommand('npm run prisma:generate', path.join(projectRoot, 'api'), 'Generating Prisma client');

  // 5. Create .env files if they don't exist
  const envFiles = [
    { path: path.join(projectRoot, 'api', '.env'), template: createApiEnvTemplate() },
    { path: path.join(projectRoot, 'web', '.env.local'), template: createWebEnvTemplate() },
  ];

  envFiles.forEach(({ path: envPath, template }) => {
    if (!fs.existsSync(envPath)) {
      console.log(`\n📝 Creating ${path.basename(envPath)}...`);
      fs.writeFileSync(envPath, template);
      console.log(`✓ Created ${path.basename(envPath)}`);
    } else {
      console.log(`✓ ${path.basename(envPath)} already exists`);
    }
  });

  console.log('\n✅ Setup completed successfully!\n');
  console.log('Next steps:');
  console.log(`  1. Update .env files with your configuration`);
  console.log(`  2. Run: npm run dev (from project root with workspace setup)`);
  console.log(`     or`);
  console.log(`     - cd web && npm run dev`);
  console.log(`     - cd api && npm run dev (in separate terminal)`);
  console.log(`     - cd transcoder && npm run dev (in separate terminal)\n`);
} catch (error) {
  console.error('\n❌ Setup failed. Please check the error above.');
  process.exit(1);
}

function createApiEnvTemplate() {
  return `# API Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/strelitzia"
DATABASE_URL_UNPOOLED="postgresql://user:password@localhost:5432/strelitzia"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRY="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5368709120

# Security
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100

# Transcoding
TRANSCODER_ENABLED=true
TRANSCODING_OUTPUT_DIR="./transcoded"
`;
}

function createWebEnvTemplate() {
  return `# Web Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_OFFLINE_MODE=true
NEXT_PUBLIC_NO_EXTERNAL_RESOURCES=true
`;
}
