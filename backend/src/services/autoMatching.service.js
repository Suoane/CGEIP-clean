// backend/src/services/autoMatching.service.js
const { db } = require('../config/firebase');
const { calculateAdvancedMatchScore } = require('./matching.service');

class AutoMatchingService {
  /**
   * Automatically find and rank courses student qualifies for
   */
  async findMatchingCourses(studentData) {
    try {
      const coursesSnapshot = await db.collection('courses')
        .where('admissionStatus', '==', 'open')
        .get();

      const matchedCourses = [];

      for (const courseDoc of coursesSnapshot.docs) {
        const course = { id: courseDoc.id, ...courseDoc.data() };
        
        // Get institution details
        const instDoc = await db.collection('institutions').doc(course.institutionId).get();
        course.institution = instDoc.exists() ? instDoc.data() : null;

        // Calculate eligibility and match score
        const matchResult = this.calculateCourseMatch(studentData, course);

        if (matchResult.isEligible && matchResult.matchScore >= 60) {
          matchedCourses.push({
            ...course,
            ...matchResult,
            autoMatched: true,
            matchedAt: new Date()
          });
        }
      }

      // Sort by match score
      matchedCourses.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        totalFound: matchedCourses.length,
        courses: matchedCourses,
        recommendations: this.generateCourseRecommendations(matchedCourses, studentData)
      };
    } catch (error) {
      console.error('Error finding matching courses:', error);
      return {
        success: false,
        error: error.message,
        courses: []
      };
    }
  }

  /**
   * Calculate course match score based on transcript data
   */
  calculateCourseMatch(student, course) {
    let matchScore = 0;
    let reasons = [];
    let isEligible = true;

    // 1. Check if transcript is uploaded (30 points)
    if (student.documents?.transcript) {
      matchScore += 30;
      reasons.push('Transcript uploaded');
    } else {
      isEligible = false;
      return { isEligible: false, matchScore: 0, reasons: ['Transcript required'] };
    }

    // 2. Check GPA/grades (40 points)
    if (student.academicInfo?.grades) {
      const grades = student.academicInfo.grades;
      const gradeValues = Object.values(grades).map(g => this.gradeToPoints(g));
      const avgGrade = gradeValues.length > 0 
        ? gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length 
        : 0;

      if (course.requirements?.minGrade) {
        const requiredGrade = this.gradeToPoints(course.requirements.minGrade);
        if (avgGrade >= requiredGrade) {
          matchScore += 40;
          reasons.push(`Meets grade requirement (${course.requirements.minGrade})`);
        } else {
          matchScore += Math.max(0, (avgGrade / requiredGrade) * 30);
          reasons.push(`Close to grade requirement`);
        }
      } else {
        matchScore += Math.min(40, avgGrade * 10);
      }

      // GPA excellence bonus
      if (avgGrade >= 3.5) {
        matchScore += 10;
        reasons.push('Excellent academic performance');
      }
    }

    // 3. Subject requirements (30 points)
    if (course.requirements?.subjects && course.requirements.subjects.length > 0) {
      const studentSubjects = Object.keys(student.academicInfo?.grades || {});
      const requiredSubjects = course.requirements.subjects;
      
      const matchedSubjects = requiredSubjects.filter(reqSub =>
        studentSubjects.some(stuSub => 
          stuSub.toLowerCase().includes(reqSub.toLowerCase()) ||
          reqSub.toLowerCase().includes(stuSub.toLowerCase())
        )
      );

      const subjectMatchRatio = matchedSubjects.length / requiredSubjects.length;
      matchScore += Math.round(subjectMatchRatio * 30);

      if (subjectMatchRatio >= 1) {
        reasons.push('All required subjects completed');
      } else if (subjectMatchRatio >= 0.7) {
        reasons.push(`Most required subjects completed (${matchedSubjects.length}/${requiredSubjects.length})`);
      }

      if (subjectMatchRatio < 0.5) {
        isEligible = false;
        reasons.push(`Missing key subjects: ${requiredSubjects.filter(s => !matchedSubjects.includes(s)).join(', ')}`);
      }
    } else {
      matchScore += 20; // Bonus if no specific subjects required
    }

    // 4. Field of interest alignment
    if (student.preferences?.fieldOfInterest && course.courseName) {
      const interests = student.preferences.fieldOfInterest.toLowerCase().split(',');
      const courseName = course.courseName.toLowerCase();
      
      const hasInterestMatch = interests.some(interest => 
        courseName.includes(interest.trim()) || 
        interest.trim().includes(courseName.split(' ')[0])
      );

      if (hasInterestMatch) {
        matchScore += 15;
        reasons.push('Matches your field of interest');
      }
    }

    // 5. Smart subject-to-course matching
    const subjectRecommendations = this.analyzeSubjectToCourseMatch(
      student.academicInfo?.grades || {},
      course
    );
    
    if (subjectRecommendations.strongMatch) {
      matchScore += 15;
      reasons.push(subjectRecommendations.reason);
    }

    return {
      isEligible,
      matchScore: Math.min(100, Math.round(matchScore)),
      reasons,
      recommendationLevel: this.getRecommendationLevel(matchScore),
      subjectAnalysis: subjectRecommendations
    };
  }

  /**
   * Analyze subject strengths to recommend specific courses
   */
  analyzeSubjectToCourseMatch(grades, course) {
    const courseName = course.courseName.toLowerCase();
    const courseDescription = (course.description || '').toLowerCase();
    const strongMatch = { strongMatch: false, reason: '' };

    // Science/Engineering courses
    if (courseName.includes('engineering') || courseName.includes('science')) {
      const scienceSubjects = ['Mathematics', 'Physical Science', 'Physics', 'Chemistry', 'Biology'];
      const scienceGrades = Object.entries(grades)
        .filter(([subject]) => scienceSubjects.some(s => subject.includes(s)))
        .map(([, grade]) => this.gradeToPoints(grade));

      if (scienceGrades.length >= 2) {
        const avgScienceGrade = scienceGrades.reduce((sum, g) => sum + g, 0) / scienceGrades.length;
        if (avgScienceGrade >= 2.5) {
          strongMatch.strongMatch = true;
          strongMatch.reason = 'Strong science/math background';
        }
      }
    }

    // Business/Commerce courses
    if (courseName.includes('business') || courseName.includes('commerce') || courseName.includes('management')) {
      const businessSubjects = ['Business Studies', 'Commerce', 'Economics', 'Mathematics'];
      const businessGrades = Object.entries(grades)
        .filter(([subject]) => businessSubjects.some(s => subject.includes(s)))
        .map(([, grade]) => this.gradeToPoints(grade));

      if (businessGrades.length >= 2) {
        const avgBusinessGrade = businessGrades.reduce((sum, g) => sum + g, 0) / businessGrades.length;
        if (avgBusinessGrade >= 2.5) {
          strongMatch.strongMatch = true;
          strongMatch.reason = 'Good business/economics foundation';
        }
      }
    }

    // Computer Science/IT courses
    if (courseName.includes('computer') || courseName.includes('it') || courseName.includes('technology')) {
      const techGrades = [
        grades['Computer Science'],
        grades['ICT'],
        grades['Mathematics']
      ].filter(Boolean).map(g => this.gradeToPoints(g));

      if (techGrades.length >= 1) {
        const avgTechGrade = techGrades.reduce((sum, g) => sum + g, 0) / techGrades.length;
        if (avgTechGrade >= 2.5) {
          strongMatch.strongMatch = true;
          strongMatch.reason = 'Strong tech/analytical skills';
        }
      }
    }

    return strongMatch;
  }

  /**
   * Find matching jobs for completed students
   */
  async findMatchingJobs(studentData) {
    try {
      // Only for completed students
      if (studentData.studyStatus !== 'completed') {
        return {
          success: false,
          message: 'Student must complete studies first',
          jobs: []
        };
      }

      const jobsSnapshot = await db.collection('jobs')
        .where('status', '==', 'active')
        .get();

      const matchedJobs = [];

      for (const jobDoc of jobsSnapshot.docs) {
        const job = { id: jobDoc.id, ...jobDoc.data() };
        
        // Get company details
        const companyDoc = await db.collection('companies').doc(job.companyId).get();
        job.company = companyDoc.exists() ? companyDoc.data() : null;

        // Calculate job match using advanced algorithm
        const matchResult = calculateAdvancedMatchScore(studentData, job.requirements || {});

        if (matchResult.totalScore >= 60) {
          matchedJobs.push({
            ...job,
            matchScore: matchResult.totalScore,
            scoreBreakdown: matchResult.breakdown,
            details: matchResult.details,
            autoMatched: true,
            matchedAt: new Date()
          });
        }
      }

      // Sort by match score
      matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        totalFound: matchedJobs.length,
        jobs: matchedJobs,
        recommendations: this.generateJobRecommendations(matchedJobs, studentData)
      };
    } catch (error) {
      console.error('Error finding matching jobs:', error);
      return {
        success: false,
        error: error.message,
        jobs: []
      };
    }
  }

  /**
   * Generate course recommendations
   */
  generateCourseRecommendations(courses, student) {
    const recommendations = {
      topMatches: courses.slice(0, 3),
      byField: {},
      urgent: []
    };

    // Group by field
    courses.forEach(course => {
      const field = this.extractField(course.courseName);
      if (!recommendations.byField[field]) {
        recommendations.byField[field] = [];
      }
      recommendations.byField[field].push(course);
    });

    // Find urgent opportunities (closing soon or limited seats)
    recommendations.urgent = courses.filter(course => {
      // Add logic for urgency if deadline info available
      return course.matchScore >= 85;
    }).slice(0, 2);

    return recommendations;
  }

  /**
   * Generate job recommendations
   */
  generateJobRecommendations(jobs, student) {
    return {
      perfectMatches: jobs.filter(j => j.matchScore >= 85),
      goodMatches: jobs.filter(j => j.matchScore >= 70 && j.matchScore < 85),
      byIndustry: this.groupJobsByIndustry(jobs),
      careerPath: this.suggestCareerPath(jobs, student)
    };
  }

  /**
   * Helper functions
   */
  gradeToPoints(grade) {
    const gradePoints = {
      'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'E': 0.5, 'F': 0.0
    };
    return gradePoints[grade] || 0;
  }

  getRecommendationLevel(score) {
    if (score >= 85) return { level: 'Excellent Match', color: '#10b981' };
    if (score >= 70) return { level: 'Good Match', color: '#3b82f6' };
    if (score >= 60) return { level: 'Fair Match', color: '#f59e0b' };
    return { level: 'Consider', color: '#6b7280' };
  }

  extractField(courseName) {
    const name = courseName.toLowerCase();
    if (name.includes('engineering')) return 'Engineering';
    if (name.includes('business') || name.includes('commerce')) return 'Business';
    if (name.includes('computer') || name.includes('it')) return 'Technology';
    if (name.includes('science')) return 'Science';
    if (name.includes('arts') || name.includes('humanities')) return 'Arts';
    return 'General';
  }

  groupJobsByIndustry(jobs) {
    return jobs.reduce((acc, job) => {
      const company = job.company?.industry || 'Other';
      if (!acc[company]) acc[company] = [];
      acc[company].push(job);
      return acc;
    }, {});
  }

  suggestCareerPath(jobs, student) {
    const fieldOfStudy = student.completionData?.fieldOfStudy || '';
    const matchingJobs = jobs.filter(job => 
      job.requirements?.education?.toLowerCase().includes(fieldOfStudy.toLowerCase())
    );

    return {
      primaryField: fieldOfStudy,
      recommendedRoles: matchingJobs.slice(0, 5).map(j => j.title),
      growthOpportunities: matchingJobs.filter(j => j.matchScore >= 80).length
    };
  }
}

module.exports = new AutoMatchingService();