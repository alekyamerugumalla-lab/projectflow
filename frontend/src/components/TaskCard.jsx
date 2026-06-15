import { MessageSquare, Calendar, Pencil, Trash2 } from 'lucide-react';

const PRIORITY_COLORS = {
  low: { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  medium: { bg: '#fefce8', color: '#ca8a04', dot: '#eab308' },
  high: { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  urgent: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
};

export default function TaskCard({ task, onClick, onEdit, onDelete, currentUserId }) {
  const p = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.column !== 'Done';

  return (
    <div
      onClick={() => onClick(task)}
      className="card"
      style={{ padding: '12px 14px', cursor: 'pointer', marginBottom: 8, transition: 'box-shadow 0.15s', borderLeft: `3px solid ${p.dot}` }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{task.title}</p>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => onEdit(task)} title="Edit">
            <Pencil size={13} />
          </button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 4, color: 'var(--danger)' }} onClick={() => onDelete(task.id)} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: p.bg, color: p.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {task.priority}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.dueDate && (
            <span style={{ fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={11} />
              {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.commentCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <MessageSquare size={11} /> {task.commentCount}
            </span>
          )}
          {task.assignee && (
            <div title={task.assignee.name} style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
              {task.assignee.avatar || task.assignee.name?.[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
