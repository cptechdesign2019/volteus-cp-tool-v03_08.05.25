#!/usr/bin/env node

/**
 * Fix Turbopack Issues Script
 * 
 * This script ensures webpack is used instead of Turbopack for compatibility.
 * Run this script if you encounter Turbopack-related errors.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Turbopack configuration...\n');

// 1. Check and fix package.json scripts
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;

    // Check all scripts for --turbopack flags
    Object.keys(packageJson.scripts || {}).forEach(scriptName => {
        const script = packageJson.scripts[scriptName];
        if (script.includes('--turbopack')) {
            console.log(`❌ Found --turbopack in "${scriptName}" script`);
            packageJson.scripts[scriptName] = script.replace(/--turbopack/g, '').replace(/\s+/g, ' ').trim();
            console.log(`✅ Removed --turbopack from "${scriptName}" script`);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('✅ Updated package.json\n');
    } else {
        console.log('✅ package.json scripts are clean (no --turbopack flags)\n');
    }
} else {
    console.log('❌ package.json not found\n');
}

// 2. Check and ensure TURBOPACK=0 in .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    if (!envContent.includes('TURBOPACK=0')) {
        fs.appendFileSync(envLocalPath, '\n# Build Tool\nTURBOPACK=0\n');
        console.log('✅ Added TURBOPACK=0 to .env.local');
    } else {
        console.log('✅ TURBOPACK=0 already in .env.local');
    }
} else {
    fs.writeFileSync(envLocalPath, '# Build Tool\nTURBOPACK=0\n');
    console.log('✅ Created .env.local with TURBOPACK=0');
}

console.log('\n🎉 Turbopack configuration fixed!');
console.log('💡 Next.js will now use webpack (default) instead of Turbopack');
console.log('🚀 Run: npm run dev');