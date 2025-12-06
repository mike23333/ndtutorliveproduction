/**
 * Authentication Context Provider
 *
 * Provides authentication state and user data throughout the application.
 */

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserDocument } from '../services/firebase/auth';
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
    // Subscribe to authentication state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setError(null);

      try {
        if (firebaseUser) {
          // User is signed in - set user immediately to stop loading
          setUser(firebaseUser);
          setLoading(false);

          // Fetch user document from Firestore in background
          getUserDocument(firebaseUser.uid)
            .then((userDoc) => {
              if (userDoc) {
                setUserDocument(userDoc);
              } else {
                // User exists in Auth but not in Firestore yet (may still be writing)
                console.warn('User document not found in Firestore yet');
              }
            })
            .catch((err) => {
              console.error('Error fetching user document:', err);
            });
        } else {
          // User is signed out
          setUser(null);
          setUserDocument(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error in auth state change:', err);
        setError(err.message || 'An error occurred while authenticating');
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    userDocument,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
