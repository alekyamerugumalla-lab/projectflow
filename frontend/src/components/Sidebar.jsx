import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Bell, LogOut, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

function getAvatarColor(name = '') {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Sidebar({ notifCount, onCreateProject }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: notifCount },
  ];

  return (
    <aside style={{
      width: collapsed ? 64 : 220, background: '#1e1b4b', color: 'white',
      display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0,
      position: 'relative', zIndex: 10
    }}>
      {/* Header */}
      <div style={{ padding: collapsed ? '16px 12px' : '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>🚀</div>
        {!collapsed && <span style={{ fontWeight: 800, fontSize: 16 }}>ProjectFlow</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
              borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s', position: 'relative',
              background: active ? 'rgba(99,102,241,0.3)' : 'transparent',
              color: active ? 'white' : 'rgba(255,255,255,0.65)'
            }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>}
              {badge > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', borderRadius: 9999, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}

        {!collapsed && (
          <button onClick={onCreateProject} className="btn" style={{ marginTop: 8, background: 'rgba(99,102,241,0.2)', color: 'rgba(255,255,255,0.9)', border: '1px dashed rgba(255,255,255,0.2)', justifyContent: 'center', fontSize: 13 }}>
            <Plus size={15} /> New Project
          </button>
        )}
      </nav>

      {/* User + collapse */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: getAvatarColor(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {user?.avatar || user?.name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          )}
        </div>
        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} />
          {!collapsed && 'Sign out'}
        </button>
      </div>

      {/* Collapse button */}
      <button onClick={() => setCollapsed(p => !p)} style={{ position: 'absolute', top: 16, right: -12, width: 24, height: 24, borderRadius: '50%', background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11 }}>
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
