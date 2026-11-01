
import React, { useEffect, useMemo, useState } from 'react';
import api, { unwrap, getError } from './api';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('scms_user') || 'null');
  } catch {
    return null;
  }
};

function findToken(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return obj.token || obj.accessToken || obj.jwt ||
    obj.data?.token || obj.data?.accessToken ||
    obj.user?.token || null;
}

function findUser(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return obj.user || obj.data?.user || obj.profile || obj.data?.profile ||
    (obj.email || obj.name || obj.role ? obj : null);
}

function listFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.complaints)) return payload.complaints;
  if (Array.isArray(payload.notifications)) return payload.notifications;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;

  if (payload.data && typeof payload.data === 'object') {
    return listFrom(payload.data);
  }

  return [];
}

function moneyOrNumber(value) {
  return Number(value || 0).toLocaleString();
}

function dateText(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString();
}

function statusClass(status = 'Pending') {
  return String(status).toLowerCase().replaceAll(' ', '-');
}

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function Brand({ light = false }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark">C</span>
      <span>
        civic<span className="brand-bold">connect</span>
        <small>SMART COMPLAINT PORTAL</small>
      </span>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const change = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;

      const response = await api.post(endpoint, body);
      const payload = unwrap(response);
      const token = findToken(payload);
      const user = findUser(payload);

      if (!token) {
        setError('The server responded, but no login token was found. Check your backend login response format.');
        return;
      }

      localStorage.setItem('scms_token', token);

      if (user) {
        localStorage.setItem('scms_user', JSON.stringify(user));
      }

      onAuth(user || readUser());
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-art">
        <Brand light />
        <div className="art-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> YOUR VOICE. YOUR CITY.
          </div>
          <h1>Better cities<br />start with <em>you.</em></h1>
          <p>
            A simple, transparent way to report civic issues, track progress,
            and make your community better.
          </p>
          <div className="art-stats">
            <div><strong>24/7</strong><span>Complaint access</span></div>
            <div><strong>100%</strong><span>Transparent tracking</span></div>
          </div>
        </div>
        <div className="art-footer">
          CITIZEN REDRESSAL PORTAL <span>•</span> EST. FOR EVERYONE
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand"><Brand /></div>
          <div className="eyebrow muted">
            {mode === 'login' ? 'WELCOME BACK' : 'JOIN YOUR COMMUNITY'}
          </div>
          <h2>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="subtle">
            {mode === 'login'
              ? 'Enter your details to continue to your portal.'
              : 'Register as a citizen to submit and track complaints.'}
          </p>

          <div className="auth-tabs">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign in
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={submit} className="form-stack">
            {mode === 'register' && <>
              <label>
                Full name
                <input name="name" value={form.name} onChange={change}
                  placeholder="Your full name" required />
              </label>
              <div className="form-grid">
                <label>
                  Phone number
                  <input name="phone" value={form.phone} onChange={change}
                    placeholder="+91..." />
                </label>
                <label>
                  Address
                  <input name="address" value={form.address} onChange={change}
                    placeholder="Your area / address" />
                </label>
              </div>
            </>}

            <label>
              Email address
              <input name="email" type="email" value={form.email}
                onChange={change} placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={form.password}
                onChange={change} placeholder="Enter your password"
                required minLength="6" />
            </label>

            {error && <div className="alert error">{error}</div>}

            <button className="btn primary full" disabled={busy}>
              {busy ? 'Please wait…' :
                mode === 'login' ? 'Sign in securely' : 'Create account'}
              <span>→</span>
            </button>
          </form>

          <div className="auth-note">
            <span className="shield">✓</span>
            Your information is protected and handled securely.
          </div>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('scms_token'));
  const [user, setUser] = useState(readUser());
  const [page, setPage] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [stats, setStats] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({ name: '', phone: '', address: '' });
  const [trackId, setTrackId] = useState('');
  const [tracked, setTracked] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showNew, setShowNew] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    category: 'Roads & Transport',
    location: '',
    department: '',
    priority: 'Medium',
    description: ''
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminUpdate, setAdminUpdate] = useState({
    status: 'In Progress',
    remarks: '',
    assignedTo: ''
  });

  const isAdmin = useMemo(() => {
    const role = String(user?.role || user?.userType || '').toLowerCase();
    return role === 'admin' || role === 'administrator';
  }, [user]);

  function logout() {
    localStorage.removeItem('scms_token');
    localStorage.removeItem('scms_user');
    setToken(null);
    setUser(null);
    setPage('overview');
    setStats({});
    setComplaints([]);
    setNotifications([]);
  }

  function authenticated(nextUser) {
    setToken(localStorage.getItem('scms_token'));
    setUser(nextUser || readUser());
    setPage('overview');
  }

  async function loadData() {
    if (!localStorage.getItem('scms_token')) return;

    setLoading(true);
    setNotice('');

    try {
      const jobs = isAdmin
        ? [
            api.get('/dashboard/admin-stats'),
            api.get('/complaints?page=1&limit=100'),
            api.get('/notifications')
          ]
        : [
            api.get('/dashboard/user-stats'),
            api.get('/complaints/my?page=1&limit=100&status=all'),
            api.get('/notifications')
          ];

      const results = await Promise.allSettled(jobs);

      // IMPORTANT: Backend returns { success: true, stats: {...} }.
      // Store the stats object itself, not the entire response.
      if (results[0].status === 'fulfilled') {
        const dashboardPayload = unwrap(results[0].value);
        const dashboardStats = dashboardPayload?.stats || dashboardPayload?.data?.stats || {};
        setStats(dashboardStats);
      } else {
        console.error('Dashboard request failed:', results[0].reason);
        setStats({});
        setNotice(getError(results[0].reason));
      }

      if (results[1].status === 'fulfilled') {
        setComplaints(listFrom(unwrap(results[1].value)));
      } else {
        console.error('Complaints request failed:', results[1].reason);
        setComplaints([]);
      }

      if (results[2].status === 'fulfilled') {
        setNotifications(listFrom(unwrap(results[2].value)));
      } else {
        console.error('Notifications request failed:', results[2].reason);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
      setNotice(getError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  async function submitComplaint(e) {
    e.preventDefault();
    setNotice('');

    try {
      const body = new FormData();
      Object.entries(newComplaint).forEach(([k, v]) => body.append(k, v));

      await api.post('/complaints', body);

      setNotice('Your complaint was submitted successfully.');
      setNewComplaint({
        title: '',
        category: 'Roads & Transport',
        location: '',
        department: '',
        priority: 'Medium',
        description: ''
      });
      setShowNew(false);
      await loadData();
    } catch (err) {
      setNotice(getError(err));
    }
  }

  async function trackComplaint(e) {
    e.preventDefault();
    setTracked(null);
    setNotice('');

    try {
      const response = await api.get(
        `/complaints/track/${encodeURIComponent(trackId.trim())}`
      );
      setTracked(unwrap(response));
    } catch (err) {
      setNotice(getError(err));
    }
  }

  async function updateStatus(e) {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      await api.patch(
        `/complaints/${selectedComplaint._id || selectedComplaint.id}/status`,
        adminUpdate
      );
      setNotice('Complaint status updated.');
      setSelectedComplaint(null);
      await loadData();
    } catch (err) {
      setNotice(getError(err));
    }
  }

  async function saveProfile(e) {
    e.preventDefault();

    try {
      const response = await api.put('/users/profile', profile);
      const updated = findUser(unwrap(response)) || { ...user, ...profile };

      localStorage.setItem('scms_user', JSON.stringify(updated));
      setUser(updated);
      setNotice('Profile updated successfully.');
    } catch (err) {
      setNotice(getError(err));
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      await loadData();
    } catch (err) {
      setNotice(getError(err));
    }
  }

  async function exportCsv() {
    try {
      const response = await api.get('/complaints/export/csv', {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'complaints.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setNotice(getError(err));
    }
  }

  if (!token) return <AuthScreen onAuth={authenticated} />;

  const nav = [
    { id: 'overview', label: 'Overview', icon: '◫' },
    { id: 'complaints', label: isAdmin ? 'All complaints' : 'My complaints', icon: '▤' },
    ...(!isAdmin ? [{ id: 'new', label: 'Submit a complaint', icon: '＋' }] : []),
    { id: 'track', label: 'Track complaint', icon: '⌕' },
    { id: 'notifications', label: 'Notifications', icon: '♧' },
    ...(isAdmin ? [{ id: 'users', label: 'User management', icon: '♙' }] : []),
    { id: 'profile', label: 'My profile', icon: '○' }
  ];

  const visibleComplaints = complaints.filter(c => {
    const text = `${c.title || ''} ${c.category || ''} ${c.location || ''} ${c.complaintId || c.trackingId || ''}`.toLowerCase();
    return text.includes(search.toLowerCase()) &&
      (filter === 'All' || normalizeStatus(c.status) === normalizeStatus(filter));
  });

  // Use backend stats first; fall back to counting the loaded complaints.
  // The backend's user dashboard counts "Submitted" as pending.
  const fallbackCount = statuses =>
    complaints.filter(c => statuses.includes(normalizeStatus(c.status))).length;

  const statCards = isAdmin ? [
    ['Total complaints', stats.totalComplaints ?? complaints.length, 'All submissions'],
    ['Pending review', stats.pending ?? fallbackCount(['pending']), 'Awaiting action'],
    ['In progress', stats.inProgress ?? fallbackCount(['in progress']), 'Being addressed'],
    ['Resolved', stats.resolved ?? fallbackCount(['resolved']), 'Successfully closed']
  ] : [
    ['My complaints', stats.total ?? complaints.length, 'Submitted by you'],
    ['Pending', stats.pending ?? fallbackCount(['pending', 'submitted']), 'Awaiting review'],
    ['In progress', stats.inProgress ?? fallbackCount(['in progress']), 'Being addressed'],
    ['Resolved', stats.resolved ?? fallbackCount(['resolved']), 'Successfully closed']
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="side-label">WORKSPACE</div>

        <nav>
          {nav.map(item => (
            <button
              key={item.id}
              className={page === item.id ? 'selected' : ''}
              onClick={() => {
                setPage(item.id);
                setNotice('');
                setShowNew(item.id === 'new');
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === 'notifications' &&
                notifications.some(n => !n.read && !n.isRead) &&
                <i className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <strong>Need assistance?</strong>
            <p>We're here to help you make a difference.</p>
            <a href="mailto:support@example.com">Contact support ↗</a>
          </div>

          <div className="user-mini">
            <div className="avatar">
              {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="user-mini-text">
              <strong>{user?.name || 'Citizen'}</strong>
              <span>{isAdmin ? 'Administrator' : 'Citizen account'}</span>
            </div>
            <button title="Sign out" onClick={logout}>↗</button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>{nav.find(n => n.id === page)?.label || 'Overview'}</strong>
          </div>
          <div className="top-actions">
            <span className="system-status"><i /> System operational</span>
            <button className="icon-button" title="Refresh" onClick={loadData}>↻</button>
            <div className="avatar small">
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="content">
          {notice && (
            <div className={`alert ${
              notice.toLowerCase().includes('success') ||
              notice.toLowerCase().includes('submitted') ||
              notice.toLowerCase().includes('updated')
                ? 'success' : 'error'
            }`}>
              <span>{notice}</span>
              <button onClick={() => setNotice('')}>×</button>
            </div>
          )}

          {page === 'overview' && (
            <section>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow muted">CITIZEN SERVICES / OVERVIEW</div>
                  <h1>
                    {isAdmin
                      ? 'Administration dashboard'
                      : `Good day${user?.name ? ', ' + user.name.split(' ')[0] : ''}.`}
                  </h1>
                  <p className="subtle">
                    {isAdmin
                      ? 'Monitor incoming reports and coordinate civic action.'
                      : 'Here’s what’s happening with your civic reports today.'}
                  </p>
                </div>
                <button
                  className="btn primary"
                  onClick={() => {
                    setPage(isAdmin ? 'complaints' : 'new');
                    setShowNew(!isAdmin);
                  }}
                >
                  {isAdmin ? 'Review complaints' : '+ Submit a complaint'}
                </button>
              </div>

              <div className="stats-grid">
                {statCards.map(([label, value, desc], i) => (
                  <div className="stat-card" key={label}>
                    <div className="stat-top">
                      <span>{label}</span>
                      <span className={`stat-icon icon-${i}`}>
                        {['▤', '◷', '↗', '✓'][i]}
                      </span>
                    </div>
                    <strong>{moneyOrNumber(value)}</strong>
                    <small>{desc}</small>
                  </div>
                ))}
              </div>

              <div className="section-heading">
                <div>
                  <h2>Recent complaints</h2>
                  <p className="subtle">Latest activity from your complaint records.</p>
                </div>
                <button className="text-button" onClick={() => setPage('complaints')}>
                  View all →
                </button>
              </div>

              <ComplaintTable
                items={complaints.slice(0, 5)}
                isAdmin={isAdmin}
                onSelect={c => {
                  setSelectedComplaint(c);
                  setAdminUpdate({
                    status: c.status || 'In Progress',
                    remarks: '',
                    assignedTo: c.assignedTo || ''
                  });
                }}
              />

              <div className="bottom-banner">
                <div className="banner-symbol">✳</div>
                <div>
                  <strong>Your feedback makes a difference.</strong>
                  <p>Every report helps create a safer, cleaner and more responsive community.</p>
                </div>
                <button onClick={() => setPage('track')}>Track a report →</button>
              </div>
            </section>
          )}

          {page === 'complaints' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow muted">CASE MANAGEMENT</div>
                  <h1>{isAdmin ? 'All complaints' : 'My complaints'}</h1>
                  <p className="subtle">Review submissions and follow their resolution progress.</p>
                </div>
                {isAdmin
                  ? <button className="btn secondary" onClick={exportCsv}>↓ Export CSV</button>
                  : <button className="btn primary" onClick={() => { setPage('new'); setShowNew(true); }}>＋ New complaint</button>}
              </div>

              <div className="toolbar">
                <input
                  className="search-input"
                  placeholder="Search by title, category or location…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select value={filter} onChange={e => setFilter(e.target.value)}>
                  <option>All</option>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Rejected</option>
                </select>
              </div>

              <ComplaintTable
                items={visibleComplaints}
                isAdmin={isAdmin}
                onSelect={c => {
                  setSelectedComplaint(c);
                  setAdminUpdate({
                    status: c.status || 'In Progress',
                    remarks: '',
                    assignedTo: c.assignedTo || ''
                  });
                }}
              />
            </section>
          )}

          {page === 'new' && (
            <section className="narrow">
              <div className="page-heading">
                <div>
                  <div className="eyebrow muted">CITIZEN SERVICES / NEW REPORT</div>
                  <h1>Submit a complaint</h1>
                  <p className="subtle">Describe the issue clearly so the right team can take action.</p>
                </div>
              </div>

              <form className="panel form-stack" onSubmit={submitComplaint}>
                <div className="panel-title">
                  <span className="step-number">01</span>
                  <div><h3>Complaint details</h3><p>Tell us what needs attention.</p></div>
                </div>

                <label>
                  Complaint title
                  <input required value={newComplaint.title}
                    onChange={e => setNewComplaint({ ...newComplaint, title: e.target.value })}
                    placeholder="e.g. Damaged road near community park" />
                </label>

                <div className="form-grid">
                  <label>
                    Category
                    <select value={newComplaint.category}
                      onChange={e => setNewComplaint({ ...newComplaint, category: e.target.value })}>
                      <option>Roads & Transport</option>
                      <option>Water Supply</option>
                      <option>Sanitation</option>
                      <option>Street Lighting</option>
                      <option>Public Safety</option>
                      <option>Electricity</option>
                      <option>Drainage</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label>
                    Priority
                    <select value={newComplaint.priority}
                      onChange={e => setNewComplaint({ ...newComplaint, priority: e.target.value })}>
                      <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                    </select>
                  </label>
                </div>

                <label>
                  Location
                  <input required value={newComplaint.location}
                    onChange={e => setNewComplaint({ ...newComplaint, location: e.target.value })}
                    placeholder="Street, landmark, area or ward" />
                </label>

                <label>
                  Department
                  <input value={newComplaint.department}
                    onChange={e => setNewComplaint({ ...newComplaint, department: e.target.value })}
                    placeholder="Relevant department (if known)" />
                </label>

                <label>
                  Description
                  <textarea required rows="5" value={newComplaint.description}
                    onChange={e => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    placeholder="Explain the issue, when it started, and how it affects the community…" />
                </label>

                <div className="form-actions">
                  <span className="subtle">Please provide accurate information.</span>
                  <button className="btn primary">Submit complaint →</button>
                </div>
              </form>
            </section>
          )}

          {page === 'track' && (
            <section className="narrow">
              <div className="page-heading">
                <div>
                  <div className="eyebrow muted">PUBLIC TRACKING</div>
                  <h1>Track a complaint</h1>
                  <p className="subtle">Enter the reference number you received after submitting a report.</p>
                </div>
              </div>

              <form className="panel track-panel" onSubmit={trackComplaint}>
                <div className="track-symbol">⌕</div>
                <label>
                  Complaint reference number
                  <input required value={trackId} onChange={e => setTrackId(e.target.value)}
                    placeholder="e.g. CMP-20261025-1042" />
                </label>
                <button className="btn primary full">Find my complaint →</button>
              </form>

              {tracked && (
                <div className="panel track-result">
                  <div className="result-head">
                    <div>
                      <span className="eyebrow muted">TRACKING RESULT</span>
                      <h2>{tracked.title || tracked.complaint?.title || 'Complaint details'}</h2>
                    </div>
                    <Status value={tracked.status || tracked.complaint?.status} />
                  </div>
                  <p>{tracked.description || tracked.complaint?.description || 'Your complaint record was found.'}</p>
                  <div className="detail-grid">
                    <div><small>Reference</small><strong>{tracked.complaintId || tracked.trackingId || trackId}</strong></div>
                    <div><small>Submitted</small><strong>{dateText(tracked.createdAt)}</strong></div>
                    <div><small>Location</small><strong>{tracked.location || '—'}</strong></div>
                    <div><small>Department</small><strong>{tracked.department || '—'}</strong></div>
                  </div>
                </div>
              )}
            </section>
          )}

          {page === 'notifications' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow muted">UPDATES</div>
                  <h1>Notifications</h1>
                  <p className="subtle">Important updates about your account and complaints.</p>
                </div>
                <button className="btn secondary" onClick={markAllRead}>Mark all as read</button>
              </div>

              <div className="panel notification-list">
                {notifications.length
                  ? notifications.map((n, i) => (
                    <div className="notification" key={n._id || n.id || i}>
                      <div className="notification-icon">♧</div>
                      <div className="notification-copy">
                        <strong>{n.title || n.subject || 'Update from Civic Connect'}</strong>
                        <p>{n.message || n.body || n.description || 'You have a new notification.'}</p>
                        <small>{dateText(n.createdAt || n.date)}</small>
                      </div>
                      {!(n.read || n.isRead) && <span className="unread-dot" />}
                    </div>
                  ))
                  : <Empty title="You're all caught up" text="New updates will appear here." />}
              </div>
            </section>
          )}

          {page === 'profile' && (
            <section className="narrow">
              <div className="page-heading">
                <div>
                  <div className="eyebrow muted">ACCOUNT SETTINGS</div>
                  <h1>My profile</h1>
                  <p className="subtle">Keep your contact information up to date.</p>
                </div>
              </div>

              <form className="panel form-stack" onSubmit={saveProfile}>
                <div className="profile-head">
                  <div className="avatar large">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
                  <div><h3>{user?.name || 'Your account'}</h3><p>{user?.email}</p></div>
                </div>
                <label>Full name<input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label>
                <label>Phone number<input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></label>
                <label>Address<input value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} /></label>
                <div className="form-actions">
                  <span className="subtle">Email: {user?.email || '—'}</span>
                  <button className="btn primary">Save changes</button>
                </div>
              </form>
            </section>
          )}

          {page === 'users' && (
            <section>
              <div className="page-heading">
                <div>
                  <div className="eyebrow muted">ADMINISTRATION</div>
                  <h1>User management</h1>
                  <p className="subtle">Account management is available through the admin API.</p>
                </div>
              </div>
              <div className="panel info-panel">
                <h3>Manage registered users</h3>
                <p>
                  The backend exposes GET /api/users?page=1&limit=10 and
                  PUT /api/users/:id/status. This view is reserved until the
                  backend's exact user-list response and status payload are confirmed.
                </p>
              </div>
            </section>
          )}
        </div>

        <footer className="footer">
          <span>© {new Date().getFullYear()} Civic Connect</span>
          <span>Making public services more responsive <b>•</b> Citizen Redressal Portal</span>
        </footer>
      </main>

      {selectedComplaint && isAdmin && (
        <div className="modal-backdrop" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedComplaint(null)}>×</button>
            <span className="eyebrow muted">ADMIN ACTION</span>
            <h2>Update complaint</h2>
            <p className="subtle">
              {selectedComplaint.title || 'Complaint'} ·
              {selectedComplaint.complaintId || selectedComplaint.trackingId || selectedComplaint._id}
            </p>
            <form className="form-stack" onSubmit={updateStatus}>
              <label>
                Status
                <select value={adminUpdate.status}
                  onChange={e => setAdminUpdate({ ...adminUpdate, status: e.target.value })}>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Rejected</option>
                </select>
              </label>
              <label>
                Assigned team
                <input value={adminUpdate.assignedTo}
                  onChange={e => setAdminUpdate({ ...adminUpdate, assignedTo: e.target.value })}
                  placeholder="Department / team" />
              </label>
              <label>
                Remarks
                <textarea rows="4" value={adminUpdate.remarks}
                  onChange={e => setAdminUpdate({ ...adminUpdate, remarks: e.target.value })}
                  placeholder="Add an update for the citizen" />
              </label>
              <button className="btn primary full">Save update</button>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="loading-bar"><span /></div>}
    </div>
  );
}

function Status({ value }) {
  return <span className={`status ${statusClass(value)}`}>{value || 'Pending'}</span>;
}

function Empty({ title, text }) {
  return (
    <div className="empty-state">
      <div>▤</div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function ComplaintTable({ items = [], isAdmin, onSelect }) {
  if (!items.length) {
    return (
      <div className="panel">
        <Empty title="No complaints found"
          text="When complaints are submitted, they will appear here." />
      </div>
    );
  }

  return (
    <div className="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>COMPLAINT</th>
            <th>CATEGORY</th>
            <th>DATE</th>
            <th>PRIORITY</th>
            <th>STATUS</th>
            {isAdmin && <th>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((c, i) => (
            <tr key={c._id || c.id || i}>
              <td>
                <strong>{c.title || 'Untitled complaint'}</strong>
                <small>{c.complaintId || c.trackingId || c._id || 'Reference pending'}</small>
              </td>
              <td>{c.category || '—'}</td>
              <td>{dateText(c.createdAt || c.date)}</td>
              <td>
                <span className={`priority ${String(c.priority || 'Medium').toLowerCase()}`}>
                  {c.priority || 'Medium'}
                </span>
              </td>
              <td><Status value={c.status} /></td>
              {isAdmin && (
                <td>
                  <button className="text-button" onClick={() => onSelect(c)}>
                    Manage →
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
