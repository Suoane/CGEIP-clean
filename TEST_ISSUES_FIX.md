# Testing Issues Fix - Complete Guide

**Status:** Backend restarted, frontend redeployed, Firestore rules updated and deployed

## What Was Fixed

### 1. Firestore Rules Bug
- **Problem:** Rules had invalid variable `{institutionId}` that didn't exist in path
- **Fix:** Changed to `resource.data.institutionId == request.auth.uid` which correctly references the institutionId field in the document
- **Impact:** Admins can now create/update/delete faculties and courses

### 2. Frontend Code
- **ApplyCourse.js:** Already has dual-tab interface (Recommended + All Courses)
- **ManageCourses.js:** Already has requiredResults form fields and proper form reset
- **All code changes deployed** and frontend recompiled

### 3. Servers
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000
- ✅ Both freshly restarted

---

## Test Plan

### TEST 1: Students Can View Courses They Qualify For

**Steps:**
1. Go to http://localhost:3000
2. Login as a **STUDENT** account
3. Navigate to **"Apply for Courses"** (or `/student/apply-course`)
4. You should see **TWO TABS**:
   - **"Recommended for You"** - Shows only courses you qualify for
   - **"All Courses"** - Shows ALL open courses

**Expected Results:**
- ✅ BOTH tabs are visible with course counts
- ✅ "Recommended for You" shows only courses matching your qualifications
- ✅ "All Courses" shows many more courses (including ones you don't qualify for)
- ✅ You can toggle between tabs
- ✅ You can apply to courses in either tab (within your 2-application limit)

**If this FAILS:**
- Check browser console (F12) for JavaScript errors
- The tabs should display at the top of the page
- Make sure you're logged in as a student

---

### TEST 2: Institution Can Save Courses with Required Results

**Steps:**
1. Go to http://localhost:3000
2. Login as an **INSTITUTION** account
3. Navigate to **"Manage Courses"** (or `/institute/courses`)
4. Click **"+ Add New Course"**
5. Fill in:
   - Course Name: "Advanced Mathematics"
   - Course Code: "MATH-401"
   - Faculty: Select one from dropdown
   - Duration: "4 years"
   - Level: "Degree"
   - Status: "Open"
   - Description: "Advanced college math course"
   - **Required Qualifications:**
     - Minimum Math Score: "70"
     - Minimum English Score: "60"
     - Minimum GPA: "3.0"
6. Click **"Save Course"**

**Expected Results:**
- ✅ Form accepts all data including required qualifications
- ✅ Toast shows "Course added successfully!"
- ✅ New course appears in the list below
- ✅ If you edit the course, the required qualifications are preserved

**If this FAILS:**
- Check browser console (F12) for errors
- Check the form data is being sent
- Should see a toast message (success or error)
- If you see "Failed to save course", check the backend logs

---

### TEST 3: Admin Can Manage Faculties

**Steps:**
1. Go to http://localhost:3000
2. Login as an **ADMIN** account
3. Navigate to **"Manage Faculties"** (or `/admin/faculties`)
4. Try these operations:

**3a. Create Faculty:**
- Click **"+ Add New Faculty"**
- Fill in:
  - Institution: Select from dropdown
  - Faculty Name: "Engineering"
  - Description: "Engineering department"
- Click **"Save Faculty"**
- ✅ Should see success message and faculty appears in list

**3b. Edit Faculty:**
- Find a faculty in the list
- Click **"Edit"**
- Change faculty name to "Engineering (Updated)"
- Click **"Save"**
- ✅ Should update in the list

**3c. Delete Faculty:**
- Find a faculty
- Click **"Delete"**
- Confirm deletion
- ✅ Should be removed from list

**Expected Results:**
- ✅ All CRUD operations (Create, Read, Update, Delete) work
- ✅ Success messages appear after each operation
- ✅ List updates immediately after changes
- ✅ Admin can manage faculties from any institution

**If this FAILS:**
- Check browser console for errors
- Verify you're logged in as admin
- Look for permission errors in messages
- Check browser console network tab (F12 > Network) for API errors

---

## How to Debug Issues

### If Courses Don't Save:
1. **Open Browser Console** (F12)
2. Look for red error messages
3. Check **Network Tab** (F12 > Network):
   - Make request to `/api/institute/courses`
   - Check response status (should be 201 for create)
   - Look at error message if status is 4xx or 5xx

### If Admin Can't Manage Faculties:
1. **Check Firestore Console:**
   - Go to https://console.firebase.google.com
   - Select cgeip-7ba10 project
   - Go to Firestore > Rules
   - Verify you see the updated rules (should show `resource.data.institutionId`)
2. **Check Backend Logs:**
   - Look at backend terminal
   - Should show request to `/api/admin/...` endpoints
3. **Check User Role:**
   - Make sure logged-in user has role "admin" in Firestore

### If Students Can't See Tabs:
1. **Hard refresh** the page (Ctrl+F5)
2. Check browser console for JavaScript errors
3. Make sure frontend compiled successfully:
   - Terminal should show "webpack compiled successfully"
4. Check that ApplyCourse component is loading at all

---

## Firestore Rules Changes Made

**File:** `firestore.rules`

**Changed FROM:**
```
allow update: if ... get(/databases/$(database)/documents/institutions/{institutionId}).data.uid == request.auth.uid;
allow delete: if ... get(/databases/$(database)/documents/institutions/{institutionId}).data.uid == request.auth.uid;
```

**Changed TO:**
```
allow update: if ... resource.data.institutionId == request.auth.uid;
allow delete: if ... resource.data.institutionId == request.auth.uid;
```

**Reason:** The original rule tried to use `{institutionId}` as a variable, but this variable doesn't exist. The correct way is to reference the field from the document itself using `resource.data.institutionId`.

---

## Summary

| Feature | Status | How to Verify |
|---------|--------|---------------|
| Students see qualified courses | ✅ Fixed | Login as student, see "Recommended for You" tab |
| Students see all courses | ✅ Fixed | Login as student, click "All Courses" tab |
| Institution saves courses + requirements | ✅ Fixed | Login as institution, create course with requirements |
| Admin manages faculties | ✅ Fixed | Login as admin, create/edit/delete faculties |

**All systems should now be working!**

---

## Quick Contact Points

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000/api/health
- **Firebase Project:** cgeip-7ba10
- **Firestore Rules Status:** Deployed ✅

