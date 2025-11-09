// frontend/src/components/student/ViewAdmissions.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import './Student.css';

const ViewAdmissions = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchStudentData();
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('studentId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      
      const applicationsData = await Promise.all(
        snapshot.docs.map(async (appDoc) => {
          const appData = { id: appDoc.id, ...appDoc.data() };
          
          // Get course details
          const courseDoc = await getDoc(doc(db, 'courses', appData.courseId));
          appData.course = courseDoc.exists() ? courseDoc.data() : null;
          
          // Get institution details
          const institutionDoc = await getDoc(doc(db, 'institutions', appData.institutionId));
          appData.institution = institutionDoc.exists() ? institutionDoc.data() : null;
          
          return appData;
        })
      );

      setApplications(applicationsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
      setLoading(false);
    }
  };

  const handleSelectInstitution = async (applicationId, institutionId, institutionName) => {
    if (!window.confirm(`Are you sure you want to select ${institutionName}? This action cannot be undone.`)) {
      return;
    }

    setSelecting(true);

    try {
      // Update student with selected institution
      await updateDoc(doc(db, 'students', currentUser.uid), {
        admittedInstitution: institutionId,
        studyStatus: 'studying',
        studyStartDate: new Date()
      });

      // Reject other admissions
      const otherAdmissions = applications.filter(
        app => app.status === 'admitted' && app.id !== applicationId
      );

      for (const app of otherAdmissions) {
        await updateDoc(doc(db, 'applications', app.id), {
          status: 'rejected',
          rejectionReason: 'Student selected another institution'
        });
      }

      toast.success(`You have successfully enrolled at ${institutionName}!`);
      fetchApplications();
      fetchStudentData();
    } catch (error) {
      console.error('Error selecting institution:', error);
      toast.error('Failed to select institution');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  const admittedApplications = applications.filter(app => app.status === 'admitted');
  const waitlistedApplications = applications.filter(app => app.status === 'waitlisted');
  const pendingApplications = applications.filter(app => app.status === 'pending');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

  return (
    <div className="view-admissions-container">
      <div className="page-header">
        <h1>My Applications & Admissions</h1>
        <p>Track your application status and admission results</p>
      </div>

      {studentData?.admittedInstitution && (
        <div className="selected-institution-banner">
          <h2>✓ Currently Enrolled</h2>
          <p>You are currently studying at: <strong>{studentData.admittedInstitution}</strong></p>
        </div>
      )}

      {admittedApplications.length > 0 && !studentData?.admittedInstitution && (
        <div className="admissions-section">
          <h2 className="section-title">🎉 Congratulations! You've Been Admitted</h2>
          <p className="section-subtitle">Select an institution to begin your studies:</p>
          
          <div className="applications-grid">
            {admittedApplications.map(application => (
              <div key={application.id} className="application-card admitted">
                <div className="card-header">
                  <div className="status-badge admitted">Admitted</div>
                </div>

                <div className="card-body">
                  <h3>{application.institution?.name}</h3>
                  <p className="course-name">{application.course?.courseName}</p>
                  <p className="course-code">{application.course?.courseCode}</p>
                  
                  <div className="details">
                    <p><strong>Location:</strong> {application.institution?.location}</p>
                    <p><strong>Duration:</strong> {application.course?.duration}</p>
                    <p><strong>Level:</strong> {application.course?.level}</p>
                  </div>

                  <div className="dates">
                    <p>Applied: {new Date(application.appliedAt?.toDate()).toLocaleDateString()}</p>
                    {application.decidedAt && (
                      <p>Admitted: {new Date(application.decidedAt?.toDate()).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    onClick={() => handleSelectInstitution(
                      application.id,
                      application.institutionId,
                      application.institution?.name
                    )}
                    className="btn-select"
                    disabled={selecting}
                  >
                    {selecting ? 'Processing...' : 'Select This Institution'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingApplications.length > 0 && (
        <div className="admissions-section">
          <h2 className="section-title">⏳ Pending Applications</h2>
          <div className="applications-grid">
            {pendingApplications.map(application => (
              <div key={application.id} className="application-card pending">
                <div className="card-header">
                  <div className="status-badge pending">Pending Review</div>
                </div>

                <div className="card-body">
                  <h3>{application.institution?.name}</h3>
                  <p className="course-name">{application.course?.courseName}</p>
                  <p className="course-code">{application.course?.courseCode}</p>
                  
                  <div className="dates">
                    <p>Applied: {new Date(application.appliedAt?.toDate()).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {waitlistedApplications.length > 0 && (
        <div className="admissions-section">
          <h2 className="section-title">📋 Waitlisted Applications</h2>
          <div className="applications-grid">
            {waitlistedApplications.map(application => (
              <div key={application.id} className="application-card waitlisted">
                <div className="card-header">
                  <div className="status-badge waitlisted">Waitlisted</div>
                </div>

                <div className="card-body">
                  <h3>{application.institution?.name}</h3>
                  <p className="course-name">{application.course?.courseName}</p>
                  <p className="course-code">{application.course?.courseCode}</p>
                  
                  <div className="dates">
                    <p>Applied: {new Date(application.appliedAt?.toDate()).toLocaleDateString()}</p>
                    {application.decidedAt && (
                      <p>Waitlisted: {new Date(application.decidedAt?.toDate()).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectedApplications.length > 0 && (
        <div className="admissions-section">
          <h2 className="section-title">❌ Rejected Applications</h2>
          <div className="applications-grid">
            {rejectedApplications.map(application => (
              <div key={application.id} className="application-card rejected">
                <div className="card-header">
                  <div className="status-badge rejected">Not Admitted</div>
                </div>

                <div className="card-body">
                  <h3>{application.institution?.name}</h3>
                  <p className="course-name">{application.course?.courseName}</p>
                  <p className="course-code">{application.course?.courseCode}</p>
                  
                  <div className="dates">
                    <p>Applied: {new Date(application.appliedAt?.toDate()).toLocaleDateString()}</p>
                    {application.decidedAt && (
                      <p>Decided: {new Date(application.decidedAt?.toDate()).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {applications.length === 0 && (
        <div className="no-applications">
          <p>You haven't submitted any applications yet.</p>
          <button onClick={() => window.location.href = '/student/apply-course'} className="btn-primary">
            Apply for a Course
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewAdmissions;