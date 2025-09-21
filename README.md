## clippy.ai — AI Code Builder

![Vite](https://img.shields.io/badge/Vite-5.x-646CFF) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Backend](https://img.shields.io/badge/Backend-Express%20%2B%20TS-000000) ![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)

### What this project does

An interactive AI-powered app builder. Describe what you want to build, and the system collaborates with Anthropic Claude to propose build steps, create/edit files, and preview a working app in-browser using WebContainers. The project is split into a Vite React frontend and a Node/Express TypeScript backend.

- **Frontend**: rich UI for chat-driven build steps, file explorer, Monaco code editor, live preview, and terminal logs. See `frontend/`.
- **Backend**: lightweight Express API that orchestrates prompts to Anthropic Claude Sonnet. See `be/`.

### Why it’s useful (key features)

- **Prompt-to-project**: Turn a plain-text idea into structured build steps.
- **File system simulation**: Create/update files and folders in-memory and mount them into a WebContainer.
- **Code editing**: Monaco-based editor with a modern UI (Tailwind, Radix, lucide-react).
- **Live preview + logs**: Run and preview directly in the browser with terminal-style logs.
- **Extendable**: Clear separation between frontend and backend with simple REST endpoints.

### Tech stack

- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Radix UI, lucide-react, `@monaco-editor/react`, `@webcontainer/api`, react-router-dom
- **Backend**: Node.js, Express, TypeScript, `@anthropic-ai/sdk`, CORS, dotenv
- **Deployment**: Vercel (root `vercel.json` for frontend, `be/vercel.json` for backend)

---

## Getting started

### Prerequisites

- Node.js 18+ and npm
- An Anthropic API key (set as `ANTHROPIC_API_KEY` for the backend)

### Clone and install

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../be
npm install
```

### Configure environment (backend)

Create `be/.env` with your Anthropic key:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

The backend reads configuration via dotenv. CORS is pre-configured to allow local Vite (`http://localhost:5173`). See `be/src/index.ts`.

### Run locally (two terminals)

```bash
# Terminal 1 — Backend
cd be
npm run dev   # builds TypeScript and runs dist/index.js on http://localhost:3000

# Terminal 2 — Frontend
cd frontend
npm run dev   # starts Vite on http://localhost:5173
```

The frontend will call the backend URL from `frontend/src/config.ts`:

- Development: `http://localhost:3000`
- Production: `https://be-neon.vercel.app`

Open `http://localhost:5173`, enter an idea, and watch the build steps, files, and preview update.

### Build for production

```bash
# Frontend bundle
cd frontend
npm run build   # outputs to frontend/dist

# Backend compile
cd ../be
npm run build   # outputs to be/dist
```

---

## Usage examples

### API (backend)

- POST `/template`
  - Request body: `{ "prompt": "A todo list app" }`
  - Response: `{ "prompts": string[], "uiPrompts": string[] }`

- POST `/chat`
  - Request body: `{ "messages": [{ "role": "user" | "assistant", "content": string }] }`
  - Response: `{ "response": string }`

Quick test with curl (ensure backend is running):

```bash
curl -sS -X POST http://localhost:3000/template \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"A simple weather app"}'

curl -sS -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Generate initial steps"}]}'
```

Frontend routing lives in `frontend/src/App.tsx` with pages under `frontend/src/pages/`.

Key UI components:
- Chat: `frontend/src/components/BuildStepsChat.tsx`
- Files: `frontend/src/components/FileExplorer.tsx`
- Editor: `frontend/src/components/CodeEditor.tsx`
- Preview: `frontend/src/components/PreviewFrame.tsx`
- Terminal: `frontend/src/components/Terminal.tsx`

---

## Deployment

- Root Vercel config builds the frontend: see [`vercel.json`](vercel.json) (builds `frontend/` and serves `frontend/dist`).
- Backend is deployed separately as a Vercel Serverless Function: see [`be/vercel.json`](be/vercel.json).
- Frontend production chooses the backend URL based on `import.meta.env.PROD` in [`frontend/src/config.ts`](frontend/src/config.ts).

To deploy with Vercel, connect the repo and ensure the backend project (in `be/`) is configured with the `ANTHROPIC_API_KEY` environment variable.

---

## Where to get help

- Open an issue on GitHub: `https://github.com/polhuang/clippy-ai` (issues)
- Review source files for examples and configuration:
  - Frontend: [`frontend/`](frontend/)
  - Backend: [`be/`](be/)
  - Backend entrypoint: [`be/src/index.ts`](be/src/index.ts)
  - Frontend backend config: [`frontend/src/config.ts`](frontend/src/config.ts)

---

## Contributing

Contributions are welcome! A quick workflow:

1. Fork and create a feature branch
2. For the frontend, run `npm run dev` and `npm run lint` in `frontend/`
3. For the backend, run `npm run dev` in `be/` with `ANTHROPIC_API_KEY` set
4. Submit a pull request with a clear description and screenshots/GIFs where helpful

If you plan a large change, consider opening a discussion or small draft PR first.

---

## Maintainers

Maintained by the project authors. If you use this project in the wild, feel free to open an issue to share feedback and ideas.

---

## License

This repository includes code under the ISC license (see package metadata). If a `LICENSE` file is added, it will take precedence for legal terms.

