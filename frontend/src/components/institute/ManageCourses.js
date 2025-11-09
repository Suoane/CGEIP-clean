// frontend/src/components/institute/ManageCourses.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import '../admin/Admin.css';

const ManageCourses = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    facultyId: '',
    duration: '',
    level: '',
    description: '',
    admissionStatus: 'closed'
  });

  useEffect(() => {
    fetchFaculties();
    fetchCourses();
  }, [currentUser]);

  const fetchFaculties = async () => {
    try {
      const q = query(
        collection(db, 'faculties'),
        where('institutionId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const facultiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

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

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.facultyName : 'Unknown';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (faculties.length === 0) {
      toast.error('Please create a faculty first before adding courses');
      return;
    }

    try {
      if (editMode && currentCourse) {
        await updateDoc(doc(db, 'courses', currentCourse.id), {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Course updated successfully!');
      } else {
        await addDoc(collection(db, 'courses'), {
          ...formData,
          institutionId: currentUser.uid,
          createdAt: new Date()
        });
        toast.success('Course added successfully!');
      }

      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setCurrentCourse(course);
    setFormData({
      courseName: course.courseName || '',
      courseCode: course.courseCode || '',
      facultyId: course.facultyId || '',
      duration: course.duration || '',
      level: course.level || '',
      description: course.description || '',
      admissionStatus: course.admissionStatus || 'closed'
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', id));
      toast.success('Course deleted successfully!');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const toggleAdmissionStatus = async (course) => {
    const newStatus = course.admissionStatus === 'open' ? 'closed' : 'open';
    
    try {
      await updateDoc(doc(db, 'courses', course.id), {
        admissionStatus: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Admissions ${newStatus === 'open' ? 'opened' : 'closed'} for ${course.courseName}`);
      fetchCourses();
    } catch (error) {
      console.error('Error toggling admission status:', error);
      toast.error('Failed to update admission status');
    }
  };

  const resetForm = () => {
    setFormData({
      courseName: '',
      courseCode: '',
      facultyId: '',
      duration: '',
      level: '',
      description: '',
      admissionStatus: 'closed'
    });
    setCurrentCourse(null);
    setEditMode(false);
    setShowModal(false);
  };

  if (loading && courses.length === 0) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <h1>Manage Courses</h1>
        <button 
          onClick={() => {
            if (faculties.length === 0) {
              toast.warning('Please create a faculty first before adding courses');
              return;
            }
            setShowModal(true);
          }} 
          className="btn-primary"
        >
          <FaPlus /> Add Course
        </button>
      </div>

      {faculties.length === 0 && (
        <div className="alert-banner">
          <p>⚠️ You need to create at least one faculty before you can add courses.</p>
        </div>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Code</th>
              <th>Faculty</th>
              <th>Duration</th>
              <th>Level</th>
              <th>Admission Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No courses found. Add your first course!
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id}>
                  <td>{course.courseName}</td>
                  <td>{course.courseCode}</td>
                  <td>{getFacultyName(course.facultyId)}</td>
                  <td>{course.duration}</td>
                  <td>{course.level}</td>
                  <td>
                    <span className={`status-badge ${course.admissionStatus}`}>
                      {course.admissionStatus}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => toggleAdmissionStatus(course)}
                        className={`btn-icon ${course.admissionStatus === 'open' ? 'btn-success' : 'btn-warning'}`}
                        title={course.admissionStatus === 'open' ? 'Close Admissions' : 'Open Admissions'}
                      >
                        {course.admissionStatus === 'open' ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button
                        onClick={() => handleEdit(course)}
                        className="btn-icon btn-edit"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.courseName)}
                        className="btn-icon btn-delete"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Course' : 'Add New Course'}</h2>
              <button onClick={resetForm} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Faculty *</label>
                <select
                  name="facultyId"
                  value={formData.facultyId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Faculty --</option>
                  {faculties.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.facultyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Bachelor of Science in Computer Science"
                />
              </div>

              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g., BSC-CS"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration *</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 4 years"
                  />
                </div>

                <div className="form-group">
                  <label>Level *</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Level --</option>
                    <option value="certificate">Certificate</option>
                    <option value="diploma">Diploma</option>
                    <option value="degree">Degree</option>
                    <option value="masters">Masters</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Admission Status</label>
                <select
                  name="admissionStatus"
                  value={formData.admissionStatus}
                  onChange={handleChange}
                >
                  <option value="closed">Closed</option>
                  <option value="open">Open</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Brief description of the course..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;