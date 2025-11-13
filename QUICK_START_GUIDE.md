# 🚀 QUICK START - Document Upload & Auto-Matching

## ⚡ TL;DR - What You Need to Do

1. ✅ **Deploy Firestore Rules** (5 minutes)
   - Go to Firebase Console → Firestore → Rules
   - Copy `firestore.rules` file content
   - Publish

2. ✅ **Restart Services** (2 minutes)
   - Backend: `npm run dev`
   - Frontend: `npm start`

3. ✅ **Test Upload** (5 minutes)
   - Register student
   - Verify email
   - Upload documents (PDF or images)
   - See matched courses
   - Apply!

**Total Time: ~12 minutes** ⏱️

---

## Step-by-Step Guide

### 🔧 Prerequisites Check

```bash
✅ Node.js installed?
✅ Firebase project created (cgeip-7ba10)?
✅ Service account key downloaded?
✅ .env files configured?
```

### 📋 Checklist

- [ ] Firestore rules deployed
- [ ] Backend running on :5000
- [ ] Frontend running on :3000
- [ ] Firebase credentials valid
- [ ] FIREBASE_STORAGE_BUCKET set

---

## 1️⃣ Deploy Firestore Rules (CRITICAL)

### 🔴 WITHOUT this, nothing works!

**Location:** Firebase Console
```
https://console.firebase.google.com/
  → Select project: cgeip-7ba10
  → Firestore Database
  → Rules tab
```

**Steps:**
```
1. Open firestore.rules file in editor
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Go to Firebase Console Rules tab
4. Clear existing rules
5. Paste content (Ctrl+V)
6. Click "Publish" button
7. Wait for deployment (~30 seconds)
8. Verify: Status shows "Rules deployed"
```

**Rules File Location:**
```
c:\Users\user\OneDrive\Desktop\CGEIP\firestore.rules
```

**What This Enables:**
```
✅ Students can read/write own documents
✅ Login works (reads user collection)
✅ Database access for all features
✅ File upload functionality
✅ Course matching queries
✅ Application submissions
```

---

## 2️⃣ Verify Environment Configuration

### Backend: `backend/.env`

```bash
# Must have these:
FIREBASE_PROJECT_ID=cgeip-7ba10
FIREBASE_STORAGE_BUCKET=cgeip-7ba10.appspot.com  ← CHECK THIS
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend: `frontend/.env`

```bash
# Must have this:
REACT_APP_API_URL=http://localhost:5000/api/  ← CHECK /api/ suffix
REACT_APP_FIREBASE_PROJECT_ID=cgeip-7ba10
# ... other Firebase config
PORT=3000
```

---

## 3️⃣ Start Services

### Option A: PowerShell Script (Recommended)

```powershell
# Run from CGEIP folder
.\start.ps1
```

### Option B: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm install  # only if needed
npm run dev
# Expected: "Server running on port 5000"
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install  # only if needed
npm start
# Expected: Opens http://localhost:3000
```

### Verification:
```
Backend:
  ✅ Server running on port 5000
  ✅ Database connected
  ✅ No auth errors

Frontend:
  ✅ Page loads at localhost:3000
  ✅ No connection errors
  ✅ Can see login form
```

---

## 4️⃣ Test the Complete Workflow

### Step 1: Register New Student

```
1. Go to http://localhost:3000
2. Click "Sign Up" or "Register"
3. Enter:
   Email: test@example.com
   Password: Test@123456
   Role: Student
4. Click "Register"
```

**Result:**
```
✅ Account created
📧 Verification email sent
⏳ Check email for link
```

### Step 2: Verify Email

```
1. Open verification email
2. Click "Verify Email" link
3. Page shows "Email verified successfully"
4. Redirects to login
```

**Result:**
```
✅ Email verified
🔓 Can now login
```

### Step 3: Login

```
1. Enter email: test@example.com
2. Enter password: Test@123456
3. Click "Login"
```

**Result:**
```
✅ Logged in
📊 Dashboard loads
🎓 Student role activated
```

### Step 4: Upload Documents

```
Path: Dashboard → "Upload Documents" or "Upload Docs"

1. Click "Select ID Card" (or ID Card input)
   Select file: any .jpg or .png image (< 5MB)
   ✅ File shows as selected

2. Click "Select Transcript" (or Transcript input) [REQUIRED]
   Select file: any .pdf or image file (< 5MB)
   ✅ File shows as selected

3. Click "Select Certificate" (optional)
   Leave empty or select file
   ✅ Optional

4. Click "Upload Selected Documents"
   ⏳ Progress bar appears: 0% → 100%
   ✅ Success message: "Documents uploaded!"
   ✨ Toast: "Found X matching courses!"
```

