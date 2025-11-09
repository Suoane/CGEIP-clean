// frontend/src/components/admin/ManageInstitutions.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import './Admin.css';

// Add this CSS to your Admin.css file for the modal and form styles

const ManageInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentInstitution, setCurrentInstitution] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    description: '',
    contactInfo: {
      phone: '',
      website: ''
    }
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'institutions'));
      const institutionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstitutions(institutionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to load institutions');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode && currentInstitution) {
        // Update existing institution
        await updateDoc(doc(db, 'institutions', currentInstitution.id), {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Institution updated successfully!');
      } else {
        // Add new institution
        await addDoc(collection(db, 'institutions'), {
          ...formData,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Institution added successfully!');
      }

      // Reset and refresh
      resetForm();
      fetchInstitutions();
    } catch (error) {
      console.error('Error saving institution:', error);
      toast.error('Failed to save institution');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (institution) => {
    setCurrentInstitution(institution);
    setFormData({
      name: institution.name || '',
      email: institution.email || '',
      location: institution.location || '',
      description: institution.description || '',
      contactInfo: {
        phone: institution.contactInfo?.phone || '',
        website: institution.contactInfo?.website || ''
      }
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'institutions', id));
      toast.success('Institution deleted successfully!');
      fetchInstitutions();
    } catch (error) {
      console.error('Error deleting institution:', error);
      toast.error('Failed to delete institution');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      location: '',
      description: '',
      contactInfo: {
        phone: '',
        website: ''
      }
    });
    setCurrentInstitution(null);
    setEditMode(false);
    setShowModal(false);
  };

  if (loading && institutions.length === 0) {
    return <div className="loading">Loading institutions...</div>;
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <h1>Manage Institutions</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <FaPlus /> Add Institution
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Phone</th>
              <th>Website</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No institutions found. Add your first institution!
                </td>
              </tr>
            ) : (
              institutions.map(institution => (
                <tr key={institution.id}>
                  <td>{institution.name}</td>
                  <td>{institution.email}</td>
                  <td>{institution.location}</td>
                  <td>{institution.contactInfo?.phone || 'N/A'}</td>
                  <td>
                    {institution.contactInfo?.website ? (
                      <a href={institution.contactInfo.website} target="_blank" rel="noopener noreferrer">
                        Visit
                      </a>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <span className={`status-badge ${institution.status}`}>
                      {institution.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(institution)}
                        className="btn-icon btn-edit"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(institution.id, institution.name)}
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
              <h2>{editMode ? 'Edit Institution' : 'Add New Institution'}</h2>
              <button onClick={resetForm} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Institution Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., National University of Lesotho"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="contact@institution.edu"
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Roma, Maseru"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleChange}
                  placeholder="+266 XXXX XXXX"
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="contactInfo.website"
                  value={formData.contactInfo.website}
                  onChange={handleChange}
                  placeholder="https://www.institution.edu"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Brief description of the institution..."
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

export default ManageInstitutions;