import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { validateClassCode, assignStudentToTeacher } from '../services/firebase/classCode';
import {
  validatePrivateStudentCode,
  usePrivateStudentCode,
  assignPrivateStudentToTeacher
} from '../services/firebase/privateStudentCode';

const JoinClassPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userDocument } = useAuth();
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [teacherInfo, setTeacherInfo] = useState<{
    teacherId: string;
    teacherName: string;
    isPrivate?: boolean;
    codeId?: string;
  } | null>(null);
  const hasAutoFilledRef = useRef(false);

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

  // Auto-fill code from URL params or sessionStorage (for shareable links)
  useEffect(() => {
    if (hasAutoFilledRef.current) return;

    // First priority: URL param
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      hasAutoFilledRef.current = true;
      const normalizedCode = codeFromUrl.toUpperCase();
      setClassCode(normalizedCode);
      // Save to sessionStorage so it survives auth redirect
      sessionStorage.setItem('pendingClassCode', normalizedCode);
      return;
    }

    // Second priority: sessionStorage (recovered after auth redirect)
    const savedCode = sessionStorage.getItem('pendingClassCode');
    if (savedCode) {
      hasAutoFilledRef.current = true;
      setClassCode(savedCode);
      // Clear it after use
      sessionStorage.removeItem('pendingClassCode');
    }
  }, [searchParams]);

  // Check if code looks like a private code (PRV-XXXXXX format)
  const isPrivateCodeFormat = (code: string): boolean => {
    return code.toUpperCase().startsWith('PRV-') && code.length === 10;
  };

  // Debounced validation of class code (supports both group and private codes)
  const validateCode = useCallback(async (code: string) => {
    const normalized = code.toUpperCase().trim();

    // Private codes need exactly 10 chars (PRV-XXXXXX)
    // Group codes need exactly 6 chars
    const isPrivateFormat = normalized.startsWith('PRV-');
    const minLength = isPrivateFormat ? 10 : 6;

    if (normalized.length < minLength) {
      setTeacherInfo(null);
      setError('');
      return;
    }

    setValidating(true);
    setError('');

    try {
      if (isPrivateCodeFormat(normalized)) {
        // Validate as private code
        const result = await validatePrivateStudentCode(normalized);
        if (result && result.isValid) {
          setTeacherInfo({
            teacherId: result.teacherId,
            teacherName: result.teacherName,
            isPrivate: true,
            codeId: result.codeId,
          });
          setError('');
        } else {
          setTeacherInfo(null);
          setError('Invalid private code. Please check with your teacher.');
        }
      } else if (normalized.length === 6) {
        // Validate as group class code
        const result = await validateClassCode(normalized);
        if (result) {
          setTeacherInfo({ ...result, isPrivate: false });
          setError('');
        } else {
          setTeacherInfo(null);
          setError('Invalid class code. Please check with your teacher.');
        }
      } else {
        setTeacherInfo(null);
        setError('Invalid code format.');
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
      const normalized = classCode.toUpperCase();
      // Validate when we have enough characters for either code type
      const isPrivateFormat = normalized.startsWith('PRV-');
      const minLength = isPrivateFormat ? 10 : 6;
      if (classCode.length >= minLength) {
        validateCode(classCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [classCode, validateCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow alphanumeric and hyphens (for private codes like PRV-ABC123)
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10);
    setClassCode(value);

    // Reset state when code is incomplete
    const isPrivateFormat = value.startsWith('PRV-');
    const minLength = isPrivateFormat ? 10 : 6;
    if (value.length < minLength) {
      setTeacherInfo(null);
      setError('');
    }
  };

  const handleJoinClass = async () => {
    if (!teacherInfo || !user || !userDocument) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (teacherInfo.isPrivate && teacherInfo.codeId) {
        // Private tutoring: mark code as used and assign with private flag
        await usePrivateStudentCode(teacherInfo.codeId, user.uid, userDocument.displayName);
        await assignPrivateStudentToTeacher(
          user.uid,
          teacherInfo.teacherId,
          teacherInfo.teacherName,
          teacherInfo.codeId
        );
        // Private students also need to select their level
        navigate('/select-level');
      } else {
        // Group class: standard assignment
        await assignStudentToTeacher(user.uid, teacherInfo.teacherId, teacherInfo.teacherName);
        navigate('/select-level');
      }
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
        background: AppColors.bgPrimary,
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
            Enter your class code or private tutoring code
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
            placeholder="ABC123 or PRV-ABC123"
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
              border: `2px solid ${teacherInfo ? AppColors.successGreen : ((classCode.length === 6 || classCode.length === 10) && !validating && !teacherInfo) ? AppColors.errorRose : AppColors.borderColor}`,
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
                {teacherInfo.isPrivate ? 'Private tutoring with' : 'Joining class with'}
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
          {loading ? 'Joining...' : teacherInfo?.isPrivate ? 'Start Private Tutoring' : 'Join Class'}
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
          Don't have a code? Ask your teacher for a class code (6 digits) or private tutoring code (PRV-XXXXXX).
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
