// frontend/src/components/institute/InstituteDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaGraduationCap, FaFileAlt, FaUsers, FaBuilding } from 'react-icons/fa';
import './Institute.css';

const InstituteDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    faculties: 0,
    courses: 0,
    applications: 0,
    pendingApplications: 0,
    admittedStudents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      // Fetch faculties count
      const facultiesQuery = query(
        collection(db, 'faculties'),
        where('institutionId', '==', currentUser.uid)
      );
      const facultiesSnap = await getDocs(facultiesQuery);

      // Fetch courses count
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', currentUser.uid)
      );
      const coursesSnap = await getDocs(coursesQuery);

      // Fetch applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('institutionId', '==', currentUser.uid)
      );
      const applicationsSnap = await getDocs(applicationsQuery);
      
      const pendingApplications = applicationsSnap.docs.filter(
        doc => doc.data().status === 'pending'
      ).length;

      const admittedStudents = applicationsSnap.docs.filter(
        doc => doc.data().status === 'admitted'
      ).length;

      setStats({
        faculties: facultiesSnap.size,
        courses: coursesSnap.size,
        applications: applicationsSnap.size,
        pendingApplications,
        admittedStudents
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
      <h1>Institution Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <FaBuilding className="stat-icon" />
          <h3>Faculties</h3>
          <p className="stat-number">{stats.faculties}</p>
          <Link to="/institute/faculties" className="stat-link">Manage Faculties</Link>
        </div>

        <div className="stat-card">
          <FaGraduationCap className="stat-icon" />
          <h3>Courses</h3>
          <p className="stat-number">{stats.courses}</p>
          <Link to="/institute/courses" className="stat-link">Manage Courses</Link>
        </div>

        <div className="stat-card">
          <FaFileAlt className="stat-icon" />
          <h3>Applications</h3>
          <p className="stat-number">{stats.applications}</p>
          <p className="stat-text">{stats.pendingApplications} pending review</p>
          <Link to="/institute/applications" className="stat-link">View Applications</Link>
        </div>

        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <h3>Admitted Students</h3>
          <p className="stat-number">{stats.admittedStudents}</p>
          <Link to="/institute/admissions" className="stat-link">View Admissions</Link>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/institute/faculties" className="action-btn">
            Manage Faculties
          </Link>
          <Link to="/institute/courses" className="action-btn">
            Manage Courses
          </Link>
          <Link to="/institute/applications" className="action-btn">
            Review Applications
          </Link>
          <Link to="/institute/publish-admissions" className="action-btn">
            Publish Admissions
          </Link>
          <Link to="/institute/profile" className="action-btn">
            Edit Profile
          </Link>
        </div>
      </div>

      {stats.pendingApplications > 0 && (
        <div className="alert-banner">
          <p>📋 You have {stats.pendingApplications} applications pending review</p>
        </div>
      )}
    </div>
  );
};

export default InstituteDashboard;