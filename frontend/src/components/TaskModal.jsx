import { useState, useEffect } from 'react';
import { X, Send, Pencil, Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TaskModal({ task, projectId, members, onClose, onSave, onDelete }) {
  const { user } = useAuth();
  const isEdit = !!task?.id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    column: task?.column || 'To Do',
    assigneeId: task?.assigneeId || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('details');
  const [editingComment, setEditingComment] = useState(null);

  useEffect(() => {
    if (isEdit) {
      api.get(`/comments/task/${task.id}`).then(r => setComments(r.data)).catch(() => {});
    }
  }, [task?.id]);

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = { ...form, projectId, assigneeId: form.assigneeId || null };
      if (isEdit) {
        const res = await api.put(`/tasks/${task.id}`, payload);
        onSave(res.data);
      } else {
        const res = await api.post('/tasks', payload);
        onSave(res.data);
      }
      onClose();
      toast.success(isEdit ? 'Task updated' : 'Task created');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      if (editingComment) {
        const res = await api.put(`/comments/${editingComment.id}`, { text: commentText });
        setComments(p => p.map(c => c.id === editingComment.id ? res.data : c));
        setEditingComment(null);
      } else {
        const res = await api.post('/comments', { taskId: task.id, text: commentText });
        setComments(p => [...p, res.data]);
      }
      setCommentText('');
    } catch (e) {
      toast.error('Failed to save comment');
    }
  };

  const deleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(p => p.filter(c => c.id !== id));
    } catch { toast.error('Failed to delete comment'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {isEdit && <button className="btn btn-danger btn-sm" onClick={() => { onDelete(task.id); onClose(); }}><Trash2 size={13} /> Delete</button>}
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Tabs (only for editing) */}
        {isEdit && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
            {['details', 'comments'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', background: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t ? 'var(--primary)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {t} {t === 'comments' && comments.length > 0 ? `(${comments.length})` : ''}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body" style={{ paddingTop: 20 }}>
          {tab === 'details' ? (
            <>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="input" placeholder="Task title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input" placeholder="Add details..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Column</label>
                  <select className="input" value={form.column} onChange={e => setForm(p => ({ ...p, column: e.target.value }))}>
                    {COLUMNS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    {PRIORITIES.map(pr => <option key={pr} value={pr} style={{ textTransform: 'capitalize' }}>{pr.charAt(0).toUpperCase() + pr.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="input" value={form.assigneeId} onChange={e => setForm(p => ({ ...p, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</button>
              </div>
            </>
          ) : (
            <>
              {/* Comments */}
              <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
                {comments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No comments yet</div>
                ) : comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {c.user?.avatar || c.user?.name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.user?.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                        {c.updatedAt !== c.createdAt && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text)', background: 'var(--surface2)', padding: '8px 12px', borderRadius: 8 }}>{c.text}</p>
                      {c.userId === user.id && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <button onClick={() => { setEditingComment(c); setCommentText(c.text); }} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deleteComment(c.id)} style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea className="input" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ minHeight: 60, flex: 1 }} onKeyDown={e => e.key === 'Enter' && e.ctrlKey && addComment()} />
                <button className="btn btn-primary btn-icon" onClick={addComment} style={{ alignSelf: 'flex-end', padding: '10px' }}>
                  <Send size={16} />
                </button>
              </div>
              {editingComment && (
                <button onClick={() => { setEditingComment(null); setCommentText(''); }} style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>
                  Cancel editing
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
