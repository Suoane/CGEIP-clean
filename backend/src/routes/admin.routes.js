const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(authorizeRoles('admin'));

// Institution Management
router.post('/institutions', adminController.addInstitution);
router.get('/institutions', adminController.getAllInstitutions);
router.get('/institutions/:id', adminController.getInstitutionById);
router.put('/institutions/:id', adminController.updateInstitution);
router.delete('/institutions/:id', adminController.deleteInstitution);

// Faculty Management
router.post('/faculties', adminController.addFaculty);
router.get('/faculties', adminController.getAllFaculties);
router.get('/faculties/:id', adminController.getFacultyById);
router.put('/faculties/:id', adminController.updateFaculty);
router.delete('/faculties/:id', adminController.deleteFaculty);

// Course Management
router.post('/courses', adminController.addCourse);
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Company Management
router.get('/companies', adminController.getAllCompanies);
router.get('/companies/pending', adminController.getPendingCompanies);
router.put('/companies/:id/approve', adminController.approveCompany);
router.put('/companies/:id/suspend', adminController.suspendCompany);
router.delete('/companies/:id', adminController.deleteCompany);

// System Reports
router.get('/reports/overview', adminController.getSystemOverview);
router.get('/reports/registrations', adminController.getRegistrationStats);
router.get('/reports/applications', adminController.getApplicationStats);
router.get('/reports/admissions', adminController.getAdmissionStats);
router.get('/reports/jobs', adminController.getJobStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:uid', adminController.getUserById);

module.exports = router;