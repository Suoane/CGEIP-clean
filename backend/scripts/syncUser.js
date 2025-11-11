// backend/scripts/syncUser.js
// Run this script with: node backend/scripts/syncUser.js <email>

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Determine the correct path to .env file
const envPath = path.join(__dirname, '../../.env');

console.log('Looking for .env file at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

// Load .env from project root
require('dotenv').config({ path: envPath });

// Debug: Check if environment variables are loaded
console.log('\n=== Environment Variables Check ===');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✓ Loaded' : '✗ Missing');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Loaded' : '✗ Missing');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✓ Loaded' : '✗ Missing');
console.log('===================================\n');

// Check if all required env vars are present
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ ERROR: Missing required environment variables!');
  console.error('\nPlease ensure your .env file contains:');
  console.error('  FIREBASE_PROJECT_ID=your-project-id');
  console.error('  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
  console.error('  FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com');
  console.error('\nNote: The private key should have \\n characters (not actual line breaks) and be wrapped in quotes.');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✓ Firebase Admin initialized successfully\n');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

async function syncUser(email) {
  try {
    console.log(`Syncing user: ${email}`);

    // Get user from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    console.log(`\n✓ Found user in Firebase Auth:`, {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified
    });

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      console.error('\n❌ User not found in Firestore!');
      console.log('The user exists in Firebase Auth but not in Firestore.');
      console.log('You may need to create the Firestore document first.');
      return;
    }

    const userData = userDoc.data();
    console.log('\n✓ Current Firestore data:', {
      emailVerified: userData.emailVerified
    });

    // Update Firestore with Firebase Auth status
    await db.collection('users').doc(userRecord.uid).update({
      emailVerified: userRecord.emailVerified,
      emailVerifiedAt: userRecord.emailVerified ? new Date() : null,
      updatedAt: new Date()
    });

    console.log('\n✅ User synced successfully!');
    console.log('Updated emailVerified to:', userRecord.emailVerified);

  } catch (error) {
    console.error('\n❌ Error syncing user:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('This email address is not registered in Firebase Auth.');
    }
  } finally {
    process.exit();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node backend/scripts/syncUser.js <email>');
  process.exit(1);
}

syncUser(email);