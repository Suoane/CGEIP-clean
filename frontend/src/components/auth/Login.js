// frontend/src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const { login, resendVerification } = useAuth();

  // Show success message if coming from email verification
  useEffect(() => {
    if (location.state?.verified && location.state?.message) {
      toast.success(location.state.message);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address!');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      toast.error('Please enter a valid password (minimum 6 characters)!');
      return;
    }

    setLoading(true);
    setNeedsVerification(false);

    try {
      const result = await login(email, password);
      
      if (result) {
        // Navigate based on role
        switch (result.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'institute':
            navigate('/institute/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          case 'company':
            navigate('/company/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // Check if error is due to unverified email
      if (error.message && error.message.includes('verify')) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.warning('Please enter your email address first');
      return;
    }

    setResendingVerification(true);
    try {
      await resendVerification(email);
    } catch (error) {
      console.error('Error resending verification:', error);
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        {needsVerification && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 1rem 0', color: '#92400e', fontWeight: '600' }}>
              ⚠️ Email Not Verified
            </p>
            <p style={{ margin: '0 0 1rem 0', color: '#92400e', fontSize: '0.875rem' }}>
              Please check your email and click the verification link to activate your account.
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              style={{
                padding: '0.5rem 1rem',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;