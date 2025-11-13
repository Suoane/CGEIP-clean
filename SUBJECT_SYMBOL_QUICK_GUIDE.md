# Subject/Symbol Matching Feature - Quick Guide

## 🏫 For Institutes: Adding Subject Requirements

### Step 1: Open Manage Courses
1. Log in as Institution
2. Navigate to **"Manage Courses"**
3. Click **"Add Course"** or **"Edit"** on existing course

### Step 2: Fill Course Details
- Course Name
- Course Code
- Faculty
- Duration
- Level
- Required qualifications (Math score, English score, GPA, Field of Study)

### Step 3: Add Subject Requirements ⭐ NEW
1. Scroll down to **"Required Subjects"** section
2. In **"Subject Name"** field, type a subject:
   ```
   Examples: Physics, Chemistry, Biology, Mathematics, 
             English Literature, History, Economics
   ```
3. In **"Minimum Symbol/Mark"** field, enter 0-100:
   ```
   Example: 70 means student needs at least 70 marks in that subject
   ```
4. Click **"Add Subject"** button
5. The subject appears in the table below with name and minimum mark

### Step 4: Manage Subject List
- **Add More Subjects**: Repeat steps 2-4 for each required subject
- **Remove Subject**: Click **"Remove"** button next to subject in table
- **View List**: All added subjects display in organized table format

### Step 5: Save Course
- Click **"Add"** (for new course) or **"Update"** (for existing)
- Course now saved with subject requirements to database
- Subjects will appear in student view when they search for matching courses

### Example:
For a "BSC Physics" course, you might set:
| Subject | Min Mark |
|---------|----------|
| Physics | 80 |
| Chemistry | 70 |
| Mathematics | 75 |

---

## 👨‍🎓 For Students: Entering Your Subjects

### Step 1: Open Enter Results
1. Log in as Student
2. Navigate to **"Your Academic Results"**
3. Fill existing fields:
   - Math Score
   - English Score
   - Science Score (optional)
   - GPA
   - Field of Study
   - Years of Study

### Step 2: Add Your Subjects ⭐ NEW
1. Scroll down to **"Your Subjects and Marks"** section
2. In **"Subject Name"** field, type your subject:
   ```
   Must match course requirements!
   Examples: Physics, Chemistry, Biology, Mathematics, etc.
   ```
3. In **"Marks/Symbol"** field, enter your obtained marks (0-100):
   ```
   Example: 85 for 85 marks in Physics exam
   ```
4. Click **"Add Subject"** button
5. Your subject appears in the table below

### Step 3: Add All Your Subjects
- **Add More Subjects**: Repeat for each subject you studied
- **Remove Mistake**: Click **"Remove"** to delete incorrect entry
- **Edit Subject**: Remove and re-add with correct marks

### Step 4: Save Everything
- Click **"Save Results"** button
- All information (scores + subjects) saved to your profile
- You can always come back and edit later

### Example Entry:
| Subject | Your Marks |
|---------|-----------|
| Physics | 85 |
| Chemistry | 72 |
| Biology | 88 |
| Mathematics | 92 |

---

## 🎯 For Students: Viewing Matching Courses

### Step 1: Check Matching Courses
After entering results and subjects:
1. Navigate to **"Matching Courses"**
2. System shows only courses you qualify for based on:
   - Profile completion ✓
   - Document upload ✓
   - Results (Math, English, GPA) ✓
   - **Subject requirements** ✓ NEW

### Step 2: View Course Details
- Click **"View Details"** on any course
- Course detail modal opens showing:
  - Course name, description, faculty
  - Your strengths (what you meet)
  - Course requirements (Math, English, GPA, Field)
  - **Required Subjects table** ⭐ NEW

### Step 3: Check Subject Matching ⭐ NEW
In the **"Required Subjects"** section, you'll see:

#### Table Columns:
- **Subject**: Required subject name
- **Required**: Minimum marks/symbol needed
- **Your Marks**: Your actual marks for that subject
- **Status**: Color-coded result

#### Status Indicators:
- 🟢 **✓ Meets** (GREEN): You have that subject and marks are enough
- 🔴 **✗ Below** (RED): Either missing subject or marks too low

#### Example Table:
```
Subject     | Required | Your Marks | Status
------------|----------|-----------|----------
Physics     | 70/100   | 85/100    | ✓ Meets
Chemistry   | 65/100   | 72/100    | ✓ Meets
Biology     | 60/100   | —         | ✗ Below
```

#### Summary Message:
- **If Qualified**: "✓ You have all 3 required subjects with passing marks!"
- **If Not Qualified**: "✗ You need 1 more subject(s) to qualify"

### Step 4: Apply or Look for Others
- **If Eligible**: Subject requirements met! Click "Apply Now" to apply
- **If Not Eligible**: Don't have required subjects. Look for other courses that match your profile

---

## 📋 Subject Matching Logic

### How It Works:
1. **Institute Sets Requirements**: "Physics (70 marks required)"
2. **Student Enters Marks**: "Physics: 85 marks"
3. **System Compares**: 85 >= 70? YES → Subject matches ✓
4. **Eligibility**: All required subjects match? YES → Student qualifies!

