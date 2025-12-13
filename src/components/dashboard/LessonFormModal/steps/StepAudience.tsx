import React from 'react';
import { AppColors } from '../../../../theme/colors';
import { SelectField } from '../../../forms';
import type { LessonFormData } from '../../../../types/dashboard';
import type { ProficiencyLevel, UserDocument } from '../../../../types/firestore';

interface CollectionOption {
  id: string;
  title: string;
}

interface StepAudienceProps {
  formData: LessonFormData;
  onTargetLevelChange: (level: ProficiencyLevel | null) => void;
  onFirstLessonChange: (isFirst: boolean) => void;
  onShowOnHomepageChange?: (show: boolean) => void;
  onCollectionChange?: (collectionId: string | null) => void;
  onAssignedStudentsChange?: (studentIds: string[]) => void;
  collections?: CollectionOption[];
  privateStudents?: UserDocument[];
}

const LEVEL_OPTIONS = [
  { value: '', label: 'All Levels (no filter)' },
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Proficient' },
];

export const StepAudience: React.FC<StepAudienceProps> = ({
  formData,
  onTargetLevelChange,
  onFirstLessonChange,
  onShowOnHomepageChange,
  onCollectionChange,
  onAssignedStudentsChange,
  collections = [],
  privateStudents = [],
}) => {
  const hasAssignedStudents = (formData.assignedStudentIds?.length || 0) > 0;

  const handleStudentToggle = (studentId: string) => {
    if (!onAssignedStudentsChange) return;
    const current = formData.assignedStudentIds || [];
    const updated = current.includes(studentId)
      ? current.filter((id) => id !== studentId)
      : [...current, studentId];
    onAssignedStudentsChange(updated);
  };

  const handleClearAssignments = () => {
    if (onAssignedStudentsChange) {
      onAssignedStudentsChange([]);
    }
  };

  return (
    <div>
      {/* Target Level Selector */}
      <SelectField
        label="Target Student Level"
        options={LEVEL_OPTIONS}
        value={formData.targetLevel || ''}
        onChange={(value) => onTargetLevelChange(value ? (value as ProficiencyLevel) : null)}
      />

      {/* RolePlay Collection Selector */}
      {collections.length > 0 && onCollectionChange && (
        <SelectField
          label="RolePlay Collection"
          options={[
            { value: '', label: 'No collection (standalone lesson)' },
            ...collections.map((c) => ({ value: c.id, label: c.title })),
          ]}
          value={formData.collectionId || ''}
          onChange={(value) => onCollectionChange(value || null)}
        />
      )}

      {/* Show on Homepage Toggle */}
      {onShowOnHomepageChange && (
        <div
          style={{
            marginBottom: 'clamp(12px, 3vw, 16px)',
            padding: 'clamp(12px, 3vw, 16px)',
            background:
              formData.showOnHomepage !== false
                ? 'rgba(16, 185, 129, 0.1)'
                : AppColors.surfaceLight,
            border: `1px solid ${
              formData.showOnHomepage !== false ? 'rgba(16, 185, 129, 0.3)' : AppColors.borderColor
            }`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'clamp(13px, 2.8vw, 15px)',
                  fontWeight: 600,
                  color: AppColors.textPrimary,
                  marginBottom: '4px',
                }}
              >
                Show on Homepage
              </label>
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(11px, 2.2vw, 12px)',
                  color: AppColors.textSecondary,
                }}
              >
                Display this lesson on students&apos; homepage for quick access
              </p>
            </div>
            <button
              type="button"
              onClick={() => onShowOnHomepageChange(formData.showOnHomepage === false)}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background:
                  formData.showOnHomepage !== false
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : AppColors.surfaceMedium,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: formData.showOnHomepage !== false ? '27px' : '3px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>
      )}

      {/* First Lesson Toggle */}
      <div
        style={{
          marginBottom: 'clamp(12px, 3vw, 16px)',
          padding: 'clamp(12px, 3vw, 16px)',
          background: formData.isFirstLesson
            ? 'rgba(139, 92, 246, 0.1)'
            : AppColors.surfaceLight,
          border: `1px solid ${
            formData.isFirstLesson ? AppColors.accentPurple : AppColors.borderColor
          }`,
          borderRadius: 'clamp(8px, 2vw, 12px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(13px, 2.8vw, 15px)',
                fontWeight: 600,
                color: AppColors.textPrimary,
                marginBottom: '4px',
              }}
            >
              First Lesson for New Students
            </label>
            <p
              style={{
                margin: 0,
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textSecondary,
              }}
            >
              This lesson will be shown first to students who haven&apos;t practiced yet
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFirstLessonChange(!formData.isFirstLesson)}
            style={{
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              border: 'none',
              background: formData.isFirstLesson
                ? `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`
                : AppColors.surfaceMedium,
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: formData.isFirstLesson ? '27px' : '3px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Private Student Assignment */}
      {privateStudents.length > 0 && onAssignedStudentsChange && (
        <div
          style={{
            marginBottom: 'clamp(16px, 4vw, 20px)',
            padding: '20px',
            background: hasAssignedStudents
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)'
              : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${
              hasAssignedStudents ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'
            }`,
            borderRadius: '16px',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}
            >
              <label
                style={{
                  fontSize: 'clamp(14px, 3vw, 15px)',
                  fontWeight: 600,
                  color: AppColors.textPrimary,
                  letterSpacing: '-0.01em',
                }}
              >
                Assign to Students
              </label>
              {hasAssignedStudents && (
                <span
                  style={{
                    background: `linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)`,
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {formData.assignedStudentIds?.length}
                </span>
              )}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textSecondary,
                lineHeight: 1.4,
              }}
            >
              Select students for personalized access
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {privateStudents.map((student) => {
              const isSelected = formData.assignedStudentIds?.includes(student.uid) || false;
              return (
                <button
                  key={student.uid}
                  type="button"
                  onClick={() => handleStudentToggle(student.uid)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isSelected
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isSelected ? 'white' : AppColors.textPrimary,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? '✓' : student.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    style={{
                      color: isSelected ? 'white' : AppColors.textPrimary,
                      fontSize: 'clamp(13px, 2.8vw, 14px)',
                      fontWeight: 500,
                    }}
                  >
                    {student.displayName}
                  </span>
                </button>
              );
            })}
          </div>

          {hasAssignedStudents && (
            <div
              style={{
                marginTop: '14px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 13px)',
                  color: AppColors.textSecondary,
                }}
              >
                Only these students will see this lesson
              </span>
              <button
                type="button"
                onClick={handleClearAssignments}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 8px',
                  color: AppColors.textSecondary,
                  fontSize: 'clamp(12px, 2.5vw, 13px)',
                  cursor: 'pointer',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Generate summary for collapsed edit mode
 */
export function getAudienceSummary(formData: LessonFormData): string {
  const parts: string[] = [];

  parts.push(formData.targetLevel || 'All levels');

  if (formData.showOnHomepage !== false) {
    parts.push('Homepage');
  }

  const assignedCount = formData.assignedStudentIds?.length || 0;
  if (assignedCount > 0) {
    parts.push(`${assignedCount} student${assignedCount !== 1 ? 's' : ''} assigned`);
  }

  return parts.join(' · ');
}
