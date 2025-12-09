import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { signUpWithEmail } from '../services/firebase/auth';
import { UserRole } from '../types/firestore';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email, password, name.trim(), role);

      // If student, go to join class; if teacher, go to dashboard
      if (role === 'student') {
        navigate('/join-class');
      } else {
        navigate('/teacher');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
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
          maxWidth: '400px',
          background: AppColors.surfaceDark,
          borderRadius: 'clamp(16px, 4vw, 24px)',
          padding: 'clamp(24px, 6vw, 40px)',
          border: `1px solid ${AppColors.borderColor}`,
        }}
      >
        {/* Logo/Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 5vw, 28px)' }}>
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 56px)',
              marginBottom: 'clamp(8px, 2vw, 12px)',
            }}
          >
            🎓
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 700,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            Create Account
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: AppColors.textSecondary,
              margin: 'clamp(8px, 2vw, 12px) 0 0 0',
            }}
          >
            Start your English learning journey
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(13px, 3vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(8px, 2vw, 10px)',
              }}
            >
              I am a...
            </label>
            <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)' }}>
              <button
                type="button"
                onClick={() => setRole('student')}
                style={{
                  flex: 1,
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: role === 'student' ? AppColors.surfaceMedium : AppColors.surfaceLight,
                  border: `2px solid ${role === 'student' ? AppColors.accentPurple : AppColors.borderColor}`,
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '4px' }}>📚</div>
                <div
                  style={{
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    fontWeight: 600,
                    color: role === 'student' ? AppColors.textPrimary : AppColors.textSecondary,
                  }}
                >
                  Student
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                style={{
                  flex: 1,
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: role === 'teacher' ? AppColors.surfaceMedium : AppColors.surfaceLight,
                  border: `2px solid ${role === 'teacher' ? AppColors.accentPurple : AppColors.borderColor}`,
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '4px' }}>👩‍🏫</div>
                <div
                  style={{
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    fontWeight: 600,
                    color: role === 'teacher' ? AppColors.textPrimary : AppColors.textSecondary,
                  }}
                >
                  Teacher
                </div>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(13px, 3vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              style={{
                width: '100%',
                height: 'clamp(44px, 10vw, 52px)',
                background: AppColors.surfaceLight,
                border: `1px solid ${AppColors.borderColor}`,
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: '0 clamp(14px, 3.5vw, 18px)',
                color: AppColors.textPrimary,
                fontSize: 'clamp(15px, 3.5vw, 16px)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(13px, 3vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                height: 'clamp(44px, 10vw, 52px)',
                background: AppColors.surfaceLight,
                border: `1px solid ${AppColors.borderColor}`,
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: '0 clamp(14px, 3.5vw, 18px)',
                color: AppColors.textPrimary,
                fontSize: 'clamp(15px, 3.5vw, 16px)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(13px, 3vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              style={{
                width: '100%',
                height: 'clamp(44px, 10vw, 52px)',
                background: AppColors.surfaceLight,
                border: `1px solid ${AppColors.borderColor}`,
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: '0 clamp(14px, 3.5vw, 18px)',
                color: AppColors.textPrimary,
                fontSize: 'clamp(15px, 3.5vw, 16px)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(13px, 3vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              style={{
                width: '100%',
                height: 'clamp(44px, 10vw, 52px)',
                background: AppColors.surfaceLight,
                border: `1px solid ${AppColors.borderColor}`,
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: '0 clamp(14px, 3.5vw, 18px)',
                color: AppColors.textPrimary,
                fontSize: 'clamp(15px, 3.5vw, 16px)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 'clamp(48px, 12vw, 56px)',
              background: loading
                ? AppColors.surfaceMedium
                : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              border: 'none',
              borderRadius: 'clamp(10px, 2.5vw, 12px)',
              color: loading ? AppColors.textSecondary : AppColors.textDark,
              fontSize: 'clamp(15px, 3.5vw, 17px)',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'clamp(20px, 5vw, 28px)',
            fontSize: 'clamp(14px, 3.5vw, 15px)',
            color: AppColors.textSecondary,
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: AppColors.accentPurple,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
