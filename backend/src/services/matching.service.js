// backend/src/services/matching.service.js
const { db } = require('../config/firebase');

/**
 * Calculate advanced match score with detailed breakdown
 * Scoring System (100 points total):
 * - Academic Performance (GPA): 25 points
 * - Certificates: 25 points
 * - Work Experience: 25 points
 * - Field Relevance: 25 points
 */
const calculateAdvancedMatchScore = (student, jobRequirements) => {
  const breakdown = {
    academicScore: 0,
    certificatesScore: 0,
    experienceScore: 0,
    fieldRelevanceScore: 0
  };

  // 1. Academic Performance Score (25 points)
  if (student.completionData?.gpa && jobRequirements.minGPA) {
    const studentGPA = parseFloat(student.completionData.gpa);
    const requiredGPA = parseFloat(jobRequirements.minGPA);
    
    if (studentGPA >= requiredGPA) {
      // Perfect score if GPA is at or above requirement
      // Bonus points for exceeding requirement
      const gpaRatio = studentGPA / Math.max(requiredGPA, 2.0);
      breakdown.academicScore = Math.min(25, Math.round(gpaRatio * 20));
      
      // Extra bonus for exceptional GPA (3.5+)
      if (studentGPA >= 3.5) {
        breakdown.academicScore = Math.min(25, breakdown.academicScore + 5);
      }
    } else {
      // Partial credit if close to requirement
      const percentOfRequired = studentGPA / requiredGPA;
      breakdown.academicScore = Math.round(percentOfRequired * 15);
    }
  } else if (student.completionData?.gpa) {
    // No specific GPA required, award based on performance
    const studentGPA = parseFloat(student.completionData.gpa);
    breakdown.academicScore = Math.round((studentGPA / 4.0) * 25);
  } else {
    breakdown.academicScore = 10; // Base score if GPA not available
  }

  // 2. Certificates Score (25 points)
  const studentCerts = student.completionData?.certificates || [];
  const requiredCerts = jobRequirements.certificates || [];
  
  if (requiredCerts.length > 0) {
    // Match required certificates
    const matchedCerts = requiredCerts.filter(reqCert =>
      studentCerts.some(studentCert => 
        normalizeText(studentCert).includes(normalizeText(reqCert)) ||
        normalizeText(reqCert).includes(normalizeText(studentCert))
      )
    );
    
    // Score based on percentage matched
    const matchPercentage = matchedCerts.length / requiredCerts.length;
    breakdown.certificatesScore = Math.round(matchPercentage * 20);
    
    // Bonus points for additional relevant certificates
    const extraCerts = studentCerts.length - matchedCerts.length;
    if (extraCerts > 0) {
      breakdown.certificatesScore = Math.min(25, breakdown.certificatesScore + Math.min(extraCerts * 2, 5));
    }
  } else {
    // No specific certificates required, award based on quantity and quality
    if (studentCerts.length >= 5) {
      breakdown.certificatesScore = 25;
    } else if (studentCerts.length >= 3) {
      breakdown.certificatesScore = 20;
    } else if (studentCerts.length >= 1) {
      breakdown.certificatesScore = 15;
    } else {
      breakdown.certificatesScore = 5; // Base score
    }
  }

  // 3. Work Experience Score (25 points)
  const studentExperience = student.workExperience || {};
  const requiredExperience = jobRequirements.experience || '';
  
  if (requiredExperience) {
    // Extract years from requirement (e.g., "2-3 years" -> 2)
    const requiredYears = extractYearsFromText(requiredExperience);
    const studentYears = parseInt(studentExperience.years || 0);
    
    if (studentYears >= requiredYears) {
      breakdown.experienceScore = 25;
      
      // Check for relevant experience in similar roles
      if (studentExperience.positions && Array.isArray(studentExperience.positions)) {
        const hasRelevantRole = studentExperience.positions.some(position =>
          isRelevantExperience(position.title, jobRequirements.title)
        );
        if (hasRelevantRole) {
          breakdown.experienceScore = 25; // Already max
        }
      }
    } else if (studentYears > 0) {
      // Partial credit based on years
      const experienceRatio = studentYears / requiredYears;
      breakdown.experienceScore = Math.round(experienceRatio * 20);
    } else {
      breakdown.experienceScore = 5; // Some credit for fresh graduates
    }
  } else {
    // No specific experience required
    const studentYears = parseInt(studentExperience.years || 0);
    if (studentYears >= 5) {
      breakdown.experienceScore = 25;
    } else if (studentYears >= 3) {
      breakdown.experienceScore = 20;
    } else if (studentYears >= 1) {
      breakdown.experienceScore = 15;
    } else {
      breakdown.experienceScore = 10; // Fresh graduate bonus
    }
  }

  // 4. Field Relevance Score (25 points)
  const studentField = student.completionData?.fieldOfStudy || '';
  const jobEducation = jobRequirements.education || '';
  
  if (studentField && jobEducation) {
    const fieldSimilarity = calculateFieldSimilarity(studentField, jobEducation);
    breakdown.fieldRelevanceScore = Math.round(fieldSimilarity * 25);
  } else {
    breakdown.fieldRelevanceScore = 10; // Base score
  }

  // Calculate total score
  const totalScore = Math.round(
    breakdown.academicScore +
    breakdown.certificatesScore +
    breakdown.experienceScore +
    breakdown.fieldRelevanceScore
  );

  return {
    totalScore: Math.min(100, totalScore),
    breakdown,
    details: {
      academic: {
        score: breakdown.academicScore,
        gpa: student.completionData?.gpa,
        required: jobRequirements.minGPA
      },
      certificates: {
        score: breakdown.certificatesScore,
        has: studentCerts.length,
        required: requiredCerts.length
      },
      experience: {
        score: breakdown.experienceScore,
        years: studentExperience.years || 0,
        required: extractYearsFromText(requiredExperience)
      },
      fieldRelevance: {
        score: breakdown.fieldRelevanceScore,
        field: studentField,
        required: jobEducation
      }
    }
  };
};

