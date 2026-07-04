import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

// ─── Service Config ────────────────────────────────────────────────────────────
const SERVICE_CONFIG = {
  'Aadhaar': {
    label: 'Aadhaar Card Number',
    placeholder: '12-digit Aadhaar (e.g. 1234 5678 9012)',
    pattern: '[0-9]{12}',
    hint: 'Enter the 12-digit number from your Aadhaar card'
  },
  'PAN': {
    label: 'PAN Card Number',
    placeholder: '10-character PAN (e.g. ABCDE1234F)',
    pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
    hint: 'Permanent Account Number — 5 letters, 4 digits, 1 letter'
  },
  'PATTA': {
    label: 'Patta / Survey Number',
    placeholder: 'Enter your Survey or Patta number',
    pattern: null,
    hint: 'Land survey or patta document registration number'
  },
  'EB Bill': {
    label: 'EB Consumer Number',
    placeholder: 'Your electricity consumer account number',
    pattern: null,
    hint: 'Found on the top section of your EB electricity bill'
  },
  'Money Transfer': {
    label: 'Bank Account & IFSC Code',
    placeholder: 'A/C: 1234567890 | IFSC: SBIN0001234',
    pattern: null,
    hint: "Recipient's bank account number and bank IFSC code"
  },
  'Insurance': {
    label: 'Policy / Vehicle Number',
    placeholder: 'Enter policy number or vehicle registration',
    pattern: null,
    hint: 'Vehicle registration number or insurance policy number'
  },
  'Voter ID': {
    label: 'EPIC / Voter ID Number',
    placeholder: '10-character Voter ID (e.g. ABC1234567)',
    pattern: '[A-Z]{3}[0-9]{7}',
    hint: 'Electoral Photo Identity Card — 3 letters + 7 digits'
  }
};

// ─── Route Detection ──────────────────────────────────────────────────────────
function getRoute() {
  return window.location.pathname === '/admin' ? 'admin' : 'sender';
}

