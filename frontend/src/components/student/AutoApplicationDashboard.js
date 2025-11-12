// frontend/src/components/student/AutoApplicationDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AutoApplicationDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [settings, setSettings] = useState({
    autoSubmit: false,
    maxApplications: 3,
    minMatchScore: 75,
    notificationsEnabled: true
  });
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [draftApps, setDraftApps] = useState([]);

  // Replace with your actual API URL from .env
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (currentUser) {
      fetchSuggestions();
      fetchSettings();
      fetchAnalytics();
      fetchDraftApplications();
    }
  }, [currentUser]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auto-apply/suggestions/${currentUser.uid}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auto-apply/settings/${currentUser.uid}`);
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auto-apply/analytics/${currentUser.uid}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchDraftApplications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auto-apply/drafts/${currentUser.uid}`);
      const data = await response.json();
      setDraftApps(data.drafts || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  const handleAutoApply = async () => {
    if (!settings.autoSubmit) {
      setShowConsentModal(true);
      return;
    }
    executeAutoApply();
  };

  const executeAutoApply = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auto-apply/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          maxApplications: settings.maxApplications,
          minMatchScore: settings.minMatchScore,
          autoSubmit: settings.autoSubmit
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchSuggestions();
        fetchAnalytics();
        if (!settings.autoSubmit) {
          fetchDraftApplications();
        }
      } else {
        alert(data.error || 'Failed to create applications');
      }
    } catch (error) {
      console.error('Auto-apply error:', error);
      alert('Failed to process auto-application');
    } finally {
      setLoading(false);
      setShowConsentModal(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await fetch(`${API_URL}/api/auto-apply/settings/${currentUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings)
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const submitDraftApplication = async (draftId) => {
    try {
      const response = await fetch(`${API_URL}/api/auto-apply/drafts/${draftId}/submit`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Application submitted successfully!');
        fetchDraftApplications();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error submitting draft:', error);
      alert('Failed to submit application');
    }
  };

  const deleteDraft = async (draftId) => {
    if (!window.confirm('Delete this draft application?')) return;

    try {
      await fetch(`${API_URL}/api/auto-apply/drafts/${draftId}`, {
        method: 'DELETE'
      });
      fetchDraftApplications();
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            🤖 Auto-Application Dashboard
          </h1>
          <p style={{ color: '#6b7280' }}>
            Let AI automatically find and apply to courses that match your qualifications
          </p>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{analytics.totalApplications}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Applications</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>{analytics.autoGenerated}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Auto-Generated</div>
            </div>
            <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>{analytics.pending}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pending Review</div>
            </div>
            <div style={{ backgroundColor: '#faf5ff', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#5b21b6' }}>
                {analytics.averageMatchScore}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg Match Score</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Settings Panel */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>⚙️ Settings</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Auto-Submit Mode</span>
                    <input
                      type="checkbox"
                      checked={settings.autoSubmit}
                      onChange={(e) => handleSettingChange('autoSubmit', e.target.checked)}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {settings.autoSubmit 
                      ? '✅ Applications will be submitted automatically' 
                      : '📝 Applications will be saved as drafts for review'}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Max Applications: {settings.maxApplications}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={settings.maxApplications}
                    onChange={(e) => handleSettingChange('maxApplications', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Min Match Score: {settings.minMatchScore}%
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="90"
                    step="5"
                    value={settings.minMatchScore}
                    onChange={(e) => handleSettingChange('minMatchScore', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    <span>60%</span>
                    <span>75%</span>
                    <span>90%</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.notificationsEnabled}
                      onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </label>
                </div>

                <button
                  onClick={handleAutoApply}
                  disabled={loading || suggestions.length === 0}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: loading || suggestions.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: loading || suggestions.length === 0 ? 0.5 : 1,
                    marginTop: '1.5rem'
                  }}
                >
                  {loading ? 'Processing...' : '🚀 Start Auto-Apply'}
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions & Drafts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Suggested Courses */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>💡 Recommended Courses</h2>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '1rem', color: '#6b7280', marginTop: '1rem' }}>Finding matching courses...</div>
                </div>
              ) : suggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No matching courses found</p>
                  <p style={{ fontSize: '0.875rem' }}>Try adjusting your match score threshold</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {suggestions.map((course, idx) => (
                    <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontWeight: '600', color: '#1f2937' }}>{course.courseName}</h3>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{course.institution}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: course.matchScore >= 85 ? '#10b981' : course.matchScore >= 75 ? '#3b82f6' : '#f59e0b'
                          }}>
                            {course.matchScore}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Match</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>Acceptance Probability:</span>
                          <span style={{ color: '#10b981' }}>{course.estimatedAcceptanceProbability}</span>
                        </div>

                        {course.reasons && course.reasons.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Why you match:</p>
                            <ul style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {course.reasons.slice(0, 3).map((reason, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                                  <span style={{ color: '#10b981', marginRight: '0.25rem' }}>✓</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: course.recommendation === 'Highly Recommended' ? '#d1fae5' : course.recommendation === 'Recommended' ? '#dbeafe' : '#fef3c7',
                          color: course.recommendation === 'Highly Recommended' ? '#065f46' : course.recommendation === 'Recommended' ? '#1e40af' : '#92400e'
                        }}>
                          {course.recommendation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Draft Applications */}
            {draftApps.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>📝 Draft Applications</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {draftApps.map((draft) => (
                    <div key={draft.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontWeight: '600', color: '#1f2937' }}>{draft.course?.name}</h3>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{draft.course?.institution}</p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Match Score: {draft.matchScore}%
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => submitDraftApplication(draft.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              fontSize: '0.875rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '0.875rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consent Modal */}
        {showConsentModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '42rem', width: '100%', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
                🤝 Auto-Application Consent
              </h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: '#374151', marginBottom: '1rem' }}>
                  By proceeding with auto-application, you agree to the following:
                </p>
                
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#6b7280' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓</span>
                    <span>Your profile and documents will be submitted to matching institutions</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓</span>
                    <span>Applications will be created based on your current qualifications</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓</span>
                    <span>You can review and manage applications in your dashboard</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓</span>
                    <span>Institutions may contact you directly for further information</span>
                  </li>
                </ul>

                <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                    <strong>Note:</strong> You are applying to up to {settings.maxApplications} courses 
                    with a minimum match score of {settings.minMatchScore}%. 
                    {settings.autoSubmit 
                      ? ' Applications will be submitted immediately.' 
                      : ' Applications will be saved as drafts for your review.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowConsentModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeAutoApply}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  I Agree, Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoApplicationDashboard;