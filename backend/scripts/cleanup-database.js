// Script to clean up Firebase database and authentication
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase with service account key
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
} catch (error) {
  console.error('Error loading service account key:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function deleteAllUsers() {
  console.log('🔍 Fetching all users from Firebase Auth...');
  try {
    const listUsersResult = await auth.listUsers(1000);
    
    if (listUsersResult.users.length === 0) {
      console.log('✅ No users to delete');
      return;
    }

    console.log(`Found ${listUsersResult.users.length} users. Deleting...`);
    
    for (const user of listUsersResult.users) {
      try {
        await auth.deleteUser(user.uid);
        console.log(`✅ Deleted user: ${user.email || user.uid}`);
      } catch (error) {
        console.error(`❌ Failed to delete user ${user.uid}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

async function deleteCollection(collectionName) {
  console.log(`🗑️  Deleting collection: ${collectionName}`);
  try {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`✅ Collection ${collectionName} is empty`);
      return;
    }

    console.log(`Found ${snapshot.docs.length} documents in ${collectionName}`);
    
    for (const doc of snapshot.docs) {
      try {
        await db.collection(collectionName).doc(doc.id).delete();
        console.log(`  ✅ Deleted document: ${doc.id}`);
      } catch (error) {
        console.error(`  ❌ Failed to delete document ${doc.id}:`, error.message);
      }
    }
    
    console.log(`✅ Deleted all documents from ${collectionName}`);
  } catch (error) {
    console.error(`Error deleting collection ${collectionName}:`, error);
  }
}

async function cleanup() {
  console.log('🚀 Starting database cleanup...\n');

  // Delete collections
  const collections = ['students', 'companies', 'institutions', 'users'];
  
  for (const collection of collections) {
    await deleteCollection(collection);
  }

  console.log('\n🔐 Now deleting Firebase Auth users...');
  await deleteAllUsers();

  console.log('\n✅ Cleanup complete!');
  console.log('You can now register new users.\n');

  process.exit(0);
}

// Run cleanup
cleanup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
