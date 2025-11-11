// frontend/src/context/AuthContext.js - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  reload
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { toast } from 'react-toastify';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check and sync email verification status
  const checkEmailVerification = async (user) => {
    try {
      // Reload user to get latest emailVerified status from Firebase Auth
      await reload(user);
      
      console.log(`📧 Email verification status for ${user.email}: ${user.emailVerified}`);
      
      // If email is verified in Auth, sync with backend
      if (user.emailVerified) {
        try {
          const syncResponse = await api.post('/auth/check-verification', { uid: user.uid });
          console.log('✅ Verification sync response:', syncResponse.data);
          
          if (syncResponse.data.synced) {
            console.log('✅ Firestore emailVerified successfully synced');
          }
        } catch (syncError) {
          console.error('⚠️ Could not sync verification status:', syncError);
          // Continue anyway since Firebase Auth is the source of truth
        }
      }
      
      return user.emailVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return user.emailVerified;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      console.log(`🔐 Attempting login for: ${email}`);
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log(`✅ Firebase authentication successful for: ${email}`);

      // Reload user to get fresh emailVerified status
      await reload(user);
      console.log(`📧 Email verified status: ${user.emailVerified}`);

      // Check if email is verified
      if (!user.emailVerified) {
        console.warn('⚠️ Email not verified');
        toast.warning('Please verify your email before logging in. Check your inbox for the verification link.');
        await signOut(auth);
        return null;
      }

      // Sync verification status with backend and Firestore
      try {
        await api.post('/auth/check-verification', { uid: user.uid });
        console.log('✅ Verification status synced with backend');
      } catch (syncError) {
        console.error('⚠️ Could not sync verification status:', syncError);
        // Continue anyway since Firebase Auth verification is confirmed
      }

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.error('❌ User document not found in Firestore');
        toast.error('User data not found. Please contact support.');
        await signOut(auth);
        return null;
      }

      const userData = userDoc.data();
      console.log(`✅ User role: ${userData.role}`);
      
      // Check company approval status if user is a company
      if (userData.role === 'company') {
        const companyDoc = await getDoc(doc(db, 'companies', user.uid));
        if (companyDoc.exists()) {
          const companyStatus = companyDoc.data().status;
          console.log(`🏢 Company status: ${companyStatus}`);
          
          if (companyStatus === 'pending') {
            toast.warning('Your company account is pending approval.');
            await signOut(auth);
            return null;
          } else if (companyStatus === 'suspended') {
            toast.error('Your company account has been suspended.');
            await signOut(auth);
            return null;
          }
        }
      }

      setUserRole(userData.role);
      toast.success('Login successful!');
      console.log(`✅ Login completed successfully for ${email}`);
      
      return { user, role: userData.role };
    } catch (error) {
      console.error('❌ Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      toast.success('Logged out successfully!');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Error logging out. Please try again.');
      throw error;
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    try {
      console.log(`📧 Resending verification email to: ${email}`);
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Please check your inbox.');
      console.log('✅ Verification email sent');
      return true;
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send verification email';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Check verification status
  const checkVerificationStatus = async (uid) => {
    try {
      const response = await api.post('/auth/check-verification', { uid });
      return response.data;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(`👤 Auth state changed - User detected: ${user.email}`);
        
        // Reload user to get fresh emailVerified status
        await reload(user);
        console.log(`📧 Current emailVerified status: ${user.emailVerified}`);
        
        if (user.emailVerified) {
          // Sync verification status with backend
          await checkEmailVerification(user);
          
          setCurrentUser(user);
          
          // Get user role
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role;
              setUserRole(role);
              console.log(`✅ User role set: ${role}`);
            } else {
              console.warn('⚠️ User document not found in Firestore');
            }
          } catch (error) {
            console.error('❌ Error fetching user role:', error);
          }
        } else {
          // User not verified, don't set as current user
          console.log('⚠️ Email not verified - user not authenticated');
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        console.log('👤 Auth state changed - No user detected');
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    loading,
    resendVerification,
    checkVerificationStatus,
    checkEmailVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};