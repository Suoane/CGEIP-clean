// frontend/src/components/student/UploadDocuments.js - USING BACKEND API
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaFileUpload, FaCheckCircle, FaIdCard, FaFileAlt, FaCertificate } from 'react-icons/fa';
import './Student.css';

const UploadDocuments = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [files, setFiles] = useState({
    idCard: null,
    transcript: null,
    certificate: null
  });
  const [validationStatus, setValidationStatus] = useState({
    idCard: null,
    transcript: null,
    certificate: null
  });
  const [uploadProgress, setUploadProgress] = useState({
    idCard: 0,
    transcript: 0,
    certificate: 0
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchStudentData();
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load student data');
    }
  };

  const validateFile = (file, documentType) => {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      validationResult.isValid = false;
      validationResult.errors.push('Invalid file type. Only PDF, JPG, and PNG are allowed.');
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      validationResult.isValid = false;
      validationResult.errors.push(`File size exceeds 5MB limit.`);
    }

    // Check minimum file size
    const minSize = 10 * 1024;
    if (file.size < minSize) {
      validationResult.isValid = false;
      validationResult.errors.push('File is too small. Please upload a valid document.');
    }

    return validationResult;
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    
    if (!file) {
      setFiles(prev => ({ ...prev, [documentType]: null }));
      setValidationStatus(prev => ({ ...prev, [documentType]: null }));
      return;
    }

    const validation = validateFile(file, documentType);
    setValidationStatus(prev => ({ ...prev, [documentType]: validation }));

    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      e.target.value = '';
      setFiles(prev => ({ ...prev, [documentType]: null }));
      return;
    }

    setFiles(prev => ({ ...prev, [documentType]: file }));
    toast.success(`${documentType} selected: ${file.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.idCard && !files.transcript && !files.certificate) {
      toast.error('Please select at least one document to upload');
      return;
    }

    setLoading(true);

    try {
      // Get Firebase auth token
      const token = await currentUser.getIdToken();

      // Create FormData
      const formData = new FormData();
      if (files.idCard) formData.append('idCard', files.idCard);
      if (files.transcript) formData.append('transcript', files.transcript);
      if (files.certificate) formData.append('certificate', files.certificate);

      console.log('📤 Uploading documents to backend...');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          idCard: files.idCard ? Math.min(prev.idCard + 10, 90) : 0,
          transcript: files.transcript ? Math.min(prev.transcript + 10, 90) : 0,
          certificate: files.certificate ? Math.min(prev.certificate + 10, 90) : 0
        }));
      }, 500);

      // Upload to backend
      const response = await fetch(`${API_URL}upload/student/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      const data = await response.json();
      console.log('Upload response:', data);

      if (data.success) {
        // Complete progress
        setUploadProgress({
          idCard: files.idCard ? 100 : 0,
          transcript: files.transcript ? 100 : 0,
          certificate: files.certificate ? 100 : 0
        });

        toast.success('🎉 Documents uploaded successfully!');
        
        // Show auto-matching results if available
        if (data.autoMatching && data.autoMatching.coursesFound > 0) {
          setTimeout(() => {
            toast.info(
              `✨ Found ${data.autoMatching.coursesFound} matching courses! Check your dashboard.`,
              { autoClose: 7000 }
            );
          }, 1000);
        }

        // Reset form
        setFiles({ idCard: null, transcript: null, certificate: null });
        setValidationStatus({ idCard: null, transcript: null, certificate: null });
        document.querySelectorAll('input[type="file"]').forEach(input => {
          input.value = '';
        });

        // Refresh data
        fetchStudentData();

        // Reset progress after showing 100%
        setTimeout(() => {
          setUploadProgress({ idCard: 0, transcript: 0, certificate: 0 });
        }, 2000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload documents: ' + error.message);
      setUploadProgress({ idCard: 0, transcript: 0, certificate: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'idCard': return FaIdCard;
      case 'transcript': return FaFileAlt;
      case 'certificate': return FaCertificate;
      default: return FaFileUpload;
    }
  };

  const renderDocumentStatus = (docType, docName) => {
    const Icon = getDocumentIcon(docType);
    const hasDoc = studentData?.documents?.[docType];
    const hasNewFile = files[docType];
    const validation = validationStatus[docType];
    const progress = uploadProgress[docType];

    return (
      <div className="upload-card" style={{
        borderColor: hasDoc ? '#10b981' : hasNewFile ? '#3b82f6' : '#d1d5db',
        background: hasDoc ? '#f0fdf4' : hasNewFile ? '#eff6ff' : '#f9fafb'
      }}>
        <label htmlFor={docType} className="upload-label">
          <div className="upload-icon">
            {hasDoc || hasNewFile ? (
              <FaCheckCircle style={{ color: hasDoc ? '#10b981' : '#3b82f6' }} />
            ) : (
              <Icon style={{ color: '#9ca3af' }} />
            )}
          </div>
          <h3>{docName}</h3>
          
          {hasDoc && (
            <div style={{
              padding: '0.5rem 1rem',
              background: '#d1fae5',
              color: '#065f46',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              ✓ Currently Uploaded
            </div>
          )}

          <p style={{ color: '#6b7280', margin: '0.5rem 0' }}>
            {docType === 'idCard' && 'National ID or Passport (Required)'}
            {docType === 'transcript' && 'Academic Transcript (Required)'}
            {docType === 'certificate' && 'Completion Certificate (Optional)'}
          </p>

          <input
            type="file"
            id={docType}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(e, docType)}
            className="file-input"
            disabled={loading}
          />

          {validation && validation.errors.length > 0 && (
            <div style={{ marginTop: '0.75rem', textAlign: 'left' }}>
              {validation.errors.map((error, idx) => (
                <div key={idx} style={{
                  padding: '0.5rem',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem'
                }}>
                  ⚠️ {error}
                </div>
              ))}
            </div>
          )}

          {hasNewFile && (
            <div className="file-selected" style={{ marginTop: '0.75rem' }}>
              <FaCheckCircle style={{ marginRight: '0.5rem' }} />
              {hasNewFile.name}
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {(hasNewFile.size / 1024).toFixed(1)}KB
              </div>
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <div style={{ marginTop: '0.75rem', width: '100%' }}>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Uploading... {progress}%
              </p>
            </div>
          )}

          {progress === 100 && (
            <div style={{ 
              marginTop: '0.75rem', 
              padding: '0.5rem',
              background: '#d1fae5',
              color: '#065f46',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              ✓ Uploaded successfully!
            </div>
          )}
        </label>

        {hasDoc && (
          <a
            href={studentData.documents[docType]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              marginTop: '0.75rem',
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#3b82f6',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              textAlign: 'center',
              border: '2px solid #3b82f6'
            }}
          >
            📄 View Current Document
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="upload-documents-container">
      <div className="page-header">
        <h1>📁 Upload Documents</h1>
        <p>Upload valid, clear documents to complete your application profile</p>
      </div>

      <div className="info-banner" style={{ marginBottom: '2rem' }}>
        <FaCheckCircle />
        <div>
          <strong>Document Requirements:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.875rem' }}>
            <li><strong>ID Card/Passport:</strong> Clear, readable copy (Required)</li>
            <li><strong>Academic Transcript:</strong> Official grades/marks sheet (Required)</li>
            <li><strong>Certificate:</strong> Completion certificate if available (Optional)</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <h2>📤 Upload Your Documents</h2>
        
        <div className="upload-grid">
          {renderDocumentStatus('idCard', 'ID Card / Passport')}
          {renderDocumentStatus('transcript', 'Academic Transcript')}
          {renderDocumentStatus('certificate', 'Certificate')}
        </div>

        <div className="upload-info">
          <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>📋 Upload Guidelines:</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <p>✓ Accepted formats: PDF, JPEG, PNG</p>
            <p>✓ Maximum file size: 5MB per document</p>
            <p>✓ Documents must be clear and readable</p>
            <p>✓ Upload will take 5-10 seconds per document</p>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading || (!files.idCard && !files.transcript && !files.certificate)}
          style={{
            opacity: (loading || (!files.idCard && !files.transcript && !files.certificate)) ? 0.5 : 1
          }}
        >
          {loading ? '⏳ Uploading Documents...' : '📤 Upload Selected Documents'}
        </button>

        {(!files.idCard && !files.transcript && !files.certificate) && (
          <p style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            fontSize: '0.875rem',
            marginTop: '1rem'
          }}>
            Select at least one document to upload
          </p>
        )}
      </form>
    </div>
  );
};

export default UploadDocuments;