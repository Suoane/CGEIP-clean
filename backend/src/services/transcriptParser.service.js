// backend/src/services/transcriptParser.service.js
const vision = require('@google-cloud/vision');

class TranscriptParserService {
  constructor() {
    // Initialize Vision API client if credentials are available
    this.visionClient = process.env.GOOGLE_APPLICATION_CREDENTIALS 
      ? new vision.ImageAnnotatorClient()
      : null;
  }

  /**
   * Parse transcript from image/PDF using OCR
   * Falls back to manual extraction if OCR not available
   */
  async parseTranscript(fileBuffer, fileType) {
    try {
      // If Google Vision API is configured, use it
      if (this.visionClient && (fileType === 'image/jpeg' || fileType === 'image/png')) {
        return await this.parseWithVision(fileBuffer);
      }
      
      // Otherwise, return structure for manual entry
      return this.getManualEntryStructure();
    } catch (error) {
      console.error('Error parsing transcript:', error);
      return this.getManualEntryStructure();
    }
  }

  /**
   * Parse transcript using Google Vision API
   */
  async parseWithVision(imageBuffer) {
    try {
      const [result] = await this.visionClient.textDetection(imageBuffer);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        return this.getManualEntryStructure();
      }

      const fullText = detections[0].description;
      return this.extractGradesFromText(fullText);
    } catch (error) {
      console.error('Vision API error:', error);
      return this.getManualEntryStructure();
    }
  }

  /**
   * Extract grades and subjects from text using pattern matching
   */
  extractGradesFromText(text) {
    const lines = text.split('\n');
    const grades = {};
    let totalPoints = 0;
    let subjectCount = 0;
    let studentName = '';
    let institutionName = '';
    let graduationYear = '';

    // Common subject patterns
    const subjectPatterns = [
      /mathematics|math|maths/i,
      /english|english language/i,
      /science|physical science|biology|chemistry|physics/i,
      /history|social studies/i,
      /geography/i,
      /computer|computing|ict/i,
      /business|commerce|economics/i,
      /sesotho|language/i
    ];

    // Grade patterns (A, B, C, D, E, F or 1-7 scale)
    const gradePattern = /\b([A-F]|[1-7])\b/;

    // Try to extract student name (usually near top)
    const namePatterns = [
      /name[:\s]+([A-Za-z\s]+)/i,
      /student[:\s]+([A-Za-z\s]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        studentName = match[1].trim();
        break;
      }
    }

    // Try to extract institution
    const institutionPatterns = [
      /school[:\s]+([A-Za-z\s]+)/i,
      /institution[:\s]+([A-Za-z\s]+)/i,
      /college[:\s]+([A-Za-z\s]+)/i
    ];
    
    for (const pattern of institutionPatterns) {
      const match = text.match(pattern);
      if (match) {
        institutionName = match[1].trim();
        break;
      }
    }

    // Try to extract year
    const yearMatch = text.match(/20\d{2}/);
    if (yearMatch) {
      graduationYear = yearMatch[0];
    }

    // Extract grades for each subject
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      for (const pattern of subjectPatterns) {
        if (pattern.test(line)) {
          // Look for grade in same line or next line
          const gradeMatch = line.match(gradePattern) || 
                           (lines[i + 1] && lines[i + 1].match(gradePattern));
          
          if (gradeMatch) {
            const subject = this.normalizeSubjectName(line);
            const grade = this.normalizeGrade(gradeMatch[1]);
            grades[subject] = grade;
            
            // Calculate points
            totalPoints += this.gradeToPoints(grade);
            subjectCount++;
          }
          break;
        }
      }
    }

    // Calculate GPA (0-4 scale)
    const gpa = subjectCount > 0 ? (totalPoints / subjectCount).toFixed(2) : 0;

    return {
      parsed: true,
      confidence: subjectCount > 0 ? 'medium' : 'low',
      data: {
        studentName: studentName || 'Not detected',
        institutionName: institutionName || 'Not detected',
        graduationYear: graduationYear || 'Not detected',
        grades,
        gpa: parseFloat(gpa),
        subjectCount,
        suggestions: this.generateSuggestions(grades, gpa)
      }
    };
  }

  /**
   * Normalize subject names to standard format
   */
  normalizeSubjectName(text) {
    const normalizations = {
      'mathematics': 'Mathematics',
      'math': 'Mathematics',
      'maths': 'Mathematics',
      'english': 'English Language',
      'science': 'Physical Science',
      'biology': 'Biology',
      'chemistry': 'Chemistry',
      'physics': 'Physics',
      'history': 'History',
      'geography': 'Geography',
      'computer': 'Computer Science',
      'computing': 'Computer Science',
      'ict': 'ICT',
      'business': 'Business Studies',
      'commerce': 'Commerce',
      'economics': 'Economics',
      'sesotho': 'Sesotho'
    };

    for (const [key, value] of Object.entries(normalizations)) {
      if (text.includes(key)) {
        return value;
      }
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Normalize grades to letter format (A-F)
   */
  normalizeGrade(grade) {
    grade = grade.toUpperCase();
    
    // If already letter grade, return it
    if (/^[A-F]$/.test(grade)) {
      return grade;
    }

    // Convert numeric grades (1-7 scale common in Lesotho)
    const numericToLetter = {
      '1': 'A',
      '2': 'B',
      '3': 'C',
      '4': 'D',
      '5': 'E',
      '6': 'F',
      '7': 'F'
    };

    return numericToLetter[grade] || 'C';
  }

  /**
   * Convert letter grade to GPA points
   */
  gradeToPoints(grade) {
    const gradePoints = {
      'A': 4.0,
      'B': 3.0,
      'C': 2.0,
      'D': 1.0,
      'E': 0.5,
      'F': 0.0
    };
    return gradePoints[grade] || 0;
  }

  /**
   * Generate course/field suggestions based on grades
   */
  generateSuggestions(grades, gpa) {
    const suggestions = [];

    // Science/Engineering track
    const scienceSubjects = ['Mathematics', 'Physical Science', 'Physics', 'Chemistry', 'Biology'];
    const scienceGrades = Object.entries(grades)
      .filter(([subject]) => scienceSubjects.includes(subject))
      .map(([, grade]) => grade);

    if (scienceGrades.length >= 2) {
      const avgScienceGrade = scienceGrades.reduce((sum, g) => sum + this.gradeToPoints(g), 0) / scienceGrades.length;
      if (avgScienceGrade >= 2.5) {
        suggestions.push({
          field: 'Engineering/Science',
          confidence: avgScienceGrade >= 3.0 ? 'high' : 'medium',
          reason: 'Strong performance in science subjects'
        });
      }
    }

    // Business/Commerce track
    const businessSubjects = ['Business Studies', 'Commerce', 'Economics', 'Mathematics'];
    const businessGrades = Object.entries(grades)
      .filter(([subject]) => businessSubjects.includes(subject))
      .map(([, grade]) => grade);

    if (businessGrades.length >= 2) {
      const avgBusinessGrade = businessGrades.reduce((sum, g) => sum + this.gradeToPoints(g), 0) / businessGrades.length;
      if (avgBusinessGrade >= 2.5) {
        suggestions.push({
          field: 'Business/Commerce',
          confidence: avgBusinessGrade >= 3.0 ? 'high' : 'medium',
          reason: 'Good performance in business subjects'
        });
      }
    }

    // Computer Science/IT track
    if (grades['Computer Science'] || grades['ICT'] || grades['Mathematics']) {
      const techGrades = [
        grades['Computer Science'],
        grades['ICT'],
        grades['Mathematics']
      ].filter(Boolean);

      const avgTechGrade = techGrades.reduce((sum, g) => sum + this.gradeToPoints(g), 0) / techGrades.length;
      if (avgTechGrade >= 2.5) {
        suggestions.push({
          field: 'Computer Science/IT',
          confidence: avgTechGrade >= 3.0 ? 'high' : 'medium',
          reason: 'Strong analytical and technical skills'
        });
      }
    }

    // General recommendation based on GPA
    if (gpa >= 3.5) {
      suggestions.push({
        field: 'Any field',
        confidence: 'high',
        reason: 'Excellent overall academic performance'
      });
    }

    return suggestions;
  }

  /**
   * Get structure for manual entry when OCR not available
   */
  getManualEntryStructure() {
    return {
      parsed: false,
      confidence: 'manual',
      data: {
        requiresManualEntry: true,
        commonSubjects: [
          'Mathematics',
          'English Language',
          'Physical Science',
          'Biology',
          'Chemistry',
          'History',
          'Geography',
          'Computer Science',
          'Business Studies',
          'Sesotho'
        ],
        gradeOptions: ['A', 'B', 'C', 'D', 'E', 'F']
      }
    };
  }
}

module.exports = new TranscriptParserService();