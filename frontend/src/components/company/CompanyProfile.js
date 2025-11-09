// frontend/src/components/company/CompanyProfile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import './Company.css';

const CompanyProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    location: '',
    description: '',
    logo: '',
    contactInfo: {
      phone: '',
      website: '',
      email: ''
    }
  });

  useEffect(() => {
    fetchCompanyProfile();
  }, [currentUser]);

  const fetchCompanyProfile = async () => {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', currentUser.uid));
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        setFormData({
          companyName: data.companyName || '',
          industry: data.industry || '',
          location: data.location || '',
          description: data.description || '',
          logo: data.logo || '',
          contactInfo: {
            phone: data.contactInfo?.phone || '',
            website: data.contactInfo?.website || '',
            email: data.contactInfo?.email || ''
          }
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, 'companies', currentUser.uid), {
        companyName: formData.companyName,
        industry: formData.industry,
        location: formData.location,
        description: formData.description,
        logo: formData.logo,
        contactInfo: formData.contactInfo,
        updatedAt: new Date()
      });

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="company-profile-container">
      <div className="profile-header">
        <h1>Company Profile</h1>
        <p>Update your company information</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h2>Company Information</h2>

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

          <div className="form-row">
            <div className="form-group">
              <label>Industry *</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                placeholder="e.g., Technology, Finance"
              />
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., Maseru, Lesotho"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Company Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Tell us about your company..."
            />
          </div>

          <div className="form-group">
            <label>Logo URL</label>
            <input
              type="url"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
            />
            {formData.logo && (
              <div className="logo-preview">
                <img src={formData.logo} alt="Company Logo" />
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Contact Information</h2>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleChange}
              required
              placeholder="contact@company.com"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleChange}
                placeholder="+266 XXXX XXXX"
              />
            </div>

            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="contactInfo.website"
                value={formData.contactInfo.website}
                onChange={handleChange}
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfile;