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

/**
 * Mission completion stats for teacher dashboard
 */
export interface MissionCompletionStats {
  missionId: string;
  completedCount: number;
  totalEligible: number;
  completionRate: number;
  notCompletedStudents: { uid: string; name: string; level?: ProficiencyLevel }[];
}

/**
 * Get completion stats for a specific mission
 * Returns how many students have completed it and who hasn't
 */
export const getMissionCompletionStats = async (
  teacherId: string,
  missionId: string,
  missionLevel?: ProficiencyLevel
): Promise<MissionCompletionStats> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    // Get all students for this teacher
    const students = await getStudentsForTeacher(teacherId);

    // Filter to students who are eligible for this mission (matching level or compatible)
    const eligibleStudents = students.filter(student => {
      if (!missionLevel) return true; // Mission available to all levels
      if (!student.level) return true; // Student without level can access all
      return isLevelCompatible(student.level, missionLevel);
    });

    // Check which students have completed this mission
    const completedStudents: UserDocument[] = [];
    const notCompletedStudents: { uid: string; name: string; level?: ProficiencyLevel }[] = [];

    for (const student of eligibleStudents) {
      const completedMissions = student.uniqueScenariosCompleted || [];
      if (completedMissions.includes(missionId)) {
        completedStudents.push(student);
      } else {
        notCompletedStudents.push({
          uid: student.uid,
          name: student.displayName || student.email || 'Unknown',
          level: student.level,
        });
      }
    }

    const totalEligible = eligibleStudents.length;
    const completedCount = completedStudents.length;
    const completionRate = totalEligible > 0 ? (completedCount / totalEligible) * 100 : 0;

    return {
      missionId,
      completedCount,
      totalEligible,
      completionRate,
      notCompletedStudents,
    };
  } catch (error) {
    console.error('Error fetching mission completion stats:', error);
    throw error;
  }
};

/**
 * Get completion stats for all missions for a teacher
 * Returns a map of missionId -> completion stats
 */
export const getAllMissionCompletionStats = async (
  teacherId: string
): Promise<Record<string, MissionCompletionStats>> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    // Get all active missions for this teacher
    const missionsRef = collection(db, MISSIONS_COLLECTION);
    const q = query(
      missionsRef,
      where('teacherId', '==', teacherId),
      where('isActive', '==', true)
    );
    const missionsSnapshot = await getDocs(q);
    const missions = missionsSnapshot.docs.map(doc => doc.data() as MissionDocument);

    // Get all students for this teacher
    const students = await getStudentsForTeacher(teacherId);

    // Build completion stats for each mission
    const statsMap: Record<string, MissionCompletionStats> = {};

    for (const mission of missions) {
      // Filter to students who are eligible for this mission
      const eligibleStudents = students.filter(student => {
        if (!mission.targetLevel) return true;
        if (!student.level) return true;
        return isLevelCompatible(student.level, mission.targetLevel);
      });

      const completedStudents: UserDocument[] = [];
      const notCompletedStudents: { uid: string; name: string; level?: ProficiencyLevel }[] = [];

      for (const student of eligibleStudents) {
        const completedMissions = student.uniqueScenariosCompleted || [];
        if (completedMissions.includes(mission.id)) {
          completedStudents.push(student);
        } else {
          notCompletedStudents.push({
            uid: student.uid,
            name: student.displayName || student.email || 'Unknown',
            level: student.level,
          });
        }
      }

      const totalEligible = eligibleStudents.length;
      const completedCount = completedStudents.length;
      const completionRate = totalEligible > 0 ? (completedCount / totalEligible) * 100 : 0;

      statsMap[mission.id] = {
        missionId: mission.id,
        completedCount,
        totalEligible,
        completionRate,
        notCompletedStudents,
      };
    }

    return statsMap;
  } catch (error) {
    console.error('Error fetching all mission completion stats:', error);
    throw error;
  }
};
