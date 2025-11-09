// backend/src/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { db } = require('../config/firebase');

// Upload student documents
router.post('/student/documents',
  verifyToken,
  authorizeRoles('student'),
  upload.fields([
    { name: 'idCard', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const studentId = req.user.uid;
      const files = req.files;

      // Prepare document URLs
      const documents = {};
      
      if (files.idCard) {
        documents.idCard = files.idCard[0].path;
      }
      if (files.transcript) {
        documents.transcript = files.transcript[0].path;
      }
      if (files.certificate) {
        documents.certificate = files.certificate[0].path;
      }

      // Update student document in Firestore
      await db.collection('students').doc(studentId).update({
        documents: documents,
        documentsUpdatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        documents: documents
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Upload completion documents
router.post('/student/completion-documents',
  verifyToken,
  authorizeRoles('student'),
  upload.fields([
    { name: 'transcript', maxCount: 1 },
    { name: 'completionCertificate', maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const studentId = req.user.uid;
      const files = req.files;
      const { gpa, fieldOfStudy, institutionId } = req.body;

      // Prepare completion data
      const completionData = {
        transcript: files.transcript ? files.transcript[0].path : null,
        certificates: files.completionCertificate ? files.completionCertificate.map(f => f.path) : [],
        gpa: parseFloat(gpa),
        fieldOfStudy: fieldOfStudy,
        institutionId: institutionId,
        completionDate: new Date()
      };

      // Update student status and completion data
      await db.collection('students').doc(studentId).update({
        studyStatus: 'completed',
        completionData: completionData,
        completedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Completion documents uploaded successfully',
        completionData: completionData
      });
    } catch (error) {
      console.error('Error uploading completion documents:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;