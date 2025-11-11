// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');
const { sendVerificationEmail } = require('../services/email.service');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, ...additionalData } = req.body;

    // Validate role
    const validRoles = ['admin', 'institute', 'student', 'company'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create Firebase user
    const { admin } = require('../config/firebase');
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false
    });

    // Generate email verification link with custom action URL
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?uid=${userRecord.uid}`,
      handleCodeInApp: true
    };
    
    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);

    // Save user data to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

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
    }

    // Send verification email
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      uid: userRecord.uid
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login (returns custom token or user info)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Check email verification in Firebase Auth (this is the source of truth)
    if (!userRecord.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    // Sync emailVerified status if it's different in Firestore
    if (!userData.emailVerified && userRecord.emailVerified) {
      await db.collection('users').doc(userRecord.uid).update({
        emailVerified: true,
        updatedAt: new Date()
      });
    }

    // For companies, check approval status
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

// NEW: Check and sync verification status
router.post('/check-verification', async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    // Get user from Firebase Auth
    const userRecord = await auth.getUser(uid);
    
    // Get user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // If Firebase Auth shows verified but Firestore doesn't, update Firestore
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
      message: userRecord.emailVerified ? 'Email is verified' : 'Email not verified yet',
      synced: userRecord.emailVerified === userData.emailVerified
    });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify email - This endpoint is called after user clicks verification link
router.post('/verify-email', async (req, res) => {
  try {
    const { oobCode } = req.body;

    if (!oobCode) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    console.log('🔄 Processing email verification...');

    // Step 1: Check and validate the action code
    const info = await auth.checkActionCode(oobCode);
    console.log('✅ Action code validated');
    
    const email = info.data.email;
    console.log(`📧 Verifying email for: ${email}`);

    // Step 2: Apply the action code (this actually verifies the email in Firebase Auth)
    await auth.applyActionCode(oobCode);
    console.log('✅ Action code applied - email verified in Firebase Auth');

    // Step 3: Get the user and confirm verification
    const { admin } = require('../config/firebase');
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Reload to get fresh data
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log(`✅ User emailVerified status: ${updatedUser.emailVerified}`);

    // Step 4: Update Firestore
    await db.collection('users').doc(userRecord.uid).update({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Firestore updated');

    res.json({ 
      message: 'Email verified successfully',
      emailVerified: true,
      uid: userRecord.uid,
      email: email
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
    
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);

    // Check if already verified
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

// ADMIN ENDPOINT: Manually sync all users from Firebase Auth to Firestore
router.post('/admin/sync-all-users', async (req, res) => {
  try {
    const { adminKey } = req.body;

    // Simple admin key check (you should use proper auth in production)
    if (adminKey !== process.env.ADMIN_SYNC_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let syncCount = 0;
    let errorCount = 0;
    const errors = [];

    // List all users from Firebase Auth
    const listUsersResult = await auth.listUsers();
    
    for (const userRecord of listUsersResult.users) {
      try {
        // Get Firestore document
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          // Sync if email verification status is different
          if (userRecord.emailVerified !== userData.emailVerified) {
            await db.collection('users').doc(userRecord.uid).update({
              emailVerified: userRecord.emailVerified,
              emailVerifiedAt: userRecord.emailVerified ? new Date() : null,
              updatedAt: new Date()
            });
            syncCount++;
            console.log(`Synced user: ${userRecord.email} - emailVerified: ${userRecord.emailVerified}`);
          }
        }
      } catch (error) {
        errorCount++;
        errors.push({
          uid: userRecord.uid,
          email: userRecord.email,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Sync completed',
      totalUsers: listUsersResult.users.length,
      syncedUsers: syncCount,
      errors: errorCount,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;