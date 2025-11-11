// frontend/src/components/auth/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { applyActionCode, reload } from 'firebase/auth';
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
      const actionCode = searchParams.get('oobCode');
      
      if (!actionCode) {
        setError('Invalid verification link. Please request a new verification email.');
        setVerifying(false);
        return;
      }

      // Call backend to verify and update Firestore
      const response = await api.post('/auth/verify-email', { oobCode: actionCode });

      if (response.data.emailVerified) {
        setVerified(true);
        toast.success('Email verified successfully! You can now login.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Failed to verify email. ';
      
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message.includes('expired')) {
        errorMessage += 'The verification link has expired. Please request a new one.';
      } else if (error.message.includes('invalid')) {
        errorMessage += 'The verification link is invalid. Please request a new one.';
      } else {
        errorMessage += error.message;
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
              <div className="loading">Please wait while we verify your email address.</div>
            </div>
          </>
        ) : verified ? (
          <>
            <div style={{ textAlign: 'center', fontSize: '4rem', color: '#10b981' }}>
              ✓
            </div>
            <h2 style={{ color: '#10b981' }}>Email Verified!</h2>
            <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '1rem' }}>
              Your email has been successfully verified. You will be redirected to the login page in a few seconds.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ marginTop: '2rem' }}
            >
              Go to Login Now
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', fontSize: '4rem', color: '#ef4444' }}>
              ✕
            </div>
            <h2 style={{ color: '#ef4444' }}>Verification Failed</h2>
            <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '1rem' }}>
              {error}
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={handleResendVerification}
                className="btn-primary"
              >
                Resend Verification Email
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-secondary"
                style={{ padding: '0.75rem' }}
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