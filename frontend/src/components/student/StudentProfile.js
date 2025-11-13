// frontend/src/components/student/StudentProfile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Student.css';

const StudentProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [studentData, setStudentData] = useState(null);
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: ''
    },
    academicInfo: {
      previousSchool: '',
      graduationYear: '',
      grades: {}
    }
  });

  // For completion documents
  const [completionFiles, setCompletionFiles] = useState({
    transcript: null,
    certificates: []
  });
  const [completionData, setCompletionData] = useState({
    gpa: '',
    fieldOfStudy: '',
    institutionId: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setStudentData(data);
        setFormData({
          personalInfo: data.personalInfo || {
            firstName: '',
            lastName: '',
            email: currentUser.email,
            phone: '',
            dateOfBirth: '',
            gender: '',
            address: ''
          },
          academicInfo: data.academicInfo || {
            previousSchool: '',
            graduationYear: '',
            grades: {}
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

  const handleChange = (e, section) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, 'students', currentUser.uid), {
        personalInfo: formData.personalInfo,
        academicInfo: formData.academicInfo,
        updatedAt: new Date()
      });

      toast.success('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCompletionFileChange = (e, type) => {
    const files = e.target.files;
    
    if (type === 'certificates') {
      setCompletionFiles(prev => ({
        ...prev,
        certificates: Array.from(files)
      }));
    } else {
      setCompletionFiles(prev => ({
        ...prev,
        [type]: files[0]
      }));
    }
  };

  const handleCompletionSubmit = async (e) => {
    e.preventDefault();

    if (!completionFiles.transcript) {
      toast.error('Please upload your transcript');
      return;
    }

    if (!completionData.gpa || !completionData.fieldOfStudy) {
      toast.error('Please fill in all completion details');
      return;
    }

    setSaving(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('transcript', completionFiles.transcript);
      completionFiles.certificates.forEach((file) => {
        formDataToSend.append('completionCertificate', file);
      });
      formDataToSend.append('gpa', completionData.gpa);
      formDataToSend.append('fieldOfStudy', completionData.fieldOfStudy);
      formDataToSend.append('institutionId', studentData.admittedInstitution || '');

      const token = await currentUser.getIdToken();

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload/student/completion-documents`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Completion documents uploaded successfully!');
        setCompletionFiles({ transcript: null, certificates: [] });
        setCompletionData({ gpa: '', fieldOfStudy: '', institutionId: '' });
        fetchProfile();
      }
    } catch (error) {
      console.error('Error uploading completion documents:', error);
      toast.error(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="student-profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="status-badge">{studentData?.studyStatus || 'applying'}</div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button
          className={`tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
          onClick={() => setActiveTab('academic')}
        >
          Academic Info
        </button>
        {studentData?.studyStatus === 'studying' && (
          <button
            className={`tab-btn ${activeTab === 'completion' ? 'active' : ''}`}
            onClick={() => setActiveTab('completion')}
          >
            Complete Studies
          </button>
        )}
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h2>Personal Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.personalInfo.firstName}
                    onChange={(e) => handleChange(e, 'personalInfo')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.personalInfo.lastName}
                    onChange={(e) => handleChange(e, 'personalInfo')}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.personalInfo.phone}
                    onChange={(e) => handleChange(e, 'personalInfo')}
                    placeholder="+266 XXXX XXXX"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.personalInfo.dateOfBirth}
                    onChange={(e) => handleChange(e, 'personalInfo')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.personalInfo.gender}
                  onChange={(e) => handleChange(e, 'personalInfo')}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.personalInfo.address}
                  onChange={(e) => handleChange(e, 'personalInfo')}
                  rows="3"
                  placeholder="Full address"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'academic' && (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h2>Academic Information</h2>
              
              <div className="form-group">
                <label>Previous School *</label>
                <input
                  type="text"
                  name="previousSchool"
                  value={formData.academicInfo.previousSchool}
                  onChange={(e) => handleChange(e, 'academicInfo')}
                  required
                  placeholder="Name of your previous school"
                />
              </div>

              <div className="form-group">
                <label>Graduation Year *</label>
                <input
                  type="number"
                  name="graduationYear"
                  value={formData.academicInfo.graduationYear}
                  onChange={(e) => handleChange(e, 'academicInfo')}
                  required
                  min="1980"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 2023"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'completion' && studentData?.studyStatus === 'studying' && (
          <form onSubmit={handleCompletionSubmit} className="profile-form">
            <div className="form-section">
              <h2>Complete Your Studies</h2>
              <p>Upload your final transcript and certificates to complete your studies and unlock job opportunities.</p>
              
              <div className="form-group">
                <label>GPA / Final Grade *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={completionData.gpa}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, gpa: e.target.value }))}
                  required
                  placeholder="e.g., 3.5"
                />
              </div>

              <div className="form-group">
                <label>Field of Study *</label>
                <input
                  type="text"
                  value={completionData.fieldOfStudy}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                  required
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div className="form-group">
                <label>Final Transcript * (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleCompletionFileChange(e, 'transcript')}
                  required
                />
                {completionFiles.transcript && (
                  <div className="file-info">✓ {completionFiles.transcript.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>Completion Certificates (Optional, Multiple)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => handleCompletionFileChange(e, 'certificates')}
                />
                {completionFiles.certificates.length > 0 && (
                  <div className="file-info">
                    ✓ {completionFiles.certificates.length} file(s) selected
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Uploading...' : 'Complete Studies & Upload Documents'}
            </button>
          </form>
        )}

        {studentData?.studyStatus === 'completed' && activeTab === 'completion' && (
          <div className="completion-status">
            <h2>✓ Studies Completed</h2>
            <p>You have successfully completed your studies. You can now apply for job opportunities!</p>
            {studentData.completionData && (
              <div className="completion-info">
                <p><strong>GPA:</strong> {studentData.completionData.gpa}</p>
                <p><strong>Field of Study:</strong> {studentData.completionData.fieldOfStudy}</p>
                <p><strong>Completed:</strong> {new Date(studentData.completionData.completionDate?.toDate()).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;