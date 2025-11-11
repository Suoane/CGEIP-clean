// frontend/src/components/student/UploadDocuments.js - ENHANCED VALIDATION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaFileUpload, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaIdCard, FaCertificate } from 'react-icons/fa';
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

    // 1. Check file type
    const allowedTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png'
    };

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileType = file.type;

    if (!Object.values(allowedTypes).includes(fileType) && 
        !Object.keys(allowedTypes).includes(fileExtension)) {
      validationResult.isValid = false;
      validationResult.errors.push('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.');
    }

    // 2. Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      validationResult.isValid = false;
      validationResult.errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit.`);
    }

    // 3. Check minimum file size (10KB to avoid empty files)
    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
      validationResult.isValid = false;
      validationResult.errors.push('File is too small. Please upload a valid document.');
    }

    // 4. Document-specific validation
    switch (documentType) {
      case 'transcript':
        if (!file.name.toLowerCase().includes('transcript') && 
            !file.name.toLowerCase().includes('academic') &&
            !file.name.toLowerCase().includes('grade')) {
          validationResult.warnings.push('Filename should contain "transcript" or "academic" for clarity.');
        }
        // Transcript should ideally be PDF
        if (fileType !== 'application/pdf') {
          validationResult.warnings.push('Transcripts are best uploaded as PDF for better quality.');
        }
        break;

      case 'idCard':
        if (!file.name.toLowerCase().includes('id') && 
            !file.name.toLowerCase().includes('card') &&
            !file.name.toLowerCase().includes('passport')) {
          validationResult.warnings.push('Filename should contain "id" or "passport" for clarity.');
        }
        break;

      case 'certificate':
        if (!file.name.toLowerCase().includes('cert') && 
            !file.name.toLowerCase().includes('diploma')) {
          validationResult.warnings.push('Filename should contain "certificate" or "diploma" for clarity.');
        }
        break;

      default:
        break;
    }

    // 5. Check for suspicious file patterns
    const suspiciousPatterns = ['test', 'sample', 'dummy', 'fake', 'temp'];
    const fileNameLower = file.name.toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
      if (fileNameLower.includes(pattern)) {
        validationResult.warnings.push(`Filename contains "${pattern}" - ensure this is your actual document.`);
      }
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

    // Validate the file
    const validation = validateFile(file, documentType);
    setValidationStatus(prev => ({ ...prev, [documentType]: validation }));

    if (!validation.isValid) {
      // Show all errors
      validation.errors.forEach(error => toast.error(error));
      e.target.value = '';
      setFiles(prev => ({ ...prev, [documentType]: null }));
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => toast.warning(warning, { autoClose: 5000 }));
    }

    // File is valid
    setFiles(prev => ({ ...prev, [documentType]: file }));
    
    toast.success(
      <div>
        <strong>✓ {documentType} validated successfully!</strong>
        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {file.name} ({(file.size / 1024).toFixed(1)}KB)
        </div>
      </div>,
      { autoClose: 3000 }
    );
  };

  const uploadFile = async (file, path, documentType) => {
    try {
      // Update progress
      setUploadProgress(prev => ({ ...prev, [documentType]: 10 }));

      const storageRef = ref(storage, path);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[documentType];
          if (current < 90) {
            return { ...prev, [documentType]: current + 10 };
          }
          return prev;
        });
      }, 200);

      const snapshot = await uploadBytes(storageRef, file);
      clearInterval(progressInterval);
      
      setUploadProgress(prev => ({ ...prev, [documentType]: 95 }));
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if at least one file is selected
    if (!files.idCard && !files.transcript && !files.certificate) {
      toast.error('Please select at least one document to upload');
      return;
    }

    // Warn about missing critical documents
    if (!files.transcript && !studentData?.documents?.transcript) {
      const shouldContinue = window.confirm(
        'Transcript is required for course applications. Continue without uploading transcript?'
      );
      if (!shouldContinue) return;
    }

    if (!files.idCard && !studentData?.documents?.idCard) {
      const shouldContinue = window.confirm(
        'ID Card is required for course applications. Continue without uploading ID?'
      );
      if (!shouldContinue) return;
    }

    setLoading(true);

    try {
      const uploadedDocs = { ...studentData?.documents };
      const uploadTasks = [];

      // Upload each file with progress tracking
      if (files.idCard) {
        toast.info('📤 Uploading ID Card...', { autoClose: 2000 });
        const idCardURL = await uploadFile(
          files.idCard,
          `students/${currentUser.uid}/documents/idCard_${Date.now()}.${files.idCard.name.split('.').pop()}`,
          'idCard'
        );
        uploadedDocs.idCard = idCardURL;
        uploadedDocs.idCardName = files.idCard.name;
        uploadedDocs.idCardUploadedAt = new Date();
        toast.success('✓ ID Card uploaded successfully!');
      }

      if (files.transcript) {
        toast.info('📤 Uploading Transcript...', { autoClose: 2000 });
        const transcriptURL = await uploadFile(
          files.transcript,
          `students/${currentUser.uid}/documents/transcript_${Date.now()}.${files.transcript.name.split('.').pop()}`,
          'transcript'
        );
        uploadedDocs.transcript = transcriptURL;
        uploadedDocs.transcriptName = files.transcript.name;
        uploadedDocs.transcriptUploadedAt = new Date();
        toast.success('✓ Transcript uploaded successfully!');
      }

      if (files.certificate) {
        toast.info('📤 Uploading Certificate...', { autoClose: 2000 });
        const certificateURL = await uploadFile(
          files.certificate,
          `students/${currentUser.uid}/documents/certificate_${Date.now()}.${files.certificate.name.split('.').pop()}`,
          'certificate'
        );
        uploadedDocs.certificate = certificateURL;
        uploadedDocs.certificateName = files.certificate.name;
        uploadedDocs.certificateUploadedAt = new Date();
        toast.success('✓ Certificate uploaded successfully!');
      }

      // Update Firestore with all document metadata
      await updateDoc(doc(db, 'students', currentUser.uid), {
        documents: uploadedDocs,
        documentsUpdatedAt: new Date(),
        documentsComplete: !!(uploadedDocs.transcript && uploadedDocs.idCard)
      });

      toast.success('🎉 All documents uploaded successfully!', { autoClose: 5000 });
      
      // Check if student can now apply
      if (uploadedDocs.transcript && uploadedDocs.idCard) {
        setTimeout(() => {
          toast.info(
            <div>
              <strong>✨ You're ready to apply!</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <a href="/student/apply-course" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  View recommended courses →
                </a>
              </div>
            </div>,
            { autoClose: 10000 }
          );
        }, 1000);
      }
      
      // Reset form
      setFiles({ idCard: null, transcript: null, certificate: null });
      setValidationStatus({ idCard: null, transcript: null, certificate: null });
      setUploadProgress({ idCard: 0, transcript: 0, certificate: 0 });

      // Clear file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });

      // Refresh student data
      fetchStudentData();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents. Please try again.');
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
          
          {/* Status */}
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

          {/* Validation feedback */}
          {validation && (
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
              {validation.warnings.map((warning, idx) => (
                <div key={idx} style={{
                  padding: '0.5rem',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem'
                }}>
                  💡 {warning}
                </div>
              ))}
            </div>
          )}

          {/* New file selected */}
          {hasNewFile && (
            <div className="file-selected" style={{ marginTop: '0.75rem' }}>
              <FaCheckCircle style={{ marginRight: '0.5rem' }} />
              {hasNewFile.name}
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {(hasNewFile.size / 1024).toFixed(1)}KB
              </div>
            </div>
          )}

          {/* Upload progress */}
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
        </label>

        {/* View existing document */}
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

      {/* Requirements Info */}
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
            <p>✓ Minimum file size: 10KB (to ensure quality)</p>
            <p>✓ Documents must be clear and readable</p>
            <p>✓ Use descriptive filenames (e.g., "transcript_2024.pdf")</p>
            <p>⚠️ Avoid uploading test/sample documents</p>
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