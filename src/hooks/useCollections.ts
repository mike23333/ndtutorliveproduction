import { useState, useEffect, useCallback } from 'react';
import {
  getCollectionsForTeacher,
  createCollection,
  updateCollection,
  deleteCollection,
  reorderCollections,
  getNextCollectionOrder,
} from '../services/firebase/collections';
import { getLessonsForCollection } from '../services/firebase/missions';
import { useAuth } from './useAuth';
import type { CollectionDocument, CreateCollectionInput, UpdateCollectionInput } from '../types/firestore';

/**
 * Collection with lesson count for display
 */
export interface CollectionWithCount extends CollectionDocument {
  lessonCount: number;
}

interface UseCollectionsResult {
  collections: CollectionWithCount[];
  loading: boolean;
  error: string | null;
  createCollection: (data: Omit<CreateCollectionInput, 'teacherId' | 'order'>) => Promise<CollectionDocument>;
  updateCollection: (data: UpdateCollectionInput) => Promise<void>;
  deleteCollection: (collectionId: string) => Promise<void>;
  reorderCollections: (collectionIds: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCollections(): UseCollectionsResult {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedCollections = await getCollectionsForTeacher(user.uid);

      // Fetch lesson counts for each collection in parallel
      const collectionsWithCounts = await Promise.all(
        fetchedCollections.map(async (col) => {
          try {
            const lessons = await getLessonsForCollection(col.id, col.teacherId);
            return {
              ...col,
              lessonCount: lessons.length,
            };
          } catch {
            // If we can't fetch lessons, default to 0
            return {
              ...col,
              lessonCount: 0,
            };
          }
        })
      );

      setCollections(collectionsWithCounts);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollectionHandler = useCallback(async (
    data: Omit<CreateCollectionInput, 'teacherId' | 'order'>
  ): Promise<CollectionDocument> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    // Get next order value
    const order = await getNextCollectionOrder(user.uid);

    const newCollection = await createCollection({
      ...data,
      teacherId: user.uid,
      order,
    });

    // Add to local state with lesson count of 0
    setCollections(prev => [...prev, { ...newCollection, lessonCount: 0 }]);
    return newCollection;
  }, [user?.uid]);

  const updateCollectionHandler = useCallback(async (
    data: UpdateCollectionInput
  ): Promise<void> => {
    await updateCollection(data);

    // Update local state
    setCollections(prev => prev.map(c =>
      c.id === data.id
        ? { ...c, ...data }
        : c
    ));
  }, []);

  const deleteCollectionHandler = useCallback(async (collectionId: string): Promise<void> => {
    await deleteCollection(collectionId);
    setCollections(prev => prev.filter(c => c.id !== collectionId));
  }, []);

  const reorderCollectionsHandler = useCallback(async (collectionIds: string[]): Promise<void> => {
    if (!user?.uid) return;

    await reorderCollections(user.uid, collectionIds);

    // Update local state with new order
    setCollections(prev => {
      const collectionMap = new Map(prev.map(c => [c.id, c]));
      return collectionIds
        .map((id, index) => {
          const collection = collectionMap.get(id);
          return collection ? { ...collection, order: index } : null;
        })
        .filter((c): c is CollectionWithCount => c !== null);
    });
  }, [user?.uid]);

  return {
    collections,
    loading,
    error,
    createCollection: createCollectionHandler,
    updateCollection: updateCollectionHandler,
    deleteCollection: deleteCollectionHandler,
    reorderCollections: reorderCollectionsHandler,
    refetch: fetchCollections,
  };
}
