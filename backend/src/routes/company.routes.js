// backend/src/routes/company.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const companyController = require('../controllers/company.controller');

// All company routes require authentication and company role
router.use(verifyToken);
router.use(authorizeRoles('company'));

// Profile Management
router.get('/profile', companyController.getProfile);
router.put('/profile', companyController.updateProfile);

// Dashboard Statistics
router.get('/dashboard/stats', companyController.getDashboardStats);

// Job Management
router.post('/jobs', companyController.postJob);
router.get('/jobs', companyController.getMyJobs);
router.get('/jobs/:id', companyController.getJobById);
router.put('/jobs/:id', companyController.updateJob);
router.delete('/jobs/:id', companyController.deleteJob);
router.put('/jobs/:id/close', companyController.closeJob);

// Qualified Applicants - Smart Filtering
router.get('/jobs/:jobId/qualified-applicants', companyController.getQualifiedApplicants);
router.get('/applicants/:applicationId/profile', companyController.getApplicantProfile);

// Application Management
router.put('/applications/:applicationId/status', companyController.updateApplicationStatus);
router.post('/applications/:applicationId/schedule-interview', companyController.scheduleInterview);
router.get('/applications/:applicationId/documents', companyController.getApplicantDocuments);

module.exports = router;