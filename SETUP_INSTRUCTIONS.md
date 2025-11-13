# CGEIP - Setup Instructions for Firebase Rules

## 🔐 Setting Up Firestore Security Rules

Your login is failing because Firestore security rules are too restrictive. Follow these steps:

### Step 1: Deploy Firestore Rules

**Using Firebase CLI:**

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (from project root)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

**Or manually in Firebase Console:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **cgeip-7ba10**
3. Go to **Firestore Database** > **Rules** tab
4. Copy and paste the rules from `firestore.rules` file
5. Click **Publish**

### Step 2: Firestore Rules Explained

The rules file (`firestore.rules`) includes:

```
✅ Users - Can read/write their own user document
✅ Students - Can read/write their own profile
✅ Institutions - Can manage their data
✅ Companies - Can manage their data
✅ Faculties - Public read, restricted write
✅ Courses - Public read, restricted write
✅ Applications - Users can read their own applications
✅ Notifications - Users can read their notifications
```

---

## 🔑 Complete Setup Checklist

### Phase 1: Backend Setup
- [ ] Navigate to `backend/` directory
- [ ] Run `npm install`
- [ ] Verify `.env` file has all variables (check TROUBLESHOOTING_GUIDE.md)
- [ ] Run `npm start`
- [ ] Backend should start without errors

### Phase 2: Frontend Setup
- [ ] Navigate to `frontend/` directory
- [ ] Run `npm install`
- [ ] Verify `.env` file has correct `REACT_APP_API_URL=http://localhost:5000/api/`
- [ ] Run `npm start`
- [ ] Frontend should open on http://localhost:3000

### Phase 3: Firebase Configuration
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select project: **cgeip-7ba10**
- [ ] Go to **Firestore Database** > **Rules**
- [ ] Replace with rules from `firestore.rules`
- [ ] Click **Publish**

### Phase 4: Test Login Flow
1. Go to http://localhost:3000
2. Click **Register**
3. Fill in details (choose role: student/institute/company)
4. Submit registration
5. Check email for verification link
6. Click verification link
7. Go back to http://localhost:3000
8. Click **Login**
9. Enter email and password
10. Should login successfully! ✅

---

## 🚨 Common Login Errors & Solutions

### Error: "Login failed try again later"

**Cause**: Firestore security rules missing or incorrect

**Solution**:
1. Go to Firebase Console
2. Check Firestore > Rules
3. Copy rules from `firestore.rules`
4. Paste and publish
5. Try login again

### Error: "Missing or insufficient permissions"

**Cause**: Your user document doesn't exist or rules are wrong

**Solution**:
1. Check Firestore > Data
2. Verify `/users/{yourUID}` exists
3. Verify rules are published
4. Try logging out and logging back in

### Error: "Cannot GET /api/auth/check-verification"

**Cause**: API URL is wrong in frontend `.env`

**Solution**:
1. Check `frontend/.env`
2. Verify: `REACT_APP_API_URL=http://localhost:5000/api/`
3. Restart frontend: `npm start`

---

## 🔍 Troubleshooting Steps

### Step 1: Verify Backend is Running
```bash
curl http://localhost:5000/health
# Should return: {"status":"OK","message":"Server is running"}
```

### Step 2: Verify Frontend API URL
```
Open browser DevTools (F12)
Go to Network tab
Try to login
Look for request to: http://localhost:5000/api/auth/...
NOT :5000/auth/...
```

### Step 3: Check Firestore Rules
```
Firebase Console > Firestore > Rules
Should show your rules, not default "deny all"
```

### Step 4: Check User Document Exists
```
Firebase Console > Firestore > Data
Navigate to: users > {your-uid}
Should see: email, role, emailVerified, etc.
```

---

## 📋 Required Environment Variables

### Backend (backend/.env)
```properties
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

FIREBASE_PROJECT_ID=cgeip-7ba10
FIREBASE_PRIVATE_KEY=... (from Firebase)
FIREBASE_CLIENT_EMAIL=... (from Firebase)
FIREBASE_STORAGE_BUCKET=cgeip-7ba10.appspot.com

SENDGRID_API_KEY=... (optional)
SENDGRID_FROM_EMAIL=... (optional)

CLOUDINARY_CLOUD_NAME=... (optional)
CLOUDINARY_API_KEY=... (optional)
CLOUDINARY_API_SECRET=... (optional)
```

### Frontend (frontend/.env)
```properties
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=cgeip-7ba10.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=cgeip-7ba10
REACT_APP_FIREBASE_STORAGE_BUCKET=cgeip-7ba10.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=949931932599
REACT_APP_FIREBASE_APP_ID=1:949931932599:web:...
REACT_APP_API_URL=http://localhost:5000/api/
PORT=3000
```

---

## ✅ Verification Steps

Once everything is set up:

1. **Start Backend**
   ```bash
   cd backend
   npm start
   # Should show: ✅ Firebase initialized, 🚀 Server running on port 5000
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   # Should open http://localhost:3000
   ```

3. **Test Registration**
   - Click "Register"
   - Enter: email, password, role
   - Submit

4. **Verify Email**
   - Check email inbox
   - Click verification link
   - Should verify successfully

5. **Test Login**
   - Click "Login"
   - Enter email and password
   - Should login successfully! ✅

---

## 🎯 Next Actions

### Immediate (Do This Now)
1. ✅ Fix `frontend/.env` API URL → **DONE**
2. ✅ Fix `backend/package.json` → **DONE**
3. **Deploy Firestore Rules** → **DO THIS NEXT**
4. Restart both servers

### After Fixing Firestore Rules
1. Test login again
2. Create test account
3. Verify email
4. Login successfully
5. Test institute/student features

---

## 📞 Need Help?

1. Check terminal logs for specific errors
2. Open browser DevTools (F12) > Console tab
3. Check Firebase Console > Firestore > Rules
4. Verify all `.env` variables are set
5. Ensure both servers are running

---

## 🚀 Quick Commands

```bash
# Restart backend
cd backend && npm start

# Restart frontend
cd frontend && npm start

# Deploy Firebase rules (from root)
firebase deploy --only firestore:rules

# Check backend health
curl http://localhost:5000/health

# Clear frontend cache (hard refresh)
Ctrl+Shift+Del (Windows) or Cmd+Shift+Del (Mac)
```

---

**Status**: Setup Complete - Now Deploy Firestore Rules! 🚀
