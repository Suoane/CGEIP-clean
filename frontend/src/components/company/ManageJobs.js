// frontend/src/components/company/ManageJobs.js
import React, { useState, useEffect } from 'react';

const ManageJobs = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [currentUser]);

  const fetchJobs = async () => {
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', currentUser.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsList = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setJobs(jobsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
      setLoading(false);
    }
  };

  const handleCloseJob = async (jobId, title) => {
    if (!window.confirm(`Close this job posting: ${title}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'closed',
        closedAt: new Date()
      });
      toast.success('Job closed successfully');
      fetchJobs();
    } catch (error) {
      console.error('Error closing job:', error);
      toast.error('Failed to close job');
    }
  };

  const handleReopenJob = async (jobId, title) => {
    if (!window.confirm(`Reopen this job posting: ${title}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'active',
        reopenedAt: new Date()
      });
      toast.success('Job reopened successfully');
      fetchJobs();
    } catch (error) {
      console.error('Error reopening job:', error);
      toast.error('Failed to reopen job');
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Permanently delete this job: ${title}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const viewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <h1>Manage Jobs</h1>
        <button 
          onClick={() => window.location.href = '/company/post-job'}
          className="btn-primary"
        >
          <FaBriefcase /> Post New Job
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Jobs ({jobs.length})
        </button>
        <button
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({jobs.filter(j => j.status === 'active').length})
        </button>
        <button
          className={`filter-tab ${filter === 'closed' ? 'active' : ''}`}
          onClick={() => setFilter('closed')}
        >
          Closed ({jobs.filter(j => j.status === 'closed').length})
        </button>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="no-data-container">
          <h2>No jobs found</h2>
          <p>You haven't posted any jobs yet.</p>
          <button onClick={() => window.location.href = '/company/post-job'} className="btn-primary">
            Post Your First Job
          </button>
        </div>
      ) : (
        <div className="companies-grid">
          {filteredJobs.map(job => (
            <div key={job.id} className="company-card">
              <div className="company-header">
                <div>
                  <h3>{job.title}</h3>
                  <p className="company-industry">{job.employmentType}</p>
                  <p className="company-location">📍 {job.location}</p>
                </div>
                <span className={`status-badge ${job.status}`}>
                  {job.status}
                </span>
              </div>

              <div className="company-info">
                <p><strong>Salary:</strong> {job.salary || 'Not specified'}</p>
                <p><strong>Posted:</strong> {job.postedAt?.toDate ? new Date(job.postedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Applicants:</strong> {job.applicantCount || 0}</p>
                <p><strong>Qualified:</strong> {job.qualifiedCount || 0}</p>
              </div>

              {job.description && (
                <div className="company-description">
                  <p>{job.description.substring(0, 150)}...</p>
                </div>
              )}

              <div className="company-actions">
                <button
                  onClick={() => viewDetails(job)}
                  className="btn-icon btn-info"
                  title="View Details"
                >
                  <FaEye /> Details
                </button>

                {job.status === 'active' && (
                  <>
                    <button
                      onClick={() => window.location.href = `/company/qualified-applicants?job=${job.id}`}
                      className="btn-icon btn-success"
                      title="View Applicants"
                    >
                      <FaEye /> Applicants ({job.qualifiedCount || 0})
                    </button>
                    <button
                      onClick={() => handleCloseJob(job.id, job.title)}
                      className="btn-icon btn-warning"
                      title="Close Job"
                    >
                      <FaTimes /> Close
                    </button>
                  </>
                )}

                {job.status === 'closed' && (
                  <button
                    onClick={() => handleReopenJob(job.id, job.title)}
                    className="btn-icon btn-success"
                    title="Reopen Job"
                  >
                    Reopen
                  </button>
                )}

                <button
                  onClick={() => handleDeleteJob(job.id, job.title)}
                  className="btn-icon btn-delete"
                  title="Delete"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {showDetailsModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <div className="company-details-content">
              <div className="detail-section">
                <h3>Job Information</h3>
                <p><strong>Location:</strong> {selectedJob.location}</p>
                <p><strong>Employment Type:</strong> {selectedJob.employmentType}</p>
                <p><strong>Salary:</strong> {selectedJob.salary || 'Not specified'}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${selectedJob.status}`}>{selectedJob.status}</span></p>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedJob.description}</p>
              </div>

              <div className="detail-section">
                <h3>Requirements</h3>
                {selectedJob.requirements && (
                  <>
                    <p><strong>Education:</strong> {selectedJob.requirements.education || 'N/A'}</p>
                    <p><strong>Minimum GPA:</strong> {selectedJob.requirements.minGPA || 'N/A'}</p>
                    <p><strong>Experience:</strong> {selectedJob.requirements.experience || 'N/A'}</p>
                    {selectedJob.requirements.skills && selectedJob.requirements.skills.length > 0 && (
                      <p><strong>Skills:</strong> {selectedJob.requirements.skills.join(', ')}</p>
                    )}
                    {selectedJob.requirements.certificates && selectedJob.requirements.certificates.length > 0 && (
                      <p><strong>Certificates:</strong> {selectedJob.requirements.certificates.join(', ')}</p>
                    )}
                  </>
                )}
              </div>

              <div className="detail-section">
                <h3>Statistics</h3>
                <p><strong>Posted:</strong> {selectedJob.postedAt?.toDate ? new Date(selectedJob.postedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                {selectedJob.closedAt && (
                  <p><strong>Closed:</strong> {new Date(selectedJob.closedAt.toDate()).toLocaleDateString()}</p>
                )}
                <p><strong>Total Applicants:</strong> {selectedJob.applicantCount || 0}</p>
                <p><strong>Qualified Applicants:</strong> {selectedJob.qualifiedCount || 0}</p>
                <p><strong>Interview Ready:</strong> {selectedJob.interviewReadyCount || 0}</p>
              </div>
            </div>

            <div className="modal-actions">
              {selectedJob.status === 'active' && (
                <button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    window.location.href = `/company/qualified-applicants?job=${selectedJob.id}`;
                  }}
                  className="btn-primary"
                >
                  View Applicants
                </button>
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

export default ManageJobs;