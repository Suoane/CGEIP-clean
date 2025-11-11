// backend/src/middleware/auth.js - UPDATE THIS FILE
const { admin, db } = require('../config/firebase');

// Verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from Firebase Auth (source of truth)
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Auto-sync email verification if different
    if (userRecord.emailVerified && !userData.emailVerified) {
      console.log(`Auto-syncing email verification for user ${decodedToken.uid}`);
      await db.collection('users').doc(decodedToken.uid).update({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      });
      userData.emailVerified = true;
    }

    // Check email verification (use Firebase Auth as source of truth)
    if (!userRecord.emailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        needsVerification: true 
      });
    }

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role,
      emailVerified: userRecord.emailVerified,
      ...userData
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

module.exports = { verifyToken, authorizeRoles };