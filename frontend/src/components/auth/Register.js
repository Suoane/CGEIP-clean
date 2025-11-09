// frontend/src/components/auth/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    firstName: '',
    lastName: '',
    companyName: '',
    institutionName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return false;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address!');
      return false;
    }

    // Role-specific validation
    if (formData.role === 'student' && (!formData.firstName || !formData.lastName)) {
      toast.error('Please enter your first and last name!');
      return false;
    }

    if (formData.role === 'company' && !formData.companyName) {
      toast.error('Please enter your company name!');
      return false;
    }

    if (formData.role === 'institute' && !formData.institutionName) {
      toast.error('Please enter your institution name!');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare registration data based on role
      let registrationData = {
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      if (formData.role === 'student') {
        registrationData.personalInfo = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || ''
        };
      } else if (formData.role === 'company') {
        registrationData.companyName = formData.companyName;
        registrationData.contactInfo = {
          email: formData.email,
          phone: formData.phone || ''
        };
        registrationData.industry = '';
        registrationData.location = '';
        registrationData.description = '';
      } else if (formData.role === 'institute') {
        registrationData.name = formData.institutionName;
        registrationData.contactInfo = {
          email: formData.email,
          phone: formData.phone || ''
        };
        registrationData.location = '';
        registrationData.description = '';
      }

      // Call backend registration API
      const response = await api.post('/auth/register', registrationData);

      if (response.data) {
        toast.success('Registration successful! Please check your email to verify your account.');
        
        // Clear form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          role: 'student',
          firstName: '',
          lastName: '',
          companyName: '',
          institutionName: '',
          phone: ''
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
          
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="institute">Institution</option>
              <option value="company">Company</option>
            </select>
          </div>

          {/* Student Fields */}
          {formData.role === 'student' && (
            <>
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your last name"
                />
              </div>
            </>
          )}

          {/* Company Fields */}
          {formData.role === 'company' && (
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                placeholder="Enter company name"
              />
            </div>
          )}

          {/* Institute Fields */}
          {formData.role === 'institute' && (
            <div className="form-group">
              <label>Institution Name *</label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                required
                placeholder="Enter institution name"
              />
            </div>
          )}

          {/* Common Fields */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+266 XXXX XXXX"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter password (min 6 characters)"
            />
            <small>Password must be at least 6 characters long</small>
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;