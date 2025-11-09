const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const studentController = require('../controllers/student.controller');

// All student routes require authentication and student role
router.use(verifyToken);
router.use(authorizeRoles('student'));

// Profile Management
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.post('/upload-documents', studentController.uploadDocuments);

// Course Applications
router.get('/courses/available', studentController.getEligibleCourses);
router.post('/applications', studentController.applyCourse);
router.get('/applications', studentController.getMyApplications);
router.get('/applications/:id', studentController.getApplicationDetails);

// Admissions
router.get('/admissions', studentController.getAdmissionResults);
router.post('/select-institution', studentController.selectInstitution);

// Completion & Transcripts
router.post('/complete-studies', studentController.uploadCompletionDocuments);

// Job Applications
router.get('/jobs/matched', studentController.getMatchingJobs);
router.post('/jobs/apply', studentController.applyForJob);
router.get('/job-applications', studentController.getMyJobApplications);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationAsRead);

module.exports = router;
