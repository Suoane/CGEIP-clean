// frontend/src/context/AuthContext.js
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
      
      // If email is verified in Auth, sync with backend
      if (user.emailVerified) {
        await api.post('/auth/check-verification', { uid: user.uid });
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
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Reload user to get fresh emailVerified status
      await reload(user);

      // Check if email is verified
      if (!user.emailVerified) {
        toast.warning('Please verify your email before logging in. Check your inbox for the verification link.');
        await signOut(auth);
        return null;
      }

      // Sync verification status with backend
      await api.post('/auth/check-verification', { uid: user.uid });

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        toast.error('User data not found. Please contact support.');
        await signOut(auth);
        return null;
      }

      const userData = userDoc.data();
      
      // Check company approval status if user is a company
      if (userData.role === 'company') {
        const companyDoc = await getDoc(doc(db, 'companies', user.uid));
        if (companyDoc.exists() && companyDoc.data().status === 'pending') {
          toast.warning('Your company account is pending approval.');
          await signOut(auth);
          return null;
        } else if (companyDoc.exists() && companyDoc.data().status === 'suspended') {
          toast.error('Your company account has been suspended.');
          await signOut(auth);
          return null;
        }
      }

      setUserRole(userData.role);
      toast.success('Login successful!');
      return { user, role: userData.role };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
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
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out. Please try again.');
      throw error;
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Please check your inbox.');
      return true;
    } catch (error) {
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Reload user to get fresh emailVerified status
        await reload(user);
        
        if (user.emailVerified) {
          // Sync verification status with backend
          await checkEmailVerification(user);
          
          setCurrentUser(user);
          
          // Get user role
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setUserRole(userDoc.data().role);
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
          }
        } else {
          // User not verified, don't set as current user
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto-check verification every 30 seconds if user exists but not verified
  useEffect(() => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      const intervalId = setInterval(async () => {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          await checkEmailVerification(auth.currentUser);
          window.location.reload(); // Refresh to update UI
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(intervalId);
    }
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