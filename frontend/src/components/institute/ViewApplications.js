// frontend/src/components/institute/ViewApplications.js - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaEye, FaCheck, FaTimes, FaClock, FaSearch, FaDownload, FaFilter } from 'react-icons/fa';
import '../admin/Admin.css';

const ViewApplications = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [processingAction, setProcessingAction] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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
    }
  };

  const fetchApplications = async () => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('institutionId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      
      const applicationsData = await Promise.all(
        snapshot.docs.map(async (appDoc) => {
          const appData = { id: appDoc.id, ...appDoc.data() };
          
          // Get student details
          const studentDoc = await getDoc(doc(db, 'students', appData.studentId));
          appData.student = studentDoc.exists() ? studentDoc.data() : null;
          
          // Get course details
          const courseDoc = await getDoc(doc(db, 'courses', appData.courseId));
          appData.course = courseDoc.exists() ? courseDoc.data() : null;
          
          return appData;
        })
      );

      // Sort by date (newest first)
      applicationsData.sort((a, b) => {
        const dateA = a.appliedAt?.toDate() || new Date(0);
        const dateB = b.appliedAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      setApplications(applicationsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus, applicationData, reason = '') => {
    const statusText = newStatus === 'admitted' ? 'admit' : 
                       newStatus === 'rejected' ? 'reject' : 'waitlist';
    
    if (!window.confirm(`Are you sure you want to ${statusText} this application?`)) {
      return;
    }

    setProcessingAction(true);

    try {
      // Update application status
      const updateData = {
        status: newStatus,
        decidedAt: new Date(),
        decidedBy: currentUser.uid
      };

      if (newStatus === 'rejected' && reason) {
        updateData.rejectionReason = reason;
      }

      await updateDoc(doc(db, 'applications', applicationId), updateData);

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
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedApplications.length === 0) {
      toast.warning('Please select applications first');
      return;
    }

    if (!window.confirm(`${action} ${selectedApplications.length} selected application(s)?`)) {
      return;
    }

    setProcessingAction(true);

    try {
      const promises = selectedApplications.map(async (appId) => {
        const app = applications.find(a => a.id === appId);
        if (app) {
          await handleStatusChange(appId, action, app);
        }
      });

      await Promise.all(promises);
      
      setSelectedApplications([]);
      setShowBulkActionModal(false);
      toast.success(`Bulk ${action} completed successfully!`);
    } catch (error) {
      console.error('Error processing bulk action:', error);
      toast.error('Failed to process bulk action');
    } finally {
      setProcessingAction(false);
    }
  };

  const toggleSelectApplication = (appId) => {
    setSelectedApplications(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredApplications.map(app => app.id);
    setSelectedApplications(filteredIds);
  };

  const deselectAll = () => {
    setSelectedApplications([]);
  };

  const viewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const exportApplications = () => {
    const csvContent = [
      ['Application Number', 'Student Name', 'Email', 'Course', 'Status', 'Applied Date', 'Decided Date'].join(','),
      ...filteredApplications.map(app => [
        app.applicationNumber || 'N/A',
        `${app.student?.personalInfo?.firstName} ${app.student?.personalInfo?.lastName}`,
        app.student?.personalInfo?.email,
        app.course?.courseName,
        app.status,
        new Date(app.appliedAt?.toDate()).toLocaleDateString(),
        app.decidedAt ? new Date(app.decidedAt?.toDate()).toLocaleDateString() : 'Pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Applications exported successfully!');
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
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <div>
          <h1>📋 Student Applications</h1>
          <p>Review and manage course applications</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectedApplications.length > 0 && (
            <button 
              onClick={() => setShowBulkActionModal(true)}
              className="btn-primary"
              style={{ background: '#f59e0b' }}
            >
              Bulk Actions ({selectedApplications.length})
            </button>
          )}
          <button onClick={exportApplications} className="btn-primary">
            <FaDownload /> Export CSV
          </button>
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

      {/* Filters and Search */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
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
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({stats.total})
            </button>
            <button
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({stats.pending})
            </button>
            <button
              className={`filter-tab ${filter === 'admitted' ? 'active' : ''}`}
              onClick={() => setFilter('admitted')}
            >
              Admitted ({stats.admitted})
            </button>
            <button
              className={`filter-tab ${filter === 'waitlisted' ? 'active' : ''}`}
              onClick={() => setFilter('waitlisted')}
            >
              Waitlisted ({stats.waitlisted})
            </button>
            <button
              className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
          
          {courses.length > 1 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseName}
                </option>
              ))}
            </select>
          )}
        </div>

        {filteredApplications.length > 0 && filter === 'pending' && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={selectAllFiltered} className="btn-icon btn-info" style={{ fontSize: '0.875rem' }}>
              Select All Filtered ({filteredApplications.length})
            </button>
            {selectedApplications.length > 0 && (
              <button onClick={deselectAll} className="btn-icon btn-secondary" style={{ fontSize: '0.875rem' }}>
                Deselect All
              </button>
            )}
          </div>
        )}
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
                {filter === 'pending' && <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === filteredApplications.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllFiltered();
                      } else {
                        deselectAll();
                      }
                    }}
                  />
                </th>}
                <th>Student</th>
                <th>Course</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map(application => (
                <tr key={application.id} style={{ 
                  background: selectedApplications.includes(application.id) ? '#eff6ff' : 'white'
                }}>
                  {filter === 'pending' && <td>
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={() => toggleSelectApplication(application.id)}
                    />
                  </td>}
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
                      <button
                        onClick={() => viewDetails(application)}
                        className="btn-icon btn-info"
                        title="View Details"
                      >
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
                <p><strong>Date of Birth:</strong> {selectedApplication.student?.personalInfo?.dateOfBirth || 'N/A'}</p>
                <p><strong>Gender:</strong> {selectedApplication.student?.personalInfo?.gender || 'N/A'}</p>
                {selectedApplication.student?.personalInfo?.address && (
                  <p><strong>Address:</strong> {selectedApplication.student.personalInfo.address}</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Academic Information</h3>
                <p><strong>Previous School:</strong> {selectedApplication.student?.academicInfo?.previousSchool || 'N/A'}</p>
                <p><strong>Graduation Year:</strong> {selectedApplication.student?.academicInfo?.graduationYear || 'N/A'}</p>
                {selectedApplication.student?.academicInfo?.grades && Object.keys(selectedApplication.student.academicInfo.grades).length > 0 && (
                  <>
                    <p><strong>Grades:</strong></p>
                    <div style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
                      {Object.entries(selectedApplication.student.academicInfo.grades).map(([subject, grade]) => (
                        <p key={subject} style={{ margin: '0.25rem 0' }}>
                          {subject}: <strong>{grade}</strong>
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="detail-section">
                <h3>Course Applied For</h3>
                <p><strong>Course:</strong> {selectedApplication.course?.courseName}</p>
                <p><strong>Code:</strong> {selectedApplication.course?.courseCode}</p>
                <p><strong>Duration:</strong> {selectedApplication.course?.duration}</p>
                <p><strong>Level:</strong> {selectedApplication.course?.level}</p>
              </div>

              <div className="detail-section">
                <h3>Application Details</h3>
                <p><strong>Application Number:</strong> #{selectedApplication.applicationNumber || 'N/A'}</p>
                <p><strong>Applied On:</strong> {selectedApplication.appliedAt?.toDate ? new Date(selectedApplication.appliedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${selectedApplication.status}`}>{selectedApplication.status}</span></p>
                {selectedApplication.decidedAt && (
                  <p><strong>Decided On:</strong> {new Date(selectedApplication.decidedAt.toDate()).toLocaleDateString()}</p>
                )}
                {selectedApplication.rejectionReason && (
                  <p><strong>Rejection Reason:</strong> {selectedApplication.rejectionReason}</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Documents</h3>
                {selectedApplication.student?.documents ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedApplication.student.documents.idCard && (
                      <a 
                        href={selectedApplication.student.documents.idCard} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-icon btn-info"
                        style={{ textDecoration: 'none', display: 'inline-block', width: 'fit-content' }}
                      >
                        📄 View ID Card
                      </a>
                    )}
                    {selectedApplication.student.documents.transcript && (
                      <a 
                        href={selectedApplication.student.documents.transcript} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-icon btn-info"
                        style={{ textDecoration: 'none', display: 'inline-block', width: 'fit-content' }}
                      >
                        📄 View Transcript
                      </a>
                    )}
                    {selectedApplication.student.documents.certificate && (
                      <a 
                        href={selectedApplication.student.documents.certificate} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-icon btn-info"
                        style={{ textDecoration: 'none', display: 'inline-block', width: 'fit-content' }}
                      >
                        📄 View Certificate
                      </a>
                    )}
                  </div>
                ) : (
                  <p>No documents uploaded</p>
                )}
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
                    <FaClock /> {processingAction ? 'Processing...' : 'Waitlist'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason (optional):');
                      handleStatusChange(selectedApplication.id, 'rejected', selectedApplication, reason || '');
                    }}
                    className="btn-secondary"
                    style={{ background: '#ef4444', color: 'white', border: 'none' }}
                    disabled={processingAction}
                  >
                    <FaTimes /> {processingAction ? 'Processing...' : 'Reject'}
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

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <div className="modal-overlay" onClick={() => setShowBulkActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bulk Actions ({selectedApplications.length} selected)</h2>
              <button onClick={() => setShowBulkActionModal(false)} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <p>Select an action to apply to all {selectedApplications.length} selected application(s):</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => handleBulkAction('admitted')}
                  className="btn-primary"
                  style={{ background: '#10b981' }}
                  disabled={processingAction}
                >
                  <FaCheck /> Admit All Selected
                </button>
                <button
                  onClick={() => handleBulkAction('waitlisted')}
                  className="btn-primary"
                  style={{ background: '#f59e0b' }}
                  disabled={processingAction}
                >
                  <FaClock /> Waitlist All Selected
                </button>
                <button
                  onClick={() => handleBulkAction('rejected')}
                  className="btn-primary"
                  style={{ background: '#ef4444' }}
                  disabled={processingAction}
                >
                  <FaTimes /> Reject All Selected
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowBulkActionModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;