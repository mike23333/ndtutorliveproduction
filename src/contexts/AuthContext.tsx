/**
 * Authentication Context Provider
 *
 * Provides authentication state and user data throughout the application.
 * Uses Firestore realtime listeners to keep userDocument in sync.
 */

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChange } from '../services/firebase/auth';
import { db } from '../config/firebase';
import { UserDocument } from '../types/firestore';

/**
 * Authentication context value type
 */
export interface AuthContextValue {
  user: User | null;
  userDocument: UserDocument | null;
  loading: boolean;
  error: string | null;
}

/**
 * Create the authentication context
 */
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  userDocument: null,
  loading: true,
  error: null,
});

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Wraps the application and provides authentication state to all children.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    // Subscribe to authentication state changes
    const unsubscribeAuth = onAuthStateChange((firebaseUser) => {
      setError(null);

      // Clean up previous Firestore listener
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        // User is signed in - set user immediately
        setUser(firebaseUser);
        setLoading(false);

        // Set up realtime listener for user document
        if (db) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          unsubscribeFirestore = onSnapshot(
            userDocRef,
            (docSnapshot) => {
              if (docSnapshot.exists()) {
                const data = docSnapshot.data() as UserDocument;
                setUserDocument(data);
              } else {
                // User exists in Auth but document not yet created
                console.warn('User document not found in Firestore yet');
                setUserDocument(null);
              }
            },
            (err) => {
              console.error('Error listening to user document:', err);
              setError(err.message || 'Error fetching user data');
            }
          );
        }
      } else {
        // User is signed out
        setUser(null);
        setUserDocument(null);
        setLoading(false);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const value: AuthContextValue = {
    user,
    userDocument,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