/**
 * Rank applicants by multiple criteria
 */
const rankApplicants = (applicants, criteria = 'overall') => {
  const ranked = [...applicants];

  switch (criteria) {
    case 'academic':
      ranked.sort((a, b) => 
        (b.scoreBreakdown?.academicScore || 0) - (a.scoreBreakdown?.academicScore || 0)
      );
      break;
    
    case 'experience':
      ranked.sort((a, b) => 
        (b.scoreBreakdown?.experienceScore || 0) - (a.scoreBreakdown?.experienceScore || 0)
      );
      break;
    
    case 'certificates':
      ranked.sort((a, b) => 
        (b.scoreBreakdown?.certificatesScore || 0) - (a.scoreBreakdown?.certificatesScore || 0)
      );
      break;
    
    case 'overall':
    default:
      ranked.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      break;
  }

  return ranked;
};

/**
 * Check if student qualifies for a course (for institutions)
 */
const checkCourseEligibility = (student, courseRequirements) => {
  const eligible = {
    qualified: true,
    reasons: [],
    score: 0
  };

  // Check minimum grade requirement
  if (courseRequirements.minGrade) {
    const studentGrades = student.academicInfo?.grades || {};
    const avgGrade = calculateAverageGrade(studentGrades);

    const requiredGrade = courseRequirements.minGrade;
    const gradeMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    
    if (avgGrade < gradeMap[requiredGrade]) {
      eligible.qualified = false;
      eligible.reasons.push(`Minimum grade requirement: ${requiredGrade} (Current average: ${getGradeLetter(avgGrade)})`);
    } else {
      eligible.score += 25;
    }
  }

  // Check required subjects
  if (courseRequirements.subjects && courseRequirements.subjects.length > 0) {
    const studentSubjects = Object.keys(student.academicInfo?.grades || {});
    const missingSubjects = courseRequirements.subjects.filter(
      subject => !studentSubjects.some(s => 
        normalizeText(s).includes(normalizeText(subject))
      )
    );

    if (missingSubjects.length > 0) {
      eligible.qualified = false;
      eligible.reasons.push(`Missing required subjects: ${missingSubjects.join(', ')}`);
    } else {
      eligible.score += 25;
    }
  }

  // Check for prerequisite courses
  if (courseRequirements.prerequisites && courseRequirements.prerequisites.length > 0) {
    const completedCourses = student.academicInfo?.completedCourses || [];
    const missingPrereqs = courseRequirements.prerequisites.filter(
      prereq => !completedCourses.includes(prereq)
    );

    if (missingPrereqs.length > 0) {
      eligible.qualified = false;
      eligible.reasons.push(`Missing prerequisites: ${missingPrereqs.join(', ')}`);
    } else {
      eligible.score += 25;
    }
  }

  return eligible;
};

// Helper functions
function normalizeText(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

function extractYearsFromText(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function isRelevantExperience(positionTitle, jobTitle) {
  const normalizedPosition = normalizeText(positionTitle);
  const normalizedJob = normalizeText(jobTitle);
  
  // Check for keyword matches
  const keywords = normalizedJob.split(' ').filter(word => word.length > 3);
  return keywords.some(keyword => normalizedPosition.includes(keyword));
}

function calculateFieldSimilarity(studentField, jobField) {
  const student = normalizeText(studentField);
  const job = normalizeText(jobField);
  
  // Direct match
  if (student === job) return 1.0;
  
  // Partial match
  if (student.includes(job) || job.includes(student)) return 0.9;
  
  // Related fields mapping
  const relatedFields = {
    'computer science': ['software engineering', 'information technology', 'computer engineering', 'it'],
    'software engineering': ['computer science', 'information technology', 'computer engineering'],
    'business administration': ['management', 'business management', 'commerce', 'business'],
    'engineering': ['civil engineering', 'mechanical engineering', 'electrical engineering'],
    'science': ['biology', 'chemistry', 'physics', 'mathematics'],
    'accounting': ['finance', 'business', 'commerce'],
    'finance': ['accounting', 'economics', 'business']
  };
  
  // Check related fields
  for (const [key, related] of Object.entries(relatedFields)) {
    if (student.includes(key) && related.some(r => job.includes(r))) {
      return 0.7;
    }
    if (job.includes(key) && related.some(r => student.includes(r))) {
      return 0.7;
    }
  }
  
  // Check for common keywords
  const studentWords = student.split(' ');
  const jobWords = job.split(' ');
  const commonWords = studentWords.filter(word => 
    word.length > 4 && jobWords.includes(word)
  );
  
  if (commonWords.length > 0) {
    return 0.5;
  }
  
  return 0.2; // Minimal relevance
}

function calculateAverageGrade(grades) {
  const gradeMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
  const values = Object.values(grades).map(g => gradeMap[g] || 0);
  return values.length > 0 
    ? values.reduce((sum, val) => sum + val, 0) / values.length 
    : 0;
}

function getGradeLetter(avgGrade) {
  if (avgGrade >= 3.5) return 'A';
  if (avgGrade >= 2.5) return 'B';
  if (avgGrade >= 1.5) return 'C';
  if (avgGrade >= 0.5) return 'D';
  return 'F';
}

module.exports = {
  calculateAdvancedMatchScore,
  rankApplicants,
  checkCourseEligibility
};