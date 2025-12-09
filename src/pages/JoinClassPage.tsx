import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { validateClassCode, assignStudentToTeacher } from '../services/firebase/classCode';

const JoinClassPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [teacherInfo, setTeacherInfo] = useState<{ teacherId: string; teacherName: string } | null>(null);

  // Redirect if already has teacherId
  useEffect(() => {
    if (userDocument?.teacherId) {
      // Already has a teacher, redirect to appropriate page
      if (userDocument.level) {
        navigate('/');
      } else {
        navigate('/select-level');
      }
    }
  }, [userDocument, navigate]);

  // Debounced validation of class code
  const validateCode = useCallback(async (code: string) => {
    if (code.length < 6) {
      setTeacherInfo(null);
      setError('');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const result = await validateClassCode(code);
      if (result) {
        setTeacherInfo(result);
        setError('');
      } else {
        setTeacherInfo(null);
        setError('Invalid class code. Please check with your teacher.');
      }
    } catch (err) {
      console.error('Error validating code:', err);
      setTeacherInfo(null);
      setError('Error validating code. Please try again.');
    } finally {
      setValidating(false);
    }
  }, []);

  // Debounce the validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (classCode.length >= 6) {
        validateCode(classCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [classCode, validateCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setClassCode(value);
    if (value.length < 6) {
      setTeacherInfo(null);
      setError('');
    }
  };

  const handleJoinClass = async () => {
    if (!teacherInfo || !user) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await assignStudentToTeacher(user.uid, teacherInfo.teacherId, teacherInfo.teacherName);
      navigate('/select-level');
    } catch (err: any) {
      setError(err.message || 'Failed to join class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: gradientBackground,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: AppColors.surfaceDark,
          borderRadius: 'clamp(16px, 4vw, 24px)',
          padding: 'clamp(24px, 6vw, 40px)',
          border: `1px solid ${AppColors.borderColor}`,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 56px)',
              marginBottom: 'clamp(8px, 2vw, 12px)',
            }}
          >
            🏫
          </div>
          <h1
            style={{
              fontSize: 'clamp(22px, 5.5vw, 28px)',
              fontWeight: 700,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            Join Your Class
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: AppColors.textSecondary,
              margin: 'clamp(8px, 2vw, 12px) 0 0 0',
            }}
          >
            Enter the 6-digit class code from your teacher
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: 'clamp(10px, 2.5vw, 14px)',
              background: 'rgba(248, 113, 113, 0.15)',
              border: `1px solid ${AppColors.errorRose}`,
              borderRadius: 'clamp(8px, 2vw, 12px)',
              marginBottom: 'clamp(16px, 4vw, 20px)',
              color: AppColors.errorRose,
              fontSize: 'clamp(13px, 3vw, 14px)',
            }}
          >
            {error}
          </div>
        )}

        {/* Class Code Input */}
        <div style={{ marginBottom: 'clamp(16px, 4vw, 24px)' }}>
          <label
            style={{
              display: 'block',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              fontWeight: 500,
              color: AppColors.textSecondary,
              marginBottom: 'clamp(6px, 1.5vw, 8px)',
            }}
          >
            Class Code
          </label>
          <input
            type="text"
            value={classCode}
            onChange={handleCodeChange}
            placeholder="ABC123"
            autoFocus
            autoComplete="off"
            style={{
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 18px)',
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 700,
              letterSpacing: '0.3em',
              textAlign: 'center',
              background: AppColors.surfaceLight,
              border: `2px solid ${teacherInfo ? AppColors.successGreen : classCode.length === 6 && !validating && !teacherInfo ? AppColors.errorRose : AppColors.borderColor}`,
              borderRadius: 'clamp(10px, 2.5vw, 12px)',
              color: AppColors.textPrimary,
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Validation Status */}
        {validating && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: 'clamp(12px, 3vw, 16px)',
              background: AppColors.surfaceLight,
              borderRadius: 'clamp(8px, 2vw, 12px)',
              marginBottom: 'clamp(16px, 4vw, 20px)',
              color: AppColors.textSecondary,
              fontSize: 'clamp(14px, 3.5vw, 16px)',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${AppColors.accentPurple}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            Checking code...
          </div>
        )}

        {/* Teacher Info - Success State */}
        {teacherInfo && !validating && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px, 3vw, 16px)',
              padding: 'clamp(14px, 3.5vw, 18px)',
              background: 'rgba(76, 175, 80, 0.15)',
              border: `1px solid ${AppColors.successGreen}`,
              borderRadius: 'clamp(10px, 2.5vw, 12px)',
              marginBottom: 'clamp(16px, 4vw, 20px)',
            }}
          >
            <div
              style={{
                width: 'clamp(40px, 10vw, 48px)',
                height: 'clamp(40px, 10vw, 48px)',
                borderRadius: '50%',
                background: AppColors.successGreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(20px, 5vw, 24px)',
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div>
              <div
                style={{
                  fontSize: 'clamp(13px, 3vw, 14px)',
                  color: AppColors.textSecondary,
                  marginBottom: '2px',
                }}
              >
                Joining class with
              </div>
              <div
                style={{
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: 600,
                  color: AppColors.textPrimary,
                }}
              >
                {teacherInfo.teacherName}
              </div>
            </div>
          </div>
        )}

        {/* Join Button */}
        <button
          type="button"
          onClick={handleJoinClass}
          disabled={loading || !teacherInfo}
          style={{
            width: '100%',
            height: 'clamp(48px, 12vw, 56px)',
            background:
              loading || !teacherInfo
                ? AppColors.surfaceMedium
                : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
            border: 'none',
            borderRadius: 'clamp(10px, 2.5vw, 12px)',
            color: loading || !teacherInfo ? AppColors.textSecondary : AppColors.textDark,
            fontSize: 'clamp(15px, 3.5vw, 17px)',
            fontWeight: 600,
            cursor: loading || !teacherInfo ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: loading || !teacherInfo ? 0.7 : 1,
          }}
        >
          {loading ? 'Joining...' : 'Join Class'}
        </button>

        {/* Help Text */}
        <p
          style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: AppColors.textSecondary,
            textAlign: 'center',
            marginTop: 'clamp(16px, 4vw, 20px)',
            lineHeight: 1.5,
          }}
        >
          Don't have a class code? Ask your teacher for the 6-digit code to join their class.
        </p>
      </div>

      {/* Spinning animation keyframes */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default JoinClassPage;
