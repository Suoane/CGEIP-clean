// frontend/src/components/admin/ManageFaculties.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import './Admin.css';

const ManageFaculties = () => {
  const [faculties, setFaculties] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState(null);
  const [formData, setFormData] = useState({
    facultyName: '',
    facultyCode: '',
    institutionId: '',
    description: '',
    dean: ''
  });

  useEffect(() => {
    fetchInstitutions();
    fetchFaculties();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'institutions'));
      const institutionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to load institutions');
    }
  };

  const fetchFaculties = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'faculties'));
      const facultiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFaculties(facultiesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      toast.error('Failed to load faculties');
      setLoading(false);
    }
  };

  const getInstitutionName = (institutionId) => {
    const institution = institutions.find(i => i.id === institutionId);
    return institution ? institution.name : 'Unknown';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode && currentFaculty) {
        await updateDoc(doc(db, 'faculties', currentFaculty.id), {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Faculty updated successfully!');
      } else {
        await addDoc(collection(db, 'faculties'), {
          ...formData,
          createdAt: new Date()
        });
        toast.success('Faculty added successfully!');
      }

      resetForm();
      fetchFaculties();
    } catch (error) {
      console.error('Error saving faculty:', error);
      toast.error('Failed to save faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    setCurrentFaculty(faculty);
    setFormData({
      facultyName: faculty.facultyName || '',
      facultyCode: faculty.facultyCode || '',
      institutionId: faculty.institutionId || '',
      description: faculty.description || '',
      dean: faculty.dean || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This will also affect related courses.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'faculties', id));
      toast.success('Faculty deleted successfully!');
      fetchFaculties();
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast.error('Failed to delete faculty');
    }
  };

  const resetForm = () => {
    setFormData({
      facultyName: '',
      facultyCode: '',
      institutionId: '',
      description: '',
      dean: ''
    });
    setCurrentFaculty(null);
    setEditMode(false);
    setShowModal(false);
  };

  if (loading && faculties.length === 0) {
    return <div className="loading">Loading faculties...</div>;
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <h1>Manage Faculties</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <FaPlus /> Add Faculty
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Faculty Name</th>
              <th>Code</th>
              <th>Institution</th>
              <th>Dean</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculties.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No faculties found. Add your first faculty!
                </td>
              </tr>
            ) : (
              faculties.map(faculty => (
                <tr key={faculty.id}>
                  <td>{faculty.facultyName}</td>
                  <td>{faculty.facultyCode}</td>
                  <td>{getInstitutionName(faculty.institutionId)}</td>
                  <td>{faculty.dean || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(faculty)}
                        className="btn-icon btn-edit"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(faculty.id, faculty.facultyName)}
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
              <h2>{editMode ? 'Edit Faculty' : 'Add New Faculty'}</h2>
              <button onClick={resetForm} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Institution *</label>
                <select
                  name="institutionId"
                  value={formData.institutionId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Institution --</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Faculty Name *</label>
                <input
                  type="text"
                  name="facultyName"
                  value={formData.facultyName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Faculty of Science and Technology"
                />
              </div>

              <div className="form-group">
                <label>Faculty Code *</label>
                <input
                  type="text"
                  name="facultyCode"
                  value={formData.facultyCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g., FST"
                />
              </div>

              <div className="form-group">
                <label>Dean</label>
                <input
                  type="text"
                  name="dean"
                  value={formData.dean}
                  onChange={handleChange}
                  placeholder="Name of the Dean"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Brief description of the faculty..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editMode ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFaculties;