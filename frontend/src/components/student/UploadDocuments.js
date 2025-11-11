// frontend/src/components/student/UploadDocuments.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { toast } from 'react-toastify';
import { FaFileUpload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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
  const [previews, setPreviews] = useState({
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

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, JPG, and PNG files are allowed');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = '';
      return;
    }

    setFiles(prev => ({
      ...prev,
      [documentType]: file
    }));

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({
          ...prev,
          [documentType]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews(prev => ({
        ...prev,
        [documentType]: 'PDF'
      }));
    }

    toast.success(`${documentType} selected: ${file.name}`);
  };

  const uploadFile = async (file, path) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.idCard && !files.transcript && !files.certificate) {
      toast.error('Please select at least one document to upload');
      return;
    }

    setLoading(true);

    try {
      const uploadedDocs = { ...studentData?.documents };

      // Upload each file
      if (files.idCard) {
        toast.info('Uploading ID Card...');
        const idCardURL = await uploadFile(
          files.idCard,
          `students/${currentUser.uid}/documents/idCard_${Date.now()}.${files.idCard.name.split('.').pop()}`
        );
        uploadedDocs.idCard = idCardURL;
        setUploadProgress(prev => ({ ...prev, idCard: 100 }));
      }

      if (files.transcript) {
        toast.info('Uploading Transcript...');
        const transcriptURL = await uploadFile(
          files.transcript,
          `students/${currentUser.uid}/documents/transcript_${Date.now()}.${files.transcript.name.split('.').pop()}`
        );
        uploadedDocs.transcript = transcriptURL;
        setUploadProgress(prev => ({ ...prev, transcript: 100 }));
      }

      if (files.certificate) {
        toast.info('Uploading Certificate...');
        const certificateURL = await uploadFile(
          files.certificate,
          `students/${currentUser.uid}/documents/certificate_${Date.now()}.${files.certificate.name.split('.').pop()}`
        );
        uploadedDocs.certificate = certificateURL;
        setUploadProgress(prev => ({ ...prev, certificate: 100 }));
      }

      // Update Firestore
      await updateDoc(doc(db, 'students', currentUser.uid), {
        documents: uploadedDocs,
        documentsUpdatedAt: new Date()
      });

      toast.success('Documents uploaded successfully!');
      
      // Reset form
      setFiles({
        idCard: null,
        transcript: null,
        certificate: null
      });
      setPreviews({
        idCard: null,
        transcript: null,
        certificate: null
      });
      setUploadProgress({
        idCard: 0,
        transcript: 0,
        certificate: 0
      });

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

  return (
    <div className="upload-documents-container">
      <div className="page-header">
        <h1>📁 Upload Documents</h1>
        <p>Upload your identification, academic transcripts, and certificates</p>
      </div>

      <div className="documents-section">
        {studentData?.documents && Object.keys(studentData.documents).length > 0 && (
          <div className="current-documents">
            <h2>✅ Current Documents</h2>
            <div className="documents-grid">
              {studentData.documents.idCard && (
                <div className="document-card">
                  <div className="document-icon">
                    <FaCheckCircle style={{ color: '#10b981' }} />
                  </div>
                  <h3>ID Card</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
                    Uploaded
                  </p>
                  <a 
                    href={studentData.documents.idCard} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-btn"
                  >
                    View Document
                  </a>
                </div>
              )}
              {studentData.documents.transcript && (
                <div className="document-card">
                  <div className="document-icon">
                    <FaCheckCircle style={{ color: '#10b981' }} />
                  </div>
                  <h3>Transcript</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
                    Uploaded
                  </p>
                  <a 
                    href={studentData.documents.transcript} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-btn"
                  >
                    View Document
                  </a>
                </div>
              )}
              {studentData.documents.certificate && (
                <div className="document-card">
                  <div className="document-icon">
                    <FaCheckCircle style={{ color: '#10b981' }} />
                  </div>
                  <h3>Certificate</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
                    Uploaded
                  </p>
                  <a 
                    href={studentData.documents.certificate} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-btn"
                  >
                    View Document
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <h2>📤 Upload New Documents</h2>
          
          <div className="upload-grid">
            <div className="upload-card">
              <label htmlFor="idCard" className="upload-label">
                <div className="upload-icon">
                  {files.idCard ? <FaCheckCircle color="#10b981" /> : <FaFileUpload />}
                </div>
                <h3>ID Card</h3>
                <p>Upload your national ID or passport</p>
                <input
                  type="file"
                  id="idCard"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'idCard')}
                  className="file-input"
                  disabled={loading}
                />
                {files.idCard && (
                  <div className="file-selected">
                    ✓ {files.idCard.name}
                  </div>
                )}
              </label>
            </div>

            <div className="upload-card">
              <label htmlFor="transcript" className="upload-label">
                <div className="upload-icon">
                  {files.transcript ? <FaCheckCircle color="#10b981" /> : <FaFileUpload />}
                </div>
                <h3>Academic Transcript</h3>
                <p>Upload your latest transcript</p>
                <input
                  type="file"
                  id="transcript"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'transcript')}
                  className="file-input"
                  disabled={loading}
                />
                {files.transcript && (
                  <div className="file-selected">
                    ✓ {files.transcript.name}
                  </div>
                )}
              </label>
            </div>

            <div className="upload-card">
              <label htmlFor="certificate" className="upload-label">
                <div className="upload-icon">
                  {files.certificate ? <FaCheckCircle color="#10b981" /> : <FaFileUpload />}
                </div>
                <h3>Certificate</h3>
                <p>Upload your completion certificate</p>
                <input
                  type="file"
                  id="certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'certificate')}
                  className="file-input"
                  disabled={loading}
                />
                {files.certificate && (
                  <div className="file-selected">
                    ✓ {files.certificate.name}
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="upload-info">
            <p>📌 Accepted formats: PDF, JPEG, PNG</p>
            <p>📌 Maximum file size: 5MB per document</p>
            <p>📌 Make sure documents are clear and readable</p>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || (!files.idCard && !files.transcript && !files.certificate)}
          >
            {loading ? '⏳ Uploading...' : '📤 Upload Documents'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadDocuments;