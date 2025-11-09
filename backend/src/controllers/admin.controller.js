const { db } = require('../config/firebase');
const { sendCompanyApprovalEmail } = require('../services/email.service');

// Institution Management
exports.addInstitution = async (req, res) => {
  try {
    const institutionData = {
      ...req.body,
      createdBy: req.user.uid,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('institutions').add(institutionData);
    
    res.status(201).json({
      message: 'Institution added successfully',
      id: docRef.id,
      data: institutionData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllInstitutions = async (req, res) => {
  try {
    const snapshot = await db.collection('institutions').get();
    const institutions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(institutions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInstitutionById = async (req, res) => {
  try {
    const doc = await db.collection('institutions').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInstitution = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    await db.collection('institutions').doc(req.params.id).update(updateData);
    
    res.json({ message: 'Institution updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInstitution = async (req, res) => {
  try {
    await db.collection('institutions').doc(req.params.id).delete();
    
    res.json({ message: 'Institution deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Faculty Management
exports.addFaculty = async (req, res) => {
  try {
    const facultyData = {
      ...req.body,
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

exports.getAllFaculties = async (req, res) => {
  try {
    const { institutionId } = req.query;
    let query = db.collection('faculties');

    if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }

    const snapshot = await query.get();
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

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    await db.collection('faculties').doc(req.params.id).update(req.body);
    
    res.json({ message: 'Faculty updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
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

exports.getAllCourses = async (req, res) => {
  try {
    const { institutionId, facultyId } = req.query;
    let query = db.collection('courses');

    if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }
    if (facultyId) {
      query = query.where('facultyId', '==', facultyId);
    }

    const snapshot = await query.get();
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    await db.collection('courses').doc(req.params.id).update(req.body);
    
    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await db.collection('courses').doc(req.params.id).delete();
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Company Management
exports.getAllCompanies = async (req, res) => {
  try {
    const snapshot = await db.collection('companies').get();
    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingCompanies = async (req, res) => {
  try {
    const snapshot = await db.collection('companies')
      .where('status', '==', 'pending')
      .get();
    
    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveCompany = async (req, res) => {
  try {
    const companyRef = db.collection('companies').doc(req.params.id);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await companyRef.update({
      status: 'approved',
      approvedBy: req.user.uid,
      approvedAt: new Date()
    });

    const companyData = companyDoc.data();
    await sendCompanyApprovalEmail(companyData.contactInfo.email, companyData.companyName, true);

    res.json({ message: 'Company approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.suspendCompany = async (req, res) => {
  try {
    await db.collection('companies').doc(req.params.id).update({
      status: 'suspended',
      suspendedBy: req.user.uid,
      suspendedAt: new Date()
    });

    res.json({ message: 'Company suspended successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    await db.collection('companies').doc(req.params.id).delete();
    
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// System Reports
exports.getSystemOverview = async (req, res) => {
  try {
    const [institutions, students, companies, applications] = await Promise.all([
      db.collection('institutions').get(),
      db.collection('students').get(),
      db.collection('companies').get(),
      db.collection('applications').get()
    ]);

    res.json({
      totalInstitutions: institutions.size,
      totalStudents: students.size,
      totalCompanies: companies.size,
      totalApplications: applications.size,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRegistrationStats = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    const stats = {
      total: users.length,
      byRole: {
        students: users.filter(u => u.role === 'student').length,
        institutes: users.filter(u => u.role === 'institute').length,
        companies: users.filter(u => u.role === 'company').length
      },
      verified: users.filter(u => u.emailVerified).length,
      pending: users.filter(u => !u.emailVerified).length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApplicationStats = async (req, res) => {
  try {
    const applicationsSnapshot = await db.collection('applications').get();
    const applications = applicationsSnapshot.docs.map(doc => doc.data());

    const stats = {
      total: applications.length,
      byStatus: {
        pending: applications.filter(a => a.status === 'pending').length,
        admitted: applications.filter(a => a.status === 'admitted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        waitlisted: applications.filter(a => a.status === 'waitlisted').length
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAdmissionStats = async (req, res) => {
  try {
    const admissionsSnapshot = await db.collection('admissions').get();
    const admissions = admissionsSnapshot.docs.map(doc => doc.data());

    res.json({
      total: admissions.length,
      byInstitution: admissions.reduce((acc, adm) => {
        acc[adm.institutionId] = (acc[adm.institutionId] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJobStats = async (req, res) => {
  try {
    const jobsSnapshot = await db.collection('jobs').get();
    const jobs = jobsSnapshot.docs.map(doc => doc.data());

    const stats = {
      total: jobs.length,
      active: jobs.filter(j => j.status === 'active').length,
      closed: jobs.filter(j => j.status === 'closed').length,
      byIndustry: jobs.reduce((acc, job) => {
        const companyId = job.companyId;
        acc[companyId] = (acc[companyId] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ uid: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};