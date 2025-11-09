// frontend/src/components/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaGraduationCap, FaFileAlt, FaBriefcase, FaUser } from 'react-icons/fa';
import './Student.css';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [stats, setStats] = useState({
    applications: 0,
    admissions: 0,
    jobMatches: 0,
    studyStatus: 'applying'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
    fetchStats();
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
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

      // Fetch job matches
      const jobApplicationsQuery = query(
        collection(db, 'jobApplications'),
        where('studentId', '==', currentUser.uid)
      );
      const jobApplicationsSnap = await getDocs(jobApplicationsQuery);

      setStats({
        applications: applicationsSnap.size,
        admissions: admittedCount,
        jobMatches: jobApplicationsSnap.size,
        studyStatus: studentData?.studyStatus || 'applying'
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

  return (
    <div className="dashboard-container">
      <h1>Student Dashboard</h1>
      
      {studentData && studentData.studyStatus === 'applying' && studentData.applicationCount >= 2 && (
        <div className="alert-banner">
          ⚠️ You have reached the maximum number of applications (2).
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <FaFileAlt className="stat-icon" />
          <h3>Applications</h3>
          <p className="stat-number">{stats.applications}</p>
          <p className="stat-text">
            {studentData?.applicationCount || 0} of 2 used
          </p>
          <Link to="/student/apply-course" className="stat-link">
            Apply for Course
          </Link>
        </div>

        <div className="stat-card">
          <FaGraduationCap className="stat-icon" />
          <h3>Admissions</h3>
          <p className="stat-number">{stats.admissions}</p>
          <Link to="/student/admissions" className="stat-link">
            View Results
          </Link>
        </div>

        <div className="stat-card">
          <FaBriefcase className="stat-icon" />
          <h3>Job Matches</h3>
          <p className="stat-number">{stats.jobMatches}</p>
          <Link to="/student/jobs" className="stat-link">
            Browse Jobs
          </Link>
        </div>

        <div className="stat-card">
          <FaUser className="stat-icon" />
          <h3>Profile</h3>
          <p className="stat-text">Status: {stats.studyStatus}</p>
          <Link to="/student/profile" className="stat-link">
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          {studentData?.applicationCount < 2 && (
            <Link to="/student/apply-course" className="action-btn">
              Apply for Course
            </Link>
          )}
          <Link to="/student/upload-documents" className="action-btn">
            Upload Documents
          </Link>
          <Link to="/student/admissions" className="action-btn">
            Check Admission Results
          </Link>
          {studentData?.studyStatus === 'completed' && (
            <Link to="/student/jobs" className="action-btn">
              Browse Job Opportunities
            </Link>
          )}
        </div>
      </div>

      {stats.admissions > 0 && !studentData?.admittedInstitution && (
        <div className="info-banner">
          🎉 You have {stats.admissions} admission offer(s). Please select an institution to proceed.
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;