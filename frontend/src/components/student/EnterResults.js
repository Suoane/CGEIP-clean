import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import './Student.css';

const EnterResults = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [formData, setFormData] = useState({
    mathScore: '',
    englishScore: '',
    scienceScore: '',
    gpa: '',
    fieldOfStudy: '',
    yearsOfStudy: '',
    additionalNotes: ''
  });
  const [mySubjects, setMySubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', marks: '' });

  useEffect(() => {
    fetchStudentData();
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setStudentData(data);
        
        // Populate form if results already exist
        if (data.results) {
          setFormData({
            mathScore: data.results.mathScore || '',
            englishScore: data.results.englishScore || '',
            scienceScore: data.results.scienceScore || '',
            gpa: data.results.gpa || '',
            fieldOfStudy: data.results.fieldOfStudy || '',
            yearsOfStudy: data.results.yearsOfStudy || '',
            additionalNotes: data.results.additionalNotes || ''
          });
        }

        // Load mySubjects if exists
        if (data.mySubjects && Array.isArray(data.mySubjects)) {
          setMySubjects(data.mySubjects);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load student data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubject = () => {
    if (!newSubject.name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    if (!newSubject.marks) {
      toast.error('Please enter marks/symbol for the subject');
      return;
    }

    const marks = parseFloat(newSubject.marks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      toast.error('Marks must be between 0 and 100');
      return;
    }

    // Check if subject already exists
    if (mySubjects.some(s => s.name.toLowerCase() === newSubject.name.toLowerCase())) {
      toast.error('This subject is already added');
      return;
    }

    setMySubjects(prev => [...prev, { name: newSubject.name.trim(), marks }]);
    setNewSubject({ name: '', marks: '' });
    toast.success('Subject added');
  };

  const handleRemoveSubject = (index) => {
    setMySubjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.mathScore || !formData.englishScore || !formData.gpa) {
      toast.error('Math score, English score, and GPA are required');
      return;
    }

    // Validate scores are between 0-100
    const scores = [formData.mathScore, formData.englishScore, formData.scienceScore];
    for (let score of scores) {
      if (score && (isNaN(score) || score < 0 || score > 100)) {
        toast.error('Scores must be between 0 and 100');
        return;
      }
    }

    // Validate GPA
    if (isNaN(formData.gpa) || formData.gpa < 0 || formData.gpa > 4.0) {
      toast.error('GPA must be between 0 and 4.0');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'students', currentUser.uid), {
        results: {
          mathScore: parseFloat(formData.mathScore),
          englishScore: parseFloat(formData.englishScore),
          scienceScore: formData.scienceScore ? parseFloat(formData.scienceScore) : null,
          gpa: parseFloat(formData.gpa),
          fieldOfStudy: formData.fieldOfStudy,
          yearsOfStudy: formData.yearsOfStudy ? parseInt(formData.yearsOfStudy) : null,
          additionalNotes: formData.additionalNotes,
          updatedAt: new Date()
        },
        mySubjects: mySubjects,
        resultsSubmitted: true,
        resultsSubmittedAt: new Date()
      });
      
      toast.success('Your results and subjects have been saved successfully!');
      fetchStudentData();
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!studentData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="enter-results-container">
      <div className="results-header">
        <h1>Your Academic Results</h1>
        <p>Please enter your exam scores and academic information to help us find suitable courses for you</p>
      </div>

      <form onSubmit={handleSubmit} className="results-form">
        <div className="form-section">
          <h2>Exam Scores</h2>
          <p className="section-info">Enter your scores on a scale of 0-100</p>

          <div className="form-group">
            <label htmlFor="mathScore">Mathematics Score *</label>
            <input
              type="number"
              id="mathScore"
              name="mathScore"
              value={formData.mathScore}
              onChange={handleChange}
              min="0"
              max="100"
              required
              placeholder="Enter your math score"
            />
          </div>

          <div className="form-group">
            <label htmlFor="englishScore">English Score *</label>
            <input
              type="number"
              id="englishScore"
              name="englishScore"
              value={formData.englishScore}
              onChange={handleChange}
              min="0"
              max="100"
              required
              placeholder="Enter your English score"
            />
          </div>

          <div className="form-group">
            <label htmlFor="scienceScore">Science Score</label>
            <input
              type="number"
              id="scienceScore"
              name="scienceScore"
              value={formData.scienceScore}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="Enter your science score (optional)"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Academic Information</h2>

          <div className="form-group">
            <label htmlFor="gpa">GPA (Grade Point Average) *</label>
            <input
              type="number"
              id="gpa"
              name="gpa"
              value={formData.gpa}
              onChange={handleChange}
              min="0"
              max="4.0"
              step="0.01"
              required
              placeholder="Enter your GPA (0.0 - 4.0)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fieldOfStudy">Field of Study</label>
            <select
              id="fieldOfStudy"
              name="fieldOfStudy"
              value={formData.fieldOfStudy}
              onChange={handleChange}
            >
              <option value="">Select a field (optional)</option>
              <option value="Science">Science</option>
              <option value="Arts">Arts</option>
              <option value="Commerce">Commerce</option>
              <option value="Technology">Technology</option>
              <option value="Engineering">Engineering</option>
              <option value="Business">Business</option>
              <option value="Medicine">Medicine</option>
              <option value="Law">Law</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="yearsOfStudy">Years of Study Completed</label>
            <input
              type="number"
              id="yearsOfStudy"
              name="yearsOfStudy"
              value={formData.yearsOfStudy}
              onChange={handleChange}
              min="0"
              max="20"
              placeholder="Number of years (optional)"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Your Subjects and Marks</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter your subject names and the marks/symbols you obtained</p>

          <div className="form-group">
            <label htmlFor="subjectName">Subject Name</label>
            <input
              type="text"
              id="subjectName"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              placeholder="e.g., Physics, Chemistry, Biology, Mathematics"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subjectMarks">Marks/Symbol (0-100)</label>
              <input
                type="number"
                id="subjectMarks"
                value={newSubject.marks}
                onChange={(e) => setNewSubject({ ...newSubject, marks: e.target.value })}
                min="0"
                max="100"
                placeholder="e.g., 85"
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

          {mySubjects.length > 0 && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f0f9ff',
              borderRadius: '4px',
              border: '1px solid #17a2b8'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#17a2b8' }}>Your Subjects:</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #17a2b8' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#17a2b8' }}>Subject</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#17a2b8' }}>Marks</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: '#17a2b8' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubjects.map((subject, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>{subject.name}</td>
                      <td style={{ padding: '0.75rem' }}>{subject.marks}/100</td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(index)}
                          className="btn-icon btn-delete"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
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
        </div>

        <div className="form-section">
          <h2>Additional Information</h2>
          
          <div className="form-group">
            <label htmlFor="additionalNotes">Additional Notes</label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              placeholder="Any additional information you'd like to share (optional)"
              rows="4"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Results'}
          </button>
        </div>

        {studentData.resultsSubmitted && (
          <div className="success-message">
            Your results were last updated on {studentData.resultsSubmittedAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
          </div>
        )}
      </form>
    </div>
  );
};

export default EnterResults;
