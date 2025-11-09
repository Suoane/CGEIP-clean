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
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false
    });

    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(email);

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

    // Check email verification
    if (!userData.emailVerified && !userRecord.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in' 
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

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { uid } = req.body;

    // Update Firebase Auth
    await auth.updateUser(uid, { emailVerified: true });

    // Update Firestore
    await db.collection('users').doc(uid).update({
      emailVerified: true,
      updatedAt: new Date()
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const verificationLink = await auth.generateEmailVerificationLink(email);
    await sendVerificationEmail(email, verificationLink);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;