// frontend/src/components/institute/ViewApplications.js - FIXED
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaEye, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import '../admin/Admin.css';

const ViewApplications = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [currentUser]);

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

      setApplications(applicationsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
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
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <h1>Student Applications</h1>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({applications.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({applications.filter(a => a.status === 'pending').length})
          </button>
          <button
            className={`filter-tab ${filter === 'admitted' ? 'active' : ''}`}
            onClick={() => setFilter('admitted')}
          >
            Admitted ({applications.filter(a => a.status === 'admitted').length})
          </button>
          <button
            className={`filter-tab ${filter === 'waitlisted' ? 'active' : ''}`}
            onClick={() => setFilter('waitlisted')}
          >
            Waitlisted ({applications.filter(a => a.status === 'waitlisted').length})
          </button>
          <button
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({applications.filter(a => a.status === 'rejected').length})
          </button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="no-data">
          <p>No applications found in this category.</p>
        </div>
      ) : (
        <div className="companies-grid">
          {filteredApplications.map(application => (
            <div key={application.id} className="company-card">
              <div className="company-header">
                <div>
                  <h3>
                    {application.student?.personalInfo?.firstName} {application.student?.personalInfo?.lastName}
                  </h3>
                  <p className="company-industry">{application.course?.courseName}</p>
                  <p className="company-location">{application.course?.courseCode}</p>
                </div>
                <span className={`status-badge ${application.status}`}>
                  {application.status}
                </span>
              </div>

              <div className="company-info">
                <p><strong>Email:</strong> {application.student?.personalInfo?.email}</p>
                <p><strong>Phone:</strong> {application.student?.personalInfo?.phone || 'N/A'}</p>
                <p><strong>Applied:</strong> {application.appliedAt?.toDate ? new Date(application.appliedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                {application.decidedAt && (
                  <p><strong>Decided:</strong> {new Date(application.decidedAt.toDate()).toLocaleDateString()}</p>
                )}
              </div>

              <div className="company-actions">
                <button
                  onClick={() => viewDetails(application)}
                  className="btn-icon btn-info"
                  title="View Details"
                >
                  <FaEye /> View
                </button>

                {application.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(application.id, 'admitted', application)}
                      className="btn-icon btn-success"
                      title="Admit"
                      disabled={processingAction}
                    >
                      <FaCheck /> Admit
                    </button>
                    <button
                      onClick={() => handleStatusChange(application.id, 'waitlisted', application)}
                      className="btn-icon btn-warning"
                      title="Waitlist"
                      disabled={processingAction}
                    >
                      <FaClock /> Waitlist
                    </button>
                    <button
                      onClick={() => handleStatusChange(application.id, 'rejected', application)}
                      className="btn-icon btn-delete"
                      title="Reject"
                      disabled={processingAction}
                    >
                      <FaTimes /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                    <div style={{ paddingLeft: '1rem' }}>
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
                        style={{ 
                          padding: '0.5rem 1rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}
                      >
                        📄 View ID Card
                      </a>
                    )}
                    {selectedApplication.student.documents.transcript && (
                      <a 
                        href={selectedApplication.student.documents.transcript} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          padding: '0.5rem 1rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}
                      >
                        📄 View Transcript
                      </a>
                    )}
                    {selectedApplication.student.documents.certificate && (
                      <a 
                        href={selectedApplication.student.documents.certificate} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          padding: '0.5rem 1rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}
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
                    onClick={() => handleStatusChange(selectedApplication.id, 'rejected', selectedApplication)}
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
    </div>
  );
};

export default ViewApplications;