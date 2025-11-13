# CGEIP Project - Troubleshooting & Setup Guide

## 🔍 Issues Found and Fixed

### ✅ CRITICAL ISSUES RESOLVED:

#### 1. **Missing Routes Registration** (FIXED)
- **Problem**: Institute and Company routes were NOT registered in `server.js`
- **Impact**: Institutions couldn't manage courses, faculties, or applications
- **Solution**: Added the following routes to `server.js`:
  ```javascript
  app.use('/api/institute', instituteRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/admin', adminRoutes);
  ```

#### 2. **Firebase Storage Bucket Missing** (FIXED)
- **Problem**: Backend Firebase config didn't include storage bucket configuration
- **Impact**: Student document uploads would fail
- **Solution**: 
  - Added `FIREBASE_STORAGE_BUCKET=cgeip-7ba10.appspot.com` to `.env`
  - Updated `firebase.js` to initialize storage and export it:
    ```javascript
    const storage = admin.storage();
    module.exports = { admin, db, auth, storage };
    ```

#### 3. **Duplicate Function in Institute Controller** (FIXED)
- **Problem**: `getMyAdmissions` function was defined twice with a typo (`admissionsSnapshot` instead of `snapshot`)
- **Impact**: Would cause runtime errors when fetching admissions
- **Solution**: Removed duplicate and fixed typo

#### 4. **Missing Upload Routes** (VERIFIED)
- **Status**: Upload routes are properly configured in `/src/routes/upload.routes.js`
- **Endpoints**:
  - `POST /api/upload/student/documents` - Upload ID, Transcript, Certificate
  - `POST /api/upload/student/completion-documents` - Upload completion docs
  - `GET /api/upload/student/matched-courses` - Get matching courses
  - `GET /api/upload/student/matched-jobs` - Get matching jobs

---

## 🚀 Getting Started - Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Firebase Project configured
- Firebase Storage bucket enabled
- SendGrid API key (for emails)

### Step 1: Backend Setup

```bash
cd backend
npm install
```

#### Configure `.env` file:
Make sure your `.env` file has ALL these variables (already set):

