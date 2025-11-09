const { db } = require('../config/firebase');

// Calculate match score between student and job
const calculateMatchScore = (student, jobRequirements) => {
  let totalScore = 0;

  // 1. GPA/Academic Performance (25 points)
  if (student.completionData?.gpa) {
    const studentGPA = parseFloat(student.completionData.gpa);
    const requiredGPA = parseFloat(jobRequirements.minGPA || 0);
    
    if (studentGPA >= requiredGPA) {
      const gpaScore = Math.min((studentGPA / 4.0) * 25, 25);
      totalScore += gpaScore;
    }
  }

  // 2. Required Certificates (25 points)
  if (jobRequirements.certificates && jobRequirements.certificates.length > 0) {
    const studentCerts = student.completionData?.certificates || [];
    const matchedCerts = jobRequirements.certificates.filter(reqCert =>
      studentCerts.some(studentCert => 
        studentCert.toLowerCase().includes(reqCert.toLowerCase())
      )
    );
    const certScore = (matchedCerts.length / jobRequirements.certificates.length) * 25;
    totalScore += certScore;
  } else {
    totalScore += 25; // No specific certs required
  }

  // 3. Work Experience (25 points)
  if (jobRequirements.experience) {
    const requiredYears = parseInt(jobRequirements.experience) || 0;
    const studentYears = parseInt(student.workExperience?.years || 0);
    
    if (studentYears >= requiredYears) {
      totalScore += 25;
    } else if (studentYears > 0) {
      totalScore += (studentYears / requiredYears) * 25;
    }
  } else {
    totalScore += 25; // No experience required
  }

  // 4. Field Relevance (25 points)
  if (student.completionData?.fieldOfStudy && jobRequirements.education) {
    const studentField = student.completionData.fieldOfStudy.toLowerCase();
    const jobField = jobRequirements.education.toLowerCase();
    
    // Simple keyword matching
    if (studentField.includes(jobField) || jobField.includes(studentField)) {
      totalScore += 25;
    } else {
      // Partial match for related fields
      const commonKeywords = ['computer', 'business', 'engineering', 'science', 'management'];
      const hasCommon = commonKeywords.some(keyword => 
        studentField.includes(keyword) && jobField.includes(keyword)
      );
      if (hasCommon) {
        totalScore += 15;
      }
    }
  } else {
    totalScore += 15; // Partial credit if education not specified
  }

  return Math.round(totalScore);
};

// Find qualified students for a job
const findQualifiedStudents = async (jobId, jobData) => {
  try {
    // Get all completed students
    const studentsSnapshot = await db.collection('students')
      .where('studyStatus', '==', 'completed')
      .get();

    const qualifiedStudents = [];

    for (const doc of studentsSnapshot.docs) {
      const student = { id: doc.id, ...doc.data() };
      const matchScore = calculateMatchScore(student, jobData.requirements);

      // Only include students with 70% or higher match
      if (matchScore >= 70) {
        qualifiedStudents.push({
          studentId: student.id,
          studentName: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
          email: student.personalInfo.email || '',
          matchScore: matchScore,
          gpa: student.completionData?.gpa,
          fieldOfStudy: student.completionData?.fieldOfStudy
        });
      }
    }

    // Sort by match score (highest first)
    qualifiedStudents.sort((a, b) => b.matchScore - a.matchScore);

    return qualifiedStudents;
  } catch (error) {
    console.error('Error finding qualified students:', error);
    throw error;
  }
};

// Check if student qualifies for a course
const checkCourseEligibility = (student, courseRequirements) => {
  const eligible = {
    qualified: true,
    reasons: []
  };

  // Check minimum grade requirement
  if (courseRequirements.minGrade) {
    const studentGrades = student.academicInfo?.grades || {};
    const avgGrade = Object.values(studentGrades).reduce((sum, grade) => {
      // Convert letter grades to numbers (A=4, B=3, C=2, D=1, F=0)
      const gradeMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
      return sum + (gradeMap[grade] || 0);
    }, 0) / Object.keys(studentGrades).length;

    const requiredGrade = courseRequirements.minGrade;
    const gradeMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    
    if (avgGrade < gradeMap[requiredGrade]) {
      eligible.qualified = false;
      eligible.reasons.push(`Minimum grade requirement: ${requiredGrade}`);
    }
  }

  // Check required subjects
  if (courseRequirements.subjects && courseRequirements.subjects.length > 0) {
    const studentSubjects = Object.keys(student.academicInfo?.grades || {});
    const missingSubjects = courseRequirements.subjects.filter(
      subject => !studentSubjects.includes(subject)
    );

    if (missingSubjects.length > 0) {
      eligible.qualified = false;
      eligible.reasons.push(`Missing required subjects: ${missingSubjects.join(', ')}`);
    }
  }

  return eligible;
};

module.exports = {
  calculateMatchScore,
  findQualifiedStudents,
  checkCourseEligibility
};