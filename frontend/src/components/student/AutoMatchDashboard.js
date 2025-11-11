// frontend/src/components/student/AutoMatchDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaGraduationCap, FaBriefcase, FaStar, FaLightbulb, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Student.css';

const AutoMatchDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [matchedCourses, setMatchedCourses] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [studentStatus, setStudentStatus] = useState('applying');

  useEffect(() => {
    fetchMatches();
  }, [currentUser]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();

      // Fetch matched courses
      const coursesResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/upload/student/matched-courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (coursesResponse.data.success) {
        setMatchedCourses(coursesResponse.data.courses || []);
      }

      // Fetch matched jobs if student has completed
      try {
        const jobsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/upload/student/matched-jobs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (jobsResponse.data.success) {
          setMatchedJobs(jobsResponse.data.jobs || []);
          setStudentStatus('completed');
        } else {
          setStudentStatus('studying');
        }
      } catch (jobError) {
        // Jobs not available yet
        setStudentStatus('applying');
      }

    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCourse = (course) => {
    navigate('/student/apply-course', { state: { selectedCourse: course } });
  };

  const handleApplyJob = async (job) => {
    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        `${process.env.REACT_APP_API_URL}/student/jobs/apply`,
        { jobId: job.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Job application submitted successfully!');
      fetchMatches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to apply for job');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>🔍 Finding perfect matches for you...</p>
      </div>
    );
  }

  return (
    <div className="auto-match-dashboard">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>🎯 Your Perfect Matches</h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          Courses and jobs automatically selected based on your qualifications
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '0.75rem 2rem',
            background: activeTab === 'courses' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
            color: activeTab === 'courses' ? 'white' : '#374151',
            border: `2px solid ${activeTab === 'courses' ? 'transparent' : '#d1d5db'}`,
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FaGraduationCap />
          Courses ({matchedCourses.length})
        </button>
        
        {studentStatus === 'completed' && (
          <button
            onClick={() => setActiveTab('jobs')}
            style={{
              padding: '0.75rem 2rem',
              background: activeTab === 'jobs' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
              color: activeTab === 'jobs' ? 'white' : '#374151',
              border: `2px solid ${activeTab === 'jobs' ? 'transparent' : '#d1d5db'}`,
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaBriefcase />
            Jobs ({matchedJobs.length})
          </button>
        )}
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div>
          {matchedCourses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <FaLightbulb style={{ fontSize: '4rem', color: '#f59e0b', marginBottom: '1rem' }} />
              <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>No Course Matches Yet</h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                Upload your transcript and complete your profile to see personalized course recommendations.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/student/upload-documents')}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Upload Transcript
                </button>
                <button
                  onClick={() => navigate('/student/profile')}
                  style={{
                    padding: '1rem 2rem',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Complete Profile
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  ✨ {matchedCourses.length} Perfect Matches Found!
                </h3>
                <p style={{ margin: 0, fontSize: '0.9375rem' }}>
                  These courses are automatically selected based on your transcript and qualifications
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '1.5rem'
              }}>
                {matchedCourses.map((course, index) => {
                  const rec = course.recommendationLevel || { level: 'Good Match', color: '#3b82f6' };
                  return (
                    <div key={course.id} style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: `2px solid ${rec.color}20`,
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}>
                      {/* Rank Badge */}
                      {index < 3 && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '20px',
                          background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#fb923c',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                          <FaStar /> Top {index + 1}
                        </div>
                      )}

                      {/* Match Score */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          padding: '0.5rem 1rem',
                          background: `${rec.color}15`,
                          color: rec.color,
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '0.875rem'
                        }}>
                          {course.matchScore}% Match
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          background: '#f3f4f6',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280'
                        }}>
                          {rec.level}
                        </div>
                      </div>

                      {/* Course Info */}
                      <h3 style={{ color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
                        {course.courseName}
                      </h3>
                      <p style={{ color: '#6b7280', margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                        {course.courseCode} • {course.duration} • {course.level}
                      </p>

                      {/* Institution */}
                      <div style={{
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                          🏛️ {course.institution?.name}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          📍 {course.institution?.location}
                        </p>
                      </div>

                      {/* Match Reasons */}
                      {course.reasons && course.reasons.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#059669',
                            margin: '0 0 0.5rem 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            ✓ Why You Match
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {course.reasons.slice(0, 3).map((reason, idx) => (
                              <span key={idx} style={{
                                padding: '0.25rem 0.75rem',
                                background: '#d1fae5',
                                color: '#065f46',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Apply Button */}
                      <button
                        onClick={() => handleApplyCourse(course)}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontSize: '0.9375rem'
                        }}
                      >
                        📝 Apply Now
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div>
          {matchedJobs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <FaBriefcase style={{ fontSize: '4rem', color: '#3b82f6', marginBottom: '1rem' }} />
              <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>No Job Matches Yet</h2>
              <p style={{ color: '#6b7280' }}>
                Complete your studies and upload your completion documents to see job opportunities.
              </p>
            </div>
          ) : (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  💼 {matchedJobs.length} Job Opportunities Waiting!
                </h3>
                <p style={{ margin: 0, fontSize: '0.9375rem' }}>
                  These jobs match your qualifications and field of study
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '1.5rem'
              }}>
                {matchedJobs.map((job, index) => (
                  <div key={job.id} style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: `2px solid ${job.matchScore >= 85 ? '#10b981' : '#3b82f6'}20`
                  }}>
                    {/* Match Score */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: job.matchScore >= 85 ? '#d1fae515' : '#dbeafe',
                        color: job.matchScore >= 85 ? '#10b981' : '#3b82f6',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '0.875rem'
                      }}>
                        {job.matchScore}% Match
                      </div>
                      {job.matchScore >= 85 && (
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          background: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Perfect Match
                        </div>
                      )}
                    </div>

                    {/* Job Info */}
                    <h3 style={{ color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                      {job.title}
                    </h3>
                    <p style={{ color: '#6b7280', margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                      {job.company?.companyName} • {job.employmentType}
                    </p>

                    {/* Details */}
                    <div style={{
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#374151' }}>
                        📍 {job.location}
                      </p>
                      {job.salary && (
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#374151' }}>
                          💰 {job.salary}
                        </p>
                      )}
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={() => handleApplyJob(job)}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: job.matchScore >= 85 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      💼 Apply Now
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoMatchDashboard;