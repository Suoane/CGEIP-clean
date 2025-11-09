// frontend/src/components/institute/InstituteProfile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import './Institute.css';

const InstituteProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    description: '',
    logo: '',
    contactInfo: {
      phone: '',
      website: '',
      address: ''
    }
  });

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const institutionDoc = await getDoc(doc(db, 'institutions', currentUser.uid));
      if (institutionDoc.exists()) {
        const data = institutionDoc.data();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          location: data.location || '',
          description: data.description || '',
          logo: data.logo || '',
          contactInfo: {
            phone: data.contactInfo?.phone || '',
            website: data.contactInfo?.website || '',
            address: data.contactInfo?.address || ''
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
      await updateDoc(doc(db, 'institutions', currentUser.uid), {
        name: formData.name,
        email: formData.email,
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
    <div className="institute-profile-container">
      <div className="profile-header">
        <h1>Institution Profile</h1>
        <p>Update your institution information</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label>Institution Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter institution name"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="contact@institution.edu"
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
              placeholder="e.g., Roma, Maseru"
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
                <img src={formData.logo} alt="Institution Logo" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Tell us about your institution..."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Contact Information</h2>

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
              placeholder="https://www.institution.edu"
            />
          </div>

          <div className="form-group">
            <label>Physical Address</label>
            <textarea
              name="contactInfo.address"
              value={formData.contactInfo.address}
              onChange={handleChange}
              rows="3"
              placeholder="Full physical address"
            />
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

export default InstituteProfile;