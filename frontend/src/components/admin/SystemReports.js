// frontend/src/components/admin/SystemReports.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaUsers, FaUniversity, FaBriefcase, FaFileAlt, FaGraduationCap, FaChartLine } from 'react-icons/fa';
import './Admin.css';

const SystemReports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    institutions: 0,
    companies: 0,
    totalApplications: 0,
    pendingApplications: 0,
    admittedApplications: 0,
    rejectedApplications: 0,
    totalCourses: 0,
    openCourses: 0,
    totalJobs: 0,
    activeJobs: 0,
    pendingCompanies: 0,
    approvedCompanies: 0,
    studyingStudents: 0,
    completedStudents: 0
  });

  const [userGrowth, setUserGrowth] = useState([]);
  const [applicationsByInstitution, setApplicationsByInstitution] = useState([]);
  const [topInstitutions, setTopInstitutions] = useState([]);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      // Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => doc.data());
      const studentsCount = users.filter(u => u.role === 'student').length;

      // Fetch Institutions
      const institutionsSnap = await getDocs(collection(db, 'institutions'));

      // Fetch Companies
      const companiesSnap = await getDocs(collection(db, 'companies'));
      const companies = companiesSnap.docs.map(doc => doc.data());
      const pendingCompanies = companies.filter(c => c.status === 'pending').length;
      const approvedCompanies = companies.filter(c => c.status === 'approved').length;

      // Fetch Applications
      const applicationsSnap = await getDocs(collection(db, 'applications'));
      const applications = applicationsSnap.docs.map(doc => doc.data());
      const pendingApplications = applications.filter(a => a.status === 'pending').length;
      const admittedApplications = applications.filter(a => a.status === 'admitted').length;
      const rejectedApplications = applications.filter(a => a.status === 'rejected').length;

      // Fetch Courses
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const courses = coursesSnap.docs.map(doc => doc.data());
      const openCourses = courses.filter(c => c.admissionStatus === 'open').length;

      // Fetch Jobs
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const jobs = jobsSnap.docs.map(doc => doc.data());
      const activeJobs = jobs.filter(j => j.status === 'active').length;

      // Fetch Students
      const studentsSnap = await getDocs(collection(db, 'students'));
      const students = studentsSnap.docs.map(doc => doc.data());
      const studyingStudents = students.filter(s => s.studyStatus === 'studying').length;
      const completedStudents = students.filter(s => s.studyStatus === 'completed').length;

      // Calculate applications by institution
      const appsByInst = {};
      applications.forEach(app => {
        if (app.institutionId) {
          appsByInst[app.institutionId] = (appsByInst[app.institutionId] || 0) + 1;
        }
      });

      // Get institution names and create array
      const institutionsData = institutionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const appsByInstArray = Object.entries(appsByInst).map(([instId, count]) => {
        const inst = institutionsData.find(i => i.id === instId);
        return {
          institutionName: inst ? inst.name : 'Unknown',
          applicationCount: count
        };
      }).sort((a, b) => b.applicationCount - a.applicationCount);

      setApplicationsByInstitution(appsByInstArray);
      setTopInstitutions(appsByInstArray.slice(0, 5));

      setStats({
        totalUsers: usersSnap.size,
        students: studentsCount,
        institutions: institutionsSnap.size,
        companies: companiesSnap.size,
        totalApplications: applicationsSnap.size,
        pendingApplications,
        admittedApplications,
        rejectedApplications,
        totalCourses: coursesSnap.size,
        openCourses,
        totalJobs: jobsSnap.size,
        activeJobs,
        pendingCompanies,
        approvedCompanies,
        studyingStudents,
        completedStudents
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading system reports...</div>;
  }

  return (
    <div className="reports-container">
      <div className="page-header">
        <h1>System Reports & Analytics</h1>
        <button onClick={fetchAllStats} className="btn-primary">
          Refresh Data
        </button>
      </div>

      {/* Overview Stats */}
      <section className="report-section">
        <h2>System Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <FaUsers className="stat-icon" style={{ color: '#3b82f6' }} />
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <p className="stat-text">{stats.students} students</p>
          </div>

          <div className="stat-card">
            <FaUniversity className="stat-icon" style={{ color: '#10b981' }} />
            <h3>Institutions</h3>
            <p className="stat-number">{stats.institutions}</p>
            <p className="stat-text">{stats.totalCourses} courses</p>
          </div>

          <div className="stat-card">
            <FaBriefcase className="stat-icon" style={{ color: '#f59e0b' }} />
            <h3>Companies</h3>
            <p className="stat-number">{stats.companies}</p>
            <p className="stat-text">{stats.pendingCompanies} pending approval</p>
          </div>

          <div className="stat-card">
            <FaFileAlt className="stat-icon" style={{ color: '#8b5cf6' }} />
            <h3>Applications</h3>
            <p className="stat-number">{stats.totalApplications}</p>
            <p className="stat-text">{stats.pendingApplications} pending</p>
          </div>
        </div>
      </section>

      {/* Applications Breakdown */}
      <section className="report-section">
        <h2>Applications Breakdown</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Pending Applications</div>
            <p className="stat-number">{stats.pendingApplications}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill warning"
                style={{ width: `${(stats.pendingApplications / stats.totalApplications) * 100}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Admitted</div>
            <p className="stat-number">{stats.admittedApplications}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill success"
                style={{ width: `${(stats.admittedApplications / stats.totalApplications) * 100}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Rejected</div>
            <p className="stat-number">{stats.rejectedApplications}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill danger"
                style={{ width: `${(stats.rejectedApplications / stats.totalApplications) * 100}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Success Rate</div>
            <p className="stat-number">
              {stats.totalApplications > 0 
                ? Math.round((stats.admittedApplications / stats.totalApplications) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </section>

      {/* Student Status */}
      <section className="report-section">
        <h2>Student Status</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <FaGraduationCap className="stat-icon" style={{ color: '#3b82f6' }} />
            <h3>Currently Studying</h3>
            <p className="stat-number">{stats.studyingStudents}</p>
          </div>

          <div className="stat-card">
            <FaGraduationCap className="stat-icon" style={{ color: '#10b981' }} />
            <h3>Completed Studies</h3>
            <p className="stat-number">{stats.completedStudents}</p>
          </div>

          <div className="stat-card">
            <FaChartLine className="stat-icon" style={{ color: '#f59e0b' }} />
            <h3>Completion Rate</h3>
            <p className="stat-number">
              {stats.studyingStudents + stats.completedStudents > 0
                ? Math.round((stats.completedStudents / (stats.studyingStudents + stats.completedStudents)) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </section>

      {/* Courses & Jobs */}
      <section className="report-section">
        <h2>Courses & Job Opportunities</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Courses</h3>
            <p className="stat-number">{stats.totalCourses}</p>
            <p className="stat-text">{stats.openCourses} accepting applications</p>
          </div>

          <div className="stat-card">
            <h3>Job Postings</h3>
            <p className="stat-number">{stats.totalJobs}</p>
            <p className="stat-text">{stats.activeJobs} active</p>
          </div>

          <div className="stat-card">
            <h3>Company Status</h3>
            <p className="stat-number">{stats.approvedCompanies}</p>
            <p className="stat-text">approved companies</p>
          </div>
        </div>
      </section>

      {/* Top Institutions */}
      <section className="report-section">
        <h2>Top Institutions by Applications</h2>
        <div className="ranking-list">
          {topInstitutions.length === 0 ? (
            <p className="no-data">No application data available</p>
          ) : (
            topInstitutions.map((inst, index) => (
              <div key={index} className="ranking-item">
                <div className="rank-number">#{index + 1}</div>
                <div className="rank-info">
                  <h4>{inst.institutionName}</h4>
                  <p>{inst.applicationCount} applications</p>
                </div>
                <div className="rank-bar">
                  <div 
                    className="rank-fill"
                    style={{ 
                      width: `${(inst.applicationCount / topInstitutions[0].applicationCount) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Summary Cards */}
      <section className="report-section">
        <h2>Quick Summary</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Registration Activity</h3>
            <ul>
              <li><strong>{stats.students}</strong> students registered</li>
              <li><strong>{stats.institutions}</strong> institutions registered</li>
              <li><strong>{stats.companies}</strong> companies registered</li>
              <li><strong>{stats.pendingCompanies}</strong> companies awaiting approval</li>
            </ul>
          </div>

          <div className="summary-card">
            <h3>Admission Activity</h3>
            <ul>
              <li><strong>{stats.totalApplications}</strong> total applications</li>
              <li><strong>{stats.admittedApplications}</strong> students admitted</li>
              <li><strong>{stats.studyingStudents}</strong> students currently studying</li>
              <li><strong>{stats.completedStudents}</strong> students completed studies</li>
            </ul>
          </div>

          <div className="summary-card">
            <h3>Job Market</h3>
            <ul>
              <li><strong>{stats.totalJobs}</strong> total job postings</li>
              <li><strong>{stats.activeJobs}</strong> active job opportunities</li>
              <li><strong>{stats.approvedCompanies}</strong> active companies</li>
              <li><strong>{stats.completedStudents}</strong> graduates available</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SystemReports;