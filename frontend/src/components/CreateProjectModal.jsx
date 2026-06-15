import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#f97316'];

export default function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return toast.error('Project name is required');
    setSaving(true);
    try {
      const res = await api.post('/projects', form);
      onCreated(res.data);
      onClose();
      toast.success('Project created!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="input" placeholder="My Awesome Project" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" placeholder="What's this project about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 70 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer', transition: 'transform 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
