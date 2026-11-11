#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const nodeModulesPath = path.join(projectRoot, 'node_modules');

async function verifyDependencies() {
  console.log('🔍 Verifying dependencies...\n');

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const missingDeps = [];
    const installedDeps = [];

    for (const [dep] of Object.entries(allDeps)) {
      const depPath = path.join(nodeModulesPath, dep);
      try {
        await fs.access(depPath);
        installedDeps.push(dep);
      } catch {
        missingDeps.push(dep);
      }
    }

    console.log(`✅ Installed: ${installedDeps.length} dependencies`);
    console.log(`❌ Missing: ${missingDeps.length} dependencies\n`);

    if (missingDeps.length > 0) {
      console.log('📦 Missing dependencies:');
      missingDeps.forEach((dep) => console.log(`   - ${dep}`));
      console.log(
        '\n⚠️  Run "pnpm install" to install missing dependencies.\n'
      );
      process.exit(1);
    } else {
      console.log('✨ All dependencies are installed successfully!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error verifying dependencies:', error.message);
    process.exit(1);
  }
}

verifyDependencies();
