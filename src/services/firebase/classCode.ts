/**
 * Class Code Utilities
 *
 * Functions for generating, validating, and managing class codes
 * for teacher-student linking.
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserDocument } from '../../types/firestore';

const USERS_COLLECTION = 'users';

/**
 * Generate a unique 6-character alphanumeric class code
 * Uses uppercase letters and numbers, excluding confusing characters (0, O, I, 1, L)
 */
export const generateClassCode = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excludes 0, O, I, 1, L for clarity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Generate a unique class code that doesn't exist in the database
 * Tries up to 10 times to find a unique code
 */
export const generateUniqueClassCode = async (): Promise<string> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateClassCode();
    const exists = await validateClassCode(code);
    if (!exists) {
      return code;
    }
  }

  // If we couldn't find a unique code after 10 attempts, add timestamp suffix
  return generateClassCode() + Date.now().toString(36).slice(-2).toUpperCase();
};

/**
 * Validate a class code and return teacher info if valid
 * Case-insensitive validation
 */
export const validateClassCode = async (
  code: string
): Promise<{ teacherId: string; teacherName: string } | null> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  if (!code || code.length < 6) {
    return null;
  }

  try {
    const normalizedCode = code.toUpperCase().trim();

    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where('classCode', '==', normalizedCode),
      where('role', '==', 'teacher')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const teacherDoc = querySnapshot.docs[0].data() as UserDocument;
    return {
      teacherId: teacherDoc.uid,
      teacherName: teacherDoc.displayName,
    };
  } catch (error) {
    console.error('Error validating class code:', error);
    throw error;
  }
};

/**
 * Assign a student to a teacher
 * Updates the student's document with teacherId, teacherName, and joinedClassAt
 */
export const assignStudentToTeacher = async (
  studentId: string,
  teacherId: string,
  teacherName: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const studentDocRef = doc(db, USERS_COLLECTION, studentId);
    await updateDoc(studentDocRef, {
      teacherId,
      teacherName,
      joinedClassAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error assigning student to teacher:', error);
    throw error;
  }
};

/**
 * Remove a student from a teacher's class
 * Clears teacherId, teacherName, and joinedClassAt from student's document
 */
export const removeStudentFromClass = async (studentId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const studentDocRef = doc(db, USERS_COLLECTION, studentId);
    await updateDoc(studentDocRef, {
      teacherId: null,
      teacherName: null,
      joinedClassAt: null,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing student from class:', error);
    throw error;
  }
};

/**
 * Regenerate a teacher's class code
 * Generates a new unique code and updates the teacher's document
 * Old code immediately becomes invalid
 */
export const regenerateClassCode = async (teacherId: string): Promise<string> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const newCode = await generateUniqueClassCode();
    const teacherDocRef = doc(db, USERS_COLLECTION, teacherId);

    await updateDoc(teacherDocRef, {
      classCode: newCode,
      updatedAt: Timestamp.now(),
    });

    return newCode;
  } catch (error) {
    console.error('Error regenerating class code:', error);
    throw error;
  }
};
