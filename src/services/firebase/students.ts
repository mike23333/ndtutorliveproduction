/**
 * Student Query Functions
 *
 * Functions for querying students and missions based on teacher-student relationships.
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserDocument, MissionDocument, ProficiencyLevel } from '../../types/firestore';

const USERS_COLLECTION = 'users';
const MISSIONS_COLLECTION = 'missions';

/**
 * Get all students for a specific teacher
 * Returns students where teacherId matches the teacher's UID
 */
export const getStudentsForTeacher = async (
  teacherId: string
): Promise<UserDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where('teacherId', '==', teacherId),
      where('role', '==', 'student'),
      orderBy('joinedClassAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserDocument);
  } catch (error) {
    console.error('Error fetching students for teacher:', error);
    throw error;
  }
};

/**
 * Get active missions for a student based on their assigned teacher
 * Optionally filters by student's proficiency level
 */
export const getMissionsForStudent = async (
  teacherId: string,
  level?: ProficiencyLevel
): Promise<MissionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  if (!teacherId) {
    console.warn('getMissionsForStudent called without teacherId');
    return [];
  }

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);

    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('teacherId', '==', teacherId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
    ];

    // Note: We filter by level in JavaScript since Firestore doesn't support
    // filtering on optional fields well with inequality + ordering
    const q = query(missionsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    let missions = querySnapshot.docs.map(doc => doc.data() as MissionDocument);

    // If level is provided, filter missions that match the student's level or have no targetLevel
    if (level) {
      missions = missions.filter(mission =>
        !mission.targetLevel || mission.targetLevel === level || isLevelCompatible(level, mission.targetLevel)
      );
    }

    return missions;
  } catch (error) {
    console.error('Error fetching missions for student:', error);
    throw error;
  }
};

/**
 * Check if a student's level is compatible with a mission's target level
 * A student can do missions at or below their level
 * e.g., B2 student can do A1, A2, B1, B2 missions
 */
const LEVEL_ORDER: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const isLevelCompatible = (
  studentLevel: ProficiencyLevel,
  missionLevel: ProficiencyLevel
): boolean => {
  const studentIndex = LEVEL_ORDER.indexOf(studentLevel);
  const missionIndex = LEVEL_ORDER.indexOf(missionLevel);
  return missionIndex <= studentIndex;
};

/**
 * Get count of students for a teacher
 */
export const getStudentCountForTeacher = async (
  teacherId: string
): Promise<number> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where('teacherId', '==', teacherId),
      where('role', '==', 'student')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error counting students for teacher:', error);
    throw error;
  }
};
