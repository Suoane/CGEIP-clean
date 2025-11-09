// frontend/src/components/student/ApplyCourse.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, addDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import './Student.css';

const ApplyCourse = () => {
  const { currentUser } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInstitutions();
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      fetchCourses(selectedInstitution);
    }
  }, [selectedInstitution]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
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
    }
  };

  const fetchCourses = async (institutionId) => {
    try {
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
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const checkEligibility = (course) => {
    if (!studentData?.academicInfo?.grades) {
      return { eligible: false, reason: 'No academic records found' };
    }

    // Check minimum grade requirement
    const studentGrades = Object.values(studentData.academicInfo.grades);
    const averageGrade = studentGrades.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / studentGrades.length;
    
    if (course.requirements?.minGrade && averageGrade < parseFloat(course.requirements.minGrade)) {
      return { eligible: false, reason: 'Does not meet minimum grade requirement' };
    }

    return { eligible: true, reason: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInstitution || !selectedCourse) {
      toast.error('Please select both institution and course');
      return;
    }

    // Check application limit
    if (studentData.applicationCount >= 2) {
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
      toast.error(`You are not eligible: ${eligibility.reason}`);
      return;
    }

    setLoading(true);

    try {
      // Create application
      await addDoc(collection(db, 'applications'), {
        studentId: currentUser.uid,
        institutionId: selectedInstitution,
        courseId: selectedCourse,
        applicationNumber: studentData.applicationCount + 1,
        status: 'pending',
        documents: studentData.documents || {},
        appliedAt: new Date()
      });

      // Update student application count
      const studentRef = doc(db, 'students', currentUser.uid);
      await updateDoc(studentRef, {
        applicationCount: (studentData.applicationCount || 0) + 1
      });

      toast.success('Application submitted successfully!');
      
      // Reset form
      setSelectedInstitution('');
      setSelectedCourse('');
      setCourses([]);
      
      // Refresh student data
      fetchStudentData();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-course-container">
      <h1>Apply for Course</h1>

      {studentData && (
        <div className="info-banner">
          <p>Applications remaining: <strong>{2 - (studentData.applicationCount || 0)}</strong> of 2</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="apply-form">
        <div className="form-group">
          <label>Select Institution</label>
          <select
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
            required
          >
            <option value="">-- Choose Institution --</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        {selectedInstitution && (
          <div className="form-group">
            <label>Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
            >
              <option value="">-- Choose Course --</option>
              {courses.map(course => {
                const eligibility = checkEligibility(course);
                return (
                  <option 
                    key={course.id} 
                    value={course.id}
                    disabled={!eligibility.eligible}
                  >
                    {course.courseName} - {course.courseCode}
                    {!eligibility.eligible && ` (Not Eligible: ${eligibility.reason})`}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {selectedCourse && (
          <div className="course-details">
            <h3>Course Details</h3>
            {courses.find(c => c.id === selectedCourse) && (
              <>
                <p><strong>Course:</strong> {courses.find(c => c.id === selectedCourse).courseName}</p>
                <p><strong>Code:</strong> {courses.find(c => c.id === selectedCourse).courseCode}</p>
                <p><strong>Duration:</strong> {courses.find(c => c.id === selectedCourse).duration}</p>
                <p><strong>Level:</strong> {courses.find(c => c.id === selectedCourse).level}</p>
              </>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading || (studentData?.applicationCount >= 2)}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default ApplyCourse;