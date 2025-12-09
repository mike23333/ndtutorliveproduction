import React from 'react';
import { AppColors } from '../../theme/colors';
import type { SystemTemplateDocument } from '../../types/firestore';

interface TemplatesTabProps {
  reviewTemplate: SystemTemplateDocument | null;
  editedTemplate: string;
  onTemplateChange: (template: string) => void;
  onSave: () => void;
  onReset: () => void;
  loading: boolean;
  saving: boolean;
  hasChanges: boolean;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  reviewTemplate,
  editedTemplate,
  onTemplateChange,
  onSave,
  onReset,
  loading,
  saving,
  hasChanges,
}) => {
  const handleSave = async () => {
    try {
      await onSave();
      alert('Template saved successfully!');
    } catch {
      alert('Failed to save template. Please try again.');
    }
  };

  return (
    <div>
      <h2
        style={{
          fontSize: 'clamp(16px, 3.5vw, 18px)',
          fontWeight: 600,
          marginBottom: 'clamp(12px, 3vw, 16px)',
        }}
      >
        System Templates
      </h2>

      {/* Weekly Review Meta-Prompt Editor */}
      <div
        style={{
          background: AppColors.surfaceLight,
          borderRadius: 'clamp(12px, 3vw, 16px)',
          padding: 'clamp(16px, 4vw, 24px)',
          marginBottom: 'clamp(16px, 4vw, 20px)',
        }}
      >
        <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
          <h3
            style={{
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              margin: '0 0 clamp(4px, 1vw, 6px) 0',
              color: AppColors.textPrimary,
            }}
          >
            Weekly Review Generation Prompt
          </h3>
          <p
            style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            This template is sent to Gemini to generate personalized weekly review conversations for students.
          </p>
        </div>

        {/* Placeholder info */}
        <div
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: 'clamp(8px, 2vw, 10px)',
            padding: 'clamp(10px, 2.5vw, 14px)',
            marginBottom: 'clamp(12px, 3vw, 16px)',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: AppColors.accentPurple,
              margin: '0 0 clamp(6px, 1.5vw, 8px) 0',
              fontWeight: 600,
            }}
          >
            Available Placeholders:
          </p>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 10px)', flexWrap: 'wrap' }}>
            <code
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textPrimary,
              }}
            >
              {'{{level}}'}
            </code>
            <span style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary }}>
              Student's CEFR level (A1-C2)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 10px)', flexWrap: 'wrap', marginTop: '6px' }}>
            <code
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textPrimary,
              }}
            >
              {'{{struggles}}'}
            </code>
            <span style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary }}>
              List of words the student struggled with
            </span>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'clamp(20px, 5vw, 40px)',
              color: AppColors.textSecondary,
            }}
          >
            Loading template...
          </div>
        ) : (
          <>
            <textarea
              value={editedTemplate}
              onChange={(e) => onTemplateChange(e.target.value)}
              style={{
                width: '100%',
                minHeight: 'clamp(250px, 40vh, 400px)',
                background: AppColors.surfaceMedium,
                border: `1px solid ${AppColors.borderColor}`,
                borderRadius: 'clamp(8px, 2vw, 12px)',
                padding: 'clamp(12px, 3vw, 16px)',
                color: AppColors.textPrimary,
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'clamp(12px, 3vw, 16px)',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(11px, 2.2vw, 12px)',
                  color: AppColors.textSecondary,
                }}
              >
                {reviewTemplate?.updatedBy && (
                  <>Last updated by: {reviewTemplate.updatedBy}</>
                )}
              </span>

              <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)' }}>
                <button
                  onClick={onReset}
                  disabled={!hasChanges}
                  style={{
                    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                    background: AppColors.surfaceMedium,
                    border: `1px solid ${AppColors.borderColor}`,
                    borderRadius: 'clamp(8px, 2vw, 10px)',
                    color: AppColors.textSecondary,
                    fontSize: 'clamp(13px, 2.8vw, 14px)',
                    fontWeight: 500,
                    cursor: !hasChanges ? 'not-allowed' : 'pointer',
                    opacity: !hasChanges ? 0.5 : 1,
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  style={{
                    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                    background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                    border: 'none',
                    borderRadius: 'clamp(8px, 2vw, 10px)',
                    color: AppColors.textDark,
                    fontSize: 'clamp(13px, 2.8vw, 14px)',
                    fontWeight: 600,
                    cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
                    opacity: saving || !hasChanges ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
