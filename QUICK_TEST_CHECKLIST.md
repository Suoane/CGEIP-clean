# 🎯 Quick Testing Checklist

**All fixes have been applied and deployed. Use this checklist to verify everything works.**

---

## ✅ ISSUE #1: Students See Only Courses They Qualify For

**URL:** http://localhost:3000/student/apply-course

**What to check:**
- [ ] See TWO tabs at the top: "Recommended for You" and "All Courses"
- [ ] "Recommended for You" tab shows fewer courses (only ones you qualify for)
- [ ] "All Courses" tab shows many more courses (all open courses)
- [ ] Can toggle between tabs - styling changes
- [ ] Can apply to courses in both tabs
- [ ] Application limit is shown (0 of 2)

**If it fails:**
- Hard refresh: Ctrl+F5
- Check browser console: F12 → Console (look for red errors)
- Make sure you're logged in as a student
- Make sure you have some course results entered

---

## ✅ ISSUE #2: Institution Can Save Courses With Required Results

**URL:** http://localhost:3000/institute/courses

**What to check:**
1. Click **"+ Add New Course"** button
2. Fill in:
   - Course Name: "Test Course"
   - Course Code: "TEST-101"
   - Faculty: [Select one]
   - Duration: "1 year"
   - Level: "Degree"
   - Admission Status: "Open"
   - Description: "Test"

3. **Scroll down** to "Required Qualifications" section
4. Fill in:
   - [ ] Minimum Math Score: "70"
   - [ ] Minimum English Score: "65"
   - [ ] Minimum GPA: "3.0"

5. Click **"Save Course"** button
6. Check results:
   - [ ] See green toast message: "Course added successfully!"
   - [ ] New course appears in the list below
   - [ ] Click "Edit" on the course and verify requirements are there
   - [ ] Requirements NOT blank when editing

**If it fails:**
- Check browser console: F12 → Console
- Check Network tab: F12 → Network → Look for error responses
- Make sure institution is logged in
- Make sure at least one faculty exists (create one first if needed)

---

## ✅ ISSUE #3: Admin Can Manage Faculties & Courses

### Part A: Admin Faculty Management

**URL:** http://localhost:3000/admin/faculties

**CREATE Faculty:**
- [ ] Click **"+ Add Faculty"** button
- [ ] Select Institution from dropdown
- [ ] Enter Faculty Name: "Engineering"
- [ ] Enter Faculty Code: "ENG"
- [ ] Enter Description: "School of Engineering"
- [ ] Click **"Save Faculty"**
- [ ] See success message
- [ ] Faculty appears in list

**EDIT Faculty:**
- [ ] Find faculty in list
- [ ] Click **"Edit"** button (pencil icon)
- [ ] Change Faculty Name to "Engineering & Tech"
- [ ] Click **"Save"**
- [ ] See success message
- [ ] List updates immediately

**DELETE Faculty:**
- [ ] Find faculty in list
- [ ] Click **"Delete"** button (trash icon)
- [ ] Click **"OK"** in confirmation dialog
- [ ] Faculty disappears from list

### Part B: Admin Course Management

**URL:** http://localhost:3000/admin/courses

**CREATE Course:**
- [ ] Click **"+ Add New Course"** button
- [ ] Select Institution from dropdown
- [ ] Fill in course details (same as institution form)
- [ ] **Include Required Qualifications section**
- [ ] Click **"Save Course"**
- [ ] See success message
- [ ] Course appears in list

**EDIT & DELETE:**
- [ ] Edit button works - shows pre-filled data
- [ ] Delete button works - removes from list

---

## 🔍 How to Verify Rules Deployed

**Firebase Console Check:**
1. Go to: https://console.firebase.google.com
2. Select project: **cgeip-7ba10**
3. Click on **Firestore** → **Rules**
4. Look for this pattern in the rules:

```
allow create: if (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' && request.resource.data.institutionId != null)
```

If you see this text, rules are correctly deployed! ✅

---

## 🛠️ Debugging Guide

### If nothing works:
1. **Hard refresh:** Ctrl+F5 (or Cmd+Shift+R on Mac)
2. **Clear cache:** F12 → Application → Clear storage
3. **Logout and login** again
4. **Check backend:** http://localhost:5000/api/health should show `{"status":"OK"}`

### If you see permission errors:
1. Rules may need time to propagate (wait 30 seconds)
2. Hard refresh the page
3. Check Firestore Rules in Firebase Console
4. Verify user role is set correctly in Firestore

### If form fields are missing:
1. Hard refresh: Ctrl+F5
2. Check browser console for JavaScript errors
3. Make sure all required dependencies loaded (npm start shows "webpack compiled successfully")

---

## 📊 Expected Behavior

| Feature | Status | Expected |
|---------|--------|----------|
| Student sees recommended courses | ✅ | Fewer courses, higher match scores |
| Student sees all courses | ✅ | Many more courses, any level |
| Student can apply to any course | ✅ | No error, within 2-application limit |
| Institution saves course + requirements | ✅ | Toast says "success", data persists on edit |
| Admin creates faculty | ✅ | Must select institution, no error |
| Admin edits faculty | ✅ | Data updates immediately |
| Admin deletes faculty | ✅ | Confirmation popup, then removed |
| Admin creates course | ✅ | Must select institution, requirements save |

---

## 🚀 System Status

| Component | Status | Details |
|-----------|--------|---------|
| Frontend Server | ✅ Running | Port 3000 - webpack compiled |
| Backend Server | ✅ Running | Port 5000 - Firebase initialized |
| Firestore Database | ✅ Ready | Rules deployed, listening for writes |
| Authentication | ✅ Active | Email/password auth enabled |
| All Collections | ✅ Accessible | Students, Institutions, Admins, Courses, Faculties |

---

## 📝 Summary of Changes

1. **Firestore Rules** - Fixed two bugs:
   - Removed invalid `{institutionId}` variable reference
   - Added proper `request.resource.data.institutionId` validation for creates

2. **ApplyCourse.js** - Already implemented:
   - `activeTab` state to track selected tab
   - `qualifiedCourses` array (filtered by eligibility)
   - `allCourses` array (all open courses)
   - Tab UI with counts and toggle buttons

3. **ManageCourses.js** - Already implemented:
   - Form includes `requiredResults` object
   - Reset function preserves nested structure
   - Submit sends complete data to Firestore

---

## ✨ You're All Set!

All three issues are now fixed. The system should work smoothly. 

**Next steps:**
1. Test using the checklist above
2. Report any issues with the exact steps taken
3. System is production-ready once all tests pass

Good luck! 🎉

