/**
 * Hook to fetch review items grouped by error type
 * Returns counts of unmastered items and new items this week
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ReviewItemDocument, ReviewItemErrorType } from '../types/firestore';

interface MistakeTypeData {
  type: ReviewItemErrorType;
  count: number;
  newThisWeek: number;
}

interface UseMistakesByTypeResult {
  mistakes: MistakeTypeData[];
  loading: boolean;
  error: string | null;
}

const ERROR_TYPES: ReviewItemErrorType[] = ['Pronunciation', 'Grammar', 'Vocabulary', 'Cultural'];

export function useMistakesByType(userId: string | undefined): UseMistakesByTypeResult {
  const [mistakes, setMistakes] = useState<MistakeTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setMistakes([]);
      setLoading(false);
      return;
    }

    // Get timestamp for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    // Query all unmastered review items
    const reviewItemsRef = collection(db!, 'users', userId, 'reviewItems');
    const unmasteredQuery = query(
      reviewItemsRef,
      where('mastered', '==', false)
    );

    const unsubscribe = onSnapshot(
      unmasteredQuery,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ReviewItemDocument[];

        // Group by error type
        const grouped = ERROR_TYPES.map(type => {
          const typeItems = items.filter(item => item.errorType === type);
          const newItems = typeItems.filter(
            item => item.createdAt && item.createdAt.toMillis() > sevenDaysAgoTimestamp.toMillis()
          );

          return {
            type,
            count: typeItems.length,
            newThisWeek: newItems.length,
          };
        });

        setMistakes(grouped);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching review items:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { mistakes, loading, error };
}

/**
 * Hook to fetch all review items of a specific type
 */
export function useMistakesOfType(
  userId: string | undefined,
  errorType: ReviewItemErrorType,
  filter: 'all' | 'unmastered' | 'mastered' = 'unmastered'
) {
  const [items, setItems] = useState<ReviewItemDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setItems([]);
      setLoading(false);
      return;
    }

    const reviewItemsRef = collection(db!, 'users', userId, 'reviewItems');

    // Build query based on filter
    let q;
    if (filter === 'all') {
      q = query(reviewItemsRef, where('errorType', '==', errorType));
    } else {
      q = query(
        reviewItemsRef,
        where('errorType', '==', errorType),
        where('mastered', '==', filter === 'mastered')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ReviewItemDocument[];

        // Sort by creation date, newest first
        fetchedItems.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });

        setItems(fetchedItems);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching review items:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, errorType, filter]);

  return { items, loading, error };
}