// ─── Shared Data Hook ─────────────────────────────────────────────────────────
function useAppData() {
  const [requests, setRequests] = useState([]);
  const [chats, setChats]       = useState([]);
  const [stats, setStats]       = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, cRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/requests`),
        fetch(`${API_BASE}/chats`),
        fetch(`${API_BASE}/stats`)
      ]);
      if (rRes.ok) setRequests(await rRes.json());
      if (cRes.ok) setChats(await cRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch { /* silently ignore poll errors */ }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return { requests, chats, stats, fetchAll };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function statusClass(s) {
  return { pending: 'status-pill--pending', in_progress: 'status-pill--in_progress', completed: 'status-pill--completed' }[s] || '';
}

// ─── Chat Module (reused in both pages) ──────────────────────────────────────
function ChatModule({ chats, isAdmin, fetchAll, customerName }) {
  const [chatName, setChatName] = useState(customerName || 'Guest');
  const [msg, setMsg]           = useState('');
  const scrollRef               = useRef(null);
  const endRef                  = useRef(null);
  const prevCount               = useRef(0);
  const justSent                = useRef(false);

  // Smart scroll: only when new messages + user near bottom or just sent
  useEffect(() => {
    const newCount = chats.length;
    if (newCount > prevCount.current) {
      const el = scrollRef.current;
      const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 120 : true;
      if (nearBottom || justSent.current) {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      justSent.current = false;
    }
    prevCount.current = newCount;
  }, [chats]);

  const senderName = isAdmin ? 'Admin' : (customerName || chatName);

  const send = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    try {
      await fetch(`${API_BASE}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: senderName,
          message: msg,
          is_admin: isAdmin ? 1 : 0
        })
      });
      setMsg('');
      justSent.current = true;
      fetchAll();
    } catch { /* ignore */ }
  };

  const getBubble = (m) => {
    // "mine" = messages sent by my role; always appear on the RIGHT
    const isMine = isAdmin ? m.is_admin === 1 : m.is_admin === 0;
    return isMine ? 'chat-bubble--mine' : 'chat-bubble--other';
  };

  const mineColor = isAdmin
    ? { background: 'var(--clr-admin)' }
    : { background: 'var(--clr-primary)' };

  return (
    <div className="chat-box">
      <div className="chat-scroll" ref={scrollRef}>
        {chats.length === 0 ? (
          <p className="empty-state" style={{ margin: 'auto' }}>No messages yet. Start the conversation below.</p>
        ) : (
          chats.map((m) => {
            const cls = getBubble(m);
            return (
              <div key={m.id} className={`chat-bubble ${cls}`} style={cls === 'chat-bubble--mine' ? mineColor : {}}>
                <div className="bubble-name">{m.sender_name}</div>
                <div>{m.message}</div>
                <div className="bubble-time">{formatTime(m.timestamp)}</div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-footer" onSubmit={send}>
        {/* Name input only visible in Sender mode when no customer is registered */}
        {!isAdmin && !customerName && (
          <input
            className="chat-name-input"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder="Your name"
          />
        )}
        <input
          className="chat-input"
          placeholder={isAdmin ? 'Reply as Admin…' : `Message as ${senderName}…`}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          required
        />
        <button type="submit" className="chat-send-btn">Send</button>
      </form>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  CUSTOMER WELCOME — registration gate for sender page
// ═════════════════════════════════════════════════════════════
function CustomerWelcome({ onRegister }) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, contact_number: number })
      });
    } catch { /* still save locally even if API fails */ }

    const customer = { name, number };
    localStorage.setItem('ak_customer', JSON.stringify(customer));
    setLoading(false);
    onRegister(customer);
  };

  return (
    <div className="welcome-page">
      <div className="welcome-bg-shapes">
        <div className="welcome-shape welcome-shape--1" />
        <div className="welcome-shape welcome-shape--2" />
      </div>

      <div className="welcome-card">
        <div className="welcome-icon">🏛️</div>
        <h1 className="welcome-title">Welcome to <span>AK E-Services</span></h1>
        <p className="welcome-subtitle">Please enter your details to continue</p>

        <form className="welcome-form" onSubmit={handleSubmit}>
          <div className="welcome-field">
            <span className="welcome-field-icon">👤</span>
            <input
              type="text"
              className="input"
              placeholder="Your Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="welcome-field">
            <span className="welcome-field-icon">📱</span>
            <input
              type="tel"
              className="input"
              placeholder="10-digit Mobile Number"
              pattern="[0-9]{10}"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="welcome-btn" disabled={loading}>
            {loading ? <span className="login-spinner" /> : <>🚀 Continue</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  SENDER PAGE  —  split-screen, blue theme
// ═════════════════════════════════════════════════════════════
function SenderPage({ requests, chats, stats, fetchAll }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const stored = localStorage.getItem('ak_customer');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const handleLogout = () => {
    localStorage.removeItem('ak_customer');
    setCustomer(null);
  };

  if (!customer) {
    return <CustomerWelcome onRegister={(c) => setCustomer(c)} />;
  }

  return <SenderDashboard customer={customer} requests={requests} chats={chats} stats={stats} fetchAll={fetchAll} onLogout={handleLogout} />;
}

function SenderDashboard({ customer, requests, chats, stats, fetchAll, onLogout }) {
  const [serviceType, setServiceType] = useState('Aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');
  const docCfg = SERVICE_CONFIG[serviceType];

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          customer_name: customer.name,
          contact_number: customer.number,
          document_number: documentNumber
        })
      });
      if (res.ok) {
        setDocumentNumber('');
        fetchAll();
        alert('✅ Request submitted to Admin!');
      } else {
        const e = await res.json(); alert(e.error || 'Submission failed');
      }
    } catch { alert('Cannot reach server'); }
  };

  return (
    <div className="sender-page" style={{
      '--theme-focus-color': 'var(--clr-primary)',
      '--theme-focus-shadow': 'var(--shadow-input)',
      '--theme-btn-color': 'var(--clr-primary)',
      '--theme-btn-hover': 'var(--clr-primary-hover)',
    }}>

      {/* ── Left branding panel ── */}
      <section className="sender-panel-left">
        <div className="sender-panel-left__overlay" />
        <div className="sender-panel-left__content">
          <div className="brand">
            <div className="brand__icon">🏛️</div>
            <h1 className="brand__name">AK <span>E-Services</span></h1>
          </div>

          <div className="panel-tagline">
            <h2>Your Gateway to<br />Digital Government<br />Services</h2>
            <p>
              Submit Aadhaar, PAN, PATTA, EB Bill, Voter ID, Money Transfer
              and Insurance requests online — tracked and processed by our
              dedicated admin team in real time.
            </p>
          </div>

          <div className="left-stats-strip">
            <div className="left-stat-box">
              <div className="left-stat-num">{stats.total}</div>
              <div className="left-stat-label">📊 Total Tickets</div>
            </div>
            <div className="left-stat-box" style={{ borderLeft: '3px solid var(--clr-pending)' }}>
              <div className="left-stat-num">{stats.pending}</div>
              <div className="left-stat-label">⏳ Pending</div>
            </div>
            <div className="left-stat-box" style={{ borderLeft: '3px solid var(--clr-inprogress)' }}>
              <div className="left-stat-num">{stats.in_progress}</div>
              <div className="left-stat-label">🔄 In Progress</div>
            </div>
            <div className="left-stat-box" style={{ borderLeft: '3px solid var(--clr-completed)' }}>
              <div className="left-stat-num">{stats.completed}</div>
              <div className="left-stat-label">✅ Completed</div>
            </div>
          </div>

          {/* Link to Admin page */}
          <a href="/admin" className="page-switch-link">👑 Admin Panel →</a>
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="sender-panel-right">
        <div className="sender-panel-right__inner">

          {/* Customer greeting banner */}
          <div className="customer-banner">
            <div className="customer-banner__info">
              <span className="customer-banner__avatar">👤</span>
              <div>
                <div className="customer-banner__name">Hello, {customer.name}!</div>
                <div className="customer-banner__number">📱 {customer.number}</div>
              </div>
            </div>
            <button className="customer-banner__switch" onClick={onLogout}>Not you?</button>
          </div>

          {/* Service Request Form */}
          <div className="card">
            <h2 className="card__title">📝 New Service Request</h2>
            <form onSubmit={submit} className="form-grid">

              {/* Service selector — full width */}
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Service Type</label>
                <select
                  className="input"
                  value={serviceType}
                  onChange={(e) => { setServiceType(e.target.value); setDocumentNumber(''); }}
                >
                  {Object.keys(SERVICE_CONFIG).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic document field — full width */}
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>{docCfg.label}</label>
                <input
                  key={serviceType}
                  className="input"
                  type="text"
                  placeholder={docCfg.placeholder}
                  pattern={docCfg.pattern || undefined}
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  required
                />
                <span className="field-hint">ℹ️ {docCfg.hint}</span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn-primary">🚀 Submit to Admin Queue</button>
              </div>
            </form>
          </div>

          {/* Pending work count */}
          <div className="card pending-summary-card">
            <div className="pending-summary">
              <div className="pending-summary__icon">⏳</div>
              <div className="pending-summary__info">
                <div className="pending-summary__count">{stats.pending + stats.in_progress}</div>
                <div className="pending-summary__label">Works Pending</div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="card">
            <h2 className="card__title">💬 Chat with Admin</h2>
            <ChatModule chats={chats} isAdmin={false} fetchAll={fetchAll} customerName={customer.name} />
          </div>

          <footer className="page-footer">
            AK E-Services Portal v1.2.0 · Secured Government & Utility Support
          </footer>
        </div>
      </section>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  ADMIN LOGIN PAGE  —  premium glassmorphism login
// ═════════════════════════════════════════════════════════════
function AdminLoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('ak_admin_auth', JSON.stringify({ username: data.user.username }));
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background shapes */}
      <div className="login-bg-shapes">
        <div className="login-shape login-shape--1" />
        <div className="login-shape login-shape--2" />
        <div className="login-shape login-shape--3" />
      </div>

      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-brand-icon">👑</div>
            <h1 className="login-brand-title">AK <span>E-Services</span></h1>
            <p className="login-brand-subtitle">Admin Control Center</p>
            <div className="login-brand-features">
              <div className="login-feature">
                <span className="login-feature-icon">🛡️</span>
                <span>Secure Access</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">📊</span>
                <span>Real-time Dashboard</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">💬</span>
                <span>Customer Chat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right login form */}
        <div className="login-form-panel">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access the admin dashboard</p>
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login-username">Username</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">👤</span>
                <input
                  id="login-username"
                  type="text"
                  className="input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>🔐 Sign In</>
              )}
            </button>

            <a href="/" className="login-back-link">← Back to Sender Portal</a>
          </form>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  ADMIN PAGE  —  full-width dashboard, orange theme
