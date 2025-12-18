import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppColors } from '../theme/colors';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for the chat system.
 * Catches JavaScript errors in child components and displays a fallback UI.
 */
export class ChatErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChatErrorBoundary] Uncaught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    // Clear any stale session data before navigating
    sessionStorage.removeItem('currentRole');
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>⚠️</span>
            </div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              We encountered an error during your session. Your progress has been saved.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={styles.errorDetails}>
                {this.state.error.message}
              </pre>
            )}
            <div style={styles.buttonContainer}>
              <button onClick={this.handleRetry} style={styles.retryButton}>
                Try Again
              </button>
              <button onClick={this.handleGoHome} style={styles.homeButton}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: AppColors.bgPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'rgba(30, 27, 75, 0.9)',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '400px',
    textAlign: 'center' as const,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  icon: {
    fontSize: '48px',
  },
  title: {
    color: '#fff',
    fontSize: '24px',
    marginBottom: '12px',
    fontWeight: '600',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '16px',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  errorDetails: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '24px',
    color: '#ef4444',
    fontSize: '12px',
    textAlign: 'left' as const,
    overflow: 'auto',
    maxHeight: '100px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  homeButton: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'transparent',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default ChatErrorBoundary;
