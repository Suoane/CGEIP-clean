// frontend/src/components/company/QualifiedApplicants.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaCheckCircle, FaStar, FaMedal, FaTrophy } from 'react-icons/fa';
import './Company.css';

const QualifiedApplicants = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all', // all, interview-ready, high-match, qualified
    sortBy: 'matchScore', // matchScore, gpa, appliedDate
    minScore: 70
  });
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [currentUser]);

  useEffect(() => {
    if (selectedJob) {
      fetchQualifiedApplicants();
    }
  }, [selectedJob, filters]);

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

  const fetchQualifiedApplicants = async () => {
    try {
      setLoading(true);
      
      // Build query based on filters
      let applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('jobId', '==', selectedJob),
        where('matchScore', '>=', filters.minScore)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      // Fetch student details for each application
      const applicantsData = await Promise.all(
        applicationsSnapshot.docs.map(async (appDoc) => {
          const application = { id: appDoc.id, ...appDoc.data() };
          
          const studentDoc = await getDocs(
            query(collection(db, 'students'), where('__name__', '==', application.studentId))
          );
          
          const studentData = studentDoc.docs[0]?.data() || null;
          
          return {
            ...application,
            studentData
          };
        })
      );

      // Apply status filter
      let filteredApplicants = applicantsData;
      if (filters.status === 'interview-ready') {
        filteredApplicants = applicantsData.filter(app => app.qualificationStatus === 'interview-ready');
      } else if (filters.status === 'high-match') {
        filteredApplicants = applicantsData.filter(app => app.matchScore >= 80);
      } else if (filters.status === 'qualified') {
        filteredApplicants = applicantsData.filter(app => app.matchScore >= 70);
      }

      // Sort applicants
      filteredApplicants.sort((a, b) => {
        if (filters.sortBy === 'matchScore') {
          return b.matchScore - a.matchScore;
        } else if (filters.sortBy === 'gpa') {
          return (b.studentData?.completionData?.gpa || 0) - (a.studentData?.completionData?.gpa || 0);
        } else if (filters.sortBy === 'appliedDate') {
          return b.appliedAt?.toDate() - a.appliedAt?.toDate();
        }
        return 0;
      });

      setApplicants(filteredApplicants);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      setLoading(false);
    }
  };

  const getMatchTier = (score) => {
    if (score >= 90) return { label: 'Excellent', icon: FaTrophy, color: '#10b981' };
    if (score >= 85) return { label: 'Interview Ready', icon: FaMedal, color: '#3b82f6' };
    if (score >= 70) return { label: 'Qualified', icon: FaStar, color: '#f59e0b' };
    return { label: 'Consider', icon: FaCheckCircle, color: '#6b7280' };
  };

  const getScoreColor = (score) => {
    if (score >= 22) return '#10b981';
    if (score >= 15) return '#f59e0b';
    return '#ef4444';
  };

  if (loading && jobs.length === 0) {
    return <div className="loading">Loading qualified applicants...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="no-data-container">
        <h2>No Job Postings</h2>
        <p>Post a job to start receiving qualified applicants automatically.</p>
        <button onClick={() => window.location.href = '/company/post-job'}>
          Post Your First Job
        </button>
      </div>
    );
  }

  const currentJob = jobs.find(job => job.id === selectedJob);
  const interviewReadyCount = applicants.filter(a => a.qualificationStatus === 'interview-ready').length;
  const avgMatchScore = applicants.length > 0
    ? Math.round(applicants.reduce((sum, a) => sum + a.matchScore, 0) / applicants.length)
    : 0;

  return (
    <div className="qualified-applicants-container">
      <div className="page-header">
        <h1>🎯 Qualified Applicants</h1>
        <p>Automatically filtered candidates ready for your review</p>
      </div>

      <div className="applicants-content">
        {/* Jobs Sidebar */}
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
              <div className="job-stats">
                <span className="stat">
                  ✅ {job.qualifiedCount || 0} Qualified
                </span>
                <span className="stat highlight">
                  🌟 {job.interviewReadyCount || 0} Interview Ready
                </span>
              </div>
              <span className={`status-badge ${job.status}`}>
                {job.status}
              </span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="applicants-main">
          {/* Header with filters */}
          <div className="applicants-header">
            <div className="job-info">
              <h2>{currentJob?.title}</h2>
              <div className="job-metrics">
                <span className="metric">
                  📊 {applicants.length} Total Qualified
                </span>
                <span className="metric highlight">
                  ⭐ {interviewReadyCount} Interview Ready
                </span>
                <span className="metric">
                  📈 {avgMatchScore}% Avg Match
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="filter-bar">
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filters.status} 
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Qualified ({applicants.length})</option>
                <option value="interview-ready">Interview Ready ({interviewReadyCount})</option>
                <option value="high-match">High Match (80%+)</option>
                <option value="qualified">Qualified (70%+)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={filters.sortBy} 
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="matchScore">Match Score</option>
                <option value="gpa">GPA</option>
                <option value="appliedDate">Application Date</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Min Score:</label>
              <input 
                type="range" 
                min="60" 
                max="100" 
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
              />
              <span className="score-value">{filters.minScore}%</span>
            </div>
          </div>

          {/* Applicants List */}
          {loading ? (
            <div className="loading">Filtering qualified applicants...</div>
          ) : applicants.length === 0 ? (
            <div className="no-applicants">
              <p>No applicants match your current filters.</p>
              <button onClick={() => setFilters({...filters, minScore: 70, status: 'all'})}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="applicants-grid">
              {applicants.map(applicant => {
                const tier = getMatchTier(applicant.matchScore);
                const TierIcon = tier.icon;

                return (
                  <div 
                    key={applicant.id} 
                    className="applicant-card-smart"
                    onClick={() => setSelectedApplicant(applicant)}
                  >
                    {/* Top Section: Match Badge */}
                    <div className="match-badge" style={{ borderColor: tier.color }}>
                      <TierIcon style={{ color: tier.color }} />
                      <div className="match-score-large">
                        {applicant.matchScore}%
                      </div>
                      <div className="match-label" style={{ color: tier.color }}>
                        {tier.label}
                      </div>
                    </div>

                    {/* Applicant Info */}
                    <div className="applicant-info-section">
                      <h3>
                        {applicant.studentData?.personalInfo?.firstName}{' '}
                        {applicant.studentData?.personalInfo?.lastName}
                      </h3>
                      
                      <div className="quick-stats">
                        <span className="stat">
                          🎓 GPA: {applicant.studentData?.completionData?.gpa || 'N/A'}
                        </span>
                        <span className="stat">
                          📚 {applicant.studentData?.completionData?.fieldOfStudy}
                        </span>
                        <span className="stat">
                          💼 {applicant.studentData?.workExperience?.years || 0} yrs exp
                        </span>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="score-breakdown">
                      <h4>Qualification Breakdown</h4>
                      <div className="score-bars">
                        <div className="score-item">
                          <span className="score-label">Academic</span>
                          <div className="score-bar-container">
                            <div 
                              className="score-bar"
                              style={{
                                width: `${(applicant.scoreBreakdown?.academicScore / 25) * 100}%`,
                                backgroundColor: getScoreColor(applicant.scoreBreakdown?.academicScore || 0)
                              }}
                            />
                          </div>
                          <span className="score-number">
                            {applicant.scoreBreakdown?.academicScore || 0}/25
                          </span>
                        </div>

                        <div className="score-item">
                          <span className="score-label">Certificates</span>
                          <div className="score-bar-container">
                            <div 
                              className="score-bar"
                              style={{
                                width: `${(applicant.scoreBreakdown?.certificatesScore / 25) * 100}%`,
                                backgroundColor: getScoreColor(applicant.scoreBreakdown?.certificatesScore || 0)
                              }}
                            />
                          </div>
                          <span className="score-number">
                            {applicant.scoreBreakdown?.certificatesScore || 0}/25
                          </span>
                        </div>

                        <div className="score-item">
                          <span className="score-label">Experience</span>
                          <div className="score-bar-container">
                            <div 
                              className="score-bar"
                              style={{
                                width: `${(applicant.scoreBreakdown?.experienceScore / 25) * 100}%`,
                                backgroundColor: getScoreColor(applicant.scoreBreakdown?.experienceScore || 0)
                              }}
                            />
                          </div>
                          <span className="score-number">
                            {applicant.scoreBreakdown?.experienceScore || 0}/25
                          </span>
                        </div>

                        <div className="score-item">
                          <span className="score-label">Field Match</span>
                          <div className="score-bar-container">
                            <div 
                              className="score-bar"
                              style={{
                                width: `${(applicant.scoreBreakdown?.fieldRelevanceScore / 25) * 100}%`,
                                backgroundColor: getScoreColor(applicant.scoreBreakdown?.fieldRelevanceScore || 0)
                              }}
                            />
                          </div>
                          <span className="score-number">
                            {applicant.scoreBreakdown?.fieldRelevanceScore || 0}/25
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Concerns */}
                    {applicant.strengthAreas && applicant.strengthAreas.length > 0 && (
                      <div className="strengths-section">
                        <h4>💪 Key Strengths</h4>
                        <div className="tags">
                          {applicant.strengthAreas.map((strength, idx) => (
                            <span key={idx} className="tag success">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="card-actions">
                      <button 
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/company/applicant/${applicant.id}`;
                        }}
                      >
                        View Full Profile
                      </button>
                      
                      {applicant.qualificationStatus === 'interview-ready' && (
                        <button className="btn-interview">
                          Schedule Interview
                        </button>
                      )}
                    </div>

                    {/* Quick Info Footer */}
                    <div className="card-footer">
                      <span className="footer-item">
                        📧 {applicant.studentData?.personalInfo?.email}
                      </span>
                      <span className="footer-item">
                        📅 Applied: {new Date(applicant.appliedAt?.toDate()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualifiedApplicants;