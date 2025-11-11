// backend/src/routes/auth.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { auth, db, admin } = require('../config/firebase');
const { sendVerificationEmail } = require('../services/email.service');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, ...additionalData } = req.body;

    const validRoles = ['admin', 'institute', 'student', 'company'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    console.log(`📝 Registering new ${role}: ${email}`);

    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false
    });

    console.log(`✅ User created in Firebase Auth: ${userRecord.uid}`);

    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?uid=${userRecord.uid}`,
      handleCodeInApp: true
    };
    
    console.log('🔗 Generating verification link...');
    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    console.log('✅ Verification link generated');

    // Save user data to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ User saved to Firestore');

    // Save role-specific data
    if (role === 'student') {
      await db.collection('students').doc(userRecord.uid).set({
        personalInfo: {
          email,
          ...additionalData.personalInfo
        },
        academicInfo: additionalData.academicInfo || {},
        applicationCount: 0,
        studyStatus: 'applying',
        admittedInstitution: null,
        createdAt: new Date()
      });
      console.log('✅ Student profile created');
    } else if (role === 'company') {
      await db.collection('companies').doc(userRecord.uid).set({
        companyName: additionalData.companyName,
        industry: additionalData.industry,
        location: additionalData.location,
        description: additionalData.description || '',
        contactInfo: additionalData.contactInfo,
        status: 'pending',
        createdAt: new Date()
      });
      console.log('✅ Company profile created');
    } else if (role === 'institute') {
      await db.collection('institutions').doc(userRecord.uid).set({
        name: additionalData.name,
        email,
        location: additionalData.location,
        description: additionalData.description || '',
        contactInfo: additionalData.contactInfo,
        status: 'active',
        createdAt: new Date()
      });
      console.log('✅ Institution profile created');
    }

    console.log('📧 Sending verification email...');
    await sendVerificationEmail(email, verificationLink);
    console.log('✅ Verification email sent successfully');

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      uid: userRecord.uid,
      email: email,
      role: role
    });

    console.log(`✅ Registration completed for ${email}`);

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    if (!userRecord.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    // Sync emailVerified status in Firestore if different
    if (!userData.emailVerified && userRecord.emailVerified) {
      await db.collection('users').doc(userRecord.uid).update({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (userData.role === 'company') {
      const companyDoc = await db.collection('companies').doc(userRecord.uid).get();
      if (companyDoc.exists && companyDoc.data().status !== 'approved') {
        return res.status(403).json({ 
          error: 'Your company account is pending approval' 
        });
      }
    }

    res.json({
      message: 'Login successful',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: userData.role,
        emailVerified: userRecord.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// FIXED: Verify email endpoint - NOW UPDATES FIRESTORE
router.post('/verify-email', async (req, res) => {
  try {
    const { oobCode } = req.body;

    if (!oobCode) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    console.log('🔄 Processing email verification...');

    // Step 1: Check and validate the action code
    let info;
    try {
      info = await auth.checkActionCode(oobCode);
      console.log('✅ Action code validated');
    } catch (checkError) {
      console.error('❌ Error checking action code:', checkError);
      return res.status(400).json({ 
        error: 'Invalid or expired verification link',
        code: checkError.code 
      });
    }
    
    const email = info.data.email;
    console.log(`📧 Verifying email for: ${email}`);

    // Step 2: Apply the action code
    try {
      await auth.applyActionCode(oobCode);
      console.log('✅ Action code applied - email verified in Firebase Auth');
    } catch (applyError) {
      console.error('❌ Error applying action code:', applyError);
      return res.status(400).json({ 
        error: 'Failed to verify email',
        code: applyError.code 
      });
    }

    // Step 3: Get the user and force update emailVerified
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`📝 User found: ${userRecord.uid}`);
    } catch (getUserError) {
      console.error('❌ Error getting user:', getUserError);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Force update emailVerified in Firebase Auth
    try {
      await admin.auth().updateUser(userRecord.uid, {
        emailVerified: true
      });
      console.log('✅ Explicitly set emailVerified=true in Firebase Auth');
    } catch (updateError) {
      console.error('⚠️ Warning: Could not explicitly update emailVerified:', updateError);
    }
    
    // Verify the update
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log(`✅ Firebase Auth emailVerified status: ${updatedUser.emailVerified}`);

    // **CRITICAL FIX: Update Firestore users collection**
    try {
      await db.collection('users').doc(userRecord.uid).update({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Firestore users collection updated with emailVerified=true');
    } catch (firestoreError) {
      console.error('⚠️ Warning: Could not update Firestore users collection:', firestoreError);
    }

    // Final verification check
    const finalUser = await admin.auth().getUser(userRecord.uid);
    const finalFirestoreUser = await db.collection('users').doc(userRecord.uid).get();
    
    console.log(`🎯 FINAL Firebase Auth emailVerified: ${finalUser.emailVerified}`);
    console.log(`🎯 FINAL Firestore emailVerified: ${finalFirestoreUser.data()?.emailVerified}`);

    res.json({ 
      success: true,
      message: 'Email verified successfully',
      emailVerified: finalUser.emailVerified,
      firestoreVerified: finalFirestoreUser.data()?.emailVerified,
      uid: userRecord.uid,
      email: email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    
    let errorMessage = 'Failed to verify email';
    let statusCode = 400;

    if (error.code === 'auth/expired-action-code') {
      errorMessage = 'Verification link has expired. Please request a new one.';
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'Invalid or already used verification link.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This user account has been disabled.';
      statusCode = 403;
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User account not found.';
      statusCode = 404;
    } else {
      errorMessage = error.message || 'Unknown error occurred';
      statusCode = 500;
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check verification status endpoint
router.post('/check-verification', async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const userRecord = await auth.getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Sync if Firebase Auth shows verified but Firestore doesn't
    if (userRecord.emailVerified && !userData.emailVerified) {
      await db.collection('users').doc(uid).update({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      });

      return res.json({
        verified: true,
        message: 'Email verification status updated',
        synced: true
      });
    }

    res.json({
      verified: userRecord.emailVerified,
      firestoreVerified: userData.emailVerified,
      message: userRecord.emailVerified ? 'Email is verified' : 'Email not verified yet',
      synced: userRecord.emailVerified === userData.emailVerified
    });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userRecord = await auth.getUserByEmail(email);

    if (userRecord.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email`,
      handleCodeInApp: true
    };
    
    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    await sendVerificationEmail(email, verificationLink);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;