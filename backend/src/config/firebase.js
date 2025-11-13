// backend/src/config/firebase.js
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

if (!admin.apps.length) {
  try {
    // Use serviceAccountKey.json for authentication
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase initialized using serviceAccountKey.json');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
