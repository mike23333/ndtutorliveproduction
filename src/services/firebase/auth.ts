/**
 * Firebase Authentication Service
 *
 * Provides authentication methods for email/password authentication.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { UserDocument, UserRole } from '../../types/firestore';

/**
 * Sign up a new user with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'student'
): Promise<UserCredential> => {
  if (!auth || !db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userDoc: UserDocument = {
      uid: user.uid,
      email: user.email || email,
      displayName,
      role,
      groupIds: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Create user document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, userDoc);

    return userCredential;
  } catch (error: any) {
    console.error('Error signing up:', error.code, error.message);

    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please provide a valid email address.');
    }

    throw error;
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    console.error('Error signing in:', error);

    // Provide user-friendly error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up first.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please provide a valid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    }

    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Subscribe to authentication state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    console.warn('Firebase is not configured. Auth state listener not attached.');
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current user's Firestore document
 */
export const getUserDocument = async (uid: string): Promise<UserDocument | null> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const userDocRef = doc(db, 'users', uid);

    // Add timeout to prevent hanging (Firebase v9 bug)
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        console.warn('getUserDocument timed out, returning null');
        resolve(null);
      }, 5000)
    );

    const docPromise = getDoc(userDocRef).then((snap) => {
      if (snap.exists()) {
        return snap.data() as UserDocument;
      }
      return null;
    });

    return await Promise.race([docPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error fetching user document:', error);
    return null; // Return null instead of throwing to prevent blocking
  }
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserDocument>
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...updates,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
