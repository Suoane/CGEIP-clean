// frontend/src/components/student/StudentDashboard.js - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaGraduationCap, FaFileAlt, FaBriefcase, FaUser, FaCheckCircle, FaExclamationTriangle, FaUpload } from 'react-icons/fa';
import './Student.css';
<Link to="/student/matches" className="action-btn">
  🎯 View My Matches
</Link>
const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [stats, setStats] = useState({
    applications: 0,
    admissions: 0,
    pending: 0,
    jobMatches: 0,
    studyStatus: 'applying'
  });
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);

  useEffect(() => {
    fetchStudentData();
    fetchStats();
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setStudentData(data);
        
        // Check profile completeness
        const hasPersonalInfo = data.personalInfo?.firstName && 
                               data.personalInfo?.lastName && 
                               data.personalInfo?.email;
        const hasAcademicInfo = data.academicInfo?.previousSchool && 
                               data.academicInfo?.graduationYear;
        setProfileComplete(hasPersonalInfo && hasAcademicInfo);
        
        // Check documents
        setDocumentsUploaded(data.documents?.transcript && data.documents?.idCard);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', currentUser.uid)
      );
      const applicationsSnap = await getDocs(applicationsQuery);
      
      const admittedCount = applicationsSnap.docs.filter(
        doc => doc.data().status === 'admitted'
      ).length;
      
      const pendingCount = applicationsSnap.docs.filter(
        doc => doc.data().status === 'pending'
      ).length;

      // Fetch job matches (if completed studies)
      let jobMatchesCount = 0;
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists() && studentDoc.data().studyStatus === 'completed') {
        const jobApplicationsQuery = query(
          collection(db, 'jobApplications'),
          where('studentId', '==', currentUser.uid)
        );
        const jobApplicationsSnap = await getDocs(jobApplicationsQuery);
        jobMatchesCount = jobApplicationsSnap.size;
      }

      setStats({
        applications: applicationsSnap.size,
        admissions: admittedCount,
        pending: pendingCount,
        jobMatches: jobMatchesCount,
        studyStatus: studentDoc.data()?.studyStatus || 'applying'
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

  const canApply = studentData && 
                   (studentData.applicationCount || 0) < 2 && 
                   profileComplete && 
                   documentsUploaded;

  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <h1>👋 Welcome back, {studentData?.personalInfo?.firstName || 'Student'}!</h1>
        <p className="dashboard-subtitle">Track your academic journey and opportunities</p>
      </div>
      
      {/* Action Required Alerts */}
      <div className="alerts-section">
        {!profileComplete && (
          <div className="alert-banner">
            <FaExclamationTriangle />
            <div>
              <strong>Complete Your Profile</strong>
              <p>Please complete your profile information to start applying for courses.</p>
              <Link to="/student/profile" style={{ color: '#92400e', fontWeight: 'bold', textDecoration: 'underline' }}>
                Complete Profile →
              </Link>
            </div>
          </div>
        )}
        
        {profileComplete && !documentsUploaded && (
          <div className="alert-banner">
            <FaUpload />
            <div>
              <strong>Upload Required Documents</strong>
              <p>Upload your documents to complete your application profile.</p>
              <Link to="/student/upload-documents" style={{ color: '#92400e', fontWeight: 'bold', textDecoration: 'underline' }}>
                Upload Documents →
              </Link>
            </div>
          </div>
        )}

        {stats.admissions > 0 && !studentData?.admittedInstitution && (
          <div className="info-banner">
            <FaCheckCircle />
            <div>
              <strong>🎉 Congratulations!</strong>
              <p>You have {stats.admissions} admission offer(s). Select an institution to proceed.</p>
              <Link to="/student/admissions" style={{ color: '#1e40af', fontWeight: 'bold', textDecoration: 'underline' }}>
                View Admissions →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: '4px solid #3b82f6' }}>
          <FaFileAlt className="stat-icon" />
          <h3>Applications</h3>
          <p className="stat-number">{stats.applications}</p>
          <p className="stat-text">
            {stats.pending} pending • {stats.admissions} admitted
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ 
              display: 'inline-block', 
              padding: '0.25rem 0.75rem', 
              background: canApply ? '#d1fae5' : '#fee2e2', 
              color: canApply ? '#065f46' : '#991b1b',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {2 - (studentData?.applicationCount || 0)} Remaining
            </span>
          </div>
          {canApply && (
            <Link to="/student/apply-course" className="stat-link">
              Apply for Course →
            </Link>
          )}
        </div>

        <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <FaGraduationCap className="stat-icon" style={{ color: '#10b981' }} />
          <h3>Admissions</h3>
          <p className="stat-number">{stats.admissions}</p>
          <p className="stat-text">
            {stats.admissions > 0 ? 'View your offers' : 'No admissions yet'}
          </p>
          <Link to="/student/admissions" className="stat-link">
            View Results →
          </Link>
        </div>

        <div className="stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <FaBriefcase className="stat-icon" style={{ color: '#f59e0b' }} />
          <h3>Study Status</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>
            {stats.studyStatus}
          </p>
          <p className="stat-text">
            {stats.studyStatus === 'completed' ? `${stats.jobMatches} job matches` : 'Current status'}
          </p>
          {stats.studyStatus === 'completed' && (
            <a href="#jobs" className="stat-link">
              Browse Jobs →
            </a>
          )}
        </div>

        <div className="stat-card" style={{ borderTop: '4px solid #8b5cf6' }}>
          <FaUser className="stat-icon" style={{ color: '#8b5cf6' }} />
          <h3>Profile</h3>
          <p className="stat-text" style={{ marginTop: '1rem' }}>
            {profileComplete ? '✅ Profile Complete' : '⚠️ Incomplete'}
          </p>
          <p className="stat-text">
            {documentsUploaded ? '✅ Documents Uploaded' : '⚠️ Documents Missing'}
          </p>
          <Link to="/student/profile" className="stat-link">
            Manage Profile →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>🚀 Quick Actions</h2>
        <div className="action-buttons">
          {!profileComplete && (
            <Link to="/student/profile" className="action-btn" style={{ background: '#ef4444' }}>
              <FaUser /> Complete Profile
            </Link>
          )}
          {profileComplete && !documentsUploaded && (
            <Link to="/student/upload-documents" className="action-btn" style={{ background: '#f59e0b' }}>
              <FaUpload /> Upload Documents
            </Link>
          )}
          {canApply && (
            <Link to="/student/apply-course" className="action-btn">
              <FaFileAlt /> Apply for Course
            </Link>
          )}
          <Link to="/student/admissions" className="action-btn">
            <FaGraduationCap /> Check Admissions
          </Link>
          <Link to="/student/profile" className="action-btn">
            <FaUser /> View Profile
          </Link>
        </div>
      </div>

      {/* Progress Section */}
      <div className="progress-section" style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>📊 Your Progress</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ minWidth: '200px', fontWeight: '600' }}>Profile Completion:</span>
            <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${profileComplete ? 100 : 50}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600' }}>
              {profileComplete ? 100 : 50}%
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ minWidth: '200px', fontWeight: '600' }}>Documents Uploaded:</span>
            <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${documentsUploaded ? 100 : 0}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #10b981, #059669)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600' }}>
              {documentsUploaded ? 100 : 0}%
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ minWidth: '200px', fontWeight: '600' }}>Applications Submitted:</span>
            <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${(stats.applications / 2) * 100}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600' }}>
              {stats.applications}/2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;