// frontend/src/components/admin/ManageCompanies.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaBan, FaTrash, FaEye } from 'react-icons/fa';
import './Admin.css';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, suspended
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'companies'));
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
      setLoading(false);
    }
  };

  const handleApprove = async (companyId, companyName) => {
    if (!window.confirm(`Approve ${companyName}? They will be able to post jobs.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'companies', companyId), {
        status: 'approved',
        approvedAt: new Date()
      });
      toast.success(`${companyName} has been approved!`);
      fetchCompanies();
    } catch (error) {
      console.error('Error approving company:', error);
      toast.error('Failed to approve company');
    }
  };

  const handleSuspend = async (companyId, companyName) => {
    if (!window.confirm(`Suspend ${companyName}? They won't be able to post new jobs.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'companies', companyId), {
        status: 'suspended',
        suspendedAt: new Date()
      });
      toast.success(`${companyName} has been suspended!`);
      fetchCompanies();
    } catch (error) {
      console.error('Error suspending company:', error);
      toast.error('Failed to suspend company');
    }
  };

  const handleReactivate = async (companyId, companyName) => {
    if (!window.confirm(`Reactivate ${companyName}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'companies', companyId), {
        status: 'approved',
        reactivatedAt: new Date()
      });
      toast.success(`${companyName} has been reactivated!`);
      fetchCompanies();
    } catch (error) {
      console.error('Error reactivating company:', error);
      toast.error('Failed to reactivate company');
    }
  };

  const handleDelete = async (companyId, companyName) => {
    if (!window.confirm(`Permanently delete ${companyName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'companies', companyId));
      toast.success(`${companyName} has been deleted!`);
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  const viewDetails = (company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const filteredCompanies = companies.filter(company => {
    if (filter === 'all') return true;
    return company.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading companies...</div>;
  }

  return (
    <div className="manage-container">
      <div className="page-header">
        <h1>Manage Companies</h1>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({companies.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({companies.filter(c => c.status === 'pending').length})
          </button>
          <button
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({companies.filter(c => c.status === 'approved').length})
          </button>
          <button
            className={`filter-tab ${filter === 'suspended' ? 'active' : ''}`}
            onClick={() => setFilter('suspended')}
          >
            Suspended ({companies.filter(c => c.status === 'suspended').length})
          </button>
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="no-data">
          <p>No companies found in this category.</p>
        </div>
      ) : (
        <div className="companies-grid">
          {filteredCompanies.map(company => (
            <div key={company.id} className="company-card">
              <div className="company-header">
                <div>
                  <h3>{company.companyName}</h3>
                  <p className="company-industry">{company.industry}</p>
                  <p className="company-location">📍 {company.location}</p>
                </div>
                <span className={`status-badge ${company.status}`}>
                  {company.status}
                </span>
              </div>

              <div className="company-info">
                <p><strong>Email:</strong> {company.contactInfo?.email}</p>
                <p><strong>Phone:</strong> {company.contactInfo?.phone || 'N/A'}</p>
                <p><strong>Website:</strong> {company.contactInfo?.website || 'N/A'}</p>
                <p><strong>Registered:</strong> {new Date(company.createdAt?.toDate()).toLocaleDateString()}</p>
              </div>

              {company.description && (
                <div className="company-description">
                  <p>{company.description.substring(0, 150)}...</p>
                </div>
              )}

              <div className="company-actions">
                <button
                  onClick={() => viewDetails(company)}
                  className="btn-icon btn-info"
                  title="View Details"
                >
                  <FaEye /> Details
                </button>

                {company.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(company.id, company.companyName)}
                    className="btn-icon btn-success"
                    title="Approve"
                  >
                    <FaCheck /> Approve
                  </button>
                )}

                {company.status === 'approved' && (
                  <button
                    onClick={() => handleSuspend(company.id, company.companyName)}
                    className="btn-icon btn-warning"
                    title="Suspend"
                  >
                    <FaBan /> Suspend
                  </button>
                )}

                {company.status === 'suspended' && (
                  <button
                    onClick={() => handleReactivate(company.id, company.companyName)}
                    className="btn-icon btn-success"
                    title="Reactivate"
                  >
                    <FaCheck /> Reactivate
                  </button>
                )}

                <button
                  onClick={() => handleDelete(company.id, company.companyName)}
                  className="btn-icon btn-delete"
                  title="Delete"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCompany.companyName}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <div className="company-details-content">
              <div className="detail-section">
                <h3>Company Information</h3>
                <p><strong>Industry:</strong> {selectedCompany.industry}</p>
                <p><strong>Location:</strong> {selectedCompany.location}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${selectedCompany.status}`}>{selectedCompany.status}</span></p>
              </div>

              <div className="detail-section">
                <h3>Contact Information</h3>
                <p><strong>Email:</strong> {selectedCompany.contactInfo?.email}</p>
                <p><strong>Phone:</strong> {selectedCompany.contactInfo?.phone || 'N/A'}</p>
                <p><strong>Website:</strong> {selectedCompany.contactInfo?.website || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedCompany.description || 'No description provided'}</p>
              </div>

              <div className="detail-section">
                <h3>Registration Details</h3>
                <p><strong>Registered:</strong> {new Date(selectedCompany.createdAt?.toDate()).toLocaleDateString()}</p>
                {selectedCompany.approvedAt && (
                  <p><strong>Approved:</strong> {new Date(selectedCompany.approvedAt?.toDate()).toLocaleDateString()}</p>
                )}
                {selectedCompany.suspendedAt && (
                  <p><strong>Suspended:</strong> {new Date(selectedCompany.suspendedAt?.toDate()).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowDetailsModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCompanies;