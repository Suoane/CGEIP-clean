# CGEIP - Complete Higher Education Integration Platform

## 🎯 Project Overview

CGEIP is a comprehensive platform that connects students, educational institutions, and companies to streamline:
- University admissions
- Course enrollment management
- Student-job matching
- Document verification
- Institutional administration

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Cloud Storage
- **Email**: SendGrid
- **Image Processing**: Cloudinary, Google Cloud Vision

### Frontend
- **Framework**: React.js
- **State Management**: Context API + Hooks
- **Styling**: CSS
- **API Client**: Axios
- **Firebase SDK**: For authentication and Firestore access

## 📦 Project Structure

```
CGEIP/
├── backend/
│   ├── src/
│   │   ├── config/          # Firebase & Cloudinary config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth & validation
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers & constants
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Auth & app state
│   │   ├── services/        # API & Firebase
│   │   ├── utils/           # Helpers
│   │   ├── App.js           # Main component
│   │   └── index.js         # React entry
│   ├── .env                 # Firebase config
│   ├── package.json
│   └── public/              # Static files
│
├── TROUBLESHOOTING_GUIDE.md  # Detailed problem solutions
├── README.md                 # This file
├── start.bat                 # Windows batch starter
└── start.ps1                 # PowerShell starter
```

## 🚀 Quick Start

### Option 1: Using Windows Batch Script
```bash
# From project root directory
start.bat
```

### Option 2: Using PowerShell
```powershell
# From project root directory
.\start.ps1
```

### Option 3: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
# Server will run on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
# App will open on http://localhost:3000
```

## ⚙️ Configuration

### Backend Environment Variables (.env)

Required variables in `backend/.env`:

```properties
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase
FIREBASE_PROJECT_ID=cgeip-7ba10
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@...
FIREBASE_STORAGE_BUCKET=cgeip-7ba10.appspot.com

# Email Service
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=your-email@gmail.com

# Image Service
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Frontend Environment Variables (.env)

```properties
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=cgeip-7ba10.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=cgeip-7ba10
REACT_APP_FIREBASE_STORAGE_BUCKET=cgeip-7ba10.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=1:xxx:web:xxx
REACT_APP_API_URL=http://localhost:5000/api/
PORT=3000
```

## 🔑 Key Features

### For Students
✅ Register and verify email  
✅ Upload academic documents (ID, Transcript, Certificate)  
✅ Browse eligible courses  
✅ Apply for courses (max 2 per institution)  
✅ Track application status  
✅ Accept/decline admissions  
✅ Upload graduation documents  
✅ Find job opportunities  

### For Institutions
✅ Manage faculties  
✅ Create and manage courses  
✅ Set admission requirements  
✅ Review student applications  
✅ Publish admission decisions  
✅ Track student admissions  

### For Companies
✅ Post job openings  
✅ View qualified applicants  
✅ Schedule interviews  
✅ Track hiring progress  
✅ Auto-matching with students  

### For Administrators
✅ Manage all institutions  
✅ Manage all companies  
✅ Approve/suspend accounts  
✅ View system reports  
✅ Monitor applications  

## 🔐 User Roles & Access Control

| Role | Access |
|------|--------|
| **Student** | Profile, documents, applications, jobs |
| **Institute** | Faculties, courses, applications, admissions |
| **Company** | Jobs, applications, interviews |
| **Admin** | All resources, reports, user management |

## 📚 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register` - Create new account
- `POST /login` - User login
- `POST /verify-email` - Verify email
- `POST /check-verification` - Check verification status
- `POST /resend-verification` - Resend verification email

### Students (`/api/student`)
- `GET /profile` - Get profile
- `PUT /profile` - Update profile
- `POST /courses/apply` - Apply for course
- `GET /courses/eligible` - Get eligible courses
- `GET /applications` - View applications
- `GET /admissions` - View admissions

### Documents (`/api/upload`)
- `POST /student/documents` - Upload docs
- `POST /student/completion-documents` - Upload graduation docs
- `GET /student/matched-courses` - Get matched courses
- `GET /student/matched-jobs` - Get matched jobs

### Institution (`/api/institute`)
- `GET /faculties` - List faculties
- `POST /faculties` - Create faculty
- `GET /courses` - List courses
- `POST /courses` - Create course
- `GET /applications` - View applications
- `POST /admissions/publish` - Publish admissions

### Company (`/api/company`)
- `POST /jobs` - Post job
- `GET /jobs` - List jobs
- `GET /jobs/:id/qualified-applicants` - View applicants
- `PUT /applications/:id/status` - Update application

### Admin (`/api/admin`)
- `GET /institutions` - List all institutions
- `GET /companies` - List all companies
- `GET /companies/pending` - Pending company approvals
- `GET /reports/*` - System reports

## 🐛 Troubleshooting

### Common Issues & Quick Fixes

**Backend won't start:**
```bash
# Clear node_modules and reinstall
rm -r backend/node_modules
cd backend && npm install && npm start
```

**Firebase initialization error:**
- Check `.env` has all required variables
- Verify FIREBASE_PRIVATE_KEY is properly formatted
- Ensure FIREBASE_STORAGE_BUCKET is set

**Cannot login:**
- Verify email is verified in Firebase Console
- Check FRONTEND_URL matches your setup
- Check auth token in browser DevTools

**Student can't upload documents:**
- Ensure Firebase Storage bucket exists
- Check file size < 5MB
- Supported formats: PDF, JPEG, PNG only

**Institute routes 404:**
- Restart backend server
- Check server.js imports all routes
- Verify authentication middleware

**Detailed solutions**: See `TROUBLESHOOTING_GUIDE.md`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Register new account
- [ ] Verify email
- [ ] Login successfully
- [ ] Institute: Create faculty
- [ ] Institute: Create course
- [ ] Student: Upload documents
- [ ] Student: View eligible courses
- [ ] Student: Apply for course
- [ ] Institute: Review application
- [ ] Company: Post job
- [ ] Student: View matched jobs

### Automated Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📊 Database Schema

### Firestore Collections:
- **users** - User accounts and roles
- **students** - Student profiles
- **institutions** - Educational institutions
- **faculties** - University faculties
- **courses** - Course offerings
- **applications** - Student applications
- **admissions** - Admission decisions
- **companies** - Company profiles
- **jobs** - Job postings
- **notifications** - User notifications

See `TROUBLESHOOTING_GUIDE.md` for detailed schema

## 🔒 Security Features

✅ Email verification required  
✅ Role-based access control (RBAC)  
✅ Firebase Authentication  
✅ JWT token validation  
✅ Firestore security rules  
✅ File upload size limits  
✅ File type validation  

## 📝 Recent Fixes (November 12, 2025)

### Critical Issues Fixed:
1. ✅ **Missing Routes** - Added institute, company, admin routes to server
2. ✅ **Firebase Storage** - Added storage bucket config to .env
3. ✅ **Controller Bug** - Fixed duplicate function in institute controller
4. ✅ **Auth Flow** - Verified and documented authentication process

### Files Modified:
- `backend/server.js` - Added route imports
- `backend/.env` - Added FIREBASE_STORAGE_BUCKET
- `backend/src/config/firebase.js` - Exported storage
- `backend/src/controllers/institute.controller.js` - Fixed duplicate function

## 🚀 Next Steps

1. **Start servers** using provided scripts
2. **Create test account** - Register as student
3. **Verify email** - Check inbox for verification link
4. **Login** - Test authentication flow
5. **Explore features** - Try each role's functionality
6. **Review logs** - Monitor terminal output for errors

## 📞 Support

If you encounter issues:

1. Check **TROUBLESHOOTING_GUIDE.md**
2. Review **terminal logs** (backend & frontend)
3. Check **browser console** (F12 DevTools)
4. Verify **Firebase Console** - Firestore, Auth, Storage
5. Ensure all `.env` variables are set

## 📄 Documentation Files

- `TROUBLESHOOTING_GUIDE.md` - Comprehensive problem-solving guide
- `backend/README.md` - Backend setup details
- `frontend/README.md` - Frontend setup details
- Code comments - Detailed inline documentation

## 🎓 Learning Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security)

## 📊 Version Information

- **Project Version**: 1.0.0
- **Node.js**: v14+
- **React**: 18+
- **Firebase**: 12.0.0+
- **Last Updated**: November 12, 2025

## 📝 License

[Your License Here]

## 👥 Contributing

[Your Contributing Guidelines Here]

---

**Ready to start?** Run `start.bat` or `npm start` in backend/frontend directories!

For detailed troubleshooting, see **TROUBLESHOOTING_GUIDE.md**
