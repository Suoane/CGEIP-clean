// frontend/src/components/company/PostJob.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import './Company.css';

const PostJob = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    employmentType: 'full-time',
    requirements: {
      education: '',
      minGPA: '',
      experience: '',
      skills: '',
      certificates: ''
    },
    expiresIn: '30' // days
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('requirements.')) {
      const reqField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [reqField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiresIn));

      // Prepare job data
      const jobData = {
        companyId: currentUser.uid,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        salary: formData.salary,
        employmentType: formData.employmentType,
        requirements: {
          education: formData.requirements.education,
          minGPA: parseFloat(formData.requirements.minGPA) || 0,
          experience: formData.requirements.experience,
          skills: formData.requirements.skills.split(',').map(s => s.trim()).filter(s => s),
          certificates: formData.requirements.certificates.split(',').map(c => c.trim()).filter(c => c)
        },
        postedAt: serverTimestamp(),
        expiresAt: expiresAt,
        status: 'active'
      };

      // Add to Firestore
      await addDoc(collection(db, 'jobs'), jobData);

      toast.success('Job posted successfully!');
      navigate('/company/dashboard');
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-container">
      <div className="form-header">
        <h1>Post New Job</h1>
        <p>Fill in the details to post a new job opportunity</p>
      </div>

      <form onSubmit={handleSubmit} className="post-job-form">
        <div className="form-section">
          <h2>Job Information</h2>
          
          <div className="form-group">
            <label>Job Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Software Developer"
            />
          </div>

          <div className="form-group">
            <label>Job Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
            />
          </div>

          <div className="form-row">
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

            <div className="form-group">
              <label>Salary Range</label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g., M15,000 - M25,000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Employment Type *</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                required
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label>Job Expires In (days) *</label>
              <input
                type="number"
                name="expiresIn"
                value={formData.expiresIn}
                onChange={handleChange}
                required
                min="1"
                max="90"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Requirements</h2>
          
          <div className="form-group">
            <label>Education Level *</label>
            <select
              name="requirements.education"
              value={formData.requirements.education}
              onChange={handleChange}
              required
            >
              <option value="">Select Education Level</option>
              <option value="diploma">Diploma</option>
              <option value="degree">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="phd">PhD</option>
            </select>
          </div>

          <div className="form-group">
            <label>Minimum GPA</label>
            <input
              type="number"
              name="requirements.minGPA"
              value={formData.requirements.minGPA}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="4"
              placeholder="e.g., 3.0"
            />
          </div>

          <div className="form-group">
            <label>Experience Required</label>
            <input
              type="text"
              name="requirements.experience"
              value={formData.requirements.experience}
              onChange={handleChange}
              placeholder="e.g., 2-3 years in software development"
            />
          </div>

          <div className="form-group">
            <label>Skills (comma-separated)</label>
            <input
              type="text"
              name="requirements.skills"
              value={formData.requirements.skills}
              onChange={handleChange}
              placeholder="e.g., JavaScript, React, Node.js"
            />
            <small>Separate multiple skills with commas</small>
          </div>

          <div className="form-group">
            <label>Additional Certificates (comma-separated)</label>
            <input
              type="text"
              name="requirements.certificates"
              value={formData.requirements.certificates}
              onChange={handleChange}
              placeholder="e.g., AWS Certified, Scrum Master"
            />
            <small>Separate multiple certificates with commas</small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/company/dashboard')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;