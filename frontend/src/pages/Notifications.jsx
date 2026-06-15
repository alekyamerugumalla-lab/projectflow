import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../utils/api';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects/notifications/all').then(r => setNotifs(r.data)).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.put(`/projects/notifications/${id}/read`);
    setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await Promise.all(notifs.filter(n => !n.read).map(n => api.put(`/projects/notifications/${n.id}/read`)));
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  const icons = { project_invite: '📁', task_assigned: '✅', comment: '💬' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Notifications</h1>
        {notifs.some(n => !n.read) && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}><CheckCheck size={14} /> Mark all read</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : notifs.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Bell size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>All caught up!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No notifications yet.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifs.map((n, i) => (
            <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', background: n.read ? 'transparent' : 'var(--primary-light)', borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none', cursor: n.read ? 'default' : 'pointer', transition: 'background 0.15s' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icons[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: n.read ? 400 : 600, color: 'var(--text)' }}>{n.message}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
