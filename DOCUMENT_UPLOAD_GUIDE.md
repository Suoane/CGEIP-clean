# 📁 Complete Document Upload & Course Matching Guide

## Features Implemented

Your system now has:

✅ **Document Upload**
- Support for PDF, JPEG, PNG files
- Max 5MB per file
- ID Card, Transcript, Certificate uploads
- Progress tracking

✅ **Auto-Course Matching**
- Automatic matching after upload
- Smart eligibility checking
- Match score calculation (0-100)
- Show only qualifying courses

✅ **Smart Apply System**
- Apply only to courses you qualify for
- Eligibility validation
- Match score display

---

## How It Works - Step by Step

### Step 1: Upload Documents
```
Student Dashboard
    ↓
Click "Upload Documents"
    ↓
Select files (PDF/JPEG/PNG)
    ↓
Click "Upload Selected Documents"
    ↓
Backend uploads to Firebase Storage
    ↓
Documents saved to Firestore
```

### Step 2: Auto-Matching Triggers
```
After upload succeeds:
    ↓
Backend analyzes student profile
    ↓
Checks against all open courses
    ↓
Calculates match scores
    ↓
Returns only qualifying courses (score ≥ 60/100)
    ↓
Frontend shows toast: "Found X matching courses!"
```

### Step 3: View Matched Courses
```
Student Dashboard
    ↓
Click "View Matching Courses" or "Auto-Match"
    ↓
See only courses you qualify for
    ↓
Each course shows:
    - Match score
    - Why you match
    - Institution info
    - Requirements
```

### Step 4: Apply to Qualifying Courses
```
See matching course
    ↓
Click "Apply Now"
    ↓
Confirm application
    ↓
Application submitted to institution
```

---

## File Types Supported

### ✅ Accepted Formats
```
Documents:
  ✅ PDF (.pdf)
  ✅ JPEG (.jpg, .jpeg)
  ✅ PNG (.png)

Maximum Size: 5MB per file
Minimum Size: 10KB (to prevent empty files)
```

### File Type Validation
The system validates:
```javascript
// Allowed MIME types
- application/pdf     (PDF files)
- image/jpeg          (JPG/JPEG files)
- image/png           (PNG files)
```

---

## Course Matching Algorithm

### Match Score Calculation (0-100)

```javascript
Score = 
  (Transcript uploaded: 30 points) +
  (Grade requirements: 40 points) +
  (Subject requirements: 30 points) +
  (Field of interest: 15 points) +
  (Bonus for excellence: 10 points)
  ————————————————————————
  Total: 100 points max

Minimum to Qualify: 60 points (60%)
```

### What Each Section Checks

**1. Transcript (30 points)**
```
✓ Is transcript uploaded? Yes = 30 points
✗ No transcript? = INELIGIBLE (0 points)
```

**2. Grades (40 points)**
```
Course requires: Minimum B average
Student has: A- average
✓ Meets requirement = 40 points
+ Bonus for excellence (A+) = +10 points
```

**3. Subjects (30 points)**
```
Course requires: Math, English, Physics
Student completed: Math, English, Chemistry
✓ 2/3 subjects match = 20 points
```

**4. Field of Interest (15 points)**
```
Student interests: "Engineering"
Course: "Civil Engineering"
✓ Matches = 15 points
```

---

## Usage Flow

### 1️⃣ Upload Documents

**Path:** Student Dashboard → Upload Documents

**Form:**
```
[Select ID Card]     (PDF/JPG/PNG, max 5MB)
[Select Transcript]  (PDF/JPG/PNG, max 5MB) ← REQUIRED
[Select Certificate] (PDF/JPG/PNG, max 5MB) ← Optional

[Upload Button]
```

**After Upload:**
```
✅ Uploading... 50%
✅ Uploading... 100%
✅ Documents uploaded successfully!
✨ Found 5 matching courses! Check your dashboard.
```

### 2️⃣ View Matched Courses

**Path:** Student Dashboard → Auto-Match Dashboard

**Displays:**
```
Course Card:
┌─────────────────────────────────┐
│ Course: Civil Engineering       │
│ Institution: XYZ University     │
│ ═════════════════════════════   │
│ Match Score: 85/100 ⭐⭐⭐⭐⭐  │
│                                 │
│ Why you match:                  │
│ ✓ Transcript uploaded           │
│ ✓ Exceeds grade requirement     │
│ ✓ All required subjects         │
│ ✓ Matches your interests        │
│                                 │
│ Requirements:                   │
│ • Min Grade: B average          │
│ • Subjects: Math, Physics, Eng  │
│ • Application Fee: $50          │
│                                 │
│ [Apply Now] [View Details]      │
└─────────────────────────────────┘
```

### 3️⃣ Apply to Course

**Path:** Click [Apply Now] on matching course

