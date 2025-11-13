// frontend/src/components/student/ViewMatchingCourses.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import './Student.css';

const ViewMatchingCourses = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hoverStates, setHoverStates] = useState({});
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasUploadedDocs, setHasUploadedDocs] = useState(false);
  const [hasEnteredResults, setHasEnteredResults] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'qualified'

  useEffect(() => {
    fetchStudentData();
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setStudentData(data);
        
        // Check profile completion
        const profileComplete = data.personalInfo?.firstName && 
                               data.personalInfo?.lastName && 
                               data.personalInfo?.email &&
                               data.academicInfo?.previousSchool;
        setHasCompletedProfile(profileComplete);
        
        // Check documents
        const docsUploaded = data.documents?.transcript && data.documents?.idCard;
        setHasUploadedDocs(docsUploaded);
        
        // Check if results have been entered
        const resultsEntered = data.results?.mathScore || data.results?.englishScore || data.results?.gpa;
        setHasEnteredResults(!!resultsEntered);
        
        await fetchAndMatchCourses(data, profileComplete, docsUploaded, resultsEntered);
      } else {
        toast.error('Student profile not found');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndMatchCourses = async (student, profileComplete, docsUploaded, resultsEntered) => {
    try {
      // Fetch all open courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('admissionStatus', '==', 'open')
      );
      const coursesSnap = await getDocs(coursesQuery);
      
      const coursesWithInstitutions = await Promise.all(
        coursesSnap.docs.map(async (courseDoc) => {
          const courseData = { id: courseDoc.id, ...courseDoc.data() };
          
          // Get institution details
          const instDoc = await getDoc(doc(db, 'institutions', courseData.institutionId));
          courseData.institution = instDoc.exists() ? instDoc.data() : null;
          
          // Get faculty details
          if (courseData.facultyId) {
            const facDoc = await getDoc(doc(db, 'faculties', courseData.facultyId));
            courseData.faculty = facDoc.exists() ? facDoc.data() : null;
          }
          
          return courseData;
        })
      );

      // Calculate eligibility for each course
      const coursesWithEligibility = coursesWithInstitutions.map(course => {
        const eligibilityResult = calculateEligibility(student, course);
        return {
          ...course,
          ...eligibilityResult
        };
      });

      // Determine filter mode based on student completion status
      // If student has uploaded docs and entered results, show only qualified courses
      // Otherwise, show ALL courses
      const shouldShowQualifiedOnly = docsUploaded && resultsEntered && profileComplete;
      
      let filtered;
      if (shouldShowQualifiedOnly) {
        // Filter only qualified courses and sort by match score
        filtered = coursesWithEligibility
          .filter(course => course.isEligible)
          .sort((a, b) => b.matchScore - a.matchScore);
        setFilterMode('qualified');
      } else {
        // Show ALL courses unsorted
        filtered = coursesWithEligibility;
        setFilterMode('all');
      }

      setCourses(filtered);

      if (filtered.length === 0 && shouldShowQualifiedOnly) {
        toast.info('No courses match your qualifications yet. Complete your profile and upload documents to see more options.');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const matchSubjects = (student, course) => {
    const studentSubjects = student.mySubjects || [];
    const requiredSubjects = course.requiredSubjects || [];

    if (requiredSubjects.length === 0) {
      return {
        allMatched: true,
        matchedCount: 0,
        totalRequired: 0,
        subjectMatches: []
      };
    }

    let matchedCount = 0;
    const subjectMatches = [];

    requiredSubjects.forEach(reqSubject => {
      const studentSubject = studentSubjects.find(
        s => s.name.toLowerCase() === reqSubject.name.toLowerCase()
      );

      if (studentSubject) {
        const meets = studentSubject.marks >= reqSubject.minimumSymbol;
        matchedCount += meets ? 1 : 0;
        subjectMatches.push({
          name: reqSubject.name,
          required: reqSubject.minimumSymbol,
          studentMarks: studentSubject.marks,
          meets
        });
      } else {
        matchedCount += 0;
        subjectMatches.push({
          name: reqSubject.name,
          required: reqSubject.minimumSymbol,
          studentMarks: null,
          meets: false
        });
      }
    });

    return {
      allMatched: matchedCount === requiredSubjects.length,
      matchedCount,
      totalRequired: requiredSubjects.length,
      subjectMatches
    };
  };

  const calculateEligibility = (student, course) => {
    let matchScore = 0;
    let isEligible = true;
    let strengths = [];
    let weaknesses = [];
    let reasons = [];

    // Check profile completion
    if (!student.personalInfo?.firstName || !student.personalInfo?.lastName) {
      isEligible = false;
      weaknesses.push('Complete your profile');
    } else {
      matchScore += 15;
      strengths.push('Profile complete');
    }

    // Check academic info
    if (!student.academicInfo?.previousSchool) {
      isEligible = false;
      weaknesses.push('Add academic history');
    } else {
      matchScore += 15;
      strengths.push('Academic history provided');
    }

    // Check required documents
    const hasRequiredDocs = student.documents?.transcript && student.documents?.idCard;
    if (!hasRequiredDocs) {
      isEligible = false;
      weaknesses.push('Upload Transcript and ID Card');
    } else {
      matchScore += 30;
      strengths.push('Documents uploaded');
    }

    // Check results if course requires them
    if (course.requiredResults) {
      const studentResults = student.results || {};
      let resultsMatch = 0;

      // Math score check
      if (course.requiredResults.minMathScore) {
        const minMath = parseFloat(course.requiredResults.minMathScore);
        const studentMath = parseFloat(studentResults.mathScore) || 0;
        
        if (studentMath < minMath) {
          isEligible = false;
          weaknesses.push(`Math: Need ${minMath}, You have ${studentMath}`);
        } else {
          resultsMatch += 10;
          strengths.push(`Math score: ${studentMath} (meets requirement)`);
        }
      }

      // English score check
      if (course.requiredResults.minEnglishScore) {
        const minEnglish = parseFloat(course.requiredResults.minEnglishScore);
        const studentEnglish = parseFloat(studentResults.englishScore) || 0;
        
        if (studentEnglish < minEnglish) {
          isEligible = false;
          weaknesses.push(`English: Need ${minEnglish}, You have ${studentEnglish}`);
        } else {
          resultsMatch += 10;
          strengths.push(`English score: ${studentEnglish} (meets requirement)`);
        }
      }

      // GPA check
      if (course.requiredResults.minGPA) {
        const minGPA = parseFloat(course.requiredResults.minGPA);
        const studentGPA = parseFloat(studentResults.gpa) || 0;
        
        if (studentGPA < minGPA) {
          isEligible = false;
          weaknesses.push(`GPA: Need ${minGPA}, You have ${studentGPA}`);
        } else {
          resultsMatch += 10;
          strengths.push(`GPA: ${studentGPA} (meets requirement)`);
        }
      }

      matchScore += resultsMatch;
    } else {
      // Course doesn't have specific requirements
      matchScore += 25;
      strengths.push('No specific results required');
    }

    // Check subject requirements
    if (course.requiredSubjects && course.requiredSubjects.length > 0) {
      const subjectMatch = matchSubjects(student, course);
      
      if (!subjectMatch.allMatched) {
        isEligible = false;
        subjectMatch.subjectMatches.forEach(match => {
          if (!match.meets) {
            if (match.studentMarks === null) {
              weaknesses.push(`Missing subject: ${match.name}`);
            } else {
              weaknesses.push(`${match.name}: Need ${match.required}, You have ${match.studentMarks}`);
            }
          }
        });
      } else {
        matchScore += 20;
        strengths.push(`All ${subjectMatch.totalRequired} required subjects match`);
        subjectMatch.subjectMatches.forEach(match => {
          strengths.push(`${match.name}: ${match.studentMarks} (meets requirement)`);
        });
      }
    }

    return {
      matchScore: Math.min(100, matchScore),
      isEligible,
      strengths,
      weaknesses,
      reasons,
      subjectMatch: course.requiredSubjects ? matchSubjects(student, course) : null
    };
  };

  const getMatchColor = (score) => {
    if (score >= 85) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setShowDetails(true);
  };

  if (loading) {
    return <div className="loading">Loading courses that match your qualifications...</div>;
  }

  return (
    <div className="matching-courses-container" style={{ padding: '2rem' }}>
      <div className="page-header">
        <h1>{filterMode === 'qualified' ? 'Courses You Qualify For' : 'Available Courses'}</h1>
        <p>{filterMode === 'qualified' ? 'View courses based on your qualifications and exam results' : 'Browse all available courses. Upload documents and enter results to see qualifying courses.'}</p>
      </div>

      {filterMode === 'all' && (
        <div style={{
          background: '#dbeafe',
          border: '2px solid #17a2b8',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
          color: '#0c5460'
        }}>
          <strong>📚 View All Available Courses</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>You're seeing all available courses. After you:</p>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Upload your transcript and ID card</li>
            <li>Enter your exam results</li>
          </ul>
          <p style={{ margin: '0.5rem 0 0 0' }}>We'll filter the courses to show only those you qualify for!</p>
        </div>
      )}

      {filterMode === 'qualified' && !hasUploadedDocs && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
          color: '#92400e'
        }}>
          <strong>Note:</strong> Upload your documents and enter your exam results to see all available courses.
          <Link to="/student/upload-documents" style={{
            marginLeft: '1rem',
            color: '#92400e',
            fontWeight: 'bold',
            textDecoration: 'underline'
          }}>
            Upload Documents
          </Link>
          {' | '}
          <Link to="/student/enter-results" style={{
            marginLeft: '0.5rem',
            color: '#92400e',
            fontWeight: 'bold',
            textDecoration: 'underline'
          }}>
            Enter Results
          </Link>
        </div>
      )}

      {courses.length > 0 ? (
        <>
          <div style={{
            background: filterMode === 'qualified' ? '#dbeafe' : '#e0f2fe',
            border: `2px solid ${filterMode === 'qualified' ? '#17a2b8' : '#06b6d4'}`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            color: filterMode === 'qualified' ? '#0c5460' : '#0c4a6e'
          }}>
            Found <strong>{courses.length}</strong> {filterMode === 'qualified' ? 'qualifying' : 'available'} courses
            {filterMode === 'all' && ' - Complete your profile and upload documents to filter by qualification'}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {courses.map(course => (
              <div
                key={course.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${filterMode === 'qualified' ? getMatchColor(course.matchScore) : '#17a2b8'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  opacity: filterMode === 'all' && !course.isEligible ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Match Score Badge - Only show if qualified mode */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  {filterMode === 'qualified' && (
                    <div style={{
                      background: getMatchColor(course.matchScore),
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {course.matchScore}% Match
                    </div>
                  )}
                  {filterMode === 'all' && (
                    <div style={{
                      background: course.isEligible ? '#d1fae5' : '#fee2e2',
                      color: course.isEligible ? '#065f46' : '#991b1b',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {course.isEligible ? '✓ Eligible' : 'Not Yet Eligible'}
                    </div>
                  )}
                  <span style={{
                    background: '#f3f4f6',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: '#6b7280'
                  }}>
                    {course.level}
                  </span>
                </div>

                {/* Course Name */}
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  color: '#2c3e50',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  {course.courseName}
                </h3>

                {/* Institution */}
                <p style={{
                  margin: '0 0 1rem 0',
                  color: '#7f8c8d',
                  fontSize: '0.9rem'
                }}>
                  {course.institution?.name || 'Unknown Institution'}
                </p>

                {/* Course Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#555'
                }}>
                  <div>
                    <strong>Code:</strong> {course.courseCode}
                  </div>
                  <div>
                    <strong>Duration:</strong> {course.duration}
                  </div>
                  {course.faculty && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Faculty:</strong> {course.faculty.facultyName}
                    </div>
                  )}
                </div>

                {/* Match Score Bar - Only show if qualified mode */}
                {filterMode === 'qualified' && (
                  <div style={{
                    background: '#e5e7eb',
                    height: '6px',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      background: getMatchColor(course.matchScore),
                      height: '100%',
                      width: `${course.matchScore}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                )}

                {/* Action Button */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem'
                }}>
                  <button
                    onClick={() => handleViewDetails(course)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: filterMode === 'qualified' ? getMatchColor(course.matchScore) : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'opacity 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    View Details
                  </button>
                  {(filterMode === 'qualified' || (filterMode === 'all' && course.isEligible)) && (
                    <Link
                      to="/student/apply-course"
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#17a2b8',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.3s',
                        opacity: hoverStates[`apply-${course.id}`] ? 0.9 : 1
                      }}
                      onMouseEnter={() => setHoverStates(prev => ({ ...prev, [`apply-${course.id}`]: true }))}
                      onMouseLeave={() => setHoverStates(prev => ({ ...prev, [`apply-${course.id}`]: false }))}
                    >
                      Apply Now
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          color: '#991b1b'
        }}>
          <h3>{filterMode === 'qualified' ? 'No Matching Courses' : 'No Courses Available'}</h3>
          <p>{filterMode === 'qualified' ? "You don't currently qualify for any courses." : 'No courses are currently available.'}</p>
          {filterMode === 'qualified' && (
            <>
              <p>Here's what you can do:</p>
              <ul style={{
                textAlign: 'left',
                display: 'inline-block',
                margin: '1rem 0'
              }}>
                <li>Complete your student profile</li>
                <li>Upload your transcript and ID card</li>
                <li>Submit your exam results</li>
              </ul>
              <div style={{ marginTop: '1.5rem' }}>
                <Link
                  to="/student/profile"
                  style={{
                    marginRight: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#991b1b',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}
                >
                  Complete Profile
                </Link>
                <Link
                  to="/student/upload-documents"
                  style={{
                    marginRight: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#991b1b',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}
                >
                  Upload Documents
                </Link>
                <Link
                  to="/student/enter-results"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#991b1b',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}
                >
                  Enter Results
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Course Details Modal */}
      {showDetails && selectedCourse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowDetails(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedCourse.courseName}</h2>
                <p style={{ margin: 0, color: '#7f8c8d' }}>
                  {selectedCourse.institution?.name}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {/* Match Score */}
            <div style={{
              background: getMatchColor(selectedCourse.matchScore) + '15',
              border: `2px solid ${getMatchColor(selectedCourse.matchScore)}`,
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: getMatchColor(selectedCourse.matchScore)
              }}>
                {selectedCourse.matchScore}%
              </div>
              <div style={{ color: '#666' }}>Compatibility Score</div>
            </div>

            {/* Course Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>Course Information</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: '#f9f9f9',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                <div>
                  <strong>Code:</strong> {selectedCourse.courseCode}
                </div>
                <div>
                  <strong>Level:</strong> {selectedCourse.level}
                </div>
                <div>
                  <strong>Duration:</strong> {selectedCourse.duration}
                </div>
                <div>
                  <strong>Faculty:</strong> {selectedCourse.faculty?.facultyName || 'N/A'}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedCourse.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3>Description</h3>
                <p>{selectedCourse.description}</p>
              </div>
            )}

            {/* Your Strengths */}
            {selectedCourse.strengths && selectedCourse.strengths.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#10b981' }}>Your Strengths</h3>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {selectedCourse.strengths.map((strength, idx) => (
                    <li key={idx} style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {selectedCourse.requiredResults && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3>Course Requirements</h3>
                <div style={{
                  background: '#f9f9f9',
                  padding: '1rem',
                  borderRadius: '8px'
                }}>
                  {selectedCourse.requiredResults.minMathScore && (
                    <p>Math: {selectedCourse.requiredResults.minMathScore}/100</p>
                  )}
                  {selectedCourse.requiredResults.minEnglishScore && (
                    <p>English: {selectedCourse.requiredResults.minEnglishScore}/100</p>
                  )}
                  {selectedCourse.requiredResults.minGPA && (
                    <p>GPA: {selectedCourse.requiredResults.minGPA}/4.0</p>
                  )}
                  {selectedCourse.requiredResults.requiredFieldOfStudy && (
                    <p>Field: {selectedCourse.requiredResults.requiredFieldOfStudy}</p>
                  )}
                </div>
              </div>
            )}

            {/* Subject Requirements */}
            {selectedCourse.requiredSubjects && selectedCourse.requiredSubjects.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3>Required Subjects</h3>
                <div style={{
                  background: '#f0f9ff',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #17a2b8'
                }}>
                  {selectedCourse.subjectMatch ? (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #17a2b8' }}>
                            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#17a2b8' }}>Subject</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#17a2b8' }}>Required</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#17a2b8' }}>Your Marks</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#17a2b8' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCourse.subjectMatch.subjectMatches.map((match, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.75rem' }}>{match.name}</td>
                              <td style={{ textAlign: 'center', padding: '0.75rem' }}>{match.required}/100</td>
                              <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                                {match.studentMarks !== null ? `${match.studentMarks}/100` : '—'}
                              </td>
                              <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  background: match.meets ? '#d4edda' : '#f8d7da',
                                  color: match.meets ? '#155724' : '#721c24'
                                }}>
                                  {match.meets ? '✓ Meets' : '✗ Below'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        {selectedCourse.subjectMatch.allMatched ? (
                          <p style={{ color: '#10b981', margin: 0 }}>
                            ✓ You have all {selectedCourse.subjectMatch.totalRequired} required subjects with passing marks!
                          </p>
                        ) : (
                          <p style={{ color: '#ef4444', margin: 0 }}>
                            ✗ You need {selectedCourse.subjectMatch.totalRequired - selectedCourse.subjectMatch.matchedCount} more subject(s) to qualify
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      {selectedCourse.requiredSubjects.map((subject, idx) => (
                        <div key={idx} style={{ marginBottom: '0.5rem' }}>
                          <strong>{subject.name}</strong>: Minimum {subject.minimumSymbol}/100
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <Link
                to="/student/apply-course"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: getMatchColor(selectedCourse.matchScore),
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Apply Now
              </Link>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#e5e7eb',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMatchingCourses;
