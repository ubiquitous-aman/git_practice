/**
 * src/pages/StudentDashboard.jsx
 *
 * Student Dashboard component: Profile editor, Drives browser, and Eligibility engine integration.
 */

import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import { CheckCircle2, XCircle, AlertCircle, Building2, Briefcase, Calendar, Award, Send, Edit3, MapPin } from 'lucide-react';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [message, setMessage] = useState('');

  // Profile Form state
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [cgpa, setCgpa] = useState('8.0');
  const [backlogs, setBacklogs] = useState('0');
  const [gradYear, setGradYear] = useState('2027');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      try {
        const pRes = await client.get('/students/profile');
        const pData = pRes.data.data.profile;
        setProfile(pData);
        setRollNumber(pData.roll_number);
        setBranch(pData.branch);
        setCgpa(pData.cgpa);
        setBacklogs(pData.active_backlogs);
        setGradYear(pData.graduation_year);
      } catch (err) {
        if (err.response?.status === 404) {
          setShowProfileModal(true); // Open modal if profile doesn't exist
        }
      }

      // 2. Fetch Placement Drives
      const dRes = await client.get('/drives');
      setDrives(dRes.data.data.drives);

      // 3. Fetch My Applications
      const aRes = await client.get('/applications/me');
      setApplications(aRes.data.data.applications);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await client.put('/students/profile', {
        roll_number: rollNumber,
        branch,
        cgpa: parseFloat(cgpa),
        active_backlogs: parseInt(backlogs, 10),
        graduation_year: parseInt(gradYear, 10),
      });
      setMessage('Profile updated successfully!');
      setShowProfileModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update profile');
    }
  };

  const handleApply = async (driveId) => {
    try {
      await client.post(`/applications/drives/${driveId}/apply`);
      setMessage('Applied successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to apply');
    }
  };

  // Helper check if applied to drive
  const isApplied = (driveId) => applications.some((app) => app.drive_id === driveId);

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Academic Profile Banner */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Academic Profile</h2>
            </div>
            {profile ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Roll: <strong style={{ color: '#fff' }}>{profile.roll_number}</strong> | Branch: <strong style={{ color: '#fff' }}>{profile.branch}</strong> | CGPA: <strong style={{ color: 'var(--accent-emerald)' }}>{profile.cgpa}</strong> | Backlogs: <strong style={{ color: '#fff' }}>{profile.active_backlogs}</strong> | Batch: <strong style={{ color: '#fff' }}>{profile.graduation_year}</strong>
              </p>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> Profile incomplete. Please fill out your academic details to see drive eligibility!
              </p>
            )}
          </div>
          <button className="btn btn-secondary" onClick={() => setShowProfileModal(true)}>
            <Edit3 size={16} /> {profile ? 'Edit Profile' : 'Setup Profile'}
          </button>
        </div>

        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', padding: '12px 20px', borderRadius: '8px', marginBottom: '24px' }}>
            {message}
          </div>
        )}

        {/* Drives Grid */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={22} color="var(--primary-hover)" /> Active Placement Drives
        </h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading drives...</p>
        ) : drives.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No placement drives currently active. Check back soon!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {drives.map((drive) => {
              const applied = isApplied(drive.id);
              const elig = drive.eligibility;

              return (
                <div key={drive.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{drive.job_role}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={16} /> {drive.company_name}
                        </p>
                      </div>

                      {applied ? (
                        <span className="badge badge-applied">APPLIED</span>
                      ) : elig?.is_eligible ? (
                        <span className="badge badge-eligible">ELIGIBLE</span>
                      ) : (
                        <span className="badge badge-ineligible">INELIGIBLE</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                      <div>Package: <strong style={{ color: 'var(--accent-emerald)' }}>{drive.package_lpa ? `${drive.package_lpa} LPA` : 'N/A'}</strong></div>
                      <div>Location: <strong style={{ color: '#fff' }}>{drive.location || 'Pan India'}</strong></div>
                      <div>Min CGPA: <strong style={{ color: '#fff' }}>{drive.minimum_cgpa}</strong></div>
                      <div>Max Backlogs: <strong style={{ color: '#fff' }}>{drive.maximum_backlogs}</strong></div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>ELIGIBLE BRANCHES:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(drive.eligible_branches || []).map((b) => (
                          <span key={b} style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#f8fafc' }}>
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Eligibility Failure Reasons */}
                    {!elig?.is_eligible && elig?.reasons?.length > 0 && !applied && (
                      <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '4px' }}>Ineligibility Reasons:</p>
                        <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: '#fda4af' }}>
                          {elig.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    className={`btn ${applied ? 'btn-secondary' : elig?.is_eligible ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', opacity: !elig?.is_eligible || applied ? 0.7 : 1 }}
                    disabled={!elig?.is_eligible || applied}
                    onClick={() => handleApply(drive.id)}
                  >
                    {applied ? <CheckCircle2 size={16} /> : <Send size={16} />}
                    {applied ? 'Applied' : elig?.is_eligible ? 'Apply Now' : 'Not Eligible'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
              Academic Profile Setup
            </h2>

            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input type="text" className="form-input" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required placeholder="e.g. 2023CSE001" />
              </div>

              <div className="form-group">
                <label className="form-label">Branch</label>
                <select className="form-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="IT">Information Tech (IT)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="MECH">Mechanical (MECH)</option>
                  <option value="CIVIL">Civil (CIVIL)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">CGPA (0.00 - 10.00)</label>
                <input type="number" step="0.01" min="0" max="10" className="form-input" value={cgpa} onChange={(e) => setCgpa(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Active Backlogs</label>
                <input type="number" min="0" className="form-input" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <input type="number" className="form-input" value={gradYear} onChange={(e) => setGradYear(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
