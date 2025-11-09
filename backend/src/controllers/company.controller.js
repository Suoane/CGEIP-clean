const { db } = require('../config/firebase');
const { findQualifiedStudents } = require('../services/matching.service');
const { sendJobNotification } = require('../services/email.service');

// Profile Management
exports.getProfile = async (req, res) => {
  try {
    const companyDoc = await db.collection('companies').doc(req.user.uid).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    res.json({ id: companyDoc.id, ...companyDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    await db.collection('companies').doc(req.user.uid).update(updateData);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Job Management
exports.postJob = async (req, res) => {
  try {
    const companyId = req.user.uid;
    
    // Check if company is approved
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists || companyDoc.data().status !== 'approved') {
      return res.status(403).json({ error: 'Company account must be approved to post jobs' });
    }

    const jobData = {
      companyId,
      ...req.body,
      status: 'active',
      postedAt: new Date()
    };

    const jobRef = await db.collection('jobs').add(jobData);

    // Find and notify qualified students
    const qualifiedStudents = await findQualifiedStudents(jobRef.id, jobData);
    
    // Send notifications to qualified students
    for (const student of qualifiedStudents) {
      // Create notification
      await db.collection('notifications').add({
        userId: student.studentId,
        type: 'job',
        title: 'New Job Match',
        message: `A new job "${jobData.title}" matches your profile (${student.matchScore}% match)`,
        read: false,
        relatedId: jobRef.id,
        createdAt: new Date()
      });

      // Send email
      if (student.email) {
        await sendJobNotification(
          student.email, 
          student.studentName, 
          jobData.title, 
          companyDoc.data().companyName
        );
      }
    }

    res.status(201).json({
      message: 'Job posted successfully',
      jobId: jobRef.id,
      notifiedStudents: qualifiedStudents.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', req.user.uid)
      .orderBy('postedAt', 'desc')
      .get();

    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.id).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const jobData = jobDoc.data();

    // Verify ownership
    if (jobData.companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ id: jobDoc.id, ...jobData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.id).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (jobDoc.data().companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('jobs').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date()
    });

    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.id).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (jobDoc.data().companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('jobs').doc(req.params.id).delete();

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.closeJob = async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.id).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (jobDoc.data().companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('jobs').doc(req.params.id).update({
      status: 'closed',
      closedAt: new Date()
    });

    res.json({ message: 'Job closed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Applicants Management
exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify job ownership
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (jobDoc.data().companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all applications for this job, sorted by match score
    const applicationsSnapshot = await db.collection('jobApplications')
      .where('jobId', '==', jobId)
      .get();

    const applicants = [];

    for (const doc of applicationsSnapshot.docs) {
      const appData = doc.data();
      
      // Get student details
      const studentDoc = await db.collection('students').doc(appData.studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        
        applicants.push({
          applicationId: doc.id,
          ...appData,
          student: {
            id: studentDoc.id,
            name: `${studentData.personalInfo.firstName} ${studentData.personalInfo.lastName}`,
            email: studentData.personalInfo.email,
            phone: studentData.personalInfo.phone,
            gpa: studentData.completionData?.gpa,
            fieldOfStudy: studentData.completionData?.fieldOfStudy,
            workExperience: studentData.workExperience,
            certificates: studentData.completionData?.certificates
          }
        });
      }
    }

    // Sort by match score (highest first)
    applicants.sort((a, b) => b.matchScore - a.matchScore);

    res.json(applicants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApplicantDetails = async (req, res) => {
  try {
    const applicationDoc = await db.collection('jobApplications').doc(req.params.id).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = applicationDoc.data();

    // Verify ownership
    if (appData.companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get full student details
    const studentDoc = await db.collection('students').doc(appData.studentId).get();
    
    res.json({
      applicationId: applicationDoc.id,
      ...appData,
      student: studentDoc.exists ? { id: studentDoc.id, ...studentDoc.data() } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationDoc = await db.collection('jobApplications').doc(req.params.id).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = applicationDoc.data();

    // Verify ownership
    if (appData.companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('jobApplications').doc(req.params.id).update({
      status,
      updatedAt: new Date()
    });

    // Send notification to student
    await db.collection('notifications').add({
      userId: appData.studentId,
      type: 'application',
      title: 'Application Status Update',
      message: `Your job application status has been updated to: ${status}`,
      read: false,
      relatedId: req.params.id,
      createdAt: new Date()
    });

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};