// frontend/src/components/company/CompanyDashboard.js - FIXED
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaBriefcase, FaUsers, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import './Company.css';

const CompanyDashboard = () => {
  const { currentUser } = useAuth();
  const [companyStatus, setCompanyStatus] = useState('loading');
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalJobs: 0,
    totalApplications: 0,
    qualifiedApplicants: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCompanyStatus();
    fetchStats();
  }, [currentUser]);

  const checkCompanyStatus = async () => {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', currentUser.uid));
      if (companyDoc.exists()) {
        setCompanyStatus(companyDoc.data().status);
      }
    } catch (error) {
      console.error('Error checking company status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', currentUser.uid)
      );
      const jobsSnap = await getDocs(jobsQuery);
      const activeJobs = jobsSnap.docs.filter(doc => doc.data().status === 'active').length;

      // Fetch job applications
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('companyId', '==', currentUser.uid)
      );
      const applicationsSnap = await getDocs(applicationsQuery);
      
      const qualifiedApplicants = applicationsSnap.docs.filter(
        doc => doc.data().matchScore >= 70
      ).length;

      setStats({
        activeJobs,
        totalJobs: jobsSnap.size,
        totalApplications: applicationsSnap.size,
        qualifiedApplicants
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (companyStatus === 'pending') {
    return (
      <div className="dashboard-container">
        <div className="status-banner pending" style={{
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          color: '#92400e'
        }}>
          <FaExclamationCircle style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <h2>Account Pending Approval</h2>
          <p>Your company account is currently under review. You'll be notified once approved.</p>
        </div>
      </div>
    );
  }

  if (companyStatus === 'suspended') {
    return (
      <div className="dashboard-container">
        <div className="status-banner suspended" style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          color: '#991b1b'
        }}>
          <FaExclamationCircle style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <h2>Account Suspended</h2>
          <p>Your company account has been suspended. Please contact support for more information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="status-banner approved" style={{
        background: '#d1fae5',
        border: '2px solid #10b981',
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center',
        color: '#065f46',
        marginBottom: '2rem'
      }}>
        <FaCheckCircle style={{ fontSize: '2rem', marginRight: '0.5rem', verticalAlign: 'middle' }} />
        <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>Company Dashboard - Account Active</span>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <FaBriefcase className="stat-icon" />
          <h3>Active Jobs</h3>
          <p className="stat-number">{stats.activeJobs}</p>
          <p className="stat-text">of {stats.totalJobs} total jobs</p>
          <Link to="/company/jobs" className="stat-link">Manage Jobs</Link>
        </div>

        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <h3>Total Applications</h3>
          <p className="stat-number">{stats.totalApplications}</p>
          <Link to="/company/applicants" className="stat-link">View All Applications</Link>
        </div>

        <div className="stat-card">
          <FaCheckCircle className="stat-icon" />
          <h3>Qualified Applicants</h3>
          <p className="stat-number">{stats.qualifiedApplicants}</p>
          <p className="stat-text">Match score ≥ 70%</p>
          <Link to="/company/qualified-applicants" className="stat-link">View Qualified</Link>
        </div>

        <div className="stat-card">
          <FaBriefcase className="stat-icon" />
          <h3>Company Profile</h3>
          <p className="stat-text">Manage your profile</p>
          <Link to="/company/profile" className="stat-link">Edit Profile</Link>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/company/post-job" className="action-btn">
            📝 Post New Job
          </Link>
          <Link to="/company/jobs" className="action-btn">
            💼 Manage Job Postings
          </Link>
          <Link to="/company/qualified-applicants" className="action-btn">
            ⭐ View Qualified Applicants
          </Link>
          <Link to="/company/profile" className="action-btn">
            🏢 Company Profile
          </Link>
        </div>
      </div>

      {stats.qualifiedApplicants > 0 && (
        <div className="info-banner" style={{
          background: '#dbeafe',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginTop: '2rem',
          color: '#1e40af'
        }}>
          <p style={{ margin: 0, fontWeight: '600' }}>
            🎯 You have {stats.qualifiedApplicants} qualified applicants ready for review!
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;