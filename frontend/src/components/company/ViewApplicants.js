// frontend/src/components/company/ViewApplicants.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import './Company.css';

const ViewApplicants = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, high-match, interview-ready

  useEffect(() => {
    fetchJobs();
  }, [currentUser]);

  useEffect(() => {
    if (selectedJob) {
      fetchApplicants(selectedJob);
    }
  }, [selectedJob, filter]);

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
      if (jobsList.length > 0) {
        setSelectedJob(jobsList[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      setLoading(true);
      
      // Fetch applications for this job
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('jobId', '==', jobId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      // Fetch student details for each application
      const applicantsData = await Promise.all(
        applicationsSnapshot.docs.map(async (appDoc) => {
          const application = { id: appDoc.id, ...appDoc.data() };
          
          // Get student details
          const studentDoc = await getDoc(doc(db, 'students', application.studentId));
          const studentData = studentDoc.exists() ? studentDoc.data() : null;
          
          return {
            ...application,
            studentData
          };
        })
      );

      // Apply filter
      let filteredApplicants = applicantsData;
      if (filter === 'high-match') {
        filteredApplicants = applicantsData.filter(app => app.matchScore >= 70);
      } else if (filter === 'interview-ready') {
        filteredApplicants = applicantsData.filter(app => app.matchScore >= 85);
      }

      // Sort by match score (highest first)
      filteredApplicants.sort((a, b) => b.matchScore - a.matchScore);

      setApplicants(filteredApplicants);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#6b7280'; // gray
  };

  const getMatchScoreLabel = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    return 'Fair Match';
  };

  if (loading && jobs.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="no-data-container">
        <p>You haven't posted any jobs yet.</p>
        <button onClick={() => window.location.href = '/company/post-job'}>
          Post Your First Job
        </button>
      </div>
    );
  }

  const currentJob = jobs.find(job => job.id === selectedJob);

  return (
    <div className="view-applicants-container">
      <div className="page-header">
        <h1>View Applicants</h1>
        <p>Review qualified candidates for your job postings</p>
      </div>

      <div className="applicants-content">
        {/* Job Selection Sidebar */}
        <div className="jobs-sidebar">
          <h3>Your Job Posts</h3>
          {jobs.map(job => (
            <div
              key={job.id}
              className={`job-item ${selectedJob === job.id ? 'active' : ''}`}
              onClick={() => setSelectedJob(job.id)}
            >
              <h4>{job.title}</h4>
              <p className="job-location">📍 {job.location}</p>
              <span className={`status-badge ${job.status}`}>
                {job.status}
              </span>
            </div>
          ))}
        </div>

        {/* Applicants List */}
        <div className="applicants-main">
          <div className="applicants-header">
            <div className="job-info">
              <h2>{currentJob?.title}</h2>
              <p>{applicants.length} Applicants</p>
            </div>
            
            <div className="filter-controls">
              <label>Filter:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Applicants</option>
                <option value="high-match">Good Match (70%+)</option>
                <option value="interview-ready">Interview Ready (85%+)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading applicants...</div>
          ) : applicants.length === 0 ? (
            <div className="no-applicants">
              <p>No applicants found for this job.</p>
            </div>
          ) : (
            <div className="applicants-list">
              {applicants.map(applicant => (
                <div key={applicant.id} className="applicant-card">
                  <div className="applicant-header">
                    <div className="applicant-info">
                      <h3>
                        {applicant.studentData?.personalInfo?.firstName}{' '}
                        {applicant.studentData?.personalInfo?.lastName}
                      </h3>
                      <p className="applicant-email">
                        📧 {applicant.studentData?.personalInfo?.email}
                      </p>
                      <p className="applicant-phone">
                        📱 {applicant.studentData?.personalInfo?.phone}
                      </p>
                    </div>
                    
                    <div className="match-score">
                      <div
                        className="score-circle"
                        style={{ borderColor: getMatchScoreColor(applicant.matchScore) }}
                      >
                        <span className="score-number">{applicant.matchScore}%</span>
                      </div>
                      <p className="score-label" style={{ color: getMatchScoreColor(applicant.matchScore) }}>
                        {getMatchScoreLabel(applicant.matchScore)}
                      </p>
                    </div>
                  </div>

                  <div className="applicant-details">
                    <div className="detail-section">
                      <h4>🎓 Education</h4>
                      <p>
                        {applicant.studentData?.academicInfo?.previousSchool}
                      </p>
                      <p>Graduated: {applicant.studentData?.academicInfo?.graduationYear}</p>
                    </div>

                    {applicant.studentData?.completionData && (
                      <div className="detail-section">
                        <h4>📜 Completion Status</h4>
                        <p>Institution: {applicant.studentData.completionData.institutionId}</p>
                        <p>
                          Completed: {new Date(applicant.studentData.completionData.completionDate?.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="detail-section">
                      <h4>📄 Documents</h4>
                      {applicant.studentData?.documents?.transcript && (
                        <a
                          href={applicant.studentData.documents.transcript}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-link"
                        >
                          View Transcript
                        </a>
                      )}
                      {applicant.studentData?.completionData?.certificates?.map((cert, idx) => (
                        <a
                          key={idx}
                          href={cert}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-link"
                        >
                          Certificate {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="applicant-actions">
                    <p className="applied-date">
                      Applied: {new Date(applicant.appliedAt?.toDate()).toLocaleDateString()}
                    </p>
                    <button className="btn-contact">
                      Contact Applicant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewApplicants;