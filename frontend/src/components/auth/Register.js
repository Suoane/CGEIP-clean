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
    
    // Prevent numbers in firstName and lastName
    if ((name === 'firstName' || name === 'lastName') && /\d/.test(value)) {
      // Remove any numbers from the input
      const filteredValue = value.replace(/\d/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address!');
      return false;
    }

    // Password strength validation
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return false;
    }

    // Check for password complexity (at least one uppercase, one lowercase, one number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number!');
      return false;
    }

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return false;
    }

    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.firstName || formData.firstName.trim() === '') {
        toast.error('Please enter your first name!');
        return false;
      }
      if (!formData.lastName || formData.lastName.trim() === '') {
        toast.error('Please enter your last name!');
        return false;
      }
      if (formData.firstName.length < 2) {
        toast.error('First name must be at least 2 characters!');
        return false;
      }
      if (formData.lastName.length < 2) {
        toast.error('Last name must be at least 2 characters!');
        return false;
      }
    }

    if (formData.role === 'company') {
      if (!formData.companyName || formData.companyName.trim() === '') {
        toast.error('Please enter your company name!');
        return false;
      }
      if (formData.companyName.length < 2) {
        toast.error('Company name must be at least 2 characters!');
        return false;
      }
    }

    if (formData.role === 'institute') {
      if (!formData.institutionName || formData.institutionName.trim() === '') {
        toast.error('Please enter your institution name!');
        return false;
      }
      if (formData.institutionName.length < 2) {
        toast.error('Institution name must be at least 2 characters!');
        return false;
      }
    }

    // Phone validation if provided
    if (formData.phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast.error('Please enter a valid phone number!');
        return false;
      }
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