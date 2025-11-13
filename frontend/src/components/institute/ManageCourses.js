// frontend/src/components/institute/ManageCourses.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
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
    admissionStatus: 'closed',
    requiredResults: {
      minMathScore: '',
      minEnglishScore: '',
      minGPA: '',
      requiredFieldOfStudy: ''
    },
    requiredSubjects: []
  });

  const [newSubject, setNewSubject] = useState({ name: '', minimumSymbol: '' });

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
    
    // Handle nested requiredResults fields
    if (name.startsWith('required')) {
      let fieldName = '';
      if (name === 'requiredMathScore') fieldName = 'minMathScore';
      else if (name === 'requiredEnglishScore') fieldName = 'minEnglishScore';
      else if (name === 'requiredGPA') fieldName = 'minGPA';
      else if (name === 'requiredFieldOfStudy') fieldName = 'requiredFieldOfStudy';
      
      setFormData(prev => ({
        ...prev,
        requiredResults: {
          ...prev.requiredResults,
          [fieldName]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubject = () => {
    if (!newSubject.name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }
    
    if (!newSubject.minimumSymbol) {
      toast.error('Please enter a minimum symbol/mark');
      return;
    }

    const symbol = parseFloat(newSubject.minimumSymbol);
    if (isNaN(symbol) || symbol < 0 || symbol > 100) {
      toast.error('Symbol/mark must be between 0 and 100');
      return;
    }

    // Check if subject already exists
    if (formData.requiredSubjects.some(s => s.name.toLowerCase() === newSubject.name.toLowerCase())) {
      toast.error('This subject is already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      requiredSubjects: [...prev.requiredSubjects, { name: newSubject.name.trim(), minimumSymbol: symbol }]
    }));
    setNewSubject({ name: '', minimumSymbol: '' });
    toast.success('Subject added');
  };

  const handleRemoveSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      requiredSubjects: prev.requiredSubjects.filter((_, i) => i !== index)
    }));
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
      admissionStatus: course.admissionStatus || 'closed',
      requiredResults: course.requiredResults || {
        minMathScore: '',
        minEnglishScore: '',
        minGPA: '',
        requiredFieldOfStudy: ''
      },
      requiredSubjects: course.requiredSubjects || []
    });
    setNewSubject({ name: '', minimumSymbol: '' });
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
      admissionStatus: 'closed',
      requiredResults: {
        minMathScore: '',
        minEnglishScore: '',
        minGPA: '',
        requiredFieldOfStudy: ''
      },
      requiredSubjects: []
    });
    setNewSubject({ name: '', minimumSymbol: '' });
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
          Add Course
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
                        {course.admissionStatus === 'open' ? 'Close' : 'Open'}
                      </button>
                      <button
                        onClick={() => handleEdit(course)}
                        className="btn-icon btn-edit"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.courseName)}
                        className="btn-icon btn-delete"
                        title="Delete"
                      >
                        Delete
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
                ×
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

              <div className="form-section-divider">
                <h3>Required Qualifications</h3>
                <p className="section-info">Specify the minimum qualifications students must have</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Mathematics Score (0-100)</label>
                  <input
                    type="number"
                    name="requiredMathScore"
                    value={formData.requiredResults.minMathScore}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="e.g., 60"
                  />
                </div>

                <div className="form-group">
                  <label>Minimum English Score (0-100)</label>
                  <input
                    type="number"
                    name="requiredEnglishScore"
                    value={formData.requiredResults.minEnglishScore}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="e.g., 55"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum GPA (0-4.0)</label>
                  <input
                    type="number"
                    name="requiredGPA"
                    value={formData.requiredResults.minGPA}
                    onChange={handleChange}
                    min="0"
                    max="4.0"
                    step="0.1"
                    placeholder="e.g., 2.5"
                  />
                </div>

                <div className="form-group">
                  <label>Required Field of Study</label>
                  <select
                    name="requiredFieldOfStudy"
                    value={formData.requiredResults.requiredFieldOfStudy}
                    onChange={handleChange}
                  >
                    <option value="">Any field (optional)</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Technology">Technology</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Law">Law</option>
                  </select>
                </div>
              </div>

              <div className="form-section-divider">
                <h3>Required Subjects</h3>
                <p className="section-info">Add specific subjects and their minimum marks/symbols</p>
              </div>

              <div className="form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g., Physics, Chemistry, Biology"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Symbol/Mark (0-100)</label>
                  <input
                    type="number"
                    value={newSubject.minimumSymbol}
                    onChange={(e) => setNewSubject({ ...newSubject, minimumSymbol: e.target.value })}
                    min="0"
                    max="100"
                    placeholder="e.g., 70"
                  />
                </div>
                <div className="form-group">
                  <button 
                    type="button" 
                    onClick={handleAddSubject}
                    className="btn-primary"
                    style={{ marginTop: '1.5rem' }}
                  >
                    Add Subject
                  </button>
                </div>
              </div>

              {formData.requiredSubjects.length > 0 && (
                <div className="subjects-list" style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f0f9ff',
                  borderRadius: '4px',
                  border: '1px solid #17a2b8'
                }}>
                  <h4 style={{ marginTop: 0, color: '#17a2b8' }}>Added Subjects:</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #17a2b8' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Subject</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Min Symbol</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.requiredSubjects.map((subject, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.5rem' }}>{subject.name}</td>
                          <td style={{ padding: '0.5rem' }}>{subject.minimumSymbol}/100</td>
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(index)}
                              className="btn-icon btn-delete"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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