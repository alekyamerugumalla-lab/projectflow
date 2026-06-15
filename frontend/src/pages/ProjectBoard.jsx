import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, ArrowLeft, Settings, X, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { useAuth } from '../context/AuthContext';

const COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];
const COLUMN_COLORS = { 'To Do': '#64748b', 'In Progress': '#3b82f6', 'Review': '#f59e0b', 'Done': '#10b981' };

export default function ProjectBoard({ onWsMessage }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | { task?, column? }
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [dragTask, setDragTask] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/projects/${id}`), api.get(`/tasks/project/${id}`)]).then(([pr, tr]) => {
      setProject(pr.data);
      setTasks(tr.data);
    }).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [id]);

  // Handle real-time updates
  useEffect(() => {
    if (!onWsMessage) return;
    const handler = (msg) => {
      if (msg.type === 'task_created') setTasks(p => [...p, msg.task]);
      else if (msg.type === 'task_updated') setTasks(p => p.map(t => t.id === msg.task.id ? msg.task : t));
      else if (msg.type === 'task_deleted') setTasks(p => p.filter(t => t.id !== msg.taskId));
    };
    // Store on window for App to forward
    window.__boardHandler = handler;
    return () => { delete window.__boardHandler; };
  }, []);

  const filtered = tasks.filter(t =>
    !searchQ || t.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.assignee?.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  const byColumn = (col) => filtered.filter(t => t.column === col);

  const handleSave = (task) => {
    setTasks(p => p.find(t => t.id === task.id) ? p.map(t => t.id === task.id ? task : t) : [...p, task]);
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(p => p.filter(t => t.id !== taskId));
    toast.success('Task deleted');
  };

  const onDragStart = (e, task) => {
    setDragTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = async (e, col) => {
    e.preventDefault();
    if (!dragTask || dragTask.column === col) return;
    const updated = { ...dragTask, column: col };
    setTasks(p => p.map(t => t.id === dragTask.id ? updated : t));
    await api.put(`/tasks/${dragTask.id}`, { column: col });
    setDragTask(null);
  };

  const isOwner = project?.members?.find(m => m.id === user?.id)?.role === 'owner';

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading board...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: project?.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            📋
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>{project?.name}</h1>
            {project?.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{project.description}</p>}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Members */}
            <div style={{ display: 'flex', marginRight: 4 }}>
              {project?.members?.slice(0, 5).map((m, i) => (
                <div key={m.id} title={`${m.name} (${m.role})`} style={{ width: 30, height: 30, borderRadius: '50%', background: ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981'][i%5], border: '2px solid white', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', zIndex: 5 - i }}>
                  {m.avatar || m.name?.[0]}
                </div>
              ))}
            </div>
            {isOwner && <button className="btn btn-secondary btn-sm" onClick={() => setInviteModal(true)}><UserPlus size={14} /> Invite</button>}
            <button className="btn btn-primary btn-sm" onClick={() => setTaskModal({ column: 'To Do' })}><Plus size={14} /> Task</button>
          </div>
        </div>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search tasks..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: 16, padding: '16px 24px', flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        {COLUMNS.map(col => {
          const colTasks = byColumn(col);
          return (
            <div key={col} style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => onDrop(e, col)}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLUMN_COLORS[col] }} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{col}</span>
                  <span style={{ background: 'var(--surface2)', color: 'var(--text-secondary)', borderRadius: 9999, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{colTasks.length}</span>
                </div>
                <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => setTaskModal({ column: col })} title="Add task">
                  <Plus size={15} />
                </button>
              </div>
              {/* Tasks */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2px 2px 8px' }}>
                {colTasks.map(task => (
                  <div key={task.id} draggable onDragStart={e => onDragStart(e, task)}>
                    <TaskCard
                      task={task}
                      onClick={(t) => setTaskModal({ task: t })}
                      onEdit={(t) => setTaskModal({ task: t })}
                      onDelete={handleDelete}
                      currentUserId={user?.id}
                    />
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {taskModal && (
        <TaskModal
          task={taskModal.task}
          projectId={id}
          members={project?.members || []}
          onClose={() => setTaskModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          defaultColumn={taskModal.column}
        />
      )}

      {/* Invite Modal */}
      {inviteModal && <InviteModal projectId={id} onClose={() => setInviteModal(false)} onInvited={m => setProject(p => ({ ...p, members: [...p.members, m] }))} />}
    </div>
  );
}

function InviteModal({ projectId, onClose, onInvited }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await api.get(`/auth/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const invite = async (userId) => {
    try {
      const res = await api.post(`/projects/${projectId}/members`, { userId });
      onInvited(res.data);
      toast.success('Member added!');
      setResults(r => r.filter(u => u.id !== userId));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to invite');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Members</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <input className="input" placeholder="Search by name or email..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
          <div style={{ marginTop: 12 }}>
            {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Searching...</p>}
            {!loading && q && results.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No users found</p>}
            {results.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{u.avatar || u.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => invite(u.id)}>Add</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
