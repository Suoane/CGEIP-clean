// frontend/src/components/student/UploadDocuments.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import axios from 'axios';
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
    }
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, JPG, and PNG files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.idCard && !files.transcript && !files.certificate) {
      toast.error('Please select at least one document to upload');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      if (files.idCard) formData.append('idCard', files.idCard);
      if (files.transcript) formData.append('transcript', files.transcript);
      if (files.certificate) formData.append('certificate', files.certificate);

      // Get auth token
      const token = await currentUser.getIdToken();

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload/student/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
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

        // Refresh student data
        fetchStudentData();
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-documents-container">
      <div className="page-header">
        <h1>Upload Documents</h1>
        <p>Upload your identification, academic transcripts, and certificates</p>
      </div>

      <div className="documents-section">
        {studentData?.documents && (
          <div className="current-documents">
            <h2>Current Documents</h2>
            <div className="documents-grid">
              {studentData.documents.idCard && (
                <div className="document-card">
                  <div className="document-icon">📄</div>
                  <h3>ID Card</h3>
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
                  <div className="document-icon">📜</div>
                  <h3>Transcript</h3>
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
                  <div className="document-icon">🎓</div>
                  <h3>Certificate</h3>
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
          <h2>Upload New Documents</h2>
          
          <div className="upload-grid">
            <div className="upload-card">
              <label htmlFor="idCard" className="upload-label">
                <div className="upload-icon">📄</div>
                <h3>ID Card</h3>
                <p>Upload your national ID or passport</p>
                <input
                  type="file"
                  id="idCard"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'idCard')}
                  className="file-input"
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
                <div className="upload-icon">📜</div>
                <h3>Academic Transcript</h3>
                <p>Upload your latest transcript</p>
                <input
                  type="file"
                  id="transcript"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'transcript')}
                  className="file-input"
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
                <div className="upload-icon">🎓</div>
                <h3>Certificate</h3>
                <p>Upload your completion certificate</p>
                <input
                  type="file"
                  id="certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'certificate')}
                  className="file-input"
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
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || (!files.idCard && !files.transcript && !files.certificate)}
          >
            {loading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadDocuments;