// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
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

  // Register is now handled directly in the Register component
  // This function is kept for backwards compatibility but not used
  const register = async (email, password, role, additionalData = {}) => {
    try {
      const registrationData = {
        email,
        password,
        role,
        ...additionalData
      };

      await api.post('/auth/register', registrationData);
      toast.success('Registration successful! Please check your email to verify your account.');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage);
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      // First, sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        toast.warning('Please verify your email before logging in.');
        await signOut(auth);
        return null;
      }

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

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
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
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};