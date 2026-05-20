# AI Chat History — Intelligent Conversation Logging & Threat Analysis Platform

> **🔗 Live Demo:** [https://dbms-assignment-psg9.onrender.com](https://dbms-assignment-psg9.onrender.com)  

---

## Overview

AI Chat History is a full-stack web application that provides a clean, terminal-themed interface for interacting with **Google Gemini AI** while maintaining a complete, searchable log of every conversation. Users can create chat sessions, send messages, bookmark important AI responses, tag sessions for organisation, and search across their entire conversation history.

Beyond its immediate use as a personal AI assistant, the platform is architected as a **conversation auditing and logging system** — making it a strong candidate for enterprise deployment in security-conscious environments.

---

## Enterprise Use Case — Honeypot & Insider Threat Detection

This application can be repurposed as a **corporate AI assistant honeypot** for internal threat monitoring:

| Capability | How It Works |
|---|---|
| **Full Message Logging** | Every user prompt and AI response is stored with timestamps, session context, and user identity |
| **Audit Trail** | The `Audit_Log` table records session deletions — flagging attempts to cover tracks |
| **Session Tagging** | Security teams can tag flagged sessions for review and classification |
| **Cross-Session Context** | Investigators can load historical sessions as context to trace behavioural patterns |
| **Search & Discovery** | Full-text search across all messages enables rapid forensic keyword sweeps |
| **Bookmarking** | Analysts can bookmark suspicious messages with notes for case files |

### Deployment Scenario

A corporate office deploys this as an internal productivity tool — employees use it for day-to-day AI-assisted tasks (code generation, research, drafting). Under the hood, the platform logs all interactions. If an internal threat is suspected (data exfiltration, policy violations, social engineering attempts), the security team can:

1. **Search** for sensitive keywords across all user conversations
2. **Review audit logs** for deleted sessions (potential evidence destruction)
3. **Analyse tagged sessions** flagged by automated or manual review
4. **Trace user behaviour** across sessions using the cross-session context feature
5. **Export bookmarked evidence** for incident response reports

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (Railway-hosted) |
| **AI Engine** | Google Gemini API (`gemini-3-flash-preview`) |
| **Auth** | JWT (JSON Web Tokens) |
| **Deployment** | Railway |

---

## Features

- **🔐 User Authentication** — Register and login with JWT-based session management
- **💬 AI Chat Sessions** — Create, manage, and delete chat sessions with Gemini AI
- **🔍 Full-Text Search** — Search across all messages in all sessions
- **🔖 Bookmarks** — Bookmark AI responses with optional notes
- **🏷️ Tags** — Create tags and assign them to sessions for organisation
- **🔗 Cross-Session Context** — Load a previous session as context for a new conversation
- **📋 Audit Logging** — Tracks session deletions with user identity and timestamps
- **🖥️ Terminal UI** — Dark, hacker-style interface with monospace fonts and cyan accents
- **📝 Markdown Rendering** — AI responses render with proper formatting (code blocks, headings, lists, bold)

---

## Database Schema

```
Users ──┬── Sessions ──┬── Messages
        │              ├── Session_Tags ── Tags
        │              └── Audit_Log
        └── Bookmarks ── Messages
```

**7 Tables:** `Users`, `Sessions`, `Messages`, `Tags`, `Session_Tags`, `Bookmarks`, `Audit_Log`

Key design decisions:
- Cascading deletes from `Users` → `Sessions` → `Messages`
- Indexed foreign keys for fast lookups
- Composite primary key on `Session_Tags` for many-to-many relationships
- `Audit_Log` intentionally does **not** cascade — deletion records persist even after the session is gone

---

## Project Structure

```
DBMS-Assignment/
├── backend/
│   ├── server.js              # Express server & static file serving
│   ├── db.js                  # MySQL connection pool
│   ├── setup-db.js            # Automated schema initialisation
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   └── routes/
│       ├── auth.js            # Login & registration
│       ├── sessions.js        # CRUD sessions + audit logging
│       ├── messages.js        # Chat messages + Gemini API
│       ├── search.js          # Full-text search
│       ├── bookmarks.js       # Bookmark management
│       └── tags.js            # Tag management
├── frontend/
│   ├── index.html             # Login / Register page
│   ├── chat.html              # Main chat interface
│   ├── search.html            # Search page
│   ├── bookmarks.html         # Bookmarks page
│   ├── style.css              # Global styles
│   └── js/
│       ├── auth.js            # Auth logic
│       ├── chat.js            # Chat, tags, context logic
│       ├── search.js          # Search logic
│       └── bookmarks.js       # Bookmarks logic
├── database/
│   ├── schema.sql             # Table definitions
│   ├── procedures.sql         # Stored procedures
│   └── triggers.sql           # Database triggers
└── package.json               # Root orchestration scripts
```

---

## Setup

### Prerequisites
- Node.js (v18+)
- MySQL database (local or cloud-hosted)
- Google Gemini API key

### Environment Variables

Create `backend/.env`:
```env
MYSQL_HOST=your-mysql-host
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DB=ai_chat_db
MYSQL_PORT=3306
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret
PORT=3000
```

### Run Locally

```bash
# Install dependencies
cd backend && npm install && cd ..

# Start the server (auto-initialises database schema)
npm start
```

The app will be available at `http://localhost:3000`.

---
