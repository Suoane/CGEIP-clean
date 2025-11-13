# Subject/Symbol Matching Feature - Developer Documentation

## Architecture Overview

The subject/symbol matching feature is built on three main pillars:

```
┌─────────────────────────────────────────────────────────────┐
│                  SUBJECT/SYMBOL MATCHING                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INSTITUTE SIDE          STUDENT SIDE        MATCHING SIDE   │
│  ───────────────         ───────────        ──────────────   │
│                                                              │
│  ManageCourses.js   →    EnterResults.js   →  ViewMatching   │
│  • Add subjects        • Enter marks        • Compare & Match │
│  • Set minimums        • Store in DB        • Show results    │
│  • Manage list         • Organize subjects  • Color code      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### 1. Course Creation with Subjects
```
Institute Admin
     ↓
ManageCourses.js (form)
     ↓
[requiredSubjects array]
     ↓
Firebase courses collection
     ↓
Ready for student matching
```

### 2. Student Subject Entry
```
Student
     ↓
EnterResults.js (form)
     ↓
[mySubjects array]
     ↓
Firebase students collection
     ↓
Data stored for matching
```

### 3. Matching & Display
```
Student views courses
     ↓
ViewMatchingCourses.js loads
     ↓
fetchAndMatchCourses() calls
     ↓
calculateEligibility() → calls matchSubjects()
     ↓
Returns eligibility + subject match details
     ↓
Course cards show match score & subjects
     ↓
Detail modal shows color-coded subject table
```

## Component Modifications

### ManageCourses.js

**File Location**: `frontend/src/components/institute/ManageCourses.js`

#### State Variables Added:
```javascript
const [formData, setFormData] = useState({
  // ... existing fields
  requiredSubjects: [] // NEW: Array of { name, minimumSymbol }
});

const [newSubject, setNewSubject] = useState({ 
  name: '', 
  minimumSymbol: '' 
}); // NEW: Temporary subject input
```

#### Functions Added:

**`handleAddSubject()`**
```javascript
const handleAddSubject = () => {
  // 1. Validate subject name is not empty
  // 2. Validate minimum symbol is provided
  // 3. Validate symbol is 0-100 and numeric
  // 4. Check for duplicate subjects (case-insensitive)
  // 5. Add to formData.requiredSubjects array
  // 6. Clear newSubject inputs
  // 7. Show success toast
}
```

**`handleRemoveSubject(index)`**
```javascript
const handleRemoveSubject = (index) => {
  // Filter out subject at given index from requiredSubjects array
}
```

#### Functions Modified:

**`handleChange()`** - No changes needed (existing logic handles all fields)

**`handleEdit(course)`**
```javascript
// ADDED: Load requiredSubjects from course
requiredSubjects: course.requiredSubjects || []

// ADDED: Reset newSubject
setNewSubject({ name: '', minimumSymbol: '' })
```

**`resetForm()`**
```javascript
// ADDED: Reset requiredSubjects
requiredSubjects: []

// ADDED: Reset newSubject
setNewSubject({ name: '', minimumSymbol: '' })
```

**`handleSubmit()`** - No changes (formData with subjects saved automatically)

#### UI Added:

```jsx
{/* NEW SECTION: Required Subjects */}
<div className="form-section-divider">
  <h3>Required Subjects</h3>
  <p className="section-info">Add specific subjects and their minimum marks/symbols</p>
</div>

{/* Input fields for adding subjects */}
<div className="form-group">
  <label>Subject Name</label>
  <input value={newSubject.name} onChange={...} />
</div>

<div className="form-row">
  <div className="form-group">
    <label>Minimum Symbol/Mark (0-100)</label>
    <input type="number" value={newSubject.minimumSymbol} onChange={...} />
  </div>
  <button type="button" onClick={handleAddSubject}>Add Subject</button>
</div>

