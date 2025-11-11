// frontend/src/components/student/ApplyCourse.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, addDoc, query, where, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaUniversity, FaGraduationCap, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './Student.css';

const ApplyCourse = () => {
  const { currentUser } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    fetchInstitutions();
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      fetchCourses(selectedInstitution);
    } else {
      setCourses([]);
      setSelectedCourse('');
    }
  }, [selectedInstitution]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
      } else {
        // Create default student document if doesn't exist
        const defaultData = {
          personalInfo: {
            email: currentUser.email
          },
          applicationCount: 0,
          studyStatus: 'applying',
          createdAt: new Date()
        };
        await doc(db, 'students', currentUser.uid).set(defaultData);
        setStudentData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load student data');
    }
  };

  const fetchInstitutions = async () => {
    try {
      const institutionsSnap = await getDocs(collection(db, 'institutions'));
      const institutionsData = institutionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to load institutions');
    }
  };

  const fetchCourses = async (institutionId) => {
    try {
      setLoadingCourses(true);
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', institutionId),
        where('admissionStatus', '==', 'open')
      );
      const coursesSnap = await getDocs(coursesQuery);
      const coursesData = coursesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
      
      if (coursesData.length === 0) {
        toast.info('No open courses available at this institution');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const checkEligibility = (course) => {
    // Basic eligibility check
    if (!studentData?.academicInfo?.previousSchool) {
      return { 
        eligible: false, 
        reason: 'Please complete your academic information in your profile first' 
      };
    }

    if (!studentData?.documents || !studentData.documents.transcript) {
      return { 
        eligible: false, 
        reason: 'Please upload your academic transcript first' 
      };
    }

    // Additional checks can be added here based on course requirements
    if (course.requirements?.minGrade) {
      const studentGrades = studentData.academicInfo?.grades;
      if (!studentGrades || Object.keys(studentGrades).length === 0) {
        return { 
          eligible: false, 
          reason: 'Academic grades information required' 
        };
      }
    }

    return { eligible: true, reason: '' };
  };

  const checkApplicationLimit = async (institutionId) => {
    try {
      const existingAppsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', currentUser.uid),
        where('institutionId', '==', institutionId)
      );
      const existingAppsSnap = await getDocs(existingAppsQuery);
      return existingAppsSnap.size;
    } catch (error) {
      console.error('Error checking application limit:', error);
      return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInstitution || !selectedCourse) {
      toast.error('Please select both institution and course');
      return;
    }

    // Check if student has uploaded required documents
    if (!studentData?.documents || !studentData.documents.transcript) {
      toast.error('Please upload your documents before applying');
      return;
    }

    // Check application limit for this institution
    const institutionApps = await checkApplicationLimit(selectedInstitution);
    if (institutionApps >= 2) {
      toast.error('You can only apply for a maximum of 2 courses per institution');
      return;
    }

    // Check if already applied for this course
    const existingAppQuery = query(
      collection(db, 'applications'),
      where('studentId', '==', currentUser.uid),
      where('courseId', '==', selectedCourse)
    );
    const existingAppSnap = await getDocs(existingAppQuery);
    
    if (!existingAppSnap.empty) {
      toast.error('You have already applied for this course');
      return;
    }

    // Check eligibility
    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    const eligibility = checkEligibility(selectedCourseData);
    
    if (!eligibility.eligible) {
      toast.error(`Not eligible: ${eligibility.reason}`);
      return;
    }

    setLoading(true);

    try {
      // Create application
      const applicationData = {
        studentId: currentUser.uid,
        institutionId: selectedInstitution,
        courseId: selectedCourse,
        applicationNumber: (studentData.applicationCount || 0) + 1,
        status: 'pending',
        documents: studentData.documents || {},
        personalInfo: studentData.personalInfo || {},
        academicInfo: studentData.academicInfo || {},
        appliedAt: new Date(),
        createdAt: new Date()
      };

      await addDoc(collection(db, 'applications'), applicationData);

      // Update student application count
      const studentRef = doc(db, 'students', currentUser.uid);
      await updateDoc(studentRef, {
        applicationCount: increment(1),
        updatedAt: new Date()
      });

      toast.success('Application submitted successfully! 🎉');
      
      // Reset form
      setSelectedInstitution('');
      setSelectedCourse('');
      setCourses([]);
      
      // Refresh student data
      fetchStudentData();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const selectedInstitutionData = institutions.find(i => i.id === selectedInstitution);
  const eligibility = selectedCourseData ? checkEligibility(selectedCourseData) : { eligible: true, reason: '' };

  return (
    <div className="apply-course-container">
      <div className="page-header">
        <h1>📝 Apply for Course</h1>
        <p>Select an institution and course to begin your application</p>
      </div>

      {studentData && (
        <div className="info-banner">
          <FaCheckCircle />
          <p>
            Applications remaining: <strong>{2 - (studentData.applicationCount || 0)} of 2</strong> per institution
          </p>
        </div>
      )}

      {(!studentData?.documents || !studentData.documents.transcript) && (
        <div className="alert-banner">
          <FaExclamationTriangle />
          <p>
            You need to upload your documents before applying. 
            <a href="/student/upload-documents" style={{ marginLeft: '0.5rem', color: '#92400e', fontWeight: 'bold', textDecoration: 'underline' }}>
              Upload Documents
            </a>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="apply-form">
        <div className="form-section">
          <h2><FaUniversity /> Select Institution</h2>
          
          <div className="form-group">
            <label>Institution *</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Choose Institution --</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} - {inst.location}
                </option>
              ))}
            </select>
          </div>

          {selectedInstitutionData && (
            <div className="course-details" style={{ marginTop: '1rem' }}>
              <h3>{selectedInstitutionData.name}</h3>
              <p><strong>Location:</strong> {selectedInstitutionData.location}</p>
              {selectedInstitutionData.description && (
                <p><strong>About:</strong> {selectedInstitutionData.description}</p>
              )}
            </div>
          )}
        </div>

        {selectedInstitution && (
          <div className="form-section">
            <h2><FaGraduationCap /> Select Course</h2>
            
            <div className="form-group">
              <label>Course *</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
                disabled={loading || loadingCourses}
              >
                <option value="">
                  {loadingCourses ? '-- Loading courses...' : '-- Choose Course --'}
                </option>
                {courses.map(course => {
                  const courseEligibility = checkEligibility(course);
                  return (
                    <option 
                      key={course.id} 
                      value={course.id}
                      disabled={!courseEligibility.eligible}
                    >
                      {course.courseName} ({course.courseCode})
                      {!courseEligibility.eligible && ` - Not Eligible`}
                    </option>
                  );
                })}
              </select>
            </div>

            {courses.length === 0 && !loadingCourses && selectedInstitution && (
              <div className="alert-banner">
                <FaExclamationTriangle />
                <p>No open courses available at this institution currently.</p>
              </div>
            )}
          </div>
        )}

        {selectedCourse && selectedCourseData && (
          <div className="course-details">
            <h3>📚 Course Details</h3>
            <p><strong>Course:</strong> {selectedCourseData.courseName}</p>
            <p><strong>Code:</strong> {selectedCourseData.courseCode}</p>
            <p><strong>Duration:</strong> {selectedCourseData.duration}</p>
            <p><strong>Level:</strong> {selectedCourseData.level}</p>
            {selectedCourseData.description && (
              <p><strong>Description:</strong> {selectedCourseData.description}</p>
            )}
            
            {!eligibility.eligible && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#991b1b' }}>
                <p><strong>⚠️ Eligibility Issue:</strong> {eligibility.reason}</p>
              </div>
            )}
          </div>
        )}

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={
            loading || 
            !selectedInstitution || 
            !selectedCourse || 
            (studentData?.applicationCount >= 2) ||
            !eligibility.eligible
          }
        >
          {loading ? '⏳ Submitting Application...' : '📤 Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default ApplyCourse;