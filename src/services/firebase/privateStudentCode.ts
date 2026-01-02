/**
 * Private Student Code Utilities
 *
 * Functions for generating, validating, and managing private tutoring codes
 * for 1:1 teacher-student relationships where students only see assigned lessons.
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PrivateStudentCodeDocument } from '../../types/firestore';

const PRIVATE_CODES_COLLECTION = 'privateStudentCodes';
const USERS_COLLECTION = 'users';

/**
 * Generate a private student code in format PRV-XXXXXX
 * Uses uppercase letters and numbers, excluding confusing characters
 */
export const generatePrivateCodeString = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = 'PRV-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create a new private student code for a teacher
 * Returns the created code document
 * @param teacherId - The teacher's user ID
 * @param teacherName - The teacher's display name
 * @param studentName - Optional name/label for the intended recipient
 */
export const createPrivateStudentCode = async (
  teacherId: string,
  teacherName: string,
  studentName?: string
): Promise<PrivateStudentCodeDocument> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  // Generate unique code (try up to 10 times)
  let code = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generatePrivateCodeString();
    const existing = await getPrivateCodeById(code);
    if (!existing) break;
  }

  if (!code) {
    throw new Error('Failed to generate unique private code');
  }

  const codeDoc: PrivateStudentCodeDocument = {
    id: code,
    teacherId,
    teacherName,
    ...(studentName && { studentName }),
    status: 'active',
    createdAt: Timestamp.now(),
  };

  const codeRef = doc(db, PRIVATE_CODES_COLLECTION, code);
  await setDoc(codeRef, codeDoc);

  return codeDoc;
};

/**
 * Get a private code document by its ID
 */
export const getPrivateCodeById = async (
  codeId: string
): Promise<PrivateStudentCodeDocument | null> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const codesRef = collection(db, PRIVATE_CODES_COLLECTION);
    const normalizedCode = codeId.toUpperCase().trim();
    const q = query(codesRef, where('id', '==', normalizedCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as PrivateStudentCodeDocument;
  } catch (error) {
    console.error('Error getting private code:', error);
    return null;
  }
};

/**
 * Validate a private student code and return teacher info if valid
 * Returns null if code doesn't exist or is not active
 */
export const validatePrivateStudentCode = async (
  code: string
): Promise<{
  isValid: boolean;
  teacherId: string;
  teacherName: string;
  codeId: string;
} | null> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  if (!code || !code.toUpperCase().startsWith('PRV-') || code.length !== 10) {
    return null;
  }

  try {
    const normalizedCode = code.toUpperCase().trim();
    const codeDoc = await getPrivateCodeById(normalizedCode);

    if (!codeDoc || codeDoc.status !== 'active') {
      return null;
    }

    return {
      isValid: true,
      teacherId: codeDoc.teacherId,
      teacherName: codeDoc.teacherName,
      codeId: codeDoc.id,
    };
  } catch (error) {
    console.error('Error validating private code:', error);
    return null;
  }
};

/**
 * Mark a private code as used by a student
 * Also updates the student's document with private student fields
 */
export const usePrivateStudentCode = async (
  codeId: string,
  studentId: string,
  studentName: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const codeRef = doc(db, PRIVATE_CODES_COLLECTION, codeId);
    await updateDoc(codeRef, {
      status: 'used',
      usedByStudentId: studentId,
      usedByStudentName: studentName,
      usedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error using private code:', error);
    throw error;
  }
};

/**
 * Assign a private student to a teacher
 * Sets isPrivateStudent: true and stores the private code reference
 */
export const assignPrivateStudentToTeacher = async (
  studentId: string,
  teacherId: string,
  teacherName: string,
  privateCode: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const studentDocRef = doc(db, USERS_COLLECTION, studentId);
    await updateDoc(studentDocRef, {
      teacherId,
      teacherName,
      isPrivateStudent: true,
      privateStudentCode: privateCode,
      joinedClassAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error assigning private student to teacher:', error);
    throw error;
  }
};

/**
 * Get all private codes for a teacher
 * Returns codes sorted by creation date (newest first)
 */
export const getPrivateCodesForTeacher = async (
  teacherId: string
): Promise<PrivateStudentCodeDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const codesRef = collection(db, PRIVATE_CODES_COLLECTION);
    const q = query(
      codesRef,
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PrivateStudentCodeDocument);
  } catch (error) {
    console.error('Error getting private codes for teacher:', error);
    return [];
  }
};

/**
 * Revoke an unused private code
 * Only active codes can be revoked
 */
export const revokePrivateStudentCode = async (codeId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const codeDoc = await getPrivateCodeById(codeId);
    if (!codeDoc) {
      throw new Error('Private code not found');
    }
    if (codeDoc.status !== 'active') {
      throw new Error('Can only revoke active codes');
    }

    const codeRef = doc(db, PRIVATE_CODES_COLLECTION, codeId);
    await updateDoc(codeRef, {
      status: 'revoked',
    });
  } catch (error) {
    console.error('Error revoking private code:', error);
    throw error;
  }
};
