const { db } = require('../config/firebase');
const { sendAdmissionNotification } = require('../services/email.service');

// Profile Management
exports.getProfile = async (req, res) => {
  try {
    const instituteDoc = await db.collection('institutions').doc(req.user.uid).get();
    
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institution profile not found' });
    }

    res.json({ id: instituteDoc.id, ...instituteDoc.data() });
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

    await db.collection('institutions').doc(req.user.uid).update(updateData);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Faculty Management
exports.addFaculty = async (req, res) => {
  try {
    const facultyData = {
      ...req.body,
      institutionId: req.user.uid,
      createdAt: new Date()
    };

    const docRef = await db.collection('faculties').add(facultyData);
    
    res.status(201).json({
      message: 'Faculty added successfully',
      id: docRef.id,
      data: facultyData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyFaculties = async (req, res) => {
  try {
    const snapshot = await db.collection('faculties')
      .where('institutionId', '==', req.user.uid)
      .get();

    const faculties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(faculties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFacultyById = async (req, res) => {
  try {
    const doc = await db.collection('faculties').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    const facultyData = doc.data();

    // Verify ownership
    if (facultyData.institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ id: doc.id, ...facultyData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const doc = await db.collection('faculties').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    if (doc.data().institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('faculties').doc(req.params.id).update(req.body);
    
    res.json({ message: 'Faculty updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    const doc = await db.collection('faculties').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    if (doc.data().institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('faculties').doc(req.params.id).delete();
    
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Course Management
exports.addCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      institutionId: req.user.uid,
      admissionStatus: 'closed',
      createdAt: new Date()
    };

    const docRef = await db.collection('courses').add(courseData);
    
    res.status(201).json({
      message: 'Course added successfully',
      id: docRef.id,
      data: courseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const snapshot = await db.collection('courses')
      .where('institutionId', '==', req.user.uid)
      .get();

    const courses = [];

    for (const doc of snapshot.docs) {
      const courseData = doc.data();
      
      // Get faculty details
      if (courseData.facultyId) {
        const facultyDoc = await db.collection('faculties').doc(courseData.facultyId).get();
        courseData.faculty = facultyDoc.exists ? facultyDoc.data() : null;
      }

      courses.push({
        id: doc.id,
        ...courseData
      });
    }

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const doc = await db.collection('courses').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = doc.data();

    // Verify ownership
    if (courseData.institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ id: doc.id, ...courseData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const doc = await db.collection('courses').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (doc.data().institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('courses').doc(req.params.id).update(req.body);
    
    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const doc = await db.collection('courses').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (doc.data().institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('courses').doc(req.params.id).delete();
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleAdmissionStatus = async (req, res) => {
  try {
    const { admissionStatus } = req.body;
    const doc = await db.collection('courses').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (doc.data().institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('courses').doc(req.params.id).update({
      admissionStatus: admissionStatus || 'open',
      updatedAt: new Date()
    });
    
    res.json({ message: 'Admission status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Applications Management
exports.getApplications = async (req, res) => {
  try {
    const snapshot = await db.collection('applications')
      .where('institutionId', '==', req.user.uid)
      .get();

    const applications = [];

    for (const doc of snapshot.docs) {
      const appData = doc.data();
      
      // Get student details
      const studentDoc = await db.collection('students').doc(appData.studentId).get();
      const student = studentDoc.exists ? studentDoc.data() : null;

      // Get course details
      const courseDoc = await db.collection('courses').doc(appData.courseId).get();
      const course = courseDoc.exists ? courseDoc.data() : null;

      applications.push({
        id: doc.id,
        ...appData,
        student,
        course
      });
    }

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const doc = await db.collection('applications').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = doc.data();

    // Verify ownership
    if (appData.institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get student details
    const studentDoc = await db.collection('students').doc(appData.studentId).get();

    res.json({ 
      id: doc.id, 
      ...appData,
      student: studentDoc.exists ? studentDoc.data() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourseApplications = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course ownership
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (courseDoc.data().institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snapshot = await db.collection('applications')
      .where('courseId', '==', courseId)
      .get();

    const applications = [];

    for (const doc of snapshot.docs) {
      const appData = doc.data();
      const studentDoc = await db.collection('students').doc(appData.studentId).get();

      applications.push({
        id: doc.id,
        ...appData,
        student: studentDoc.exists ? studentDoc.data() : null
      });
    }

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admissions Management
exports.publishAdmissions = async (req, res) => {
  try {
    const { courseId, admittedStudents, rejectedStudents, waitlistedStudents, academicYear, semester } = req.body;

    // Verify course ownership
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (courseDoc.data().institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create admission record
    const admissionData = {
      institutionId: req.user.uid,
      courseId,
      academicYear,
      semester,
      admittedStudents: admittedStudents || [],
      rejectedStudents: rejectedStudents || [],
      waitlistedStudents: waitlistedStudents || [],
      publishedAt: new Date()
    };

    const admissionRef = await db.collection('admissions').add(admissionData);

    // Update application statuses and send notifications
    const statusUpdates = [
      { students: admittedStudents, status: 'admitted' },
      { students: rejectedStudents, status: 'rejected' },
      { students: waitlistedStudents, status: 'waitlisted' }
    ];

    for (const { students, status } of statusUpdates) {
      if (students && students.length > 0) {
        for (const studentId of students) {
          // Find application
          const appSnapshot = await db.collection('applications')
            .where('studentId', '==', studentId)
            .where('courseId', '==', courseId)
            .get();

          if (!appSnapshot.empty) {
            const appDoc = appSnapshot.docs[0];
            
            // Update application status
            await db.collection('applications').doc(appDoc.id).update({
              status,
              decidedAt: new Date()
            });

            // Get student details
            const studentDoc = await db.collection('students').doc(studentId).get();
            if (studentDoc.exists) {
              const student = studentDoc.data();
              
              // Send notification
              await db.collection('notifications').add({
                userId: studentId,
                type: 'admission',
                title: 'Admission Decision',
                message: `Your application for ${courseDoc.data().courseName} has been ${status}`,
                read: false,
                relatedId: admissionRef.id,
                createdAt: new Date()
              });

              // Send email
              if (student.personalInfo?.email) {
                await sendAdmissionNotification(
                  student.personalInfo.email,
                  `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
                  courseDoc.data().courseName,
                  status
                );
              }
            }
          }
        }
      }
    }

    res.status(201).json({
      message: 'Admissions published successfully',
      admissionId: admissionRef.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appDoc = await db.collection('applications').doc(req.params.id).get();
    
    if (!appDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = appDoc.data();

    // Verify ownership
    if (appData.institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('applications').doc(req.params.id).update({
      status,
      decidedAt: new Date()
    });

    // Send notification to student
    await db.collection('notifications').add({
      userId: appData.studentId,
      type: 'admission',
      title: 'Application Status Update',
      message: `Your application status has been updated to: ${status}`,
      read: false,
      relatedId: req.params.id,
      createdAt: new Date()
    });

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyAdmissions = async (req, res) => {
  try {
    const snapshot = await db.collection('admissions')
      .where('institutionId', '==', req.user.uid)
      .orderBy('publishedAt', 'desc')
      .get();

    const admissions = [];

    for (const doc of admissionsSnapshot.docs) {
      const admissionData = doc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(admissionData.courseId).get();

      admissions.push({
        id: doc.id,
        ...admissionData,
        course: courseDoc.exists ? courseDoc.data() : null
      });
    }

    res.json(admissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// backend/src/controllers/institute.controller.js - Fix for getMyAdmissions
// Add this to the end of the file, replacing the existing getMyAdmissions function

exports.getMyAdmissions = async (req, res) => {
  try {
    const snapshot = await db.collection('admissions')
      .where('institutionId', '==', req.user.uid)
      .orderBy('publishedAt', 'desc')
      .get();

    const admissions = [];

    for (const doc of snapshot.docs) {  // Changed from admissionsSnapshot to snapshot
      const admissionData = doc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(admissionData.courseId).get();

      admissions.push({
        id: doc.id,
        ...admissionData,
        course: courseDoc.exists ? courseDoc.data() : null
      });
    }

    res.json(admissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};