```properties
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase
FIREBASE_PROJECT_ID=cgeip-7ba10
FIREBASE_PRIVATE_KEY=your_private_key_here
FIREBASE_CLIENT_EMAIL=your_client_email@iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=cgeip-7ba10.appspot.com

# Email
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=your_email@gmail.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

#### Start Backend Server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Expected output:
```
✅ Firebase initialized using .env credentials
🚀 Server running on port 5000
📝 Environment: development
```

### Step 2: Frontend Setup

```bash
cd frontend
npm install
```

#### Verify `.env` file:
```properties
REACT_APP_FIREBASE_API_KEY=AIzaSyDWx5vizSMiZ6LiWEe_tqB6fnxJUEaDxNc
REACT_APP_FIREBASE_AUTH_DOMAIN=cgeip-7ba10.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=cgeip-7ba10
REACT_APP_FIREBASE_STORAGE_BUCKET=cgeip-7ba10.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=949931932599
REACT_APP_FIREBASE_APP_ID=1:949931932599:web:5dfe92a182c81b3a344632
REACT_APP_API_URL=http://localhost:5000/api/
PORT=3000
```

#### Start Frontend:
```bash
npm start
```

---

## 🔐 Authentication Flow

### Login/Registration Process

1. **User Registers**
   - `POST /api/auth/register` with email, password, role
   - User document created in Firestore
   - Verification email sent

2. **User Verifies Email**
   - Click link in email
   - `POST /api/auth/verify-email` with token and UID
   - Email marked as verified in Firebase Auth and Firestore

3. **User Logs In**
   - `signInWithEmailAndPassword()` from Firebase
   - Frontend fetches ID token
   - Token sent with all requests via `Authorization: Bearer token`

4. **Token Validation**
   - Backend middleware `verifyToken` validates token
   - Checks email verification status
   - Attaches user info to request

### Troubleshooting Login Issues

#### ❌ "Cannot login - Firebase errors"

**Check 1: Firebase Credentials**
```bash
# Backend .env file
FIREBASE_PROJECT_ID=cgeip-7ba10
FIREBASE_PRIVATE_KEY=... (should start with -----BEGIN PRIVATE KEY-----)
FIREBASE_CLIENT_EMAIL=... (should be @iam.gserviceaccount.com)
```

**Check 2: Email Verification Status**
- User must verify email BEFORE logging in
- Check Firebase Console > Authentication > Users
- Ensure `Email Verified` is checked

**Check 3: Test Firebase Connection**
```bash
curl http://localhost:5000/health
# Should return: {"status":"OK","message":"Server is running"}
```

#### ❌ "Email not verified error"

**Solution:**
1. Go to `/verify-email` page in frontend
2. Check your email for verification link
3. Click the link (must match REACT_APP_FIREBASE_AUTH_DOMAIN)
4. Try login again

**If you don't see email:**
1. Check spam/junk folder
2. Request resend: `POST /api/auth/resend-verification` with email

---

## 📚 Institute Features

### Manage Faculties
```
GET  /api/institute/faculties          - List all faculties
POST /api/institute/faculties          - Create new faculty
PUT  /api/institute/faculties/:id      - Update faculty
DELETE /api/institute/faculties/:id    - Delete faculty
```

### Manage Courses
```
GET  /api/institute/courses            - List all courses
POST /api/institute/courses            - Create new course
PUT  /api/institute/courses/:id        - Update course
DELETE /api/institute/courses/:id      - Delete course
```

### Manage Applications
```
GET  /api/institute/applications       - View all applications
GET  /api/institute/applications/:id   - View single application
PUT  /api/institute/applications/:id/status - Update application status
```

### Publish Admissions
```
POST /api/institute/admissions/publish - Publish admission decisions
```

---

## 👨‍🎓 Student Features

### Upload Documents
```
POST /api/upload/student/documents
- idCard (PDF/JPEG/PNG, max 5MB)
- transcript (PDF/JPEG/PNG, max 5MB)
- certificate (PDF/JPEG/PNG, max 5MB)
```

### Apply for Courses
```
POST /api/student/courses/apply
Body: { courseId, institutionId }
- Maximum 2 applications per institution
- Cannot apply if already admitted
```

### View Eligible Courses
```
GET /api/student/courses/eligible
- Returns courses matching student's eligibility
```

### View Application Status
```
GET /api/student/applications
GET /api/student/applications/:id
```

### After Graduation - Upload Completion Docs
```
POST /api/upload/student/completion-documents
- transcript
- completionCertificate (multiple)
- gpa
- fieldOfStudy
```

### Find Jobs
```
GET /api/upload/student/matched-jobs
- Automatically matches jobs based on profile
```

---

## 🏢 Company Features

### Post Jobs
```
POST /api/company/jobs
Body: {
  jobTitle,
  description,
  requirements,
  location,
  salaryRange
}
```

### View Qualified Applicants
```
GET /api/company/jobs/:jobId/qualified-applicants
- Auto-filters based on qualifications
```

### Manage Applications
```
PUT /api/company/applications/:applicationId/status
- Update to: pending, interviewing, offered, rejected
POST /api/company/applications/:applicationId/schedule-interview
```

---

## ⚙️ Admin Features

### Manage Institutions
```
POST /api/admin/institutions
GET /api/admin/institutions
PUT /api/admin/institutions/:id
DELETE /api/admin/institutions/:id
```

### Manage Companies
```
GET /api/admin/companies
GET /api/admin/companies/pending
PUT /api/admin/companies/:id/approve
PUT /api/admin/companies/:id/suspend
```

### View Reports
```
GET /api/admin/reports/overview
GET /api/admin/reports/registrations
GET /api/admin/reports/applications
GET /api/admin/reports/admissions
GET /api/admin/reports/jobs
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Institute routes not working"
**Symptoms**: Getting 404 on `/api/institute/courses`, etc.

**Solution:**
```bash
# 1. Stop backend server
# 2. Check server.js has these lines:
#    const instituteRoutes = require('./src/routes/institute.routes');
#    app.use('/api/institute', instituteRoutes);
# 3. Restart server
npm start
```

### Issue 2: "Student can't upload documents"
**Symptoms**: 400/500 error on document upload

**Troubleshoot:**
```bash
# 1. Check Firebase Storage bucket exists
#    In Firebase Console > Storage
# 2. Check .env has FIREBASE_STORAGE_BUCKET
# 3. Verify file size < 5MB
# 4. Check file type (PDF, JPEG, PNG only)
# 5. Check auth token is valid
```

### Issue 3: "Cannot login - Firebase config error"
**Symptoms**: "Firebase initialization failed"

**Solution:**
```bash
# 1. Verify .env file is in backend/ directory
# 2. Restart backend: npm start
# 3. Check logs for specific Firebase error
# 4. Verify credentials in Firebase Console
```

### Issue 4: "Email verification not working"
**Symptoms**: "Email not verified" error during login

