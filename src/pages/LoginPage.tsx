import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { signInWithEmail } from '../services/firebase/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);

      // Check for saved return URL (e.g., from join-class link)
      const returnUrl = sessionStorage.getItem('authReturnUrl');
      sessionStorage.removeItem('authReturnUrl');

      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
          maxWidth: '400px',
          background: AppColors.surfaceDark,
          borderRadius: 'clamp(16px, 4vw, 24px)',
          padding: 'clamp(24px, 6vw, 40px)',
          border: `1px solid ${AppColors.borderColor}`,
        }}
      >
        {/* Logo/Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
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
            Welcome Back
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: AppColors.textSecondary,
              margin: 'clamp(8px, 2vw, 12px) 0 0 0',
            }}
          >
            Sign in to continue your learning journey
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
          {/* Email Field */}
          <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
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
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = AppColors.accentPurple)}
              onBlur={(e) => (e.target.style.borderColor = AppColors.borderColor)}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 'clamp(24px, 6vw, 32px)' }}>
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
              placeholder="Enter your password"
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
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = AppColors.accentPurple)}
              onBlur={(e) => (e.target.style.borderColor = AppColors.borderColor)}
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'clamp(20px, 5vw, 28px)',
            fontSize: 'clamp(14px, 3.5vw, 15px)',
            color: AppColors.textSecondary,
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: AppColors.accentPurple,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
