// frontend/src/components/company/CompanyDashboard.js
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
        <div className="status-banner pending">
          <FaExclamationCircle className="status-icon" />
          <h2>Account Pending Approval</h2>
          <p>Your company account is currently under review. You'll be notified once approved.</p>
        </div>
      </div>
    );
  }

  if (companyStatus === 'suspended') {
    return (
      <div className="dashboard-container">
        <div className="status-banner suspended">
          <FaExclamationCircle className="status-icon" />
          <h2>Account Suspended</h2>
          <p>Your company account has been suspended. Please contact support for more information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="status-banner approved">
        <FaCheckCircle className="status-icon" />
        <h2>Company Dashboard</h2>
        <p>Your account is active and approved</p>
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
          <Link to="/company/applications" className="stat-link">View Applications</Link>
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
            Post New Job
          </Link>
          <Link to="/company/jobs" className="action-btn">
            Manage Job Postings
          </Link>
          <Link to="/company/qualified-applicants" className="action-btn">
            View Qualified Applicants
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;