{/* Display added subjects */}
{formData.requiredSubjects.length > 0 && (
  <div className="subjects-list">
    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Min Symbol</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {formData.requiredSubjects.map((subject, index) => (
          <tr key={index}>
            <td>{subject.name}</td>
            <td>{subject.minimumSymbol}/100</td>
            <td>
              <button onClick={() => handleRemoveSubject(index)}>Remove</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

### EnterResults.js

**File Location**: `frontend/src/components/student/EnterResults.js`

#### State Variables Added:
```javascript
const [mySubjects, setMySubjects] = useState([]); // NEW: Array of { name, marks }

const [newSubject, setNewSubject] = useState({ 
  name: '', 
  marks: '' 
}); // NEW: Temporary subject input
```

#### Functions Added:

**`handleAddSubject()`**
```javascript
const handleAddSubject = () => {
  // 1. Validate subject name not empty
  // 2. Validate marks provided
  // 3. Validate marks 0-100 range
  // 4. Check for duplicate subjects
  // 5. Add to mySubjects array
  // 6. Clear newSubject inputs
  // 7. Show success toast
}
```

**`handleRemoveSubject(index)`**
```javascript
const handleRemoveSubject = (index) => {
  // Filter out subject at given index
}
```

#### Functions Modified:

**`fetchStudentData()`**
```javascript
// ADDED: Load mySubjects if exists in student document
if (data.mySubjects && Array.isArray(data.mySubjects)) {
  setMySubjects(data.mySubjects);
}
```

**`handleSubmit()`**
```javascript
// ADDED: Save mySubjects array to Firestore
await updateDoc(doc(db, 'students', currentUser.uid), {
  // ... existing fields
  mySubjects: mySubjects, // NEW
  // ... rest of document
});

// UPDATED: Success message
toast.success('Your results and subjects have been saved successfully!');
```

#### UI Added:

```jsx
{/* NEW SECTION: Your Subjects and Marks */}
<div className="form-section">
  <h2>Your Subjects and Marks</h2>
  <p>Enter subject names and the marks/symbols you obtained</p>
  
  {/* Input fields */}
  <div className="form-group">
    <label>Subject Name</label>
    <input value={newSubject.name} onChange={...} />
  </div>
  
  <div className="form-row">
    <div className="form-group">
      <label>Marks/Symbol (0-100)</label>
      <input type="number" value={newSubject.marks} onChange={...} />
    </div>
    <button type="button" onClick={handleAddSubject}>Add Subject</button>
  </div>
  
  {/* Display student's subjects */}
  {mySubjects.length > 0 && (
    <div>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Marks</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {mySubjects.map((subject, index) => (
            <tr key={index}>
              <td>{subject.name}</td>
              <td>{subject.marks}/100</td>
              <td>
                <button onClick={() => handleRemoveSubject(index)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

### ViewMatchingCourses.js

**File Location**: `frontend/src/components/student/ViewMatchingCourses.js`

#### Functions Added:

**`matchSubjects(student, course)`**
```javascript
const matchSubjects = (student, course) => {
  const studentSubjects = student.mySubjects || [];
  const requiredSubjects = course.requiredSubjects || [];
  
  // If no required subjects, all matched
  if (requiredSubjects.length === 0) {
    return {
      allMatched: true,
      matchedCount: 0,
      totalRequired: 0,
      subjectMatches: []
    };
  }
  
  let matchedCount = 0;
  const subjectMatches = [];
  
  // For each required subject
  requiredSubjects.forEach(reqSubject => {
    // Find student's corresponding subject (case-insensitive)
    const studentSubject = studentSubjects.find(
      s => s.name.toLowerCase() === reqSubject.name.toLowerCase()
    );
    
    // Check if marks meet requirement
    if (studentSubject) {
      const meets = studentSubject.marks >= reqSubject.minimumSymbol;
      matchedCount += meets ? 1 : 0;
      subjectMatches.push({
        name: reqSubject.name,
        required: reqSubject.minimumSymbol,
        studentMarks: studentSubject.marks,
        meets
      });
    } else {
      // Student doesn't have this subject
      matchedCount += 0;
      subjectMatches.push({
        name: reqSubject.name,
        required: reqSubject.minimumSymbol,
        studentMarks: null,
        meets: false
      });
    }
  });
  
  return {
    allMatched: matchedCount === requiredSubjects.length,
    matchedCount,
    totalRequired: requiredSubjects.length,
    subjectMatches
  };
};
```

**Return Object Structure:**
```javascript
{
  allMatched: boolean,        // true if all subjects met
  matchedCount: number,       // count of subjects meeting requirements
  totalRequired: number,      // total required subjects
  subjectMatches: [           // array of match details
    {
      name: string,           // subject name
      required: number,       // minimum symbol required
      studentMarks: number|null, // student's marks or null
      meets: boolean         // does student meet requirement
    },
    ...
  ]
}
```

#### Functions Modified:

**`calculateEligibility(student, course)`**
```javascript
// ADDED: After checking results (lines after GPA check)

// Check subject requirements
if (course.requiredSubjects && course.requiredSubjects.length > 0) {
  const subjectMatch = matchSubjects(student, course);
  
  if (!subjectMatch.allMatched) {
    isEligible = false;
    // Add weakness for each unmet subject
    subjectMatch.subjectMatches.forEach(match => {
      if (!match.meets) {
        if (match.studentMarks === null) {
          weaknesses.push(`Missing subject: ${match.name}`);
        } else {
          weaknesses.push(`${match.name}: Need ${match.required}, You have ${match.studentMarks}`);
        }
      }
    });
  } else {
    matchScore += 20;
    strengths.push(`All ${subjectMatch.totalRequired} required subjects match`);
    // Add strength for each matched subject
    subjectMatch.subjectMatches.forEach(match => {
      strengths.push(`${match.name}: ${match.studentMarks} (meets requirement)`);
    });
  }
}

// ADDED: Return subjectMatch in return object
return {
  matchScore: Math.min(100, matchScore),
  isEligible,
  strengths,
  weaknesses,
  reasons,
  subjectMatch: course.requiredSubjects ? matchSubjects(student, course) : null // NEW
};
```

#### UI Added:

```jsx
{/* NEW SECTION: Required Subjects in course detail modal */}
{selectedCourse.requiredSubjects && selectedCourse.requiredSubjects.length > 0 && (
  <div style={{ marginBottom: '1.5rem' }}>
    <h3>Required Subjects</h3>
    <div style={{
      background: '#f0f9ff',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid #17a2b8'
    }}>
      {selectedCourse.subjectMatch ? (
        <>
          {/* Table showing subject matching */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #17a2b8' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Subject</th>
                <th style={{ textAlign: 'center', padding: '0.75rem' }}>Required</th>
                <th style={{ textAlign: 'center', padding: '0.75rem' }}>Your Marks</th>
                <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedCourse.subjectMatch.subjectMatches.map((match, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{match.name}</td>
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    {match.required}/100
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    {match.studentMarks !== null ? `${match.studentMarks}/100` : '—'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      background: match.meets ? '#d4edda' : '#f8d7da',
                      color: match.meets ? '#155724' : '#721c24'
                    }}>
                      {match.meets ? '✓ Meets' : '✗ Below'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Summary message */}
          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            {selectedCourse.subjectMatch.allMatched ? (
              <p style={{ color: '#10b981' }}>
                ✓ You have all {selectedCourse.subjectMatch.totalRequired} required subjects!
              </p>
            ) : (
              <p style={{ color: '#ef4444' }}>
                ✗ You need {selectedCourse.subjectMatch.totalRequired - selectedCourse.subjectMatch.matchedCount} more subject(s)
              </p>
            )}
          </div>
        </>
      ) : (
        // Fallback if subjectMatch not available
        <div>
          {selectedCourse.requiredSubjects.map((subject, idx) => (
            <div key={idx}>
              <strong>{subject.name}</strong>: Minimum {subject.minimumSymbol}/100
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

## Database Schema

### Firestore Collection: `courses`

**New Field:**
```javascript
{
  // ... existing fields
  requiredSubjects: [
    {
      name: string,           // e.g., "Physics"
      minimumSymbol: number   // 0-100, e.g., 70
    },
    {
      name: string,
      minimumSymbol: number
    },
    // ... more subjects
  ]
}
```

**Example Document:**
```json
{
  "id": "course123",
  "courseName": "BSC Physics",
  "courseCode": "BSC-PHY",
  "facultyId": "fac123",
  "duration": "4 years",
  "level": "degree",
  "description": "Bachelor of Science in Physics",
  "admissionStatus": "open",
  "institutionId": "inst123",
  "requiredResults": {
    "minMathScore": 70,
    "minEnglishScore": 65,
    "minGPA": 3.0,
    "requiredFieldOfStudy": "Science"
  },
  "requiredSubjects": [
    {
      "name": "Physics",
      "minimumSymbol": 80
    },
    {
      "name": "Chemistry",
      "minimumSymbol": 70
    },
    {
      "name": "Mathematics",
      "minimumSymbol": 75
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Firestore Collection: `students`

**New Field:**
```javascript
{
  // ... existing fields
  mySubjects: [
    {
      name: string,    // e.g., "Physics"
      marks: number    // 0-100, e.g., 85
    },
    {
      name: string,
      marks: number
    },
    // ... more subjects
  ]
}
```

**Example Document:**
```json
{
  "id": "student456",
  "uid": "user789",
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "academicInfo": {
    "previousSchool": "ABC High School"
  },
  "results": {
    "mathScore": 85,
    "englishScore": 78,
    "scienceScore": 82,
    "gpa": 3.8,
    "fieldOfStudy": "Science",
    "yearsOfStudy": 12,
    "additionalNotes": "Top student",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "mySubjects": [
    {
      "name": "Physics",
      "marks": 85
    },
    {
      "name": "Chemistry",
      "marks": 72
    },
    {
      "name": "Biology",
      "marks": 88
    },
    {
      "name": "Mathematics",
      "marks": 92
    }
  ],
  "documents": {
    "transcript": { url: "..." },
    "idCard": { url: "..." }
  },
  "resultsSubmitted": true,
  "resultsSubmittedAt": "2024-01-15T10:00:00Z"
}
```

## Matching Algorithm

### Step-by-step Process:

1. **Load Course Requirements**
   ```
   course.requiredSubjects = [
     { name: "Physics", minimumSymbol: 70 },
     { name: "Chemistry", minimumSymbol: 65 }
   ]
   ```

2. **Load Student Marks**
   ```
   student.mySubjects = [
     { name: "Physics", marks: 85 },
     { name: "Mathematics", marks: 90 }
     // Note: Missing Chemistry
   ]
   ```

3. **For Each Required Subject**
   - Find matching subject in student data (case-insensitive)
   - Check if student marks >= required minimum
   - Record match status

4. **Calculate Results**
   ```
   Physics: found AND 85 >= 70 → ✓ MEETS
   Chemistry: NOT found → ✗ BELOW
   
   allMatched = false (1 out of 2 met)
   matchedCount = 1
   totalRequired = 2
   ```

5. **Update Eligibility**
   ```
   If allMatched = true:
     → isEligible = true (assuming other checks pass)
     → Add 20 points to matchScore
     → Add strengths
   
   If allMatched = false:
     → isEligible = false
     → Add weaknesses for unmet subjects
   ```

### Edge Cases Handled:

1. **Course with No Subject Requirements**
   - `matchSubjects()` returns `allMatched: true`
   - No penalty to eligibility

2. **Student with No Subjects Entered**
   - All subjects show as missing
   - `matchSubjects()` returns `allMatched: false`

3. **Case Sensitivity**
   - "Physics" == "physics" == "PHYSICS" (normalized to lowercase for comparison)
   - "Math" ≠ "Mathematics" (exact match required)

4. **Partial Matches**
   - Student has subject but marks too low → ✗ BELOW
   - Student missing subject entirely → ✗ BELOW

5. **Extra Subjects**
   - Student can have subjects not required by course (ignored, doesn't affect matching)

## Scoring Impact

### Match Score Calculation:

```
Total: 100 points

Profile complete:           +15 points
Academic history:           +15 points
Documents uploaded:         +30 points

Results section:
  Math requirement met:     +10 points
  English requirement met:  +10 points
  GPA requirement met:      +10 points
  No specific results req:  +25 points

Subject section:
  All subjects matched:     +20 points
  No subject requirements:  0 points (handled above)
  Subjects don't match:     0 points + marked ineligible

Total Possible:             100 points
```

### Examples:

**Scenario 1: All Requirements Met**
```
Profile: +15
Academic: +15
Documents: +30
Math: +10
English: +10
GPA: +10
Subjects: +20
─────────────
Total: 110 (capped at 100)
Result: 100, ✓ ELIGIBLE
```

**Scenario 2: Missing Subjects**
```
Profile: +15
Academic: +15
Documents: +30
Math: +10
English: +10
GPA: +10
Subjects: 0 (ineligible)
─────────────
Total: 90
Result: 90, ✗ INELIGIBLE (failed subject match)
```

## Validation Rules

### Institute Subject Input:
- Subject name: Required, non-empty string, max 100 chars
- Minimum symbol: Required, 0-100, numeric
- No duplicate subject names (case-insensitive)

### Student Subject Input:
- Subject name: Required, non-empty string, max 100 chars
- Marks: Required, 0-100, numeric (decimal allowed)
- No duplicate subject names (case-insensitive)

### Matching Comparison:
- Subject names normalized to lowercase for comparison
- All required subjects must be present
- All marks must be >= required minimum
- Missing subject = ineligible
- Low marks = ineligible

## Testing Scenarios

### Test Case 1: Complete Match
```
Course: Physics (70), Chemistry (65), Math (75)
Student: Physics (80), Chemistry (72), Math (90)
Result: ✓ ELIGIBLE
Display: All ✓ Meets
```

### Test Case 2: Partial Match
```
Course: Physics (70), Chemistry (65), Math (75)
Student: Physics (80), Chemistry (60), Math (90)
Result: ✗ INELIGIBLE
Display: Physics ✓, Chemistry ✗ (60<65), Math ✓
```

### Test Case 3: Missing Subject
```
Course: Physics (70), Chemistry (65), Math (75)
Student: Physics (80), Chemistry (72)
Result: ✗ INELIGIBLE
Display: Physics ✓, Chemistry ✓, Math ✗ (missing)
```

### Test Case 4: Extra Subjects
```
Course: Physics (70), Chemistry (65)
Student: Physics (80), Chemistry (72), Biology (85), Math (90)
Result: ✓ ELIGIBLE
Display: Only Physics ✓, Chemistry ✓ shown (extras ignored)
```

### Test Case 5: No Subject Requirements
```
Course: No subjects required
Student: Physics (80), Chemistry (72)
Result: Based on other factors only
Display: No subject table shown
```

## Performance Considerations

1. **Subject Matching Efficiency**
   - O(n*m) where n=required subjects, m=student subjects
   - Typically small arrays (3-6 subjects), negligible impact
   - Case-insensitive comparison adds minimal overhead

2. **Database Indexing**
   - `students.mySubjects` is a sub-array, searchable with filtering
   - Consider indexing if querying by subject name needed

3. **Caching**
   - Eligibility calculated on demand (not cached)
   - Acceptable for typical user workload

## Security Considerations

1. **Data Validation**
   - All inputs validated client-side before Firebase save
   - Firebase rules can add server-side validation if needed

2. **Permissions**
   - Only students can edit their own mySubjects
   - Only institutions can edit course requiredSubjects
   - No cross-institution access possible

3. **Input Sanitization**
   - Subject names trimmed of whitespace
   - Numbers parsed and validated before storage
   - String lengths not explicitly limited but Firebase document size limits apply

## Future Enhancements

### Planned:
1. Subject category/stream organization
2. Grade conversion (marks to letters)
3. Subject aliases/normalization
4. Prerequisite subject chains
5. Weighted subject scoring

### Possible:
1. Bulk subject upload (CSV/Excel)
2. Subject performance analytics
3. Historical subject tracking
4. Institution-wide subject templates
5. Inter-course subject requirements

## Troubleshooting

### Issue: Subject not matching
**Cause**: Spelling difference
**Solution**: Ensure exact spelling (case doesn't matter)
**Example**: "Math" ≠ "Mathematics"

### Issue: Low eligibility score despite subjects matching
**Cause**: Other factors failing (profile, docs, results)
**Solution**: Complete all sections: profile → documents → results → subjects

### Issue: Subjects not saving
**Cause**: Missing required Math/English/GPA in results
**Solution**: Fill all result fields before adding subjects

### Issue: Course requirements not showing
**Cause**: `requiredSubjects` array not initialized
**Solution**: Update course to add at least one subject

## Code Quality Metrics

- **Type Safety**: Uses JavaScript duck typing, could benefit from TypeScript
- **Error Handling**: Toast notifications for all user errors
- **Comments**: Complex logic has inline comments
- **DRY Principle**: Shared validation logic in separate functions
- **Accessibility**: All inputs have labels, buttons accessible
- **Responsive**: CSS uses flexbox, works on mobile

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Development Team
