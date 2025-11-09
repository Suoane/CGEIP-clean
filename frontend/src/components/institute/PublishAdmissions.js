// frontend/src/components/institute/PublishAdmissions.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaGraduationCap, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import './Institute.css';

const PublishAdmissions = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [applications, setApplications] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({
    admitted: [],
    rejected: [],
    waitlisted: []
  });
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [currentUser]);

  useEffect(() => {
    if (selectedCourse) {
      fetchApplicationsForCourse(selectedCourse);
    }
  }, [selectedCourse]);

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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      setLoading(false);
    }
  };

  const fetchApplicationsForCourse = async (courseId) => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'applications'),
        where('courseId', '==', courseId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      const applicationsData = await Promise.all(
        snapshot.docs.map(async (appDoc) => {
          const appData = { id: appDoc.id, ...appDoc.data() };
          
          // Get student details
          const studentDoc = await getDoc(doc(db, 'students', appData.studentId));
          appData.student = studentDoc.exists() ? studentDoc.data() : null;
          
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

  const handleStudentSelection = (studentId, category) => {
    setSelectedStudents(prev => {
      const newSelections = { ...prev };
      
      // Remove from all categories first
      Object.keys(newSelections).forEach(key => {
        newSelections[key] = newSelections[key].filter(id => id !== studentId);
      });
      
      // Add to selected category
      if (!newSelections[category].includes(studentId)) {
        newSelections[category].push(studentId);
      }
      
      return newSelections;
    });
  };

  const getStudentCategory = (studentId) => {
    if (selectedStudents.admitted.includes(studentId)) return 'admitted';
    if (selectedStudents.rejected.includes(studentId)) return 'rejected';
    if (selectedStudents.waitlisted.includes(studentId)) return 'waitlisted';
    return null;
  };

  const handlePublishAdmissions = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    if (!academicYear || !semester) {
      toast.error('Please specify academic year and semester');
      return;
    }

    if (selectedStudents.admitted.length === 0 && 
        selectedStudents.rejected.length === 0 && 
        selectedStudents.waitlisted.length === 0) {
      toast.error('Please categorize at least one student');
      return;
    }

    if (!window.confirm('Are you sure you want to publish these admissions? This action will notify all students.')) {
      return;
    }

    setPublishing(true);

    try {
      // Create admission record
      const admissionData = {
        institutionId: currentUser.uid,
        courseId: selectedCourse,
        academicYear,
        semester,
        admittedStudents: selectedStudents.admitted,
        rejectedStudents: selectedStudents.rejected,
        waitlistedStudents: selectedStudents.waitlisted,
        publishedAt: new Date()
      };

      const admissionRef = await addDoc(collection(db, 'admissions'), admissionData);

      // Update application statuses
      const updatePromises = [];

      selectedStudents.admitted.forEach(studentId => {
        const app = applications.find(a => a.studentId === studentId);
        if (app) {
          updatePromises.push(
            updateDoc(doc(db, 'applications', app.id), {
              status: 'admitted',
              decidedAt: new Date()
            })
          );
        }
      });

      selectedStudents.rejected.forEach(studentId => {
        const app = applications.find(a => a.studentId === studentId);
        if (app) {
          updatePromises.push(
            updateDoc(doc(db, 'applications', app.id), {
              status: 'rejected',
              decidedAt: new Date()
            })
          );
        }
      });

      selectedStudents.waitlisted.forEach(studentId => {
        const app = applications.find(a => a.studentId === studentId);
        if (app) {
          updatePromises.push(
            updateDoc(doc(db, 'applications', app.id), {
              status: 'waitlisted',
              decidedAt: new Date()
            })
          );
        }
      });

      await Promise.all(updatePromises);

      toast.success('Admissions published successfully! Students will be notified.');
      
      // Reset form
      setSelectedCourse('');
      setApplications([]);
      setSelectedStudents({ admitted: [], rejected: [], waitlisted: [] });
      setAcademicYear('');
      setSemester('');
    } catch (error) {
      console.error('Error publishing admissions:', error);
      toast.error('Failed to publish admissions');
    } finally {
      setPublishing(false);
    }
  };

  if (loading && courses.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="publish-admissions-container">
      <div className="page-header">
        <h1>Publish Admissions</h1>
        <p>Review and publish admission decisions for your courses</p>
      </div>

      <div className="admission-form-section">
        <div className="form-row">
          <div className="form-group">
            <label>Select Course *</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
            >
              <option value="">-- Select Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseName} ({course.courseCode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Academic Year *</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g., 2024/2025"
              required
            />
          </div>

          <div className="form-group">
            <label>Semester *</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            >
              <option value="">-- Select Semester --</option>
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>
          </div>
        </div>
      </div>

      {selectedCourse && applications.length > 0 && (
        <div className="categorization-section">
          <h2>Categorize Students</h2>
          <p>Click on the status buttons to categorize each student</p>

          <div className="students-list">
            {applications.map(application => {
              const category = getStudentCategory(application.studentId);
              
              return (
                <div key={application.id} className={`student-card ${category || ''}`}>
                  <div className="student-info">
                    <h3>
                      {application.student?.personalInfo?.firstName} {application.student?.personalInfo?.lastName}
                    </h3>
                    <p className="student-email">{application.student?.personalInfo?.email}</p>
                    <p className="student-school">
                      Previous School: {application.student?.academicInfo?.previousSchool || 'N/A'}
                    </p>
                    <p className="application-number">Application #{application.applicationNumber}</p>
                  </div>

                  <div className="categorization-buttons">
                    <button
                      onClick={() => handleStudentSelection(application.studentId, 'admitted')}
                      className={`category-btn admit ${category === 'admitted' ? 'selected' : ''}`}
                    >
                      <FaCheck /> Admit
                    </button>
                    <button
                      onClick={() => handleStudentSelection(application.studentId, 'waitlisted')}
                      className={`category-btn waitlist ${category === 'waitlisted' ? 'selected' : ''}`}
                    >
                      <FaClock /> Waitlist
                    </button>
                    <button
                      onClick={() => handleStudentSelection(application.studentId, 'rejected')}
                      className={`category-btn reject ${category === 'rejected' ? 'selected' : ''}`}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="admission-summary">
            <h3>Summary</h3>
            <div className="summary-stats">
              <div className="summary-stat admitted">
                <FaCheck />
                <span>Admitted: {selectedStudents.admitted.length}</span>
              </div>
              <div className="summary-stat waitlisted">
                <FaClock />
                <span>Waitlisted: {selectedStudents.waitlisted.length}</span>
              </div>
              <div className="summary-stat rejected">
                <FaTimes />
                <span>Rejected: {selectedStudents.rejected.length}</span>
              </div>
              <div className="summary-stat total">
                <FaGraduationCap />
                <span>Total Processed: {selectedStudents.admitted.length + selectedStudents.waitlisted.length + selectedStudents.rejected.length} / {applications.length}</span>
              </div>
            </div>
          </div>

          <div className="publish-actions">
            <button
              onClick={handlePublishAdmissions}
              className="btn-primary btn-large"
              disabled={publishing || 
                (selectedStudents.admitted.length === 0 && 
                 selectedStudents.rejected.length === 0 && 
                 selectedStudents.waitlisted.length === 0)}
            >
              {publishing ? 'Publishing...' : 'Publish Admissions'}
            </button>
          </div>
        </div>
      )}

      {selectedCourse && applications.length === 0 && !loading && (
        <div className="no-data">
          <p>No pending applications found for this course.</p>
        </div>
      )}

      {!selectedCourse && (
        <div className="info-message">
          <p>Please select a course to view and categorize applications.</p>
        </div>
      )}
    </div>
  );
};

export default PublishAdmissions;