import React, { useState, useEffect } from 'react';
import { AppColors } from '../../theme/colors';
import { UserDocument, PrivateStudentCodeDocument, SubscriptionPlan } from '../../types/firestore';
import { getStudentsForTeacher } from '../../services/firebase/students';
import { removeStudentFromClass, regenerateClassCode, suspendStudent, reactivateStudent } from '../../services/firebase/classCode';
import {
  createPrivateStudentCode,
  getPrivateCodesForTeacher,
  revokePrivateStudentCode,
} from '../../services/firebase/privateStudentCode';
import { updateStudentPlan, getUsageStats } from '../../services/firebase/subscriptionUsage';
import { formatTimeRemaining } from '../../constants/subscriptionPlans';
import { PlanSelector } from './PlanSelector';

interface StudentsTabProps {
  teacherId: string;
  teacherName: string;
  classCode: string | undefined;
  onClassCodeRegenerated: (newCode: string) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  teacherId,
  teacherName,
  classCode,
  onClassCodeRegenerated,
}) => {
  const [students, setStudents] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedClassLink, setCopiedClassLink] = useState(false);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);
  const [suspendingStudent, setSuspendingStudent] = useState<string | null>(null);
  const [reactivatingStudent, setReactivatingStudent] = useState<string | null>(null);

  // Private code state
  const [privateCodes, setPrivateCodes] = useState<PrivateStudentCodeDocument[]>([]);
  const [generatingPrivateCode, setGeneratingPrivateCode] = useState(false);
  const [copiedPrivateLink, setCopiedPrivateLink] = useState<string | null>(null);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);

  // Plan management state
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  // Fetch students and private codes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsList, codesList] = await Promise.all([
          getStudentsForTeacher(teacherId),
          getPrivateCodesForTeacher(teacherId),
        ]);
        setStudents(studentsList);
        setPrivateCodes(codesList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  // Split students into group and private, and further by status
  const groupStudents = students.filter(s => !s.isPrivateStudent);
  const privateStudents = students.filter(s => s.isPrivateStudent);

  // Further split by active/suspended status
  const activeGroupStudents = groupStudents.filter(s => s.status !== 'suspended');
  const suspendedGroupStudents = groupStudents.filter(s => s.status === 'suspended');
  const activePrivateStudents = privateStudents.filter(s => s.status !== 'suspended');
  const suspendedPrivateStudents = privateStudents.filter(s => s.status === 'suspended');

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

  const handleCopyClassLink = async () => {
    if (!classCode) return;
    try {
      const link = `${window.location.origin}/join-class?code=${classCode}`;
      await navigator.clipboard.writeText(link);
      setCopiedClassLink(true);
      setTimeout(() => setCopiedClassLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
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

  const handleGeneratePrivateCode = async () => {
    setGeneratingPrivateCode(true);
    try {
      const newCode = await createPrivateStudentCode(teacherId, teacherName);
      setPrivateCodes(prev => [newCode, ...prev]);
    } catch (error) {
      console.error('Error generating private code:', error);
      alert('Failed to generate private code. Please try again.');
    } finally {
      setGeneratingPrivateCode(false);
    }
  };

  const handleCopyPrivateLink = async (code: string) => {
    try {
      const link = `${window.location.origin}/join-class?code=${code}`;
      await navigator.clipboard.writeText(link);
      setCopiedPrivateLink(code);
      setTimeout(() => setCopiedPrivateLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleRevokePrivateCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to revoke this code? It will no longer be usable.')) {
      return;
    }

    setRevokingCode(codeId);
    try {
      await revokePrivateStudentCode(codeId);
      setPrivateCodes(prev =>
        prev.map(c => c.id === codeId ? { ...c, status: 'revoked' as const } : c)
      );
    } catch (error) {
      console.error('Error revoking code:', error);
      alert('Failed to revoke code. Please try again.');
    } finally {
      setRevokingCode(null);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to permanently remove ${studentName} from your class? They will need to re-enter your class code to rejoin.`)) {
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

  const handleSuspendStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Suspend ${studentName}? They won't be able to access lessons until you reactivate them.`)) {
      return;
    }

    setSuspendingStudent(studentId);
    try {
      await suspendStudent(studentId);
      setStudents(prev => prev.map(s =>
        s.uid === studentId ? { ...s, status: 'suspended' as const } : s
      ));
    } catch (error) {
      console.error('Error suspending student:', error);
      alert('Failed to suspend student. Please try again.');
    } finally {
      setSuspendingStudent(null);
    }
  };

  const handleReactivateStudent = async (studentId: string) => {
    setReactivatingStudent(studentId);
    try {
      await reactivateStudent(studentId);
      setStudents(prev => prev.map(s =>
        s.uid === studentId ? { ...s, status: 'active' as const } : s
      ));
    } catch (error) {
      console.error('Error reactivating student:', error);
      alert('Failed to reactivate student. Please try again.');
    } finally {
      setReactivatingStudent(null);
    }
  };

  // Handle subscription plan change
  const handlePlanChange = async (studentId: string, newPlan: SubscriptionPlan) => {
    setChangingPlan(studentId);
    try {
      await updateStudentPlan(studentId, newPlan);
      // Update local state
      setStudents(prev => prev.map(s =>
        s.uid === studentId ? { ...s, subscriptionPlan: newPlan } : s
      ));
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan. Please try again.');
    } finally {
      setChangingPlan(null);
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
              background: copiedCode ? AppColors.successGreen : AppColors.surfaceLight,
              border: `1px solid ${AppColors.borderColor}`,
              borderRadius: 'clamp(8px, 2vw, 10px)',
              padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 24px)',
              color: copiedCode ? AppColors.textDark : AppColors.textPrimary,
              fontSize: 'clamp(14px, 3vw, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {copiedCode ? 'Copied!' : 'Code'}
          </button>
          <button
            onClick={handleCopyClassLink}
            style={{
              background: copiedClassLink ? AppColors.successGreen : AppColors.accentPurple,
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
            {copiedClassLink ? 'Copied!' : 'Link'}
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

      {/* Private Tutoring Section - Refined Design */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          borderRadius: '20px',
          padding: 'clamp(24px, 6vw, 32px)',
          marginBottom: 'clamp(24px, 6vw, 32px)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              👤
            </div>
            <div>
              <h2 style={{
                fontSize: 'clamp(18px, 4vw, 20px)',
                fontWeight: 600,
                margin: 0,
                color: AppColors.textPrimary,
                letterSpacing: '-0.02em',
              }}>
                Private Tutoring
              </h2>
              <p style={{
                fontSize: 'clamp(13px, 3vw, 14px)',
                color: AppColors.textSecondary,
                margin: 0,
              }}>
                1-on-1 students with personalized lessons
              </p>
            </div>
          </div>
        </div>

        {/* Invite Section - Clean Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textSecondary,
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Invite a Student
              </div>
              {privateCodes.filter(c => c.status === 'active').length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'SF Mono, Menlo, monospace',
                    fontSize: 'clamp(18px, 4vw, 22px)',
                    fontWeight: 600,
                    color: AppColors.textPrimary,
                    letterSpacing: '0.1em',
                  }}>
                    {privateCodes.filter(c => c.status === 'active')[0].id}
                  </span>
                </div>
              ) : (
                <span style={{
                  fontSize: 'clamp(14px, 3vw, 15px)',
                  color: AppColors.textSecondary,
                }}>
                  Generate a code to invite
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {privateCodes.filter(c => c.status === 'active').length > 0 ? (
                <>
                  <button
                    onClick={() => handleCopyPrivateLink(privateCodes.filter(c => c.status === 'active')[0].id)}
                    style={{
                      background: copiedPrivateLink === privateCodes.filter(c => c.status === 'active')[0].id
                        ? AppColors.successGreen
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      color: 'white',
                      fontSize: 'clamp(13px, 2.8vw, 14px)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {copiedPrivateLink === privateCodes.filter(c => c.status === 'active')[0].id ? (
                      <>✓ Copied</>
                    ) : (
                      <>
                        <span style={{ fontSize: '14px' }}>🔗</span>
                        Copy Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleGeneratePrivateCode}
                    disabled={generatingPrivateCode}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      color: AppColors.textSecondary,
                      fontSize: 'clamp(13px, 2.8vw, 14px)',
                      fontWeight: 500,
                      cursor: generatingPrivateCode ? 'not-allowed' : 'pointer',
                      opacity: generatingPrivateCode ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    + New
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGeneratePrivateCode}
                  disabled={generatingPrivateCode}
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    color: 'white',
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    fontWeight: 600,
                    cursor: generatingPrivateCode ? 'not-allowed' : 'pointer',
                    opacity: generatingPrivateCode ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {generatingPrivateCode ? 'Creating...' : 'Generate Invite Code'}
                </button>
              )}
            </div>
          </div>

          {/* Additional codes - collapsed view */}
          {privateCodes.filter(c => c.status === 'active').length > 1 && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textSecondary,
                marginBottom: '8px',
              }}>
                {privateCodes.filter(c => c.status === 'active').length - 1} more active code{privateCodes.filter(c => c.status === 'active').length > 2 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {privateCodes.filter(c => c.status === 'active').slice(1).map(code => (
                  <div
                    key={code.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{
                      fontFamily: 'SF Mono, Menlo, monospace',
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      color: AppColors.textSecondary,
                    }}>
                      {code.id}
                    </span>
                    <button
                      onClick={() => handleCopyPrivateLink(code.id)}
                      style={{
                        background: copiedPrivateLink === code.id ? AppColors.successGreen : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: copiedPrivateLink === code.id ? AppColors.textDark : AppColors.textPrimary,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedPrivateLink === code.id ? '✓' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleRevokePrivateCode(code.id)}
                      disabled={revokingCode === code.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '2px 6px',
                        fontSize: '11px',
                        color: AppColors.errorRose,
                        cursor: 'pointer',
                        opacity: revokingCode === code.id ? 0.5 : 0.7,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Students List */}
        {activePrivateStudents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Your Students ({activePrivateStudents.length})
            </div>
            {activePrivateStudents.map((student) => (
              <div
                key={student.uid}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: AppColors.textPrimary,
                  }}>
                    {student.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 'clamp(15px, 3.2vw, 16px)',
                      fontWeight: 600,
                      color: AppColors.textPrimary,
                      marginBottom: '2px',
                    }}>
                      {student.displayName}
                    </div>
                    {/* Usage Stats */}
                    {(() => {
                      const stats = getUsageStats(student);
                      if (stats.isUnlimited) {
                        return (
                          <div style={{ fontSize: 'clamp(11px, 2.3vw, 12px)', color: AppColors.textSecondary, marginTop: '4px' }}>
                            {formatTimeRemaining(stats.usedSeconds)} this week
                          </div>
                        );
                      }
                      const progressPercent = Math.min(stats.percentUsed * 100, 100);
                      const progressColor = stats.isAtLimit ? AppColors.errorRose :
                        progressPercent > 75 ? AppColors.whisperAmber : AppColors.successGreen;
                      return (
                        <div style={{ marginTop: '4px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: 'clamp(11px, 2.3vw, 12px)',
                            color: stats.isAtLimit ? AppColors.errorRose : AppColors.textSecondary,
                            marginBottom: '4px',
                          }}>
                            <span>{formatTimeRemaining(stats.usedSeconds)} / {formatTimeRemaining(stats.limitSeconds)}</span>
                            {stats.isAtLimit && <span style={{ fontWeight: 600 }}>At limit</span>}
                          </div>
                          <div style={{
                            height: '4px',
                            width: '100px',
                            borderRadius: '2px',
                            background: 'rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${progressPercent}%`,
                              borderRadius: '2px',
                              background: progressColor,
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PlanSelector
                    currentPlan={student.subscriptionPlan || 'starter'}
                    onChange={(plan) => handlePlanChange(student.uid, plan)}
                    disabled={changingPlan === student.uid}
                    compact
                  />
                  <button
                    onClick={() => handleSuspendStudent(student.uid, student.displayName)}
                    disabled={suspendingStudent === student.uid}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 12px',
                      color: AppColors.textSecondary,
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      cursor: suspendingStudent === student.uid ? 'not-allowed' : 'pointer',
                      opacity: suspendingStudent === student.uid ? 0.5 : 0.7,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => { if (suspendingStudent !== student.uid) e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { if (suspendingStudent !== student.uid) e.currentTarget.style.opacity = '0.7'; }}
                  >
                    {suspendingStudent === student.uid ? '...' : 'Pause'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : privateStudents.length === 0 && privateCodes.filter(c => c.status === 'active').length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px 20px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.8 }}>👋</div>
            <div style={{
              fontSize: 'clamp(15px, 3.2vw, 16px)',
              color: AppColors.textPrimary,
              marginBottom: '8px',
              fontWeight: 500,
            }}>
              Start 1-on-1 Tutoring
            </div>
            <div style={{
              fontSize: 'clamp(13px, 2.8vw, 14px)',
              color: AppColors.textSecondary,
              maxWidth: '280px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}>
              Generate an invite code above to bring in your first private student
            </div>
          </div>
        ) : null}

        {/* Paused Students */}
        {suspendedPrivateStudents.length > 0 && (
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: AppColors.whisperAmber,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '14px' }}>⏸</span>
              Paused ({suspendedPrivateStudents.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suspendedPrivateStudents.map((student) => (
                <div
                  key={student.uid}
                  style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(251, 191, 36, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: AppColors.whisperAmber,
                    }}>
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{
                      fontSize: 'clamp(14px, 3vw, 15px)',
                      color: AppColors.textPrimary,
                    }}>
                      {student.displayName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleReactivateStudent(student.uid)}
                      disabled={reactivatingStudent === student.uid}
                      style={{
                        background: AppColors.successGreen,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        color: AppColors.textDark,
                        fontSize: 'clamp(12px, 2.5vw, 13px)',
                        fontWeight: 600,
                        cursor: reactivatingStudent === student.uid ? 'not-allowed' : 'pointer',
                        opacity: reactivatingStudent === student.uid ? 0.5 : 1,
                      }}
                    >
                      {reactivatingStudent === student.uid ? '...' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleRemoveStudent(student.uid, student.displayName)}
                      disabled={removingStudent === student.uid}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '6px 10px',
                        color: AppColors.errorRose,
                        fontSize: 'clamp(12px, 2.5vw, 13px)',
                        cursor: removingStudent === student.uid ? 'not-allowed' : 'pointer',
                        opacity: removingStudent === student.uid ? 0.5 : 0.7,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Group Students List - Active */}
      <h2
        style={{
          fontSize: 'clamp(16px, 3.5vw, 18px)',
          fontWeight: 600,
          marginBottom: 'clamp(12px, 3vw, 16px)',
        }}
      >
        Group Students ({activeGroupStudents.length})
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
      ) : activeGroupStudents.length === 0 ? (
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
            No Active Group Students
          </h3>
          <p
            style={{
              fontSize: 'clamp(13px, 3vw, 15px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            Share your class code with students to get started!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 14px)' }}>
          {activeGroupStudents.map((student) => (
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
                    alignItems: 'center',
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
                {/* Usage Stats */}
                {(() => {
                  const stats = getUsageStats(student);
                  if (stats.isUnlimited) {
                    return (
                      <div style={{
                        fontSize: 'clamp(11px, 2.3vw, 12px)',
                        color: AppColors.textSecondary,
                        marginTop: '6px',
                      }}>
                        {formatTimeRemaining(stats.usedSeconds)} this week
                      </div>
                    );
                  }
                  const progressPercent = Math.min(stats.percentUsed * 100, 100);
                  const progressColor = stats.isAtLimit ? AppColors.errorRose :
                    progressPercent > 75 ? AppColors.whisperAmber : AppColors.successGreen;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                      <div style={{
                        height: '4px',
                        width: '80px',
                        borderRadius: '2px',
                        background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${progressPercent}%`,
                          borderRadius: '2px',
                          background: progressColor,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 'clamp(11px, 2.3vw, 12px)',
                        color: stats.isAtLimit ? AppColors.errorRose : AppColors.textSecondary,
                      }}>
                        {formatTimeRemaining(stats.usedSeconds)} / {formatTimeRemaining(stats.limitSeconds)}
                        {stats.isAtLimit && ' (limit)'}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                <PlanSelector
                  currentPlan={student.subscriptionPlan || 'starter'}
                  onChange={(plan) => handlePlanChange(student.uid, plan)}
                  disabled={changingPlan === student.uid}
                  compact
                />
                <button
                  onClick={() => handleSuspendStudent(student.uid, student.displayName)}
                  disabled={suspendingStudent === student.uid}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${AppColors.whisperAmber}`,
                    borderRadius: 'clamp(6px, 1.5vw, 8px)',
                    padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 14px)',
                    color: AppColors.whisperAmber,
                    fontSize: 'clamp(12px, 2.5vw, 13px)',
                    fontWeight: 500,
                    cursor: suspendingStudent === student.uid ? 'not-allowed' : 'pointer',
                    opacity: suspendingStudent === student.uid ? 0.6 : 1,
                  }}
                >
                  {suspendingStudent === student.uid ? '...' : 'Suspend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suspended Group Students */}
      {suspendedGroupStudents.length > 0 && (
        <div style={{ marginTop: 'clamp(20px, 5vw, 28px)' }}>
          <h3
            style={{
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              color: AppColors.whisperAmber,
              marginBottom: 'clamp(12px, 3vw, 16px)',
            }}
          >
            Suspended ({suspendedGroupStudents.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 10px)' }}>
            {suspendedGroupStudents.map((student) => (
              <div
                key={student.uid}
                style={{
                  background: `${AppColors.whisperAmber}15`,
                  border: `1px solid ${AppColors.whisperAmber}40`,
                  borderRadius: 'clamp(10px, 2.5vw, 14px)',
                  padding: 'clamp(12px, 3vw, 16px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'clamp(12px, 3vw, 16px)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'clamp(14px, 3vw, 15px)',
                      fontWeight: 600,
                      color: AppColors.textPrimary,
                      marginBottom: '2px',
                    }}
                  >
                    {student.displayName}
                  </div>
                  <div style={{ fontSize: 'clamp(11px, 2.4vw, 12px)', color: AppColors.textSecondary }}>
                    Level: {student.level || 'Not set'} • Sessions: {student.totalSessions || 0}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleReactivateStudent(student.uid)}
                    disabled={reactivatingStudent === student.uid}
                    style={{
                      background: AppColors.successGreen,
                      border: 'none',
                      borderRadius: 'clamp(6px, 1.5vw, 8px)',
                      padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 14px)',
                      color: AppColors.textDark,
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      fontWeight: 500,
                      cursor: reactivatingStudent === student.uid ? 'not-allowed' : 'pointer',
                      opacity: reactivatingStudent === student.uid ? 0.6 : 1,
                    }}
                  >
                    {reactivatingStudent === student.uid ? '...' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => handleRemoveStudent(student.uid, student.displayName)}
                    disabled={removingStudent === student.uid}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${AppColors.errorRose}`,
                      borderRadius: 'clamp(6px, 1.5vw, 8px)',
                      padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)',
                      color: AppColors.errorRose,
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      fontWeight: 500,
                      cursor: removingStudent === student.uid ? 'not-allowed' : 'pointer',
                      opacity: removingStudent === student.uid ? 0.6 : 1,
                    }}
                  >
                    {removingStudent === student.uid ? '...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
