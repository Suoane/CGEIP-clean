const { db, admin } = require('../config/firebase');
const notificationService = require('../services/notification.service');

const studentController = {
  // Get student profile
  getProfile: async (req, res) => {
    try {
      const studentDoc = await db.collection('students').doc(req.user.uid).get();
      
      if (!studentDoc.exists) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      res.json({ success: true, data: studentDoc.data() });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  },

  // Update student profile
  updateProfile: async (req, res) => {
    try {
      const { personalInfo, academicInfo } = req.body;
      
      const updateData = {
        ...(personalInfo && { personalInfo }),
        ...(academicInfo && { academicInfo }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('students').doc(req.user.uid).update(updateData);

      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
  },

  // Upload documents
  uploadDocuments: async (req, res) => {
    try {
      const { documents } = req.body;

      await db.collection('students').doc(req.user.uid).update({
        documents,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, message: 'Documents uploaded successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading documents', error: error.message });
    }
  },

  // Get eligible courses
  getEligibleCourses: async (req, res) => {
    try {
      const studentDoc = await db.collection('students').doc(req.user.uid).get();
      const student = studentDoc.data();

      // Get all open courses
      const coursesSnapshot = await db.collection('courses')
        .where('admissionStatus', '==', 'open')
        .get();

      const eligibleCourses = [];

      for (const doc of coursesSnapshot.docs) {
        const courseData = { id: doc.id, ...doc.data() };
        
        // Check eligibility
        const isEligible = checkEligibility(student, courseData.requirements);
        
        // Get institution details
        const institutionDoc = await db.collection('institutions').doc(courseData.institutionId).get();
        courseData.institution = institutionDoc.exists() ? institutionDoc.data() : null;
        courseData.eligible = isEligible;

        eligibleCourses.push(courseData);
      }

      res.json({ success: true, data: eligibleCourses });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
  },

  // Apply for a course
  applyCourse: async (req, res) => {
    try {
      const { courseId, institutionId } = req.body;
      const studentId = req.user.uid;

      const studentDoc = await db.collection('students').doc(studentId).get();
      const student = studentDoc.data();

      // Check if already admitted
      if (student.admittedInstitution) {
        return res.status(400).json({ message: 'You are already admitted to an institution' });
      }

      // Check application count for this institution
      const existingAppsSnapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('institutionId', '==', institutionId)
        .get();

      if (existingAppsSnapshot.size >= 2) {
        return res.status(400).json({ message: 'Maximum 2 applications per institution' });
      }

      // Check if already applied for this course
      const duplicateCheck = existingAppsSnapshot.docs.find(doc => doc.data().courseId === courseId);
      if (duplicateCheck) {
        return res.status(400).json({ message: 'Already applied for this course' });
      }

      // Create application
      await db.collection('applications').add({
        studentId,
        institutionId,
        courseId,
        status: 'pending',
        documents: student.documents || {},
        appliedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update application count
      await db.collection('students').doc(studentId).update({
        applicationCount: admin.firestore.FieldValue.increment(1)
      });

      res.json({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting application', error: error.message });
    }
  },

  // Get my applications
  getMyApplications: async (req, res) => {
    try {
      const snapshot = await db.collection('applications')
        .where('studentId', '==', req.user.uid)
        .orderBy('appliedAt', 'desc')
        .get();

      const applications = [];

      for (const doc of snapshot.docs) {
        const appData = { id: doc.id, ...doc.data() };
        
        const courseDoc = await db.collection('courses').doc(appData.courseId).get();
        const institutionDoc = await db.collection('institutions').doc(appData.institutionId).get();

        appData.course = courseDoc.exists() ? courseDoc.data() : null;
        appData.institution = institutionDoc.exists() ? institutionDoc.data() : null;

        applications.push(appData);
      }

      res.json({ success: true, data: applications });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
  },

  // Get application details
  getApplicationDetails: async (req, res) => {
    try {
      const appDoc = await db.collection('applications').doc(req.params.id).get();
      
      if (!appDoc.exists) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const appData = appDoc.data();

      if (appData.studentId !== req.user.uid) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      res.json({ success: true, data: { id: appDoc.id, ...appData } });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching application', error: error.message });
    }
  },

  // Get admission results
  getAdmissionResults: async (req, res) => {
    try {
      const snapshot = await db.collection('applications')
        .where('studentId', '==', req.user.uid)
        .where('status', 'in', ['admitted', 'waitlisted'])
        .get();

      const admissions = [];

      for (const doc of snapshot.docs) {
        const appData = { id: doc.id, ...doc.data() };
        
        const courseDoc = await db.collection('courses').doc(appData.courseId).get();
        const institutionDoc = await db.collection('institutions').doc(appData.institutionId).get();

        appData.course = courseDoc.exists() ? courseDoc.data() : null;
        appData.institution = institutionDoc.exists() ? institutionDoc.data() : null;

        admissions.push(appData);
      }

      res.json({ success: true, data: admissions });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching admissions', error: error.message });
    }
  },

  // Select institution
  selectInstitution: async (req, res) => {
    try {
      const { institutionId, applicationId } = req.body;
      const studentId = req.user.uid;

      const appDoc = await db.collection('applications').doc(applicationId).get();
      
      if (!appDoc.exists || appDoc.data().studentId !== studentId) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (appDoc.data().status !== 'admitted') {
        return res.status(400).json({ message: 'Not admitted to this institution' });
      }

      // Update student
      await db.collection('students').doc(studentId).update({
        admittedInstitution: institutionId,
        studyStatus: 'studying'
      });

      // Reject other admissions and promote waitlisted students
      const otherAppsSnapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('status', '==', 'admitted')
        .get();

      const batch = db.batch();

      otherAppsSnapshot.docs.forEach(doc => {
        if (doc.id !== applicationId) {
          batch.update(doc.ref, { status: 'rejected' });
        }
      });

      await batch.commit();

      res.json({ success: true, message: 'Institution selected successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error selecting institution', error: error.message });
    }
  },

  // Upload completion documents
  uploadCompletionDocuments: async (req, res) => {
    try {
      const { transcript, certificates, gpa, fieldOfStudy } = req.body;

      await db.collection('students').doc(req.user.uid).update({
        studyStatus: 'completed',
        completionData: {
          transcript,
          certificates,
          gpa,
          fieldOfStudy,
          completionDate: admin.firestore.FieldValue.serverTimestamp()
        }
      });

      res.json({ success: true, message: 'Completion documents uploaded' });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading documents', error: error.message });
    }
  },

  // Get matching jobs
  getMatchingJobs: async (req, res) => {
    try {
      const studentDoc = await db.collection('students').doc(req.user.uid).get();
      const student = studentDoc.data();

      if (student.studyStatus !== 'completed') {
        return res.json({ success: true, data: [] });
      }

      const jobsSnapshot = await db.collection('jobs')
        .where('status', '==', 'active')
        .get();

      const matchedJobs = [];

      for (const doc of jobsSnapshot.docs) {
        const jobData = { id: doc.id, ...doc.data() };
        const matchScore = calculateMatchScore(student, jobData.requirements);

        if (matchScore >= 70) {
          const companyDoc = await db.collection('companies').doc(jobData.companyId).get();
          jobData.company = companyDoc.exists() ? companyDoc.data() : null;
          jobData.matchScore = matchScore;
          matchedJobs.push(jobData);
        }
      }

      matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

      res.json({ success: true, data: matchedJobs });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
  },

  // Apply for job
  applyForJob: async (req, res) => {
    try {
      const { jobId } = req.body;
      const studentId = req.user.uid;

      // Check if already applied
      const existingAppSnapshot = await db.collection('jobApplications')
        .where('jobId', '==', jobId)
        .where('studentId', '==', studentId)
        .get();

      if (!existingAppSnapshot.empty) {
        return res.status(400).json({ message: 'Already applied for this job' });
      }

      const studentDoc = await db.collection('students').doc(studentId).get();
      const jobDoc = await db.collection('jobs').doc(jobId).get();

      if (!jobDoc.exists) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const student = studentDoc.data();
      const job = jobDoc.data();

      const matchScore = calculateMatchScore(student, job.requirements);

      await db.collection('jobApplications').add({
        jobId,
        studentId,
        companyId: job.companyId,
        matchScore,
        status: 'applied',
        appliedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, message: 'Application submitted', matchScore });
    } catch (error) {
      res.status(500).json({ message: 'Error applying for job', error: error.message });
    }
  },

  // Get my job applications
  getMyJobApplications: async (req, res) => {
    try {
      const snapshot = await db.collection('jobApplications')
        .where('studentId', '==', req.user.uid)
        .orderBy('appliedAt', 'desc')
        .get();

      const applications = [];

      for (const doc of snapshot.docs) {
        const appData = { id: doc.id, ...doc.data() };
        
        const jobDoc = await db.collection('jobs').doc(appData.jobId).get();
        const companyDoc = await db.collection('companies').doc(appData.companyId).get();

        appData.job = jobDoc.exists() ? jobDoc.data() : null;
        appData.company = companyDoc.exists() ? companyDoc.data() : null;

        applications.push(appData);
      }

      res.json({ success: true, data: applications });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
  },

  // Get notifications
  getNotifications: async (req, res) => {
    try {
      const result = await notificationService.getByUserId(req.user.uid);
      
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ message: 'Error fetching notifications' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (req, res) => {
    try {
      const result = await notificationService.markAsRead(req.params.id);
      
      if (result.success) {
        res.json({ success: true, message: 'Notification marked as read' });
      } else {
        res.status(500).json({ message: 'Error updating notification' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
  }
};

// Helper function to check eligibility
function checkEligibility(student, requirements) {
  if (!requirements) return true;
  
  // Add your eligibility logic here
  return true;
}

// Helper function to calculate match score
function calculateMatchScore(student, requirements) {
  let score = 0;

  if (student.completionData?.gpa) {
    score += 25;
  }

  if (student.completionData?.certificates) {
    score += 25;
  }

  if (student.workExperience) {
    score += 25;
  }

  score += 25;

  return Math.round(score);
}

module.exports = studentController;