**Check:**
1. Is `SENDGRID_API_KEY` valid?
2. Is `SENDGRID_FROM_EMAIL` correct?
3. Is `FRONTEND_URL` correct in .env?
4. Check email spam folder
5. Try resending verification email

### Issue 5: "Admin role not working"
**Symptoms**: Getting "Access denied" on admin endpoints

**Solution:**
```bash
# 1. Check Firestore: collection 'users' > your user doc
# 2. Verify 'role' field = 'admin'
# 3. Log out and log in again (to refresh claims)
# 4. Check auth middleware in backend
```

---

## 📊 Database Collections Structure

### Firestore Collections:
```
users/
├── [uid]
│   ├── email: string
│   ├── role: 'student' | 'company' | 'institute' | 'admin'
│   ├── emailVerified: boolean
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

students/
├── [uid]
│   ├── personalInfo: { firstName, lastName, email, phone }
│   ├── academicInfo: { qualification, fieldOfStudy }
│   ├── documents: { idCard, transcript, certificate }
│   ├── admittedInstitution: string (courseId or null)
│   ├── applicationCount: number
│   └── studyStatus: 'applying' | 'admitted' | 'studying' | 'completed'

institutions/
├── [uid]
│   ├── name: string
│   ├── status: 'active' | 'inactive'
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

faculties/
├── [docId]
│   ├── institutionId: string (uid of institution)
│   ├── name: string
│   ├── description: string
│   └── createdAt: timestamp

courses/
├── [docId]
│   ├── institutionId: string
│   ├── facultyId: string
│   ├── courseName: string
│   ├── admissionStatus: 'open' | 'closed'
│   ├── requirements: { minGPA, qualifications }
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

applications/
├── [docId]
│   ├── studentId: string
│   ├── institutionId: string
│   ├── courseId: string
│   ├── status: 'pending' | 'admitted' | 'rejected' | 'waitlisted'
│   ├── documents: { idCard, transcript, certificate }
│   ├── appliedAt: timestamp
│   └── decidedAt: timestamp (if decided)

admissions/
├── [docId]
│   ├── institutionId: string
│   ├── courseId: string
│   ├── academicYear: string
│   ├── semester: string
│   ├── admittedStudents: [string] (uids)
│   ├── rejectedStudents: [string] (uids)
│   ├── waitlistedStudents: [string] (uids)
│   └── publishedAt: timestamp

notifications/
├── [docId]
│   ├── userId: string
│   ├── type: 'admission' | 'application' | 'job'
│   ├── title: string
│   ├── message: string
│   ├── read: boolean
│   ├── relatedId: string (applicationId or jobId)
│   └── createdAt: timestamp
```

---

## 🧪 Testing the Endpoints

### Using Postman or cURL:

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "additionalData": {
      "personalInfo": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }'
```

**Verify Email:**
```bash
# Get token from email link, then:
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_from_email",
    "uid": "user_uid"
  }'
```

**Login (Firebase):**
Use Firebase SDK or postman firebase auth helper

**Create Faculty (as institute):**
```bash
curl -X POST http://localhost:5000/api/institute/faculties \
  -H "Authorization: Bearer id_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering",
    "description": "Engineering Faculty"
  }'
```

---

## 📝 Logs & Debugging

### Enable Debug Logs:
```javascript
// In Firebase config (backend):
console.log('✅ Firebase initialized using .env credentials');

// In AuthContext (frontend):
console.log('🔍 Current User:', currentUser);
console.log('📧 Email verification status:', user.emailVerified);
```

### Monitor Server:
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Check Firebase status
curl http://localhost:5000/health
```

---

## ✅ Verification Checklist

Run through this to ensure everything is working:

- [ ] Backend server starts without Firebase errors
- [ ] Frontend loads and shows login page
- [ ] Can register new user
- [ ] Can receive verification email
- [ ] Can verify email and login
- [ ] Institute users can see dashboard
- [ ] Institute can add faculties
- [ ] Institute can add courses
- [ ] Students can view eligible courses
- [ ] Students can upload documents
- [ ] Students can apply for courses
- [ ] Institute can view applications
- [ ] Institute can publish admissions
- [ ] Company can post jobs
- [ ] Admin can manage all entities

---

## 📞 Need Help?

Check these in order:
1. Terminal logs (backend and frontend)
2. Browser console (frontend DevTools)
3. Firebase Console (Firestore data, Auth status)
4. This troubleshooting guide
5. Code comments in controllers and services

---

**Last Updated:** November 12, 2025
**Version:** 1.0
