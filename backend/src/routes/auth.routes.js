// backend/src/routes/auth.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const emailService = require('../services/email.service');
const crypto = require('crypto');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, additionalData } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and role are required' 
      });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      role,
      emailVerified: false,
      verificationToken,
      verificationExpiry,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create role-specific document
    if (role === 'student') {
      await db.collection('students').doc(userRecord.uid).set({
        id: userRecord.uid,
        personalInfo: additionalData?.personalInfo || {},
        academicInfo: additionalData?.academicInfo || {},
        documents: {},
        admittedInstitution: null,
        applicationCount: 0,
        studyStatus: 'applying',
        createdAt: new Date()
      });
    } else if (role === 'company') {
      await db.collection('companies').doc(userRecord.uid).set({
        id: userRecord.uid,
        companyName: additionalData?.companyName || '',
        status: 'pending',
        createdAt: new Date()
      });
    } else if (role === 'institute') {
      await db.collection('institutions').doc(userRecord.uid).set({
        id: userRecord.uid,
        name: additionalData?.institutionName || '',
        status: 'active',
        createdAt: new Date()
      });
    }

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&uid=${userRecord.uid}`;
    const userName = additionalData?.personalInfo?.firstName || 
                      additionalData?.companyName || 
                      additionalData?.institutionName || 
                      email.split('@')[0];
    
    await emailService.sendVerificationEmail(email, verificationLink, userName);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      uid: userRecord.uid
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// Login endpoint (ADD THIS IF IT'S MISSING)
router.post('/login', async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID is required'
      });
    }

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Check if email is verified
    if (!userData.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        emailVerified: false
      });
    }

    // Get role-specific data
    let roleData = null;
    if (userData.role === 'student') {
      const studentDoc = await db.collection('students').doc(uid).get();
      roleData = studentDoc.exists ? studentDoc.data() : null;
    } else if (userData.role === 'company') {
      const companyDoc = await db.collection('companies').doc(uid).get();
      roleData = companyDoc.exists ? companyDoc.data() : null;
    } else if (userData.role === 'institute') {
      const instituteDoc = await db.collection('institutions').doc(uid).get();
      roleData = instituteDoc.exists ? instituteDoc.data() : null;
    }

    res.status(200).json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        role: userData.role,
        emailVerified: userData.emailVerified,
        ...roleData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token, uid } = req.body;

    if (!token || !uid) {
      return res.status(400).json({
        success: false,
        message: 'Token and UID are required'
      });
    }

    // Get user document
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Check if already verified
    if (userData.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Check token validity
    if (userData.verificationToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check token expiry
    if (new Date() > userData.verificationExpiry.toDate()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }

    // Update user as verified
    await db.collection('users').doc(uid).update({
      emailVerified: true,
      verificationToken: null,
      verificationExpiry: null,
      updatedAt: new Date()
    });

    // Update Firebase Auth
    await auth.updateUser(uid, {
      emailVerified: true
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(
      userData.email, 
      userData.email.split('@')[0], 
      userData.role
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!'
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Email verification failed'
    });
  }
});

// Check verification status - GET endpoint (for frontend with auth token)
router.get('/check-verification', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    console.log('🔍 GET - Checking verification status for UID:', uid);

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // If email is NOT verified in Firestore, check Firebase Auth
    if (!userData.emailVerified) {
      try {
        const authUser = await auth.getUser(uid);
        
        // If verified in Auth but not in Firestore, sync it
        if (authUser.emailVerified) {
          console.log('✅ Syncing verification status from Firebase Auth to Firestore');
          
          await db.collection('users').doc(uid).update({
            emailVerified: true,
            updatedAt: new Date()
          });

          return res.status(200).json({
            success: true,
            emailVerified: true,
            synced: true,
            email: userData.email
          });
        }
      } catch (authError) {
        console.error('Error fetching Firebase Auth user:', authError);
      }
    }

    res.status(200).json({
      success: true,
      emailVerified: userData.emailVerified || false,
      email: userData.email
    });

  } catch (error) {
    console.error('❌ GET Check verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check verification status'
    });
  }
});

// Check verification status - POST endpoint (for internal use)
router.post('/check-verification', async (req, res) => {
  try {
    const { uid } = req.body;

    console.log('🔍 POST - Checking verification status for UID:', uid);

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID is required'
      });
    }

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // If email is NOT verified in Firestore, check Firebase Auth
    if (!userData.emailVerified) {
      try {
        const authUser = await auth.getUser(uid);
        
        // If verified in Auth but not in Firestore, sync it
        if (authUser.emailVerified) {
          console.log('✅ Syncing verification status from Firebase Auth to Firestore');
          
          await db.collection('users').doc(uid).update({
            emailVerified: true,
            updatedAt: new Date()
          });

          return res.status(200).json({
            success: true,
            verified: true,
            synced: true,
            message: 'Verification status synced successfully'
          });
        }
      } catch (authError) {
        console.error('Error fetching Firebase Auth user:', authError);
      }
    }

    // Return current verification status
    res.status(200).json({
      success: true,
      verified: userData.emailVerified || false,
      synced: false,
      message: userData.emailVerified ? 'Email is verified' : 'Email is not verified'
    });

  } catch (error) {
    console.error('❌ POST Check verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check verification status'
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    if (userData.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.collection('users').doc(userRecord.uid).update({
      verificationToken,
      verificationExpiry,
      updatedAt: new Date()
    });

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&uid=${userRecord.uid}`;
    await emailService.sendVerificationEmail(email, verificationLink, email.split('@')[0]);

    res.status(200).json({
      success: true,
      message: 'Verification email sent!'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resend verification email'
    });
  }
});

module.exports = router;