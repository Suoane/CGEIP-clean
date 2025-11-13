// backend/src/config/firebase.js
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

if (!admin.apps.length) {
  try {
    let serviceAccount;

    // Try to use environment variable first (for production/Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Firebase initialized using environment variable');
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable');
        throw parseError;
      }
    } 
    // Fall back to serviceAccountKey.json file (for local development)
    else {
      const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
          'serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT environment variable not set. ' +
          'Please set FIREBASE_SERVICE_ACCOUNT environment variable with your Firebase service account JSON.'
        );
      }
      
      serviceAccount = require(serviceAccountPath);
      console.log('✅ Firebase initialized using serviceAccountKey.json');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