### Matching Rules:
- ✅ Subject names are matched (case doesn't matter):
  - "Physics" = "physics" = "PHYSICS" ✓
  - "Math" ≠ "Mathematics" ✗ (must be exact)
  
- ✅ Marks must be 0-100
- ✅ Student marks must be >= Required minimum
- ✅ Student must have ALL required subjects
- ✅ Missing even one subject = Not eligible

### Example 1: QUALIFIED ✅
```
Course: BSC Physics
Required: Physics (80), Chemistry (70), Math (75)

Student Has:
- Physics: 85 ✓ (85 >= 80)
- Chemistry: 72 ✓ (72 >= 70)
- Math: 90 ✓ (90 >= 75)

Result: ELIGIBLE ✓ All 3 subjects match!
```

### Example 2: NOT QUALIFIED ❌
```
Course: BSC Physics  
Required: Physics (80), Chemistry (70), Math (75)

Student Has:
- Physics: 88 ✓ (88 >= 80)
- Chemistry: 65 ✗ (65 < 70) TOO LOW
- Math: 90 ✓ (90 >= 75)

Result: NOT ELIGIBLE ✗ Chemistry marks too low
```

### Example 3: INCOMPLETE ❌
```
Course: BSC Physics
Required: Physics (80), Chemistry (70), Math (75)

Student Has:
- Physics: 85 ✓ (85 >= 80)
- Chemistry: 72 ✓ (72 >= 70)
- (Missing Math) ✗

Result: NOT ELIGIBLE ✗ Missing Mathematics subject
```

---

## 🔧 Important Notes

### For Subject Names:
- Use exact spelling (case doesn't matter)
- Common subjects: Physics, Chemistry, Biology, Mathematics, History, Geography, Economics, English, Languages, etc.
- Avoid spaces at start/end (system auto-trims)
- No special characters needed

### For Marks:
- Must be 0-100 (decimal allowed: 85.5 ✓)
- Can't be negative or over 100
- Must be actual exam marks/scores
- No letters or special characters

### Editing:
- **Edit Subjects**: Remove old entry and add corrected one
- **Edit Marks**: Remove and re-add with correct marks
- **Edit Courses**: Institutes can update subject requirements anytime

### Getting Qualified:
1. Complete your profile (name, email, etc.)
2. Upload required documents (Transcript, ID Card)
3. Enter exam results (Math, English, GPA, Field of Study)
4. **Enter your subjects and marks** ⭐ NEW
5. Check "Matching Courses" - only qualifying courses shown

---

## ✅ Checklist Before Applying

### Institute Checklist:
- [ ] Course details entered (name, code, faculty, duration, level)
- [ ] Admission status set to "Open"
- [ ] Required qualifications set (Math, English, GPA, Field)
- [ ] At least one subject added (if subjects required)
- [ ] All subjects have realistic minimum marks
- [ ] Course saved successfully

### Student Checklist:
- [ ] Profile completed (first name, last name, email)
- [ ] Academic history added
- [ ] Documents uploaded (Transcript, ID Card)
- [ ] Math, English, GPA scores entered
- [ ] **All subjects entered with marks** ⭐ NEW
- [ ] Matched courses now visible
- [ ] Subject requirements shown in course details

---

## 📚 Examples of Subject Requirements

### Science Stream Courses:
**BSC Physics**
- Physics: 75
- Chemistry: 70
- Mathematics: 80

**BSC Biology**
- Biology: 80
- Chemistry: 75
- English: 65

### Commerce Stream:
**BCom Accounting**
- Mathematics: 70
- English: 65
- Economics: 75

### Arts Stream:
**BA History**
- History: 70
- English: 75
- Geography: 65

### Engineering:
**BTech Computer Science**
- Mathematics: 85
- Physics: 80
- English: 70

---

## ❓ FAQ

**Q: Can I apply to a course if I don't have all subjects?**
A: No, you must have ALL required subjects to qualify. You'll see which ones you're missing.

**Q: What if my subject name is spelled differently?**
A: Exact spelling matters. If course requires "Mathematics" but you enter "Math", it won't match. But case (uppercase/lowercase) doesn't matter.

**Q: Can I update my subjects after saving?**
A: Yes! Go to "Your Academic Results", remove old entries, add corrected ones, and save again.

**Q: Do I need to enter subjects if a course doesn't have subject requirements?**
A: No, they're optional. Courses without subject requirements only check Math/English/GPA/Field of Study.

**Q: Why doesn't my course show up?**
A: Check:
1. Did you complete your profile?
2. Did you upload documents?
3. Did you enter all required results?
4. Do your subjects and marks meet the course requirements?

If still not showing, you're not qualified for that course yet. Look for other courses matching your profile.

**Q: Can an institute change subject requirements after course is created?**
A: Yes! Edit the course, update/remove subjects, and save. Applies to all future applications.

---

**Version**: 1.0  
**Feature Status**: ✅ ACTIVE  
**Last Updated**: 2024
