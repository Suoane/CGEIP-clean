const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const instituteController = require('../controllers/institute.controller');

// All institute routes require authentication and institute role
router.use(verifyToken);
router.use(authorizeRoles('institute'));

// Profile Management
router.get('/profile', instituteController.getProfile);
router.put('/profile', instituteController.updateProfile);

// Faculty Management
router.post('/faculties', instituteController.addFaculty);
router.get('/faculties', instituteController.getMyFaculties);
router.get('/faculties/:id', instituteController.getFacultyById);
router.put('/faculties/:id', instituteController.updateFaculty);
router.delete('/faculties/:id', instituteController.deleteFaculty);

// Course Management
router.post('/courses', instituteController.addCourse);
router.get('/courses', instituteController.getMyCourses);
router.get('/courses/:id', instituteController.getCourseById);
router.put('/courses/:id', instituteController.updateCourse);
router.delete('/courses/:id', instituteController.deleteCourse);
router.put('/courses/:id/admission-status', instituteController.toggleAdmissionStatus);

// Applications Management
router.get('/applications', instituteController.getApplications);
router.get('/applications/:id', instituteController.getApplicationById);
router.get('/courses/:courseId/applications', instituteController.getCourseApplications);

// Admissions Management
router.post('/admissions/publish', instituteController.publishAdmissions);
router.put('/applications/:id/status', instituteController.updateApplicationStatus);
router.get('/admissions', instituteController.getMyAdmissions);

module.exports = router;