// ═════════════════════════════════════════════════════════════
function AdminPage({ requests, chats, stats, fetchAll, onLogout }) {

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE}/requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAll();
    } catch { alert('Update failed'); }
  };

  const removeRequest = async (id) => {
    try {
      await fetch(`${API_BASE}/requests/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch { alert('Remove failed'); }
  };

  const clearChats = async () => {
    try {
      await fetch(`${API_BASE}/chats`, { method: 'DELETE' });
      fetchAll();
    } catch { alert('Clear failed'); }
  };

  return (
    <div className="admin-page" style={{
      '--theme-focus-color': 'var(--clr-admin)',
      '--theme-focus-shadow': 'var(--shadow-admin)',
      '--theme-btn-color': 'var(--clr-admin)',
      '--theme-btn-hover': 'var(--clr-admin-hover)',
    }}>

      {/* ── Header ── */}
      <header className="admin-header">
        <div className="admin-header__brand">
          <div className="admin-header__icon">👑</div>
          <div>
            <div className="admin-header__title">AK E-Services <span>Admin</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="admin-header__badge">
            <span className="live-dot" /> LIVE
          </div>
          <a href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.2)', padding: '0.35rem 0.9rem', borderRadius: '20px' }}>
            📱 Sender Portal
          </a>
          <button onClick={onLogout} className="admin-logout-btn">
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="admin-body">

        {/* ── Stats Row ── */}
        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--total">📊</div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{stats.total}</div>
              <div className="admin-stat-label">Total Tickets</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--pending">⏳</div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{stats.pending}</div>
              <div className="admin-stat-label">Pending</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--progress">🔄</div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{stats.in_progress}</div>
              <div className="admin-stat-label">In Progress</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--completed">✅</div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{stats.completed}</div>
              <div className="admin-stat-label">Completed</div>
            </div>
          </div>
        </div>

        {/* ── Queue + Chat ── */}
        <div className="admin-main-grid">

          {/* Service Queue */}
          <div className="card">
            <h2 className="card__title">📋 Incoming Service Queue</h2>
            <div className="admin-queue-list">
              {requests.length === 0
                ? <div className="empty-state">No requests in queue.</div>
                : requests.map(t => (
                  <div key={t.id} className="admin-queue-card">
                    <div className="aq-header">
                      <div>
                        <div className="aq-name">
                          <span className="aq-badge">#{t.id}</span>{t.customer_name}
                        </div>
                        <div className="aq-service">Service: <strong>{t.service_type}</strong></div>
                      </div>
                      <span className={`status-pill ${statusClass(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="aq-details">
                      <div className="aq-detail-item">
                        <span className="aq-detail-label">Mobile</span>
                        <span className="aq-detail-val">{t.contact_number}</span>
                      </div>
                      <div className="aq-detail-item">
                        <span className="aq-detail-label">{SERVICE_CONFIG[t.service_type]?.label || 'Document'}</span>
                        <span className="aq-detail-val">{t.document_number}</span>
                      </div>
                      <div className="aq-detail-item">
                        <span className="aq-detail-label">Submitted</span>
                        <span className="aq-detail-val">{formatTime(t.created_at)}</span>
                      </div>
                    </div>

                    <div className="aq-actions">
                      {t.status === 'pending' && (
                        <button className="aq-btn aq-btn--process"
                          onClick={() => updateStatus(t.id, 'in_progress')}>
                          🔄 Start Processing
                        </button>
                      )}
                      {t.status === 'in_progress' && (
                        <button className="aq-btn aq-btn--complete"
                          onClick={() => updateStatus(t.id, 'completed')}>
                          ✅ Mark Completed
                        </button>
                      )}
                      {t.status !== 'pending' && (
                        <button className="aq-btn aq-btn--reset"
                          onClick={() => updateStatus(t.id, 'pending')}>
                          ↩ Reset
                        </button>
                      )}
                      {t.status === 'completed' && (
                        <button className="aq-btn aq-btn--remove"
                          onClick={() => removeRequest(t.id)}>
                          🗑 Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Admin Chat */}
          <div className="card">
            <div className="card__title-row">
              <h2 className="card__title">💬 Customer Chat</h2>
              {chats.length > 0 && (
                <button className="clear-chat-btn" onClick={clearChats}>
                  🗑 Clear Chat
                </button>
              )}
            </div>
            <ChatModule chats={chats} isAdmin={true} fetchAll={fetchAll} />
          </div>
        </div>

        <footer className="page-footer">
          AK E-Services Admin Panel v1.2.0 · Staff Only Access
        </footer>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  ROOT — renders the right page based on URL
// ═════════════════════════════════════════════════════════════
export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ak_admin_auth');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const { requests, chats, stats, fetchAll } = useAppData();

  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('ak_admin_auth');
    setAdminUser(null);
  };

  if (route === 'admin') {
    if (!adminUser) {
      return <AdminLoginPage onLogin={(user) => setAdminUser(user)} />;
    }
    return <AdminPage requests={requests} chats={chats} stats={stats} fetchAll={fetchAll} onLogout={handleLogout} />;
  }
  return <SenderPage requests={requests} chats={chats} stats={stats} fetchAll={fetchAll} />;
}
