// backend/src/routes/autoApplication.routes.js
const express = require('express');
const router = express.Router();
const autoApplicationService = require('../services/autoApplication.service');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { db } = require('../config/firebase');

/**
 * GET /api/auto-apply/suggestions/:studentId
 * Get auto-application suggestions for a student
 */
router.get('/suggestions/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student access
    if (req.user.uid !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    const result = await autoApplicationService.getAutoApplicationSuggestions(studentId);
    res.json(result);

  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/auto-apply/apply
 * Execute auto-application for a student
 */
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { 
      studentId, 
      maxApplications, 
      minMatchScore, 
      autoSubmit,
      preferences 
    } = req.body;

    // Verify student access
    if (req.user.uid !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    const result = await autoApplicationService.autoApplyToCourses(studentId, {
      maxApplications,
      minMatchScore,
      autoSubmit,
      preferences
    });

    res.json(result);

  } catch (error) {
    console.error('Error in auto-apply:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/auto-apply/jobs
 * Auto-apply to jobs for completed students
 */
router.post('/jobs', verifyToken, async (req, res) => {
  try {
    const { 
      studentId, 
      maxApplications, 
      minMatchScore, 
      autoSubmit,
      jobPreferences 
    } = req.body;

    // Verify student access
    if (req.user.uid !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    const result = await autoApplicationService.autoApplyToJobs(studentId, {
      maxApplications,
      minMatchScore,
      autoSubmit,
      jobPreferences
    });

    res.json(result);

  } catch (error) {
    console.error('Error in job auto-apply:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/auto-apply/settings/:studentId
 * Get student's auto-application settings
 */
router.get('/settings/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.uid !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    const studentDoc = await db.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    const settings = studentDoc.data().autoApplicationSettings || {
      autoSubmit: false,
      maxApplications: 3,
      minMatchScore: 75,
      notificationsEnabled: true
    };

    res.json({ 
      success: true, 
      settings 
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * PUT /api/auto-apply/settings/:studentId
 * Update student's auto-application settings
 */
router.put('/settings/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const settings = req.body;

    if (req.user.uid !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    await db.collection('students').doc(studentId).update({
      autoApplicationSettings: settings,
      updatedAt: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings 
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/auto-apply/analytics/:studentId
 * Get analytics for student's auto-applications
 */
router.get('/analytics/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.uid !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    // Get all applications for this student
    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', studentId)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const analytics = {
      totalApplications: applications.length,
      autoGenerated: applications.filter(app => app.autoGenerated).length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      draft: applications.filter(app => app.status === 'draft').length,
      averageMatchScore: applications.length > 0
        ? Math.round(applications.reduce((sum, app) => sum + (app.matchScore || 0), 0) / applications.length)
        : 0,
      recentApplications: applications
        .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
        .slice(0, 5)
    };

    res.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/auto-apply/drafts/:studentId
 * Get draft applications for student
 */
router.get('/drafts/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.uid !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    const draftsSnapshot = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('status', '==', 'draft')
      .get();

    const drafts = [];
    
    for (const doc of draftsSnapshot.docs) {
      const draftData = doc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(draftData.courseId).get();
      const courseData = courseDoc.exists ? courseDoc.data() : null;

      drafts.push({
        id: doc.id,
        ...draftData,
        course: courseData ? {
          id: courseDoc.id,
          name: courseData.courseName,
          institution: courseData.institutionName
        } : null
      });
    }

    res.json({ 
      success: true, 
      drafts 
    });

  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/auto-apply/drafts/:draftId/submit
 * Submit a draft application
 */
router.post('/drafts/:draftId/submit', verifyToken, async (req, res) => {
  try {
    const { draftId } = req.params;

    const draftDoc = await db.collection('applications').doc(draftId).get();
    
    if (!draftDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Draft not found' 
      });
    }

    const draftData = draftDoc.data();

    // Verify ownership
    if (req.user.uid !== draftData.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    // Update draft to submitted
    await db.collection('applications').doc(draftId).update({
      status: 'pending',
      appliedAt: new Date(),
      submittedAt: new Date()
    });

    // Update student application count
    const studentRef = db.collection('students').doc(draftData.studentId);
    const studentDoc = await studentRef.get();
    const currentCount = studentDoc.data().applicationCount || 0;
    
    await studentRef.update({
      applicationCount: currentCount + 1,
      lastApplicationDate: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Application submitted successfully' 
    });

  } catch (error) {
    console.error('Error submitting draft:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/auto-apply/drafts/:draftId
 * Delete a draft application
 */
router.delete('/drafts/:draftId', verifyToken, async (req, res) => {
  try {
    const { draftId } = req.params;

    const draftDoc = await db.collection('applications').doc(draftId).get();
    
    if (!draftDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Draft not found' 
      });
    }

    const draftData = draftDoc.data();

    // Verify ownership
    if (req.user.uid !== draftData.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    await db.collection('applications').doc(draftId).delete();

    res.json({ 
      success: true, 
      message: 'Draft deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/auto-apply/batch
 * Batch auto-apply for multiple students (Admin only)
 */
router.post('/batch', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { studentIds, options } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student IDs array is required' 
      });
    }

    const result = await autoApplicationService.batchAutoApply(studentIds, options);

    res.json(result);

  } catch (error) {
    console.error('Error in batch auto-apply:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;