// backend/src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const studentController = require('../controllers/student.controller');

// All routes require authentication and student role
router.use(verifyToken);
router.use(authorizeRoles('student'));

// Profile routes
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

// Document routes
router.post('/documents', studentController.uploadDocuments);

// Course routes
router.get('/courses/eligible', studentController.getEligibleCourses);
router.post('/courses/apply', studentController.applyCourse);

// Application routes
router.get('/applications', studentController.getMyApplications);
router.get('/applications/:id', studentController.getApplicationDetails);

// Admission routes
router.get('/admissions', studentController.getAdmissionResults);
router.post('/admissions/select', studentController.selectInstitution);

// Completion routes
router.post('/completion/documents', studentController.uploadCompletionDocuments);

// Job routes
router.get('/jobs/matching', studentController.getMatchingJobs);
router.post('/jobs/apply', studentController.applyForJob);
router.get('/jobs/applications', studentController.getMyJobApplications);

// Notification routes
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationAsRead);

module.exports = router;