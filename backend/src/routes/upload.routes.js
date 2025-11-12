// backend/src/routes/upload.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { db } = require('../config/firebase');

// Upload student documents (SIMPLIFIED - No transcript parsing for now)
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

      console.log(`📤 Processing document upload for student: ${studentId}`);
      console.log('Files received:', Object.keys(files || {}));

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      // Get current student data
      const studentDoc = await db.collection('students').doc(studentId).get();
      const studentData = studentDoc.exists ? studentDoc.data() : {};
      const documents = studentData.documents || {};

      // Process each uploaded file
      if (files.idCard && files.idCard[0]) {
        documents.idCard = files.idCard[0].path;
        documents.idCardName = files.idCard[0].originalname;
        documents.idCardUploadedAt = new Date();
        console.log('✓ ID Card uploaded:', documents.idCard);
      }

      if (files.certificate && files.certificate[0]) {
        documents.certificate = files.certificate[0].path;
        documents.certificateName = files.certificate[0].originalname;
        documents.certificateUploadedAt = new Date();
        console.log('✓ Certificate uploaded:', documents.certificate);
      }

      if (files.transcript && files.transcript[0]) {
        documents.transcript = files.transcript[0].path;
        documents.transcriptName = files.transcript[0].originalname;
        documents.transcriptUploadedAt = new Date();
        console.log('✓ Transcript uploaded:', documents.transcript);
      }

      // Update student document with documents
      const updateData = {
        documents,
        documentsUpdatedAt: new Date(),
        documentsComplete: !!(documents.transcript && documents.idCard)
      };

      await db.collection('students').doc(studentId).update(updateData);
      console.log('✅ Student documents updated in Firestore');

      // Prepare response
      const response = {
        success: true,
        message: 'Documents uploaded successfully',
        documents,
        documentsComplete: updateData.documentsComplete
      };

      res.json(response);

    } catch (error) {
      console.error('❌ Error uploading documents:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Simple single file upload endpoint
router.post('/upload',
  verifyToken,
  upload.single('file'),
  async (req, res) => {
    try {
      console.log('📤 Single file upload started...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      console.log('✓ File uploaded to Cloudinary');
      console.log('  - Original name:', req.file.originalname);
      console.log('  - Cloudinary URL:', req.file.path);
      console.log('  - Public ID:', req.file.filename);

      res.json({
        success: true,
        message: 'File uploaded successfully',
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
);

// Get auto-matched courses for student (using existing autoMatching service)
router.get('/student/matched-courses',
  verifyToken,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const studentId = req.user.uid;
      
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Student profile not found'
        });
      }

      const studentData = studentDoc.data();
      
      console.log(`🔍 Finding courses for student: ${studentId}`);
      
      // Check if autoMatching service exists
      try {
        const autoMatching = require('../services/autoMatching.service');
        const matchingCourses = await autoMatching.findMatchingCourses(studentData);
        res.json(matchingCourses);
      } catch (serviceError) {
        console.log('⚠️ AutoMatching service not available yet');
        res.json({
          success: true,
          message: 'Auto-matching feature coming soon',
          courses: [],
          totalFound: 0
        });
      }
    } catch (error) {
      console.error('Error finding matched courses:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get auto-matched jobs for completed students
router.get('/student/matched-jobs',
  verifyToken,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const studentId = req.user.uid;
      
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Student profile not found'
        });
      }

      const studentData = studentDoc.data();

      if (studentData.studyStatus !== 'completed') {
        return res.json({
          success: false,
          message: 'Complete your studies first to see job opportunities',
          jobs: [],
          totalFound: 0
        });
      }

      console.log(`🔍 Finding jobs for student: ${studentId}`);
      
      // Check if autoMatching service exists
      try {
        const autoMatching = require('../services/autoMatching.service');
        const matchingJobs = await autoMatching.findMatchingJobs(studentData);
        res.json(matchingJobs);
      } catch (serviceError) {
        console.log('⚠️ AutoMatching service not available yet');
        res.json({
          success: true,
          message: 'Job matching feature coming soon',
          jobs: [],
          totalFound: 0
        });
      }
    } catch (error) {
      console.error('Error finding matched jobs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Upload completion documents (when student finishes studies)
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

      console.log(`📤 Processing completion documents for: ${studentId}`);

      // Prepare completion data
      const completionData = {
        transcript: files.transcript ? files.transcript[0].path : null,
        certificates: files.completionCertificate ? files.completionCertificate.map(f => f.path) : [],
        gpa: parseFloat(gpa) || 0,
        fieldOfStudy: fieldOfStudy || '',
        institutionId: institutionId || '',
        completionDate: new Date()
      };

      // Update student status and completion data
      await db.collection('students').doc(studentId).update({
        studyStatus: 'completed',
        completionData: completionData,
        completedAt: new Date()
      });

      console.log('✓ Completion documents uploaded');

      // Try to find matching jobs if service exists
      let jobMatching = {
        jobsFound: 0,
        topMatches: [],
        message: 'Job matching feature coming soon'
      };

      try {
        const autoMatching = require('../services/autoMatching.service');
        const studentDoc = await db.collection('students').doc(studentId).get();
        const studentData = studentDoc.data();
        
        const matchingJobs = await autoMatching.findMatchingJobs(studentData);
        console.log(`✓ Found ${matchingJobs.totalFound} matching jobs`);

        jobMatching = {
          jobsFound: matchingJobs.totalFound,
          topMatches: matchingJobs.jobs.slice(0, 5).map(job => ({
            id: job.id,
            title: job.title,
            company: job.company?.companyName,
            matchScore: job.matchScore,
            location: job.location
          })),
          message: matchingJobs.totalFound > 0 
            ? `Congratulations! We found ${matchingJobs.totalFound} jobs matching your qualifications!`
            : 'Keep building your skills! More opportunities will become available.'
        };
      } catch (serviceError) {
        console.log('⚠️ AutoMatching service not available for jobs');
      }

      res.json({
        success: true,
        message: 'Completion documents uploaded successfully',
        completionData,
        jobMatching
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