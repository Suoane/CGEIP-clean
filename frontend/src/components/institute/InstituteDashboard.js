// frontend/src/components/institute/InstituteDashboard.js - ENHANCED WITH DEBUG
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
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
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (currentUser) {
      console.log('🔍 Current User:', {
        uid: currentUser.uid,
        email: currentUser.email
      });
      fetchStats();
    } else {
      setError('No user logged in');
      setLoading(false);
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      setError(null);
      console.log('📊 Fetching stats for institution:', currentUser.uid);

      // Test Firebase connection first
      try {
        const testQuery = query(collection(db, 'faculties'));
        await getDocs(testQuery);
        console.log('✅ Firebase connection successful');
      } catch (fbError) {
        console.error('❌ Firebase connection failed:', fbError);
        throw new Error('Firebase connection failed. Check your configuration.');
      }

      // Fetch faculties count
      const facultiesQuery = query(
        collection(db, 'faculties'),
        where('institutionId', '==', currentUser.uid)
      );
      const facultiesSnap = await getDocs(facultiesQuery);
      console.log('📚 Faculties found:', facultiesSnap.size);

      // Fetch courses count
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', currentUser.uid)
      );
      const coursesSnap = await getDocs(coursesQuery);
      console.log('📖 Courses found:', coursesSnap.size);

      // Fetch applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('institutionId', '==', currentUser.uid)
      );
      const applicationsSnap = await getDocs(applicationsQuery);
      console.log('📋 Applications found:', applicationsSnap.size);
      
      const pendingApplications = applicationsSnap.docs.filter(
        doc => doc.data().status === 'pending'
      ).length;

      const admittedStudents = applicationsSnap.docs.filter(
        doc => doc.data().status === 'admitted'
      ).length;

      const newStats = {
        faculties: facultiesSnap.size,
        courses: coursesSnap.size,
        applications: applicationsSnap.size,
        pendingApplications,
        admittedStudents
      };

      setStats(newStats);
      setDebugInfo({
        institutionId: currentUser.uid,
        lastFetch: new Date().toISOString(),
        ...newStats
      });

      console.log('✅ Stats updated:', newStats);
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Loading dashboard...</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Checking Firebase connection...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '2rem',
          marginTop: '2rem'
        }}>
          <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>
            Error Loading Dashboard
          </h2>
          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchStats();
            }} 
            className="action-btn"
          >
            Try Again
          </button>
          
          {/* Debug Info */}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Debug Information
            </summary>
            <pre style={{ 
              background: '#1f2937', 
              color: '#10b981', 
              padding: '1rem', 
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              marginTop: '0.5rem'
            }}>
              {JSON.stringify({
                userLoggedIn: !!currentUser,
                userId: currentUser?.uid,
                userEmail: currentUser?.email,
                error: error
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Institution Dashboard</h1>
        <button 
          onClick={fetchStats}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Refresh
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Faculties</h3>
          <p className="stat-number">{stats.faculties}</p>
          <Link to="/institute/faculties" className="stat-link">Manage Faculties</Link>
        </div>

        <div className="stat-card">
          <h3>Courses</h3>
          <p className="stat-number">{stats.courses}</p>
          <Link to="/institute/courses" className="stat-link">Manage Courses</Link>
        </div>

        <div className="stat-card">
          <h3>Applications</h3>
          <p className="stat-number">{stats.applications}</p>
          <p className="stat-text">{stats.pendingApplications} pending review</p>
          <Link to="/institute/applications" className="stat-link">View Applications</Link>
        </div>

        <div className="stat-card">
          <h3>Admitted Students</h3>
          <p className="stat-number">{stats.admittedStudents}</p>
          <Link to="/institute/applications?filter=admitted" className="stat-link">View Students</Link>
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
          <Link to="/institute/profile" className="action-btn">
            Edit Profile
          </Link>
        </div>
      </div>

      {stats.pendingApplications > 0 && (
        <div className="alert-banner">
          <p>You have {stats.pendingApplications} applications pending review</p>
        </div>
      )}

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '2rem' }}>
          <summary style={{ 
            cursor: 'pointer', 
            padding: '1rem',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            Debug Information (Development Only)
          </summary>
          <pre style={{ 
            background: '#1f2937', 
            color: '#10b981', 
            padding: '1rem', 
            borderRadius: '8px',
            fontSize: '12px',
            overflow: 'auto',
            marginTop: '0.5rem'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default InstituteDashboard;