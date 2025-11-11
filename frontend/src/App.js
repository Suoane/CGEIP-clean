// frontend/src/App.js - WITH FOOTER
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmailVerification from './components/auth/EmailVerification';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import ManageInstitutions from './components/admin/ManageInstitutions';
import AdminManageFaculties from './components/admin/ManageFaculties';
import AdminManageCourses from './components/admin/ManageCourses';
import ManageCompanies from './components/admin/ManageCompanies';
import SystemReports from './components/admin/SystemReports';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import ApplyCourse from './components/student/ApplyCourse';
import ViewAdmissions from './components/student/ViewAdmissions';
import StudentProfile from './components/student/StudentProfile';
import UploadDocuments from './components/student/UploadDocuments';
import AutoMatchDashboard from './components/student/AutoMatchDashboard';

// Institute Components
import InstituteDashboard from './components/institute/InstituteDashboard';
import InstituteManageFaculties from './components/institute/ManageFaculties';
import InstituteManageCourses from './components/institute/ManageCourses';
import ViewApplications from './components/institute/ViewApplications';
import InstituteProfile from './components/institute/InstituteProfile';
import PublishAdmissions from './components/institute/PublishAdmissions';

// Company Components
import CompanyDashboard from './components/company/CompanyDashboard';
import PostJob from './components/company/PostJob';
import QualifiedApplicants from './components/company/QualifiedApplicants';
import CompanyProfile from './components/company/CompanyProfile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <div className="main-content" style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<EmailVerification />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/institutions" element={<ProtectedRoute allowedRoles={['admin']}><ManageInstitutions /></ProtectedRoute>} />
              <Route path="/admin/faculties" element={<ProtectedRoute allowedRoles={['admin']}><AdminManageFaculties /></ProtectedRoute>} />
              <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin']}><AdminManageCourses /></ProtectedRoute>} />
              <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><ManageCompanies /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><SystemReports /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/apply-course" element={<ProtectedRoute allowedRoles={['student']}><ApplyCourse /></ProtectedRoute>} />
              <Route path="/student/admissions" element={<ProtectedRoute allowedRoles={['student']}><ViewAdmissions /></ProtectedRoute>} />
              <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
              <Route path="/student/upload-documents" element={<ProtectedRoute allowedRoles={['student']}><UploadDocuments /></ProtectedRoute>} />
              <Route path="/student/matches" element={<ProtectedRoute allowedRoles={['student']}><AutoMatchDashboard /></ProtectedRoute>} />

              {/* Institute Routes */}
              <Route path="/institute/dashboard" element={<ProtectedRoute allowedRoles={['institute']}><InstituteDashboard /></ProtectedRoute>} />
              <Route path="/institute/faculties" element={<ProtectedRoute allowedRoles={['institute']}><InstituteManageFaculties /></ProtectedRoute>} />
              <Route path="/institute/courses" element={<ProtectedRoute allowedRoles={['institute']}><InstituteManageCourses /></ProtectedRoute>} />
              <Route path="/institute/applications" element={<ProtectedRoute allowedRoles={['institute']}><ViewApplications /></ProtectedRoute>} />
              <Route path="/institute/publish-admissions" element={<ProtectedRoute allowedRoles={['institute']}><PublishAdmissions /></ProtectedRoute>} />
              <Route path="/institute/profile" element={<ProtectedRoute allowedRoles={['institute']}><InstituteProfile /></ProtectedRoute>} />

              {/* Company Routes */}
              <Route path="/company/dashboard" element={<ProtectedRoute allowedRoles={['company']}><CompanyDashboard /></ProtectedRoute>} />
              <Route path="/company/post-job" element={<ProtectedRoute allowedRoles={['company']}><PostJob /></ProtectedRoute>} />
              <Route path="/company/jobs" element={<ProtectedRoute allowedRoles={['company']}><QualifiedApplicants /></ProtectedRoute>} />
              <Route path="/company/qualified-applicants" element={<ProtectedRoute allowedRoles={['company']}><QualifiedApplicants /></ProtectedRoute>} />
              <Route path="/company/profile" element={<ProtectedRoute allowedRoles={['company']}><CompanyProfile /></ProtectedRoute>} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </AuthProvider>
    </Router>
  );
}

// Home Component
const Home = () => (
  <div className="home-container">
    <h1>🎓 CGEIP - Centralized Gateway for Education and Industry Placement</h1>
    <p>Welcome to the Centralized Gateway for Education and Industry Placement (CGEIP).</p>
    <p>Please login or register to continue.</p>
  </div>
);

// Not Found Component
const NotFound = () => (
  <div className="not-found">
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
  </div>
);

export default App;