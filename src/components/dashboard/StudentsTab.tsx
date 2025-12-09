import React, { useState, useEffect } from 'react';
import { AppColors } from '../../theme/colors';
import { UserDocument } from '../../types/firestore';
import { getStudentsForTeacher } from '../../services/firebase/students';
import { removeStudentFromClass, regenerateClassCode } from '../../services/firebase/classCode';

interface StudentsTabProps {
  teacherId: string;
  classCode: string | undefined;
  onClassCodeRegenerated: (newCode: string) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  teacherId,
  classCode,
  onClassCodeRegenerated,
}) => {
  const [students, setStudents] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);

  // Fetch students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsList = await getStudentsForTeacher(teacherId);
        setStudents(studentsList);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [teacherId]);

  const handleCopyCode = async () => {
    if (!classCode) return;
    try {
      await navigator.clipboard.writeText(classCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm('Are you sure you want to regenerate your class code? The old code will stop working immediately.')) {
      return;
    }

    setRegenerating(true);
    try {
      const newCode = await regenerateClassCode(teacherId);
      onClassCodeRegenerated(newCode);
    } catch (error) {
      console.error('Error regenerating code:', error);
      alert('Failed to regenerate class code. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from your class? They will need to re-enter your class code to rejoin.`)) {
      return;
    }

    setRemovingStudent(studentId);
    try {
      await removeStudentFromClass(studentId);
      setStudents(prev => prev.filter(s => s.uid !== studentId));
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student. Please try again.');
    } finally {
      setRemovingStudent(null);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Class Code Card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${AppColors.accentPurple}20 0%, ${AppColors.accentBlue}20 100%)`,
          border: `2px solid ${AppColors.accentPurple}`,
          borderRadius: 'clamp(12px, 3vw, 16px)',
          padding: 'clamp(20px, 5vw, 28px)',
          marginBottom: 'clamp(20px, 5vw, 28px)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontWeight: 500,
            color: AppColors.textSecondary,
            margin: '0 0 clamp(8px, 2vw, 12px) 0',
          }}
        >
          Your Class Code
        </h2>
        <div
          style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: AppColors.textPrimary,
            marginBottom: 'clamp(12px, 3vw, 16px)',
            fontFamily: 'monospace',
          }}
        >
          {classCode || '------'}
        </div>
        <p
          style={{
            fontSize: 'clamp(13px, 3vw, 15px)',
            color: AppColors.textSecondary,
            margin: '0 0 clamp(16px, 4vw, 20px) 0',
          }}
        >
          Share this code with your students to join your class
        </p>
        <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyCode}
            style={{
              background: copiedCode ? AppColors.successGreen : AppColors.accentPurple,
              border: 'none',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 24px)',
              color: AppColors.textDark,
              fontSize: 'clamp(14px, 3vw, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleRegenerateCode}
            disabled={regenerating}
            style={{
              background: AppColors.surfaceLight,
              border: `1px solid ${AppColors.borderColor}`,
              borderRadius: 'clamp(8px, 2vw, 10px)',
              padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 24px)',
              color: AppColors.textSecondary,
              fontSize: 'clamp(14px, 3vw, 15px)',
              fontWeight: 500,
              cursor: regenerating ? 'not-allowed' : 'pointer',
              opacity: regenerating ? 0.6 : 1,
            }}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Students List */}
      <h2
        style={{
          fontSize: 'clamp(16px, 3.5vw, 18px)',
          fontWeight: 600,
          marginBottom: 'clamp(12px, 3vw, 16px)',
        }}
      >
        Your Students ({students.length})
      </h2>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'clamp(30px, 8vw, 50px)',
            color: AppColors.textSecondary,
          }}
        >
          Loading students...
        </div>
      ) : students.length === 0 ? (
        <div
          style={{
            background: AppColors.surfaceLight,
            borderRadius: 'clamp(12px, 3vw, 16px)',
            padding: 'clamp(30px, 8vw, 50px)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 'clamp(40px, 10vw, 56px)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
            👨‍🎓
          </div>
          <h3
            style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: '0 0 clamp(8px, 2vw, 10px) 0',
            }}
          >
            No Students Yet
          </h3>
          <p
            style={{
              fontSize: 'clamp(13px, 3vw, 15px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            Share your class code with your students to get started!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 14px)' }}>
          {students.map((student) => (
            <div
              key={student.uid}
              style={{
                background: AppColors.surfaceLight,
                borderRadius: 'clamp(10px, 2.5vw, 14px)',
                padding: 'clamp(14px, 3.5vw, 18px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'clamp(12px, 3vw, 16px)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'clamp(15px, 3.5vw, 17px)',
                    fontWeight: 600,
                    color: AppColors.textPrimary,
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {student.displayName}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(12px, 2.5vw, 13px)',
                    color: AppColors.textSecondary,
                    display: 'flex',
                    gap: 'clamp(12px, 3vw, 16px)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>Level: {student.level || 'Not set'}</span>
                  <span>Joined: {formatDate(student.joinedClassAt)}</span>
                  {student.totalSessions !== undefined && (
                    <span>Sessions: {student.totalSessions}</span>
                  )}
                  {student.totalStars !== undefined && student.totalSessions !== undefined && student.totalSessions > 0 && (
                    <span>Avg Stars: {(student.totalStars / student.totalSessions).toFixed(1)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveStudent(student.uid, student.displayName)}
                disabled={removingStudent === student.uid}
                style={{
                  background: 'transparent',
                  border: `1px solid ${AppColors.errorRose}`,
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 14px)',
                  color: AppColors.errorRose,
                  fontSize: 'clamp(12px, 2.5vw, 13px)',
                  fontWeight: 500,
                  cursor: removingStudent === student.uid ? 'not-allowed' : 'pointer',
                  opacity: removingStudent === student.uid ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {removingStudent === student.uid ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
