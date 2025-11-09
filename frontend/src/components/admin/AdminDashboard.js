// frontend/src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaUniversity, FaUsers, FaBriefcase, FaFileAlt } from 'react-icons/fa';
import './Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    institutions: 0,
    students: 0,
    companies: 0,
    pendingCompanies: 0,
    applications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch institutions count
      const institutionsSnap = await getDocs(collection(db, 'institutions'));
      
      // Fetch students count
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      const studentsSnap = await getDocs(studentsQuery);

      // Fetch companies count
      const companiesSnap = await getDocs(collection(db, 'companies'));
      const pendingCompanies = companiesSnap.docs.filter(
        doc => doc.data().status === 'pending'
      ).length;

      // Fetch applications count
      const applicationsSnap = await getDocs(collection(db, 'applications'));

      setStats({
        institutions: institutionsSnap.size,
        students: studentsSnap.size,
        companies: companiesSnap.size,
        pendingCompanies,
        applications: applicationsSnap.size
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
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <FaUniversity className="stat-icon" />
          <h3>Institutions</h3>
          <p className="stat-number">{stats.institutions}</p>
          <Link to="/admin/institutions" className="stat-link">Manage Institutions</Link>
        </div>

        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <h3>Students</h3>
          <p className="stat-number">{stats.students}</p>
          <span className="stat-text">Registered Students</span>
        </div>

        <div className="stat-card">
          <FaBriefcase className="stat-icon" />
          <h3>Companies</h3>
          <p className="stat-number">{stats.companies}</p>
          <p className="stat-text">
            {stats.pendingCompanies} pending approval
          </p>
          <Link to="/admin/companies" className="stat-link">Manage Companies</Link>
        </div>

        <div className="stat-card">
          <FaFileAlt className="stat-icon" />
          <h3>Applications</h3>
          <p className="stat-number">{stats.applications}</p>
          <span className="stat-text">Total Applications</span>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/admin/institutions" className="action-btn">
            Manage Institutions
          </Link>
          <Link to="/admin/faculties" className="action-btn">
            Manage Faculties
          </Link>
          <Link to="/admin/courses" className="action-btn">
            Manage Courses
          </Link>
          <Link to="/admin/companies" className="action-btn">
            Approve Companies
          </Link>
          <Link to="/admin/reports" className="action-btn">
            View Reports
          </Link>
        </div>
      </div>

      {stats.pendingCompanies > 0 && (
        <div className="alert-banner">
          <p>⚠️ You have {stats.pendingCompanies} companies pending approval</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;