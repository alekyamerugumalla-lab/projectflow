# 🚀 ProjectFlow — Collaborative Project Management Tool

A full-stack project management application similar to Trello/Asana, built with **Node.js + Express** (backend) and **React + Vite** (frontend).

## ✨ Features

- **Auth system** — Register/Login with JWT tokens and bcrypt password hashing
- **Project boards** — Create group projects with custom colors
- **Kanban board** — Drag-and-drop task cards across columns (To Do, In Progress, Review, Done)
- **Task management** — Create, edit, delete tasks with priority, due dates, and assignees
- **Team collaboration** — Invite members to projects by searching users
- **Comments** — Comment and communicate within tasks (edit/delete your own)
- **Real-time updates** — WebSocket-powered live notifications and board updates
- **Notifications** — In-app notification bell with unread count

## 🗂 Project Structure

```
projectflow/
├── backend/
│   ├── src/
│   │   ├── routes/       # auth, projects, tasks, comments
│   │   ├── middleware/   # JWT auth middleware
│   │   ├── models/       # In-memory DB (swap with MongoDB/PostgreSQL)
│   │   └── server.js     # Express + WebSocket server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, TaskCard, TaskModal, CreateProjectModal
│   │   ├── pages/        # AuthPage, Dashboard, ProjectBoard, Notifications
│   │   ├── context/      # AuthContext
│   │   ├── hooks/        # useWebSocket
│   │   └── utils/        # axios API client
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables

**Backend** (`backend/.env`):
```
PORT=3001
JWT_SECRET=your_super_secret_key
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/users/search?q=` | Search users |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| POST | `/api/projects/:id/members` | Invite member |
| GET | `/api/tasks/project/:id` | Get tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/comments/task/:id` | Get comments |
| POST | `/api/comments` | Add comment |
| PUT | `/api/comments/:id` | Edit comment |
| DELETE | `/api/comments/:id` | Delete comment |

## 🔄 WebSocket Events

The server broadcasts real-time events to project members:
- `task_created` — New task added
- `task_updated` — Task modified (column, assignee, etc.)
- `task_deleted` — Task removed
- `new_comment` — Comment added to task
- `notification` — General notification (invite, assignment)

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Pure CSS with CSS variables |
| HTTP | Axios |
| Real-time | WebSocket (ws) |
| Backend | Node.js, Express |
| Auth | JWT + bcryptjs |
| Database | In-memory (replace with MongoDB/PostgreSQL) |

## 📝 Production Considerations

- Replace the in-memory `db` with a real database (PostgreSQL + Prisma recommended)
- Add file upload support for task attachments
- Implement email notifications
- Add role-based permissions (viewer/member/owner)
- Deploy backend to Railway/Render, frontend to Vercel/Netlify
## 📄 License

MIT


