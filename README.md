# 🧠 OmniScribe

**Transform your books and courses into AI-powered expert agents.**

OmniScribe lets you upload books, university courses, and documents to create custom AI agents that answer questions, summarize content, and help you learn — on demand.

---

## ✨ Features

- 📚 **Upload any book or course** — PDFs, documents, academic content
- 🤖 **Create custom AI agents** — each trained on your specific material
- 🔍 **Academic search** — find answers directly from your content
- 💬 **Conversational interface** — ask questions naturally
- ⚡ **Powered by Base44** — no backend setup required

## 🚀 Getting Started

```bash
git clone https://github.com/P-create-sumo/omniscribe.git
cd omniscribe
npm install
```

Create a `.env.local` file:

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

Run locally:

```bash
npm run dev
```

## 🛠 Tech Stack

- **React 18** + Vite
- **Tailwind CSS** + Radix UI
- **Base44 SDK** — entities, auth, AI
- **Framer Motion** — animations
- **React Query** — data fetching

## 📦 Project Structure

```
src/
├── pages/          # Home, AgentDetail, CreateAgent, AcademicSearch
├── components/     # Reusable UI components
├── api/            # Base44 client & entity bindings
└── hooks/          # Custom React hooks
```

## 📄 License

MIT — open source, free to use and modify.
