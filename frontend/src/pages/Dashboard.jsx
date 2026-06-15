import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, Users, Plus } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#f97316'];

export default function Dashboard({ onCreateProject }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, tasks: 0, due: 0, members: new Set() });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(res => {
      setProjects(res.data);
      const allTasks = res.data.reduce((s, p) => s + (p.taskCount || 0), 0);
      const allMembers = new Set(res.data.flatMap(p => p.members?.map(m => m.id) || []));
      setStats({ total: res.data.length, tasks: allTasks, members: allMembers });
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Projects', value: stats.total, icon: FolderKanban, color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Total Tasks', value: stats.tasks, icon: CheckSquare, color: '#10b981', bg: '#d1fae5' },
    { label: 'Collaborators', value: stats.members.size, icon: Users, color: '#f59e0b', bg: '#fef3c7' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here's what's happening with your projects</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your Projects</h2>
        <button className="btn btn-primary btn-sm" onClick={onCreateProject}><Plus size={14} /> New Project</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No projects yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={onCreateProject}><Plus size={15} /> Create Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projects.map((p, i) => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: 20, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: p.color || COLORS[i % COLORS.length], marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderKanban size={20} color="white" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--text)' }}>{p.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description || 'No description'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex' }}>
                    {(p.members || []).slice(0, 4).map((m, mi) => (
                      <div key={m.id} title={m.name} style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS[mi % COLORS.length], border: '2px solid white', marginLeft: mi > 0 ? -6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                        {m.avatar || m.name?.[0]}
                      </div>
                    ))}
                    {p.members?.length > 4 && <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface2)', border: '2px solid white', marginLeft: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-secondary)' }}>+{p.members.length - 4}</div>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.taskCount || 0} tasks</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
