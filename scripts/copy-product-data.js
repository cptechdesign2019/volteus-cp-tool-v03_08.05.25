#!/usr/bin/env node

/**
 * Script to copy Todd's complete product CSV to our project
 * This will copy the full master price sheet with 588 products
 */

const fs = require('fs');
const path = require('path');

const sourceFile = '../av-management-tool-v1-tc_08.04.2025/CSV Docs/2025 Master Price Sheet - 7.15.2025.xlsx - Sheet1.csv';
const targetFile = 'data/master-price-sheet-2025.csv';

console.log('📦 Copying Todd\'s Master Price Sheet...');

try {
  // Ensure data directory exists
  const dataDir = path.dirname(targetFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Created directory: ${dataDir}`);
  }

  // Copy the file
  fs.copyFileSync(sourceFile, targetFile);
  
  // Get file stats
  const stats = fs.statSync(targetFile);
  const content = fs.readFileSync(targetFile, 'utf8');
  const lineCount = content.split('\n').length - 1; // Subtract 1 for header
  
  console.log(`✅ Successfully copied product data!`);
  console.log(`📊 File size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`📦 Products: ${lineCount} items`);
  console.log(`📍 Location: ${targetFile}`);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Go to /product-library page');
  console.log('2. Click "Import CSV" button');
  console.log('3. Upload the master-price-sheet-2025.csv file');
  console.log('4. Test the import functionality!');

} catch (error) {
  console.error('❌ Error copying file:', error.message);
  process.exit(1);
}