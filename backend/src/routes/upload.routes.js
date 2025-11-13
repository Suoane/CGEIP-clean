// backend/src/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { storage, admin, db } = require('../config/firebase');
const autoMatching = require('../services/autoMatching.service');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
    }
  }
});

/**
 * Upload student documents (ID Card, Transcript, Certificate)
 */
router.post(
  '/student/documents',
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

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log(`📤 Uploading documents for student: ${studentId}`);

      const documentUrls = {};

      // Store file data as base64 in Firestore (no Cloud Storage needed)
      for (const [fieldName, fileArray] of Object.entries(files)) {
        const file = fileArray[0];
        const base64Data = file.buffer.toString('base64');
        
        documentUrls[fieldName] = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          data: base64Data,
          uploadedAt: new Date().toISOString()
        };
        
        console.log(`✅ ${fieldName} processed successfully (${file.size} bytes)`);
      }

      // Update student document in Firestore
      const studentRef = db.collection('students').doc(studentId);
      const studentDoc = await studentRef.get();
      const currentDocs = studentDoc.exists ? studentDoc.data().documents || {} : {};

      await studentRef.update({
        documents: {
          ...currentDocs,
          ...documentUrls
        },
        documentsUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Documents saved to Firestore for student: ${studentId}`);

      // If transcript was uploaded, trigger auto-matching
      let autoMatchingResults = null;
      if (documentUrls.transcript) {
        console.log('🔍 Starting auto-matching for uploaded transcript...');
        const studentData = (await studentRef.get()).data();
        autoMatchingResults = await autoMatching.findMatchingCourses(studentData);
        console.log(`✨ Found ${autoMatchingResults.totalFound} matching courses`);
      }

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        documents: documentUrls,
        autoMatching: autoMatchingResults ? {
          coursesFound: autoMatchingResults.totalFound,
          topMatches: autoMatchingResults.courses.slice(0, 5)
        } : null
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        error: 'Failed to upload documents',
        message: error.message
      });
    }
  }
);

/**
 * Upload completion documents (after studies)
 */
router.post(
  '/student/completion-documents',
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
      const { gpa, fieldOfStudy } = req.body;

      if (!files.transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      console.log(`📤 Uploading completion documents for: ${studentId}`);

      const bucket = storage.bucket();
      const documentUrls = {
        transcript: null,
        certificates: []
      };

      // Upload transcript
      const transcriptFile = files.transcript[0];
      const transcriptFileName = `students/${studentId}/completion/transcript_${Date.now()}.pdf`;
      const transcriptUpload = bucket.file(transcriptFileName);

      await new Promise((resolve, reject) => {
        const stream = transcriptUpload.createWriteStream({
          metadata: { contentType: transcriptFile.mimetype }
        });
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(transcriptFile.buffer);
      });

      await transcriptUpload.makePublic();
      documentUrls.transcript = `https://storage.googleapis.com/${bucket.name}/${transcriptFileName}`;

      // Upload certificates
      if (files.completionCertificate) {
        for (const cert of files.completionCertificate) {
          const certFileName = `students/${studentId}/completion/cert_${Date.now()}_${cert.originalname}`;
          const certUpload = bucket.file(certFileName);

          await new Promise((resolve, reject) => {
            const stream = certUpload.createWriteStream({
              metadata: { contentType: cert.mimetype }
            });
            stream.on('error', reject);
            stream.on('finish', resolve);
            stream.end(cert.buffer);
          });

          await certUpload.makePublic();
          documentUrls.certificates.push(
            `https://storage.googleapis.com/${bucket.name}/${certFileName}`
          );
        }
      }

      // Update student status
      await db.collection('students').doc(studentId).update({
        studyStatus: 'completed',
        completionData: {
          transcript: documentUrls.transcript,
          certificates: documentUrls.certificates,
          gpa: parseFloat(gpa),
          fieldOfStudy,
          completionDate: admin.firestore.FieldValue.serverTimestamp()
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Completion documents uploaded for: ${studentId}`);

      res.json({
        success: true,
        message: 'Completion documents uploaded successfully',
        documents: documentUrls
      });

    } catch (error) {
      console.error('❌ Completion upload error:', error);
      res.status(500).json({
        error: 'Failed to upload completion documents',
        message: error.message
      });
    }
  }
);

/**
 * Get matched courses for student
 */
router.get(
  '/student/matched-courses',
  verifyToken,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const studentId = req.user.uid;
      const studentDoc = await db.collection('students').doc(studentId).get();

      if (!studentDoc.exists) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const studentData = studentDoc.data();
      const matchingResults = await autoMatching.findMatchingCourses(studentData);

      res.json({
        success: true,
        courses: matchingResults.courses,
        totalFound: matchingResults.totalFound,
        recommendations: matchingResults.recommendations
      });

    } catch (error) {
      console.error('Error fetching matched courses:', error);
      res.status(500).json({
        error: 'Failed to fetch matched courses',
        message: error.message
      });
    }
  }
);

/**
 * Get matched jobs for completed students
 */
router.get(
  '/student/matched-jobs',
  verifyToken,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const studentId = req.user.uid;
      const studentDoc = await db.collection('students').doc(studentId).get();

      if (!studentDoc.exists) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const studentData = studentDoc.data();

      if (studentData.studyStatus !== 'completed') {
        return res.status(400).json({
          error: 'Student must complete studies first',
          studyStatus: studentData.studyStatus
        });
      }

      const matchingResults = await autoMatching.findMatchingJobs(studentData);

      res.json({
        success: true,
        jobs: matchingResults.jobs,
        totalFound: matchingResults.totalFound,
        recommendations: matchingResults.recommendations
      });

    } catch (error) {
      console.error('Error fetching matched jobs:', error);
      res.status(500).json({
        error: 'Failed to fetch matched jobs',
        message: error.message
      });
    }
  }
);

module.exports = router;