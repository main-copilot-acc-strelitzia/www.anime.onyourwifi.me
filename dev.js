#!/usr/bin/env node

/**
 * Cross-platform development server starter
 * Starts API, Web, and Transcoder services
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const projectRoot = __dirname;
const isWindows = process.platform === 'win32';
const shell = isWindows ? 'cmd.exe' : '/bin/bash';

console.log('🚀 Starting Strelitzia Services\n');

const services = [
  {
    name: 'API',
    cwd: path.join(projectRoot, 'api'),
    cmd: isWindows ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    port: 3001,
  },
  {
    name: 'Web',
    cwd: path.join(projectRoot, 'web'),
    cmd: isWindows ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    port: 3000,
  },
  {
    name: 'Transcoder',
    cwd: path.join(projectRoot, 'transcoder'),
    cmd: isWindows ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    port: null,
  },
];

const processes = [];
let startCount = 0;

services.forEach((service, index) => {
  console.log(`📦 Starting ${service.name}...`);

  const proc = spawn(service.cmd, service.args, {
    cwd: service.cwd,
    stdio: 'inherit',
    shell: true,
  });

  proc.on('error', (err) => {
    console.error(`❌ ${service.name} error:`, err.message);
  });

  proc.on('exit', (code) => {
    console.error(`⚠️  ${service.name} exited with code ${code}`);
  });

  processes.push(proc);
  startCount++;

  // Add delay between service starts
  if (index < services.length - 1) {
    setTimeout(() => {}, 2000);
  }
});

// Print service URLs after a delay
setTimeout(() => {
  console.log('\n✅ Services started!\n');
  console.log('📍 Service URLs:');
  console.log('   Web:        http://localhost:3000');
  console.log('   API:        http://localhost:3001');
  console.log('   Transcoder: Running in background\n');
  console.log('Press Ctrl+C to stop all services\n');
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down services...\n');
  processes.forEach((proc) => {
    if (!proc.killed) {
      proc.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 2000);
});
