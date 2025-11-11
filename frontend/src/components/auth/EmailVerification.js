// frontend/src/components/auth/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      const oobCode = searchParams.get('oobCode');
      const mode = searchParams.get('mode');
      
      if (!oobCode) {
        setError('Invalid verification link. Please request a new verification email.');
        setVerifying(false);
        return;
      }

      if (mode !== 'verifyEmail') {
        setError('Invalid verification mode.');
        setVerifying(false);
        return;
      }

      console.log('🔄 Starting email verification...');

      // Let backend handle EVERYTHING - it has admin privileges
      const response = await api.post('/auth/verify-email', { oobCode });
      console.log('✅ Verification response:', response.data);

      if (response.data.emailVerified) {
        setVerified(true);
        toast.success('🎉 Email verified successfully! Redirecting to login...');
        
        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email verified! You can now log in.',
              verified: true 
            } 
          });
        }, 2000);
      } else {
        throw new Error('Verification completed but status not updated');
      }

    } catch (error) {
      console.error('❌ Verification error:', error);
      
      let errorMessage = 'Failed to verify email. ';
      
      // Handle backend error responses
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    const email = prompt('Please enter your email address:');
    
    if (!email) return;

    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send verification email';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {verifying ? (
          <>
            <h2>Verifying Your Email...</h2>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  border: '6px solid #f3f4f6',
                  borderTop: '6px solid #3b82f6',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Please wait while we verify your email address...
              </div>
            </div>
          </>
        ) : verified ? (
          <>
            <div style={{ 
              textAlign: 'center', 
              fontSize: '5rem', 
              color: '#10b981',
              marginBottom: '1rem'
            }}>
              ✓
            </div>
            <h2 style={{ color: '#10b981', textAlign: 'center' }}>
              Email Verified Successfully!
            </h2>
            <p style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              marginTop: '1rem',
              fontSize: '1.125rem'
            }}>
              Your email has been verified. Redirecting you to login...
            </p>
            <div style={{ 
              textAlign: 'center', 
              marginTop: '2rem',
              padding: '1rem',
              background: '#d1fae5',
              borderRadius: '8px',
              color: '#065f46'
            }}>
              <p style={{ margin: 0, fontWeight: '600' }}>
                🎉 You can now access all features!
              </p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ marginTop: '2rem' }}
            >
              Go to Login Now →
            </button>
          </>
        ) : (
          <>
            <div style={{ 
              textAlign: 'center', 
              fontSize: '5rem', 
              color: '#ef4444',
              marginBottom: '1rem'
            }}>
              ✕
            </div>
            <h2 style={{ color: '#ef4444', textAlign: 'center' }}>
              Verification Failed
            </h2>
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <p style={{ 
                textAlign: 'center', 
                color: '#991b1b', 
                margin: 0,
                fontSize: '0.95rem'
              }}>
                {error}
              </p>
            </div>
            <div style={{ 
              marginTop: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem' 
            }}>
              <button 
                onClick={handleResendVerification}
                className="btn-primary"
              >
                📧 Resend Verification Email
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-secondary"
                style={{ 
                  padding: '0.75rem',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#374151'
                }}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;