**Result:**
```
✅ Files uploaded to Firebase Storage
✅ Stored in Firestore
✅ Auto-matching triggered
✅ Matched courses calculated
```

### Step 5: View Matched Courses

```
Path: Dashboard → "View Matching Courses" or "Auto-Match Dashboard"

You should see:
┌─────────────────────────────────────────────┐
│ Matching Courses (5 found)                  │
├─────────────────────────────────────────────┤
│                                             │
│ Course Card #1:                             │
│ • Course Name: Civil Engineering            │
│ • Institution: ABC University               │
│ • Match Score: 85/100 ⭐⭐⭐⭐⭐          │
│ • Why you match:                            │
│   ✓ Excellent transcript                    │
│   ✓ Strong math grades                      │
│   ✓ Physics background                      │
│   ✓ Engineering interests                   │
│ • [Apply Now]                               │
│                                             │
│ Course Card #2:                             │
│ • Course Name: Mechanical Engineering       │
│ • Match Score: 78/100 ⭐⭐⭐⭐              │
│ • [Apply Now]                               │
│                                             │
└─────────────────────────────────────────────┘
```

**Result:**
```
✅ Only see courses with score ≥ 60
✅ Courses sorted by match score (best first)
✅ Detailed reasons shown
✅ Can read full requirements
```

### Step 6: Apply to a Course

```
1. Find a course you like
2. Click "Apply Now" button
3. Confirmation dialog appears:
   "Apply for: Civil Engineering at ABC University?
    Match Score: 85/100 (You qualify!)"
4. Click "Confirm Application"
```

**Result:**
```
✅ Application submitted
📝 Stored in Firestore
📧 Institution notified
📊 Status: "Pending Review"
```

### Step 7: Check Application Status

```
Path: Dashboard → "My Applications"

You should see:
┌─────────────────────────────────────────────┐
│ My Applications                             │
├─────────────────────────────────────────────┤
│ Course: Civil Engineering                   │
│ Institution: ABC University                 │
│ Status: 🟡 Pending Review                  │
│ Applied: Today at 10:30 AM                  │
│ Expected Response: 2-4 weeks                │
│                                             │
│ [View Course] [Cancel Application]          │
└─────────────────────────────────────────────┘
```

**Result:**
```
✅ Application listed
✅ Status tracked
✅ Timeline shown
✅ Can manage applications
```

---

## 📸 Upload Support - Image Examples

### Supported Image Types

**JPEG/JPG**
```
✅ test.jpg (< 5MB)
✅ transcript.jpeg (< 5MB)
✅ photo_2024.jpg (< 5MB)
```

**PNG**
```
✅ id_card.png (< 5MB)
✅ document.png (< 5MB)
```

**PDF**
```
✅ transcript.pdf (< 5MB)
✅ certificate.pdf (< 5MB)
```

### NOT Supported

```
❌ doc.docx (Word document)
❌ photo.bmp (BMP image)
❌ file.txt (Text file)
❌ file.zip (Archive)
❌ video.mp4 (Video)
```

### File Size Requirements

```
Minimum: 10 KB
Maximum: 5 MB

Example sizes:
✅ Small PDF: 100 KB
✅ Image (JPG): 500 KB
✅ Large PDF: 4.9 MB
❌ Corrupted: 2 KB (too small)
❌ Large file: 6 MB (too large)
```

---

## 🐛 Troubleshooting

### ❌ "Upload Failed" Error

**Check these:**
```
1. File type
   ✅ Is it PDF, JPG, or PNG?
   ❌ Not DOCX, BMP, etc.

2. File size
   ✅ Between 10 KB and 5 MB?
   ❌ Not larger or empty

3. Internet
   ✅ Connected to internet?
   ❌ Not offline

4. Browser console
   Right-click → Inspect → Console
   Look for error messages
   Copy error message for debugging
```

### ❌ "No Matching Courses Found"

**Likely reasons:**
```
1. ❌ Transcript not uploaded
   FIX: Upload transcript file

2. ❌ Grades don't meet requirements
   FIX: Take courses with better grades

3. ❌ No open courses in system
   FIX: Check if courses exist

4. ❌ Match score < 60
   FIX: Check course requirements
```

