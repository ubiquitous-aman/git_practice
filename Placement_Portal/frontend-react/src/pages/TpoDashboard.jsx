/**
 * src/pages/TpoDashboard.jsx
 *
 * TPO Officer Dashboard: Company management, Placement Drive creation, and Candidate Workflow State Machine control.
 */

import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Navbar from '../components/Navbar';
import { Building2, Plus, Briefcase, Users, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

const TpoDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Company Form
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Drive Form
  const [companyId, setCompanyId] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [packageLpa, setPackageLpa] = useState('10.0');
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [maxBacklogs, setMaxBacklogs] = useState('0');
  const [gradYear, setGradYear] = useState('2027');
  const [branches, setBranches] = useState('CSE, IT');

  const fetchData = async () => {
    setLoading(true);
    try {
      const cRes = await client.get('/companies');
      setCompanies(cRes.data.data.companies);

      const dRes = await client.get('/drives');
      setDrives(dRes.data.data.drives);
    } catch (err) {
      console.error('Error loading TPO dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await client.post('/companies', { name: companyName, website: companyWebsite });
      setCompanyName('');
      setCompanyWebsite('');
      setShowCompanyModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create company');
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    try {
      const branchArray = branches.split(',').map((b) => b.trim());
      await client.post('/drives', {
        company_id: parseInt(companyId, 10),
        job_role: jobRole,
        package_lpa: parseFloat(packageLpa),
        minimum_cgpa: parseFloat(minCgpa),
        maximum_backlogs: parseInt(maxBacklogs, 10),
        graduation_year: parseInt(gradYear, 10),
        application_deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        eligible_branches: branchArray,
      });
      setShowDriveModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create drive');
    }
  };

  const loadApplicants = async (driveId) => {
    setSelectedDriveId(driveId);
    try {
      const res = await client.get(`/applications/drives/${driveId}/applications`);
      setApplicants(res.data.data.applications);
    } catch (err) {
      console.error('Error loading applicants:', err);
    }
  };

  const handleStatusTransition = async (applicationId, nextStatus) => {
    try {
      await client.patch(`/applications/${applicationId}/status`, { status: nextStatus });
      loadApplicants(selectedDriveId);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Transition failed');
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>TPO Control Center</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage recruitment drives, companies, and candidate status pipelines</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setShowCompanyModal(true)}>
              <Building2 size={16} /> Add Company
            </button>
            <button className="btn btn-primary" onClick={() => setShowDriveModal(true)}>
              <Plus size={16} /> Create Drive
            </button>
          </div>
        </div>

        {/* Drives Grid */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={20} color="var(--primary-hover)" /> Placement Drives
        </h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading drives...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {drives.map((d) => (
              <div key={d.id} className="glass-card" style={{ padding: '20px', border: selectedDriveId === d.id ? '1px solid var(--primary-hover)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{d.job_role}</h3>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--accent-cyan)' }}>
                    {d.company_name}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Package: <strong style={{ color: 'var(--accent-emerald)' }}>{d.package_lpa} LPA</strong> | Min CGPA: {d.minimum_cgpa}
                </p>

                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => loadApplicants(d.id)}>
                  <Users size={16} /> View Applicants ({selectedDriveId === d.id ? applicants.length : 'Click to load'})
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Applicants Workflow Pipeline Table */}
        {selectedDriveId && (
          <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--accent-cyan)" /> Candidate Workflow Pipeline
            </h2>

            {applicants.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No student applications received for this drive yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Student</th>
                      <th style={{ padding: '12px' }}>Branch</th>
                      <th style={{ padding: '12px' }}>CGPA</th>
                      <th style={{ padding: '12px' }}>Current Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Advance Workflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app) => (
                      <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px' }}>
                          <strong>{app.student_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.roll_number}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{app.branch}</td>
                        <td style={{ padding: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>{app.cgpa}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge badge-${app.status.toLowerCase()}`}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {app.status === 'APPLIED' && (
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleStatusTransition(app.id, 'APTITUDE')}>
                              Pass Aptitude <ChevronRight size={14} />
                            </button>
                          )}
                          {app.status === 'APTITUDE' && (
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleStatusTransition(app.id, 'TECHNICAL')}>
                              Pass Technical <ChevronRight size={14} />
                            </button>
                          )}
                          {app.status === 'TECHNICAL' && (
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleStatusTransition(app.id, 'HR')}>
                              Pass HR <ChevronRight size={14} />
                            </button>
                          )}
                          {app.status === 'HR' && (
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={() => handleStatusTransition(app.id, 'SELECTED')}>
                              Select Candidate <CheckCircle size={14} />
                            </button>
                          )}
                          {['APPLIED', 'APTITUDE', 'TECHNICAL', 'HR'].includes(app.status) && (
                            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', marginLeft: '6px', color: 'var(--accent-rose)' }} onClick={() => handleStatusTransition(app.id, 'REJECTED')}>
                              Reject <XCircle size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Company Modal */}
      {showCompanyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Register Company</h2>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="e.g. Google" />
              </div>
              <div className="form-group">
                <label className="form-label">Website (Optional)</label>
                <input type="url" className="form-input" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://google.com" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCompanyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Drive Modal */}
      {showDriveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Create Placement Drive</h2>
            <form onSubmit={handleCreateDrive}>
              <div className="form-group">
                <label className="form-label">Select Company</label>
                <select className="form-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
                  <option value="">-- Choose Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Job Role</label>
                <input type="text" className="form-input" value={jobRole} onChange={(e) => setJobRole(e.target.value)} required placeholder="e.g. Software Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Package (LPA)</label>
                <input type="number" step="0.1" className="form-input" value={packageLpa} onChange={(e) => setPackageLpa(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum CGPA</label>
                <input type="number" step="0.1" className="form-input" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Eligible Branches (Comma Separated)</label>
                <input type="text" className="form-input" value={branches} onChange={(e) => setBranches(e.target.value)} required placeholder="CSE, IT, ECE" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDriveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Publish Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TpoDashboard;
