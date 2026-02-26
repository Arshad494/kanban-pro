# KanbanPro — Enterprise Project Management

A production-grade Kanban board application built with React + TypeScript + Tailwind CSS, inspired by Linear, Notion, and ClickUp.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Features

| Feature | Details |
|---------|---------|
| **Kanban Board** | 5-column board (Backlog → Done) with drag-and-drop |
| **Task Management** | Create, edit, delete, move tasks inline |
| **Task Detail Panel** | Slide-over with checklist, comments, assignee, status |
| **Multiple Projects** | Switch between 4 enterprise-grade mock projects |
| **Dashboard** | Progress overview, stats, activity feed |
| **Analytics** | Charts for task distribution, team workload, completion |
| **Shareable Links** | `/shared/:projectId` for view-only board access |
| **Dark/Light Mode** | Full dark mode with system persistence |
| **Search & Filter** | Real-time search, filter by assignee & priority |
| **Toast Notifications** | Feedback on all actions |
| **Persistence** | All data saved to localStorage |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Go to Dashboard |
| `B` | Go to active Board |
| `A` | Go to Analytics |
| `T` | Toggle Dark/Light mode |
| `Esc` | Clear search |
| `Cmd/Ctrl + K` | Focus search |

## Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS v3** — utility-first styling
- **Framer Motion** — animations & transitions
- **@dnd-kit** — accessible drag-and-drop
- **Zustand** — state management with localStorage persistence
- **React Router v6** — client-side routing
- **Recharts** — analytics charts
- **Lucide React** — icons

## Project Structure

```
src/
├── components/
│   ├── ui/           # Atomic components (Avatar, Badge, Button, Modal, Toast, Progress)
│   ├── Sidebar.tsx
│   ├── KanbanColumn.tsx
│   ├── TaskCard.tsx
│   ├── TaskDetailPanel.tsx
│   ├── CreateProjectModal.tsx
│   └── ShareModal.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── BoardPage.tsx
│   ├── AnalyticsPage.tsx
│   └── SharedBoardPage.tsx
├── store/
│   └── useAppStore.ts    # Zustand store with persistence
├── data/
│   ├── mockData.ts       # 4 projects, 22 tasks
│   └── mockUsers.ts      # 7 team members
├── hooks/
│   └── useKeyboardShortcuts.ts
├── types/
│   └── index.ts
└── utils/
    └── index.ts
```

## Deploy

```bash
npm run build
# Upload dist/ to Netlify, or:
npx vercel
```

## Shareable Board URLs

Click **Share** on any board to get a link:
```
http://localhost:5173/shared/p1
```
Anyone with the link sees a read-only board with a "View-only" banner.

## Mock Data

Four enterprise projects pre-loaded:
- **AI Transformation Program** — ML pipeline, governance, dashboards
- **ERP Modernization** — SAP S/4HANA migration
- **Customer Support Automation** — Chatbot, NLP, sentiment analysis
- **Manufacturing Analytics Platform** — IoT, OEE monitoring

Seven team members: PM, Engineer, Business Analyst, QA Engineer, Architect, Frontend Engineer, DevOps Engineer.
