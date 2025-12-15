/**
 * Account Settings Page
 * Allows users to change email and password with security verification
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { ChevronLeftIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import {
  reauthenticateUser,
  updateUserEmail,
  updateUserPassword,
} from '../services/firebase/auth';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleEmailChange = async () => {
    if (!user?.email || !newEmail || !emailPassword) return;

    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess(false);

    try {
      await reauthenticateUser(user.email, emailPassword);
      await updateUserEmail(newEmail);
      setEmailSuccess(true);
      setNewEmail('');
      setEmailPassword('');
    } catch (error: any) {
      setEmailError(error.message || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user?.email || !currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      await reauthenticateUser(user.email, currentPassword);
      await updateUserPassword(newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: AppColors.textPrimary,
    fontSize: '15px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: AppColors.textSecondary,
    marginBottom: '8px',
  };

  const buttonStyles = (disabled: boolean, loading: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 20px',
    borderRadius: '12px',
    border: 'none',
    background: disabled || loading
      ? 'rgba(255, 255, 255, 0.1)'
      : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
    color: disabled || loading ? 'rgba(255, 255, 255, 0.4)' : '#000',
    fontSize: '15px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: loading ? 0.7 : 1,
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: AppColors.bgPrimary,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        .account-content::-webkit-scrollbar { width: 0; display: none; }
        .account-content { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .account-content { max-width: 540px; margin: 0 auto; }
        }
        input:focus {
          border-color: ${AppColors.accentPurple} !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2) !important;
        }
      `}</style>

      {/* Scrollable content */}
      <div
        className="account-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: AppColors.textPrimary,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <ChevronLeftIcon size={24} />
          </button>
          <h1 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
          }}>
            Account Security
          </h1>
        </div>

        {/* Content */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Current Email Display */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <p style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 500,
              color: AppColors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}>
              Current Email
            </p>
            <p style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 500,
              color: AppColors.textPrimary,
            }}>
              {user?.email}
            </p>
          </div>

          {/* Change Email Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: AppColors.textPrimary,
            }}>
              Change Email
            </h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyles}>New Email Address</label>
              <input
                type="email"
                placeholder="Enter new email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyles}>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                style={inputStyles}
              />
            </div>

            {emailError && (
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: AppColors.errorRose,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                {emailError}
              </p>
            )}

            {emailSuccess && (
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: AppColors.successGreen,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                Email updated successfully!
              </p>
            )}

            <button
              onClick={handleEmailChange}
              disabled={!newEmail || !emailPassword || emailLoading}
              style={buttonStyles(!newEmail || !emailPassword, emailLoading)}
            >
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </div>

          {/* Change Password Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: AppColors.textPrimary,
            }}>
              Change Password
            </h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyles}>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyles}>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyles}>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyles}
              />
            </div>

            {passwordError && (
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: AppColors.errorRose,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: AppColors.successGreen,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                Password updated successfully!
              </p>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword || passwordLoading}
              style={buttonStyles(!currentPassword || !newPassword || !confirmPassword, passwordLoading)}
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          {/* Security Info */}
          <div style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: AppColors.textSecondary,
              lineHeight: 1.5,
            }}>
              For your security, you must enter your current password to make changes to your account credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
