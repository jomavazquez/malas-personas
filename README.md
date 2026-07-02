# Malas Personas

A free, open web game inspired by Cards Against Humanity — playable online with your team or friends, in Spanish and English.

**→ [malaspersonas.com](https://www.malaspersonas.com)**

---

## What is it?

Malas Personas is a card game played in rounds. Each round a judge draws a black question card with a blank, and the rest of the players pick their funniest white answer card. The judge picks the winner, who earns a point. First to the points goal wins.

No install needed — just share a room code and play from any browser.

---

## Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS v4
- Socket.io client
- react-i18next (ES / EN)
- Lenis (smooth scroll)
- canvas-confetti

### Backend
- Node.js + Express
- Socket.io
- Prisma 7 + PostgreSQL
- JWT authentication
- Helmet + rate limiting

### Infrastructure
- Docker + Docker Compose
- Nginx (frontend)
- Nginx Proxy Manager (reverse proxy + SSL)
- Oracle Cloud VM

---

## Features

- 🎮 Real-time multiplayer via WebSockets
- 👤 Guest play — no account required to join
- 🔐 User accounts — create rooms, manage decks, view history
- 🃏 Official decks in Spanish and English (For Everyone / No Filters)
- 📦 Custom decks — registered users can create their own cards
- ⏱️ 60-second timer per round with auto-play
- 🏆 End-of-game leaderboard with confetti
- 🌍 Full i18n support (ES / EN)
- 📱 Responsive — works on mobile and desktop

---

## Project Structure

```
malas-personas/
├── frontend/           # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── types/
└── backend/            # Node.js + Express + Prisma
    ├── src/
    │   └── config/
    │   └── lib/
    │   └── middleware/
    │   └── modules/
    │       ├── auth/
    │       ├── decks/
    │       ├── game/   # Socket.io game engine
    │       ├── rooms/
    │       └── users/      
    └── prisma/
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker + Docker Compose (for the database)
- PostgreSQL (or use the Docker setup)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/malas-personas.git
cd malas-personas
```

### 2. Run backend and frontend in one time in the root

```bash
npm run dev
```


### 3. Or set up the backend / frontend independently

```bash
cd backend
# Fill in DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev
node prisma/seed.js   # Seeds official decks
npm run dev
```

```bash
cd frontend
# Set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev
```

---

## Environment Variables

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/malas_personas
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Game Flow

```
Create room (host) → Share code → Players join → Host starts
→ Judge draws black card → Players pick white card (60s timer)
→ Judge picks winner → Winner becomes next judge
→ First to N points wins
```

---

## Custom Decks

Registered users can create their own decks with custom black (question) and white (answer) cards. Custom decks appear alongside official ones when creating a room.

---

## Legal

Malas Personas is an independent project and is not affiliated with, sponsored by, or endorsed by Cards Against Humanity LLC. The game mechanic (question/answer cards with a rotating judge) is not subject to copyright. All card content is original.

This project is free to play and not monetised.

---

## License

MIT