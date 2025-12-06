/**
 * useAuth Hook
 *
 * Custom React hook for accessing authentication state and user data.
 */

import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../contexts/AuthContext';

/**
 * Hook to access authentication context
 *
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context value
 *
 * @example
 * ```tsx
 * const { user, userDocument, loading } = useAuth();
 *
 * if (loading) return <div>Loading...</div>;
 * if (!user) return <div>Please sign in</div>;
 *
 * return <div>Welcome, {userDocument?.displayName}!</div>;
 * ```
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Hook to check if user has a specific role
 *
 * @example
 * ```tsx
 * const isTeacher = useRole('teacher');
 * const isStudent = useRole('student');
 * ```
 */
export const useRole = (role: 'student' | 'teacher' | 'admin'): boolean => {
  const { userDocument } = useAuth();
  return userDocument?.role === role;
};

/**
 * Hook to get current user's ID
 *
 * @returns User ID or null if not authenticated
 */
export const useUserId = (): string | null => {
  const { user } = useAuth();
  return user?.uid || null;
};

/**
 * Hook to check if user is authenticated
 *
 * @returns True if user is authenticated, false otherwise
 */
export const useIsAuthenticated = (): boolean => {
  const { user } = useAuth();
  return user !== null;
};
