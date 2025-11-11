// backend/src/routes/upload.routes.js - ENHANCED VERSION
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { db } = require('../config/firebase');
const transcriptParser = require('../services/transcriptParser.service');
const autoMatching = require('../services/autoMatching.service');

// Upload student documents with transcript parsing and auto-matching
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

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      console.log(`📤 Processing document upload for student: ${studentId}`);

      // Get current student data
      const studentDoc = await db.collection('students').doc(studentId).get();
      const studentData = studentDoc.exists() ? studentDoc.data() : {};
      const documents = studentData.documents || {};

      // Process each uploaded file
      if (files.idCard) {
        documents.idCard = files.idCard[0].path;
        documents.idCardName = files.idCard[0].originalname;
        documents.idCardUploadedAt = new Date();
        console.log('✓ ID Card uploaded');
      }

      if (files.certificate) {
        documents.certificate = files.certificate[0].path;
        documents.certificateName = files.certificate[0].originalname;
        documents.certificateUploadedAt = new Date();
        console.log('✓ Certificate uploaded');
      }

      // Special handling for transcript - parse and analyze
      let transcriptAnalysis = null;
      let matchingCourses = null;
      
      if (files.transcript) {
        documents.transcript = files.transcript[0].path;
        documents.transcriptName = files.transcript[0].originalname;
        documents.transcriptUploadedAt = new Date();
        console.log('✓ Transcript uploaded, analyzing...');

        try {
          // Parse transcript to extract grades
          const transcriptFile = files.transcript[0];
          
          // For now, we'll encourage manual grade entry
          // In production, you can integrate OCR services
          transcriptAnalysis = await transcriptParser.parseTranscript(
            transcriptFile.buffer,
            transcriptFile.mimetype
          );

          console.log('📊 Transcript analysis:', transcriptAnalysis.confidence);

          // If grades were successfully parsed or already exist, find matching courses
          if (studentData.academicInfo?.grades || transcriptAnalysis.parsed) {
            const updatedStudentData = {
              ...studentData,
              documents,
              academicInfo: transcriptAnalysis.parsed 
                ? { ...studentData.academicInfo, ...transcriptAnalysis.data }
                : studentData.academicInfo
            };

            console.log('🔍 Finding matching courses...');
            matchingCourses = await autoMatching.findMatchingCourses(updatedStudentData);
            console.log(`✓ Found ${matchingCourses.totalFound} matching courses`);
          }
        } catch (parseError) {
          console.error('⚠️ Transcript parsing error:', parseError);
          // Continue with upload even if parsing fails
        }
      }

      // Update student document with documents and analysis
      const updateData = {
        documents,
        documentsUpdatedAt: new Date(),
        documentsComplete: !!(documents.transcript && documents.idCard)
      };

      // If transcript was analyzed, add suggestions
      if (transcriptAnalysis?.data?.suggestions) {
        updateData.courseSuggestions = transcriptAnalysis.data.suggestions;
        updateData.suggestionsGeneratedAt = new Date();
      }

      await db.collection('students').doc(studentId).update(updateData);

      // Prepare response
      const response = {
        success: true,
        message: 'Documents uploaded successfully',
        documents,
        documentsComplete: updateData.documentsComplete
      };

      // Add transcript analysis if available
      if (transcriptAnalysis) {
        response.transcriptAnalysis = {
          parsed: transcriptAnalysis.parsed,
          confidence: transcriptAnalysis.confidence,
          requiresManualEntry: !transcriptAnalysis.parsed,
          suggestions: transcriptAnalysis.data?.suggestions || []
        };
      }

      // Add matching courses if found
      if (matchingCourses && matchingCourses.success) {
        response.autoMatching = {
          coursesFound: matchingCourses.totalFound,
          topMatches: matchingCourses.courses.slice(0, 5).map(course => ({
            id: course.id,
            name: course.courseName,
            institution: course.institution?.name,
            matchScore: course.matchScore,
            reasons: course.reasons
          })),
          message: matchingCourses.totalFound > 0 
            ? `Great news! We found ${matchingCourses.totalFound} courses you qualify for!`
            : 'Please complete your academic information to see course recommendations.'
        };
      }

      console.log('✅ Upload complete with analysis');
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

// Get auto-matched courses for student
router.get('/student/matched-courses',
  verifyToken,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const studentId = req.user.uid;
      
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Student profile not found'
        });
      }

      const studentData = studentDoc.data();
      
      console.log(`🔍 Finding courses for student: ${studentId}`);
      const matchingCourses = await autoMatching.findMatchingCourses(studentData);

      res.json(matchingCourses);
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
      if (!studentDoc.exists()) {
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
          jobs: []
        });
      }

      console.log(`🔍 Finding jobs for student: ${studentId}`);
      const matchingJobs = await autoMatching.findMatchingJobs(studentData);

      res.json(matchingJobs);
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

      console.log('✓ Completion documents uploaded');

      // Automatically find matching jobs
      console.log('🔍 Finding matching jobs...');
      const studentDoc = await db.collection('students').doc(studentId).get();
      const studentData = studentDoc.data();
      
      const matchingJobs = await autoMatching.findMatchingJobs(studentData);
      console.log(`✓ Found ${matchingJobs.totalFound} matching jobs`);

      res.json({
        success: true,
        message: 'Completion documents uploaded successfully',
        completionData,
        jobMatching: {
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
        }
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