### ❌ "Login Error - Insufficient Permissions"

**Solution:**
```
1. Go to Firebase Console
2. Firestore → Rules tab
3. Verify rules are published
4. Check status = "Rules deployed"
5. If not:
   - Copy firestore.rules content
   - Paste in Rules editor
   - Click Publish
6. Wait 1 minute
7. Reload page
8. Try login again
```

### ❌ "Cannot See Matched Courses"

**Check:**
```
1. Transcript uploaded?
   ✅ Must have transcript to qualify

2. Courses exist?
   ✅ Check Firestore: courses collection

3. Course has status = "open"?
   ✅ Only open courses show

4. Match score ≥ 60?
   ✅ Check requirements met

5. API working?
   Open DevTools → Network tab
   Check /api/upload/student/matched-courses
   Should return 200 with data
```

---

## ✅ Success Indicators

### ✨ You'll Know It's Working When:

```
1. Registration Works
   ✅ Account created
   ✅ Email verification sent

2. Email Verification Works
   ✅ Link in email works
   ✅ Redirects to login

3. Login Works
   ✅ Can login with email/password
   ✅ Dashboard loads
   ✅ Sees student-only content

4. Document Upload Works
   ✅ Can select PDF/image files
   ✅ Upload shows progress
   ✅ Success message appears

5. Auto-Matching Works
   ✅ Toast shows: "Found X matching courses!"
   ✅ Courses appear in dashboard
   ✅ Each shows match score

6. Course Display Works
   ✅ See all matched courses
   ✅ Each course shows:
      - Name, institution
      - Match score (e.g., 85/100)
      - Why you match
      - Requirements

7. Application Works
   ✅ Can click "Apply Now"
   ✅ Confirmation dialog shows
   ✅ Application submitted
   ✅ Appears in "My Applications"

8. Status Tracking Works
   ✅ Can see application status
   ✅ Shows "Pending Review"
   ✅ Timeline visible
```

---

## 🎯 Common Questions

### Q: Can I upload images instead of PDF?
**A:** Yes! ✅ Supports PDF, JPEG, and PNG files

### Q: What's the file size limit?
**A:** Maximum 5MB per file

### Q: What happens after I upload?
**A:** Automatic course matching triggers. You see courses within 5 seconds.

### Q: Do I have to upload all documents?
**A:** Transcript is REQUIRED. ID and certificate are optional.

### Q: Can I apply to all matched courses?
**A:** Only courses with match score ≥ 60. Lower scores = ineligible.

### Q: When will I get admission?
**A:** Institutions review applications within 2-4 weeks.

### Q: Can I change my uploaded documents?
**A:** Upload new files again. Latest files replace old ones.

### Q: What if no courses match?
**A:** Your transcript might not meet requirements. Check with course requirements or upload better documents.

---

## 📞 Need Help?

### Check These Files First:
```
Documentation:
  → DOCUMENT_UPLOAD_GUIDE.md (How to use)
  → DOCUMENT_UPLOAD_VERIFICATION.md (What works)
  → TROUBLESHOOTING_GUIDE.md (Common issues)
  → FIRESTORE_RULES_EXPLANATION.md (Rules info)

Code:
  → backend/src/routes/upload.routes.js (Upload endpoint)
  → backend/src/services/autoMatching.service.js (Matching algorithm)
  → frontend/src/components/student/UploadDocuments.js (Upload UI)
  → frontend/src/components/student/AutoMatchDashboard.js (Display)
```

### Quick Fixes:
```
1. Deploy Firestore rules
   → 90% of issues fixed

2. Restart backend
   → npm run dev in backend folder

3. Clear browser cache
   → Ctrl+Shift+Delete

4. Check .env files
   → Ensure all variables set

5. Check Firebase project
   → Wrong project ID? Recreate config
```

---

## 🚀 Ready to Launch?

```
✅ Firestore rules deployed?
✅ Backend running on :5000?
✅ Frontend running on :3000?
✅ Test files prepared?
✅ Ready to register student?

If all ✅, you're good to go!

Type in browser: http://localhost:3000
Click: Sign Up
Follow: Registration steps
Upload: Documents
See: Matched courses
Apply: To qualifying courses

DONE! 🎉
```

---

**You've got this! The system is ready. Start uploading!** 📤✨
