# CGEIP Project - Quick Reference Card

## 🚀 Start Your Project

```bash
# Windows Batch
start.bat

# PowerShell
.\start.ps1

# Manual
cd backend && npm start
# (in another terminal)
cd frontend && npm start
```

## 📍 Access Points

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | http://localhost:3000 | ✅ React App |
| Backend | http://localhost:5000 | ✅ API Server |
| Health Check | http://localhost:5000/health | ✅ Server Status |

## 👥 Test Accounts (Create Your Own)

1. Go to http://localhost:3000
2. Click "Register"
3. Choose role: Student, Institute, or Company
4. Verify email when prompted
5. Login

## 📚 Main Features

### Student
- 📄 Upload documents
- 🎓 View courses & apply
- ✅ Track applications
- 🏢 Find jobs

### Institution
- 👥 Manage faculties
- 📖 Manage courses
- 📋 Review applications
- 🎓 Publish admissions

### Company
- 💼 Post jobs
- 👤 View applicants
- 📞 Schedule interviews

### Admin
- 🏛️ Manage all institutions
- 🏢 Manage companies
- 📊 View reports

## 🔌 API Endpoints (Main)

```
Authentication:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/verify-email

Student:
  GET    /api/student/profile
  POST   /api/student/courses/apply
  GET    /api/student/applications

Institute:
  GET    /api/institute/faculties
  POST   /api/institute/faculties
  GET    /api/institute/courses
  POST   /api/institute/courses
  GET    /api/institute/applications

Upload:
  POST   /api/upload/student/documents
  GET    /api/upload/student/matched-courses

Company:
  POST   /api/company/jobs
  GET    /api/company/jobs

Admin:
  GET    /api/admin/institutions
  GET    /api/admin/companies
  GET    /api/admin/reports/overview
```

## 🔧 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Backend won't start | `npm install` then `npm start` |
| Firebase error | Check `.env` has FIREBASE_* vars |
| 404 on routes | Restart backend server |
| Can't login | Verify email first |
| Upload fails | Check file < 5MB, PDF/JPEG/PNG |
| Frontend 404 | Check `npm start` is running |

**Detailed help**: See TROUBLESHOOTING_GUIDE.md

## 📊 Database Collections

- `users` - User accounts
- `students` - Student profiles
- `institutions` - Schools/Universities
- `faculties` - Departments
- `courses` - Course offerings
- `applications` - Student applications
- `companies` - Companies
- `jobs` - Job postings

## 🔑 Environment Variables

**Backend (.env):**
```
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FIREBASE_STORAGE_BUCKET ← IMPORTANT!
SENDGRID_API_KEY
PORT=5000
```

**Frontend (.env):**
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_API_URL=http://localhost:5000/api/
```

## 🧪 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads
- [ ] Can register new user
- [ ] Can receive verification email
- [ ] Can verify & login
- [ ] Can upload documents
- [ ] Can apply for course
- [ ] Can post job (as company)
- [ ] All role-specific features work

## 💾 Important Files Modified

1. `backend/server.js` - Added missing routes ✅
2. `backend/.env` - Added storage bucket ✅
3. `backend/src/config/firebase.js` - Export storage ✅
4. `backend/src/controllers/institute.controller.js` - Fixed bug ✅

## 📱 Browser DevTools

Press `F12` to open developer tools:

**Console Tab**: Check for JavaScript errors  
**Network Tab**: Check API requests status  
**Storage Tab**: View Firebase config  

## 🐛 Getting Help

1. **Check logs** - Terminal output
2. **Read TROUBLESHOOTING_GUIDE.md** - Comprehensive guide
3. **Check FIXES_SUMMARY.md** - What was fixed
4. **Firebase Console** - Check data/auth status
5. **Browser DevTools** - Check frontend errors

## 📝 Log Into Different Roles

**As Institution:**
- Go to Register
- Choose "Institute" role
- Fill in institution name
- Verify email
- Login & manage courses

**As Student:**
- Go to Register
- Choose "Student" role
- Fill in personal info
- Verify email
- Login & upload docs, apply for courses

**As Company:**
- Go to Register
- Choose "Company" role
- Fill in company name
- Verify email
- Login & post jobs

## ⚡ Performance Tips

1. Use incognito mode to test multiple accounts
2. Check DevTools Network tab for slow requests
3. Monitor backend logs for database issues
4. Clear browser cache if changes don't appear
5. Restart servers if hung

## 📞 Contact Points

For issues:
1. Terminal logs (backend)
2. Browser console (frontend)
3. Firebase Console
4. TROUBLESHOOTING_GUIDE.md
5. FIXES_SUMMARY.md

## ✅ Status

**All Critical Issues Fixed!**
- ✅ Institute routes working
- ✅ Document uploads working
- ✅ All endpoints operational
- ✅ Firebase configured

**Ready to use!**

---

**Version**: 1.0 | **Updated**: Nov 12, 2025

Keep this handy while developing! 📋
