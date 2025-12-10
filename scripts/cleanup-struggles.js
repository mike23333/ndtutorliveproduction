/**
 * Firebase Cleanup Script: Delete Legacy Struggles Collection
 *
 * This script deletes all documents from the old `users/{userId}/struggles`
 * subcollection as part of the migration to the new `reviewItems` collection.
 *
 * Run with: node scripts/cleanup-struggles.js
 *
 * IMPORTANT: This is a destructive operation. Back up data first if needed.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Load service account
const serviceAccountPath = path.join(__dirname, '../python-server/firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found at:', serviceAccountPath);
  console.error('   Please ensure firebase-service-account.json exists in python-server/');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'ndtutorlive',
});

const db = getFirestore();

async function deleteUserStruggles(userId) {
  const strugglesRef = db.collection(`users/${userId}/struggles`);

  try {
    const snapshot = await strugglesRef.get();

    if (snapshot.empty) {
      return { userId, deletedCount: 0 };
    }

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    let deletedCount = 0;

    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, i + batchSize);

      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
    }

    return { userId, deletedCount };
  } catch (error) {
    return {
      userId,
      deletedCount: 0,
      error: error.message || 'Unknown error'
    };
  }
}

async function getAllUserIds() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.select().get(); // Select no fields, just get IDs
  return snapshot.docs.map(doc => doc.id);
}

async function main() {
  console.log('🔥 Firebase Struggles Cleanup Script');
  console.log('=====================================\n');

  // Get all user IDs
  console.log('📋 Fetching all user IDs...');
  const userIds = await getAllUserIds();
  console.log(`   Found ${userIds.length} users\n`);

  if (userIds.length === 0) {
    console.log('✅ No users found. Nothing to clean up.');
    process.exit(0);
  }

  // Process users
  console.log('🗑️  Deleting struggles collections...\n');

  let totalDeleted = 0;
  let usersWithStruggles = 0;
  let errors = 0;

  for (const userId of userIds) {
    const result = await deleteUserStruggles(userId);

    if (result.error) {
      console.log(`   ❌ ${userId}: Error - ${result.error}`);
      errors++;
    } else if (result.deletedCount > 0) {
      console.log(`   ✓ ${userId}: Deleted ${result.deletedCount} struggles`);
      totalDeleted += result.deletedCount;
      usersWithStruggles++;
    }
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 Summary:');
  console.log(`   Users processed: ${userIds.length}`);
  console.log(`   Users with struggles: ${usersWithStruggles}`);
  console.log(`   Total struggles deleted: ${totalDeleted}`);
  if (errors > 0) {
    console.log(`   Errors: ${errors}`);
  }
  console.log('\n✅ Cleanup complete!');
  console.log('   New errors will be saved to users/{userId}/reviewItems');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
