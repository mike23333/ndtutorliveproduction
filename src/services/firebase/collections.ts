/**
 * Firebase Collections Service
 *
 * CRUD operations for collection documents in Firestore.
 * Collections group related lessons/scenarios for RolePlay.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  CollectionDocument,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '../../types/firestore';

const COLLECTIONS_COLLECTION = 'collections';

/**
 * Create a new collection
 */
export const createCollection = async (
  collectionData: CreateCollectionInput
): Promise<CollectionDocument> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const collectionRef = doc(collection(db, COLLECTIONS_COLLECTION));

    const newCollection: CollectionDocument = {
      id: collectionRef.id,
      teacherId: collectionData.teacherId,
      title: collectionData.title,
      category: collectionData.category,
      imageUrl: collectionData.imageUrl,
      order: collectionData.order,
      visibility: collectionData.visibility ?? 'visible',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add optional fields if provided
    if (collectionData.description) newCollection.description = collectionData.description;
    if (collectionData.imageStoragePath) newCollection.imageStoragePath = collectionData.imageStoragePath;
    if (collectionData.color) newCollection.color = collectionData.color;

    console.log('[collections] Creating collection:', newCollection.title, 'for teacher:', newCollection.teacherId);
    await setDoc(collectionRef, newCollection);
    console.log('[collections] Collection created successfully:', collectionRef.id);

    return newCollection;
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[collections] Failed to create collection:', errorCode, errorMessage);
    throw new Error(`Firestore error (${errorCode}): ${errorMessage}`);
  }
};

/**
 * Get a single collection by ID
 */
export const getCollection = async (collectionId: string): Promise<CollectionDocument | null> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    const collectionSnap = await getDoc(collectionRef);

    if (collectionSnap.exists()) {
      return collectionSnap.data() as CollectionDocument;
    }

    return null;
  } catch (error) {
    console.error('[collections] Error fetching collection:', error);
    throw error;
  }
};

/**
 * Get all collections for a specific teacher
 */
export const getCollectionsForTeacher = async (
  teacherId: string,
  visibleOnly: boolean = false
): Promise<CollectionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const collectionsRef = collection(db, COLLECTIONS_COLLECTION);

    // Build query - order by 'order' field for consistent display
    let q;
    if (visibleOnly) {
      q = query(
        collectionsRef,
        where('teacherId', '==', teacherId),
        where('visibility', '==', 'visible'),
        orderBy('order', 'asc')
      );
    } else {
      q = query(
        collectionsRef,
        where('teacherId', '==', teacherId),
        orderBy('order', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as CollectionDocument);
  } catch (error) {
    console.error('[collections] Error fetching teacher collections:', error);
    throw error;
  }
};

/**
 * Update an existing collection
 */
export const updateCollection = async (
  collectionData: UpdateCollectionInput
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const { id, ...updates } = collectionData;
    const collectionRef = doc(db, COLLECTIONS_COLLECTION, id);

    // Clean the update object - remove undefined values
    const cleanedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanedUpdates[key] = value;
      }
    }

    console.log('[collections] Updating collection:', id, 'with fields:', Object.keys(cleanedUpdates));

    await updateDoc(collectionRef, {
      ...cleanedUpdates,
      updatedAt: Timestamp.now(),
    });

    console.log('[collections] Collection updated successfully:', id);
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[collections] Error updating collection:', errorCode, errorMessage);
    throw new Error(`Firestore error (${errorCode}): ${errorMessage}`);
  }
};

/**
 * Delete a collection
 * Note: This does not delete lessons within the collection - they become orphaned
 * The caller should handle lesson cleanup if needed
 */
export const deleteCollection = async (collectionId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await deleteDoc(collectionRef);
    console.log('[collections] Collection deleted:', collectionId);
  } catch (error) {
    console.error('[collections] Error deleting collection:', error);
    throw error;
  }
};

/**
 * Reorder collections for a teacher
 * Takes an array of collection IDs in the new order and updates their order field
 */
export const reorderCollections = async (
  teacherId: string,
  collectionIds: string[]
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  // TypeScript narrowing - capture db after null check
  const firestore = db;

  try {
    const batch = writeBatch(firestore);
    const now = Timestamp.now();

    collectionIds.forEach((collectionId, index) => {
      const collectionRef = doc(firestore, COLLECTIONS_COLLECTION, collectionId);
      batch.update(collectionRef, {
        order: index,
        updatedAt: now,
      });
    });

    await batch.commit();
    console.log('[collections] Reordered', collectionIds.length, 'collections for teacher:', teacherId);
  } catch (error) {
    console.error('[collections] Error reordering collections:', error);
    throw error;
  }
};

/**
 * Get the next order value for a new collection
 * Returns the max order + 1, or 0 if no collections exist
 */
export const getNextCollectionOrder = async (teacherId: string): Promise<number> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const collections = await getCollectionsForTeacher(teacherId);
    if (collections.length === 0) return 0;

    const maxOrder = Math.max(...collections.map(c => c.order));
    return maxOrder + 1;
  } catch (error) {
    console.error('[collections] Error getting next order:', error);
    return 0;
  }
};

/**
 * Toggle collection visibility
 */
export const toggleCollectionVisibility = async (
  collectionId: string,
  visibility: 'visible' | 'hidden'
): Promise<void> => {
  await updateCollection({
    id: collectionId,
    visibility,
  });
};
