// frontend/src/components/student/ApplyCourse.js - ENHANCED WITH SMART MATCHING
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, addDoc, query, where, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaUniversity, FaGraduationCap, FaCheckCircle, FaExclamationTriangle, FaStar, FaLightbulb } from 'react-icons/fa';
import './Student.css';

const ApplyCourse = () => {
  const { currentUser } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [qualifiedCourses, setQualifiedCourses] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [applicationLimit, setApplicationLimit] = useState({ count: 0, limit: 2 });
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' or 'all'

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
        
        // Check how many applications student has made
        const appsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', currentUser.uid)
        );
        const appsSnap = await getDocs(appsQuery);
        setApplicationLimit({ count: appsSnap.size, limit: 2 });

        // Fetch and match courses
        await fetchAndMatchCourses(data);
      } else {
        toast.error('Student profile not found. Please complete your profile first.');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndMatchCourses = async (student) => {
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

      setAllCourses(coursesWithInstitutions);

      // Calculate eligibility and match score for each course
      const coursesWithScores = coursesWithInstitutions.map(course => {
        const eligibilityResult = calculateEligibility(student, course);
        return {
          ...course,
          ...eligibilityResult
        };
      });

      // Sort by match score (highest first) and filter qualified courses
      const qualified = coursesWithScores
        .filter(course => course.isEligible)
        .sort((a, b) => b.matchScore - a.matchScore);

      setQualifiedCourses(qualified);

      if (qualified.length === 0) {
        toast.info('No courses match your current qualifications. Please complete your profile and upload documents.');
      } else {
        toast.success(`Found ${qualified.length} courses you qualify for!`);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const calculateEligibility = (student, course) => {
    let matchScore = 0;
    let eligibilityReasons = [];
    let isEligible = true;
    let strengths = [];
    let weaknesses = [];

    // 1. Check if profile is complete (30 points)
    if (!student.personalInfo?.firstName || !student.personalInfo?.lastName) {
      isEligible = false;
      eligibilityReasons.push('Personal information incomplete');
      weaknesses.push('Complete your profile');
    } else {
      matchScore += 10;
      strengths.push('Profile complete');
    }

    // 2. Check academic info (30 points)
    if (!student.academicInfo?.previousSchool || !student.academicInfo?.graduationYear) {
      isEligible = false;
      eligibilityReasons.push('Academic information incomplete');
      weaknesses.push('Add academic history');
    } else {
      matchScore += 10;
      strengths.push('Academic info provided');

      // Bonus for recent graduation
      const graduationYear = parseInt(student.academicInfo.graduationYear);
      const currentYear = new Date().getFullYear();
      if (currentYear - graduationYear <= 2) {
        matchScore += 10;
        strengths.push('Recent graduate');
      } else if (currentYear - graduationYear <= 5) {
        matchScore += 5;
      }
    }

    // 3. Check required documents (40 points - CRITICAL)
    const hasRequiredDocs = student.documents?.transcript && student.documents?.idCard;
    if (!hasRequiredDocs) {
      isEligible = false;
      eligibilityReasons.push('Required documents not uploaded (Transcript & ID Card)');
      weaknesses.push('Upload required documents');
    } else {
      matchScore += 30;
      strengths.push('Documents uploaded');

      // Bonus for additional documents
      if (student.documents?.certificate) {
        matchScore += 10;
        strengths.push('Extra certificates provided');
      }
    }

    // 4. Check required results (exam scores and GPA)
    if (course.requiredResults) {
      const studentResults = student.results || {};
      let resultsScore = 0;
      let meetsAllResults = true;

      // Check Mathematics score
      if (course.requiredResults.minMathScore) {
        const minMath = parseFloat(course.requiredResults.minMathScore);
        const studentMath = parseFloat(studentResults.mathScore) || 0;
        
        if (studentMath < minMath) {
          isEligible = false;
          meetsAllResults = false;
          eligibilityReasons.push(`Math score required: minimum ${minMath}`);
          weaknesses.push(`Math score too low (required: ${minMath}, yours: ${studentMath})`);
        } else {
          resultsScore += 10;
          strengths.push(`Strong mathematics score (${studentMath})`);
        }
      }

      // Check English score
      if (course.requiredResults.minEnglishScore) {
        const minEnglish = parseFloat(course.requiredResults.minEnglishScore);
        const studentEnglish = parseFloat(studentResults.englishScore) || 0;
        
        if (studentEnglish < minEnglish) {
          isEligible = false;
          meetsAllResults = false;
          eligibilityReasons.push(`English score required: minimum ${minEnglish}`);
          weaknesses.push(`English score too low (required: ${minEnglish}, yours: ${studentEnglish})`);
        } else {
          resultsScore += 10;
          strengths.push(`Strong English score (${studentEnglish})`);
        }
      }

      // Check GPA
      if (course.requiredResults.minGPA) {
        const minGPA = parseFloat(course.requiredResults.minGPA);
        const studentGPA = parseFloat(studentResults.gpa) || 0;
        
        if (studentGPA < minGPA) {
          isEligible = false;
          meetsAllResults = false;
          eligibilityReasons.push(`GPA required: minimum ${minGPA}`);
          weaknesses.push(`GPA below requirement (required: ${minGPA}, yours: ${studentGPA})`);
        } else {
          resultsScore += 10;
          strengths.push(`GPA meets requirement (${studentGPA})`);
        }
      }

      // Check Field of Study
      if (course.requiredResults.requiredFieldOfStudy && course.requiredResults.requiredFieldOfStudy !== '') {
        const requiredField = course.requiredResults.requiredFieldOfStudy;
        const studentField = studentResults.fieldOfStudy || '';
        
        if (studentField !== requiredField) {
          eligibilityReasons.push(`Field of Study: ${requiredField} preferred`);
          weaknesses.push(`Your field (${studentField}) differs from preferred field (${requiredField})`);
        } else {
          resultsScore += 5;
          strengths.push(`Field of study matches (${studentField})`);
        }
      }

      if (meetsAllResults) {
        matchScore += resultsScore;
      }
    } else if (!student.results || !student.resultsSubmitted) {
      // If course doesn't have specific requirements, still encourage results submission
      eligibilityReasons.push('Submit your exam results to improve matching');
      weaknesses.push('Submit your exam results');
    }

    // 4b. Check course-specific requirements
    if (course.requirements) {
      // Level matching
      if (course.level) {
        const studentLevel = student.academicInfo?.highestQualification || 'high-school';
        const levelMatch = checkLevelMatch(studentLevel, course.level);
        
        if (!levelMatch.eligible) {
          isEligible = false;
          eligibilityReasons.push(levelMatch.reason);
          weaknesses.push(levelMatch.reason);
        } else {
          matchScore += levelMatch.score;
          if (levelMatch.score > 0) {
            strengths.push('Qualification level matches');
          }
        }
      }

      // Minimum grades/GPA
      if (course.requirements.minGrade) {
        const studentGrades = student.academicInfo?.grades || {};
        const avgGrade = calculateAverageGrade(studentGrades);
        
        if (avgGrade < getGradeValue(course.requirements.minGrade)) {
          eligibilityReasons.push(`Minimum grade requirement: ${course.requirements.minGrade}`);
          weaknesses.push('Academic performance below requirement');
          matchScore -= 10;
        } else {
          matchScore += 15;
          strengths.push('Meets grade requirements');
        }
      }

      // Required subjects
      if (course.requirements.subjects && course.requirements.subjects.length > 0) {
        const studentSubjects = Object.keys(student.academicInfo?.grades || {});
        const missingSubjects = course.requirements.subjects.filter(
          subject => !studentSubjects.some(s => 
            s.toLowerCase().includes(subject.toLowerCase())
          )
        );

        if (missingSubjects.length > 0) {
          eligibilityReasons.push(`Missing subjects: ${missingSubjects.join(', ')}`);
          weaknesses.push(`Required subjects: ${missingSubjects.join(', ')}`);
          matchScore -= 5;
        } else {
          matchScore += 10;
          strengths.push('All required subjects present');
        }
      }
    }

    // 5. Institution preference matching (bonus points)
    if (student.preferences?.preferredInstitutions?.includes(course.institutionId)) {
      matchScore += 15;
      strengths.push('Preferred institution');
    }

    // 6. Field of interest matching
    if (student.preferences?.fieldOfInterest && course.courseName) {
      const fieldMatch = course.courseName.toLowerCase().includes(
        student.preferences.fieldOfInterest.toLowerCase()
      );
      if (fieldMatch) {
        matchScore += 15;
        strengths.push('Matches field of interest');
      }
    }

    // Ensure score is between 0-100
    matchScore = Math.max(0, Math.min(100, matchScore));

    return {
      isEligible,
      matchScore,
      eligibilityReasons,
      strengths: strengths.slice(0, 5), // Top 5 strengths
      weaknesses: weaknesses.slice(0, 3), // Top 3 weaknesses
      recommendation: getRecommendationLevel(matchScore)
    };
  };

  const checkLevelMatch = (studentLevel, courseLevel) => {
    const levelHierarchy = {
      'high-school': 0,
      'certificate': 1,
      'diploma': 2,
      'degree': 3,
      'masters': 4,
      'phd': 5
    };

    const studentLevelValue = levelHierarchy[studentLevel] || 0;
    const courseLevelValue = levelHierarchy[courseLevel] || 0;

    if (courseLevelValue === 0) {
      return { eligible: true, score: 10, reason: '' };
    }

    if (studentLevelValue < courseLevelValue - 1) {
      return { 
        eligible: false, 
        score: 0, 
        reason: `Requires ${courseLevel} level qualification` 
      };
    }

    if (studentLevelValue === courseLevelValue - 1) {
      return { eligible: true, score: 20, reason: '' };
    }

    return { eligible: true, score: 10, reason: '' };
  };

  const calculateAverageGrade = (grades) => {
    const gradeMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const values = Object.values(grades).map(g => gradeMap[g] || 0);
    return values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : 0;
  };

  const getGradeValue = (grade) => {
    const gradeMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    return gradeMap[grade] || 0;
  };

  const getRecommendationLevel = (score) => {
    if (score >= 80) return { level: 'Excellent Match', color: '#10b981', icon: '🌟' };
    if (score >= 60) return { level: 'Good Match', color: '#3b82f6', icon: '👍' };
    if (score >= 40) return { level: 'Fair Match', color: '#f59e0b', icon: '⚡' };
    return { level: 'Consider Carefully', color: '#6b7280', icon: '💭' };
  };

  const handleApply = async (course) => {
    if (applicationLimit.count >= applicationLimit.limit) {
      toast.error('You have reached the maximum number of applications (2)');
      return;
    }

    // Check if already applied
    const existingAppQuery = query(
      collection(db, 'applications'),
      where('studentId', '==', currentUser.uid),
      where('courseId', '==', course.id)
    );
    const existingAppSnap = await getDocs(existingAppQuery);
    
    if (!existingAppSnap.empty) {
      toast.error('You have already applied for this course');
      return;
    }

    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const confirmApplication = async () => {
    if (!selectedCourse) return;

    setApplying(true);

    try {
      // Create application
      const applicationData = {
        studentId: currentUser.uid,
        institutionId: selectedCourse.institutionId,
        courseId: selectedCourse.id,
        status: 'pending',
        matchScore: selectedCourse.matchScore,
        documents: studentData.documents || {},
        personalInfo: studentData.personalInfo || {},
        academicInfo: studentData.academicInfo || {},
        appliedAt: new Date(),
        createdAt: new Date(),
        applicationNumber: `APP-${Date.now()}-${currentUser.uid.slice(0, 6).toUpperCase()}`
      };

      await addDoc(collection(db, 'applications'), applicationData);

      // Update student application count
      const studentRef = doc(db, 'students', currentUser.uid);
      await updateDoc(studentRef, {
        applicationCount: increment(1),
        lastApplicationDate: new Date(),
        updatedAt: new Date()
      });

      toast.success(`Application submitted successfully for ${selectedCourse.courseName}! 🎉`);
      
      setShowCourseModal(false);
      setSelectedCourse(null);
      
      // Refresh data
      fetchStudentData();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="loading">🔍 Finding courses that match your qualifications...</div>;
  }

  const canApply = applicationLimit.count < applicationLimit.limit;

  return (
    <div className="apply-course-container">
      <div className="page-header">
        <h1>Apply for Courses</h1>
        <p>Browse and apply to available courses</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '1rem'
      }}>
        <button
          onClick={() => setActiveTab('recommended')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'recommended' ? '#3b82f6' : 'transparent',
            color: activeTab === 'recommended' ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s'
          }}
        >
          Recommended for You ({qualifiedCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'all' ? '#3b82f6' : 'transparent',
            color: activeTab === 'all' ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s'
          }}
        >
          All Courses ({allCourses.length})
        </button>
      </div>

      {/* Application Status */}
      <div className={`info-banner ${!canApply ? 'alert-banner' : ''}`}>
        <FaCheckCircle />
        <div>
          <strong>Application Status:</strong> {applicationLimit.count} of {applicationLimit.limit} applications submitted
          {!canApply && <p style={{ margin: '0.5rem 0 0 0' }}>You have reached the maximum number of applications.</p>}
        </div>
      </div>

      {/* Document Check */}
      {(!studentData?.documents?.transcript || !studentData?.documents?.idCard) && (
        <div className="alert-banner">
          <FaExclamationTriangle />
          <div>
            <strong>Missing Required Documents</strong>
            <p>You need to upload your Transcript and ID Card to apply for courses.</p>
            <a href="/student/upload-documents" style={{ color: '#92400e', fontWeight: 'bold', textDecoration: 'underline' }}>
              Upload Documents Now →
            </a>
          </div>
        </div>
      )}

      {/* Profile Completion Check */}
      {(!studentData?.personalInfo?.firstName || !studentData?.academicInfo?.previousSchool) && (
        <div className="alert-banner">
          <FaExclamationTriangle />
          <div>
            <strong>Incomplete Profile</strong>
            <p>Complete your profile to see more course recommendations.</p>
            <a href="/student/profile" style={{ color: '#92400e', fontWeight: 'bold', textDecoration: 'underline' }}>
              Complete Profile →
            </a>
          </div>
        </div>
      )}

      {/* Recommended Courses Tab */}
      {activeTab === 'recommended' && (
        <>
          {qualifiedCourses.length > 0 ? (
            <div className="courses-section">
              <h2>{qualifiedCourses.length} Courses You Qualify For</h2>
              
              <div className="courses-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
                gap: '1.5rem',
                marginTop: '1.5rem'
              }}>
                {qualifiedCourses.map(course => {
                  const rec = course.recommendation;
                  return (
                    <div key={course.id} className="course-card" style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: `2px solid ${rec.color}20`,
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Match Score Badge */}
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
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>{rec.icon}</span>
                          <span>{course.matchScore}% Match</span>
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
                  <h3 style={{ 
                    color: '#1f2937', 
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.125rem'
                  }}>
                    {course.courseName}
                  </h3>
                  <p style={{ 
                    color: '#6b7280', 
                    margin: '0 0 1rem 0',
                    fontSize: '0.875rem'
                  }}>
                    {course.courseCode} • {course.duration} • {course.level}
                  </p>

                  {/* Institution */}
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem',
                      color: '#374151',
                      fontWeight: '600'
                    }}>
                      🏛️ {course.institution?.name}
                    </p>
                    <p style={{ 
                      margin: '0.25rem 0 0 0', 
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      📍 {course.institution?.location}
                    </p>
                  </div>

                  {/* Strengths */}
                  {course.strengths && course.strengths.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700',
                        color: '#059669',
                        margin: '0 0 0.5rem 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        ✓ Your Strengths
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {course.strengths.slice(0, 3).map((strength, idx) => (
                          <span key={idx} style={{
                            padding: '0.25rem 0.75rem',
                            background: '#d1fae5',
                            color: '#065f46',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleApply(course)}
                    disabled={!canApply || applying}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      background: canApply ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: canApply ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {canApply ? '📝 Apply Now' : '✓ Application Limit Reached'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="no-courses" style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <FaLightbulb style={{ fontSize: '4rem', color: '#f59e0b', marginBottom: '1rem' }} />
          <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>No Matching Courses Found</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Complete your profile and upload documents to see course recommendations.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/student/profile" className="action-btn">
              Complete Profile
            </a>
            <a href="/student/upload-documents" className="action-btn">
              Upload Documents
            </a>
          </div>
        </div>
      )}
      </>
      )}

      {/* All Courses Tab */}
      {activeTab === 'all' && (
        <>
          {allCourses.length > 0 ? (
            <div className="courses-section">
              <h2>All Available Courses ({allCourses.length})</h2>
              
              <div className="courses-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
                gap: '1.5rem',
                marginTop: '1.5rem'
              }}>
                {allCourses.map(course => (
                  <div key={course.id} className="course-card" style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #e5e7eb',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        background: '#f3f4f6',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6b7280'
                      }}>
                        {course.level}
                      </div>
                    </div>

                    <h3 style={{ 
                      color: '#1f2937', 
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.125rem'
                    }}>
                      {course.courseName}
                    </h3>
                    <p style={{ 
                      color: '#6b7280', 
                      margin: '0 0 1rem 0',
                      fontSize: '0.875rem'
                    }}>
                      {course.courseCode} • {course.duration}
                    </p>

                    <div style={{
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                        {course.institution?.name || 'Unknown Institution'}
                      </p>
                    </div>

                    {course.description && (
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280', 
                        margin: '0 0 1rem 0',
                        lineHeight: '1.5'
                      }}>
                        {course.description.substring(0, 100)}...
                      </p>
                    )}

                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowCourseModal(true);
                      }}
                      disabled={!canApply}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: canApply ? '#3b82f6' : '#d1d5db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: canApply ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'background 0.3s'
                      }}
                    >
                      {canApply ? 'Apply Now' : 'Application Limit Reached'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: '12px',
              color: '#1f2937'
            }}>
              <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>No Courses Available</h2>
              <p style={{ color: '#6b7280' }}>
                There are currently no open courses. Please check back later.
              </p>
            </div>
          )}
        </>
      )}

      {/* No content for empty state */}
      {allCourses.length === 0 && qualifiedCourses.length === 0 && (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: '12px',
          color: '#1f2937'
        }}>
          <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>No Matching Courses Found</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Complete your profile and upload documents to see course recommendations.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/student/profile" className="action-btn">
              Complete Profile
            </a>
            <a href="/student/upload-documents" className="action-btn">
              Upload Documents
            </a>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => !applying && setShowCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Confirm Application</h2>
              <button onClick={() => !applying && setShowCourseModal(false)} className="btn-close" disabled={applying}>
                ×
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                background: `#dbeafe`,
                borderRadius: '8px',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: '#1e40af',
                  margin: 0
                }}>
                  Apply for Course
                </p>
              </div>

              <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>
                {selectedCourse.courseName}
              </h3>
              <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>
                {selectedCourse.institution?.name} • {selectedCourse.courseCode}
              </p>

              <div style={{ 
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#374151' }}>
                  Application Details:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  <li>Duration: {selectedCourse.duration}</li>
                  <li>Level: {selectedCourse.level}</li>
                  <li>Location: {selectedCourse.institution?.location || 'N/A'}</li>
                </ul>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                By confirming, you agree to submit your application with all uploaded documents.
                This will count as 1 of your 2 allowed applications.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowCourseModal(false)} 
                className="btn-secondary"
                disabled={applying}
              >
                Cancel
              </button>
              <button 
                onClick={confirmApplication} 
                className="btn-primary"
                disabled={applying}
              >
                {applying ? 'Submitting...' : 'Confirm Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyCourse;