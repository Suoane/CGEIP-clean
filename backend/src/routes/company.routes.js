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

// Job Management
router.post('/jobs', companyController.postJob);
router.get('/jobs', companyController.getMyJobs);
router.get('/jobs/:id', companyController.getJobById);
router.put('/jobs/:id', companyController.updateJob);
router.delete('/jobs/:id', companyController.deleteJob);
router.put('/jobs/:id/close', companyController.closeJob);

// Applicants
router.get('/jobs/:jobId/applicants', companyController.getJobApplicants);
router.get('/applicants/:id', companyController.getApplicantDetails);
router.put('/applications/:id/status', companyController.updateApplicationStatus);

module.exports = router;