**Confirmation:**
```
You're eligible to apply for:
Civil Engineering at XYZ University

Match Score: 85/100

Reasons you qualify:
✓ Excellent transcript
✓ Strong grades (A- average)
✓ All required subjects
✓ Matches engineering interest

[Confirm Application]
```

**Result:**
```
✅ Application submitted!
Your application is now with XYZ University

Expected response: 2-4 weeks
You can check status in "My Applications"
```

---

## Data Flow Diagram

```
Student Uploads Documents
        ↓
    ┌───┴───┐
    │       │
 [ID Card] [Transcript] [Certificate]
    │       │
    └───┬───┘
        ↓
Backend/Firebase Storage
        ↓
Update Student Profile
        ↓
    Firestore: students/{uid}
        ├─ documents.idCard: "url"
        ├─ documents.transcript: "url"
        └─ documents.certificate: "url"
        ↓
Auto-Matching Service
        ├─ Get all open courses
        ├─ For each course:
        │  ├─ Check requirements
        │  ├─ Calculate match score
        │  └─ Add if score ≥ 60
        ↓
Return Matched Courses
        ↓
Frontend Displays
        ├─ Toast notification
        ├─ Matching courses list
        └─ Apply buttons
```

---

## Document Requirements by Course

### Example: Engineering Course
```
Requirements:
  ✓ Valid ID/Passport
  ✓ Academic Transcript (REQUIRED)
  ✓ Minimum Grade: B- average
  ✓ Required Subjects:
    - Mathematics (advanced)
    - Physics
    - English/Language
  ✓ Field: Science/Technology preferred

Student Has:
  ✓ ID: ✅ (uploaded)
  ✓ Transcript: ✅ (uploaded, A- average)
  ✓ Math: ✅ (A)
  ✓ Physics: ✅ (B+)
  ✓ English: ✅ (A-)
  ✓ Interest: Engineering ✅

Result: ✅ ELIGIBLE (Match Score: 92/100)
```

---

## Troubleshooting

### ❌ Problem: "Upload Failed"

**Solutions:**
```
1. Check file type
   ✓ Only PDF, JPEG, PNG allowed
   ✗ Not: DOCX, TXT, BMP

2. Check file size
   ✓ Max 5MB
   ✗ Not larger

3. Check file content
   ✓ File must be ≥ 10KB
   ✗ Not empty or corrupted

4. Check connection
   ✓ Internet working
   ✗ Offline
```

### ❌ Problem: "No Matching Courses Found"

**Why:**
```
Could mean:
1. ❌ Transcript not uploaded
   → Upload transcript first

2. ❌ Your grades don't meet minimums
   → Courses require higher grades

3. ❌ Missing required subjects
   → Courses need specific subjects you don't have

4. ❌ All courses closed
   → Check institution schedules
```

**Solutions:**
```
✓ Upload clear transcript
✓ Check course requirements
✓ Contact institutions
✓ Wait for new courses to open
```

### ❌ Problem: "Apply Button Disabled"

**Why:**
```
You can't apply because:
1. Transcript not uploaded
2. Grade score < 60/100
3. You already applied to this course
4. Course admission closed
```

**Solution:**
```
✓ Upload all documents
✓ Verify your grades
✓ Check course status
✓ Contact institution
```

---

## Important Notes

### Document Upload
- **Transcript is REQUIRED** for any course application
- ID Card validates your identity
- Certificate shows completion (optional)

### Match Scoring
- **Score ≥ 60** = Eligible to apply
- **Score 60-75** = Good match
- **Score 75-85** = Excellent match  
- **Score 85-100** = Perfect match

### Course Requirements
- Each course has different requirements
- Your transcript is analyzed for:
  - GPA/grades
  - Specific subjects
  - Field of study
  - Previous coursework

### Application Rules
- Maximum 2 applications per institution
- Cannot apply if already admitted elsewhere
- Application processing: 2-4 weeks
- Institutions review in order received

---

## Feature Highlights

### Smart Matching
```
✨ AI-powered matching algorithm
✨ Analyzes your entire profile
✨ Considers grades, subjects, interests
✨ Ranks courses by compatibility
✨ Shows why you match each course
```

### Easy Application
```
📱 One-click apply to matched courses
📱 No need to fill complex forms
📱 Application auto-filled with your data
📱 Instant confirmation
📱 Track status anytime
```

### Document Management
```
📁 Secure storage on Firebase
📁 Easy upload with progress
📁 View uploaded documents anytime
📁 Replace old documents
📁 Automatic validation
```

---

## Next Steps

1. ✅ Deploy Firestore rules
2. ✅ Restart backend & frontend
3. ✅ Go to Student Dashboard
4. ✅ Click "Upload Documents"
5. ✅ Select and upload your files
6. ✅ Wait for matching
7. ✅ View matched courses
8. ✅ Apply to courses you like!

---

**You're all set!** The system is designed to be smart and user-friendly. Upload your documents and let the matching algorithm find perfect courses for you! 🎓🚀
