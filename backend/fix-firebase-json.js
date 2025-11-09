// backend/fix-firebase-json.js
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'firebase-service-account.json');
const outputFile = path.join(__dirname, 'firebase-service-account-fixed.json');

console.log('🔧 Reading and fixing Firebase JSON...\n');

try {
  // Read the file
  const rawData = fs.readFileSync(inputFile, 'utf8');
  const data = JSON.parse(rawData);

  // Check if private_key exists
  if (!data.private_key) {
    console.error('❌ No private_key found in JSON file!');
    console.error('Please download a new service account key from Firebase Console.');
    process.exit(1);
  }

  // Fix the private key formatting
  let privateKey = data.private_key;
  
  // Remove any existing newlines and replace with \n
  privateKey = privateKey
    .replace(/\\n/g, '\n')  // Convert \n to actual newlines
    .split('\n')             // Split into lines
    .filter(line => line.trim())  // Remove empty lines
    .join('\n');             // Join back with newlines
  
  // Ensure it starts and ends correctly
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ Invalid private key format - missing BEGIN marker');
    process.exit(1);
  }
  
  if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
    console.error('❌ Invalid private key format - missing END marker');
    process.exit(1);
  }

  // Create fixed data
  const fixedData = {
    ...data,
    private_key: privateKey
  };

  // Write fixed file
  fs.writeFileSync(outputFile, JSON.stringify(fixedData, null, 2));

  console.log('✅ Fixed JSON saved to:', outputFile);
  console.log('\nValidation:');
  console.log('✅ Project ID:', data.project_id);
  console.log('✅ Client Email:', data.client_email);
  console.log('✅ Private Key Length:', privateKey.length, 'characters');
  console.log('✅ Private Key Lines:', privateKey.split('\n').length);
  
  console.log('\n📋 Next steps:');
  console.log('1. Backup your original: firebase-service-account.json');
  console.log('2. Replace it with: firebase-service-account-fixed.json');
  console.log('3. Run: npm start');

} catch (error) {
  console.error('❌ Error:', error.message);
  
  if (error.code === 'ENOENT') {
    console.error('\n📁 File not found. Please ensure firebase-service-account.json exists in the backend folder.');
    console.error('Download it from: https://console.firebase.google.com/project/cgeip-7ba10/settings/serviceaccounts/adminsdk');
  }
}