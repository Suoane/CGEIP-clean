// frontend/src/components/institute/ViewApplications.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaEye, FaCheck, FaTimes, FaClock, FaSearch, FaDownload } from 'react-icons/fa';
import '../admin/Admin.css';

const ViewApplications = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchApplications();
  }, [currentUser]);

  const fetchCourses = async () => {
    try {
      const q = query(
        collection(db, 'courses'),
        where('institutionId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching applications for institution:', currentUser.uid);
      
      // Query applications for this institution
      const q = query(
        collection(db, 'applications'),
        where('institutionId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      console.log('📋 Applications found:', snapshot.size);
      
      if (snapshot.empty) {
        console.log('⚠️ No applications found for this institution');
        setApplications([]);
        setLoading(false);
        return;
      }
      
      // Fetch additional data for each application
      const applicationsData = await Promise.all(
        snapshot.docs.map(async (appDoc) => {
          const appData = { id: appDoc.id, ...appDoc.data() };
          console.log('📄 Processing application:', appData);
          
          try {
            // Get student details
            const studentDoc = await getDoc(doc(db, 'students', appData.studentId));
            appData.student = studentDoc.exists() ? studentDoc.data() : null;
            
            // Get course details
            const courseDoc = await getDoc(doc(db, 'courses', appData.courseId));
            appData.course = courseDoc.exists() ? courseDoc.data() : null;
            
            console.log('✅ Application processed - Student:', appData.student?.personalInfo?.firstName, 'Course:', appData.course?.courseName);
          } catch (err) {
            console.error('Error fetching related data for application:', err);
          }
          
          return appData;
        })
      );

      // Sort by date (newest first)
      applicationsData.sort((a, b) => {
        const dateA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(0);
        const dateB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      setApplications(applicationsData);
      console.log('✅ Applications loaded successfully:', applicationsData.length);
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      setError(error.message);
      toast.error('Failed to load applications. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus, applicationData) => {
    const statusText = newStatus === 'admitted' ? 'admit' : 
                       newStatus === 'rejected' ? 'reject' : 'waitlist';
    
    if (!window.confirm(`Are you sure you want to ${statusText} this application?`)) {
      return;
    }

    setProcessingAction(true);

    try {
      // Update application status
      await updateDoc(doc(db, 'applications', applicationId), {
        status: newStatus,
        decidedAt: new Date(),
        decidedBy: currentUser.uid
      });

      // Create notification for student
      await addDoc(collection(db, 'notifications'), {
        userId: applicationData.studentId,
        type: 'admission',
        title: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Your application for ${applicationData.course?.courseName} has been ${newStatus}`,
        read: false,
        relatedId: applicationId,
        createdAt: new Date()
      });

      toast.success(`Application ${newStatus} successfully!`);
      
      // Refresh applications
      await fetchApplications();
      
      // Close modal if open
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    } finally {
      setProcessingAction(false);
    }
  };

  const viewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const filteredApplications = applications.filter(app => {
    // Status filter
    if (filter !== 'all' && app.status !== filter) return false;
    
    // Course filter
    if (courseFilter !== 'all' && app.courseId !== courseFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const studentName = `${app.student?.personalInfo?.firstName} ${app.student?.personalInfo?.lastName}`.toLowerCase();
      const email = app.student?.personalInfo?.email?.toLowerCase() || '';
      const courseName = app.course?.courseName?.toLowerCase() || '';
      
      return studentName.includes(searchLower) || 
             email.includes(searchLower) || 
             courseName.includes(searchLower);
    }
    
    return true;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    admitted: applications.filter(a => a.status === 'admitted').length,
    waitlisted: applications.filter(a => a.status === 'waitlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Loading applications...</p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Fetching applications from database...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-container">
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>Error Loading Applications</h2>
          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>{error}</p>
          <button onClick={fetchApplications} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <div>
          <h1>📋 Student Applications</h1>
          <p>Review and manage course applications</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: '#f3f4f6' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Total Applications</h3>
          <p className="stat-number" style={{ fontSize: '2rem', margin: 0 }}>{stats.total}</p>
        </div>
        <div className="stat-card" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#92400e', margin: '0 0 0.5rem 0' }}>Pending Review</h3>
          <p className="stat-number" style={{ fontSize: '2rem', margin: 0, color: '#92400e' }}>{stats.pending}</p>
        </div>
        <div className="stat-card" style={{ background: '#d1fae5', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#065f46', margin: '0 0 0.5rem 0' }}>Admitted</h3>
          <p className="stat-number" style={{ fontSize: '2rem', margin: 0, color: '#065f46' }}>{stats.admitted}</p>
        </div>
        <div className="stat-card" style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#991b1b', margin: '0 0 0.5rem 0' }}>Rejected</h3>
          <p className="stat-number" style={{ fontSize: '2rem', margin: 0, color: '#991b1b' }}>{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search by student name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All ({stats.total})
            </button>
            <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
              Pending ({stats.pending})
            </button>
            <button className={`filter-tab ${filter === 'admitted' ? 'active' : ''}`} onClick={() => setFilter('admitted')}>
              Admitted ({stats.admitted})
            </button>
            <button className={`filter-tab ${filter === 'waitlisted' ? 'active' : ''}`} onClick={() => setFilter('waitlisted')}>
              Waitlisted ({stats.waitlisted})
            </button>
            <button className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
              Rejected ({stats.rejected})
            </button>
          </div>
          
          {courses.length > 1 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              style={{ padding: '0.75rem 1rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem' }}
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="no-data">
          <p>No applications found matching your filters.</p>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map(application => (
                <tr key={application.id}>
                  <td>
                    <div>
                      <strong>{application.student?.personalInfo?.firstName} {application.student?.personalInfo?.lastName}</strong>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {application.student?.personalInfo?.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      {application.course?.courseName}
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {application.course?.courseCode}
                      </div>
                    </div>
                  </td>
                  <td>{application.appliedAt?.toDate ? new Date(application.appliedAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${application.status}`}>
                      {application.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => viewDetails(application)} className="btn-icon btn-info" title="View Details">
                        <FaEye />
                      </button>

                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(application.id, 'admitted', application)}
                            className="btn-icon btn-success"
                            title="Admit"
                            disabled={processingAction}
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleStatusChange(application.id, 'waitlisted', application)}
                            className="btn-icon btn-warning"
                            title="Waitlist"
                            disabled={processingAction}
                          >
                            <FaClock />
                          </button>
                          <button
                            onClick={() => handleStatusChange(application.id, 'rejected', application)}
                            className="btn-icon btn-delete"
                            title="Reject"
                            disabled={processingAction}
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <div className="company-details-content">
              <div className="detail-section">
                <h3>Student Information</h3>
                <p><strong>Name:</strong> {selectedApplication.student?.personalInfo?.firstName} {selectedApplication.student?.personalInfo?.lastName}</p>
                <p><strong>Email:</strong> {selectedApplication.student?.personalInfo?.email}</p>
                <p><strong>Phone:</strong> {selectedApplication.student?.personalInfo?.phone || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Course Applied For</h3>
                <p><strong>Course:</strong> {selectedApplication.course?.courseName}</p>
                <p><strong>Code:</strong> {selectedApplication.course?.courseCode}</p>
              </div>

              <div className="detail-section">
                <h3>Application Details</h3>
                <p><strong>Applied On:</strong> {selectedApplication.appliedAt?.toDate ? new Date(selectedApplication.appliedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${selectedApplication.status}`}>{selectedApplication.status}</span></p>
              </div>
            </div>

            <div className="modal-actions">
              {selectedApplication.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'admitted', selectedApplication)}
                    className="btn-primary"
                    disabled={processingAction}
                  >
                    <FaCheck /> {processingAction ? 'Processing...' : 'Admit Student'}
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'waitlisted', selectedApplication)}
                    className="btn-secondary"
                    style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                    disabled={processingAction}
                  >
                    <FaClock /> Waitlist
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'rejected', selectedApplication)}
                    className="btn-secondary"
                    style={{ background: '#ef4444', color: 'white', border: 'none' }}
                    disabled={processingAction}
                  >
                    <FaTimes /> Reject
                  </button>
                </>
              )}
              <button onClick={() => setShowDetailsModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;