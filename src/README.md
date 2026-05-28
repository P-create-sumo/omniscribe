# 🚀 NEXUS Intelligence Platform

---

> [!NOTE]
> ## 📢 BETA TESTERS WANTED
>
> Stiamo aprendo la piattaforma a un gruppo selezionato di tester esterni — **Data Engineers, AI Architects, Power Users**.
>
> Se vuoi testare l'orchestrazione agentica sui tuoi dati:
> - 💬 Apri una discussione nella sezione [**Discussions**](../../discussions)
> - ✋ Candidati lasciando un feedback nella sezione [**Issues**](../../issues)
>
> Il tuo contributo è fondamentale per portare NEXUS alla v1.0! 🙏

---

> Transform your books, notes, and documents into specialized AI experts you can chat with.

![SuperAgents Banner](https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&h=400&fit=crop)

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📖 What is SuperAgents?

**SuperAgents** is an open-source platform that lets you upload your own documents — books, university courses, lecture notes, PDFs, audio files — and instantly create a specialized AI expert for each discipline. Instead of generic chatbot answers, every response is grounded in *your* sources.

**Use cases:**
- 📚 Students who want to chat with their textbooks
- 🔬 Researchers who need to query large document collections
- 🏢 Teams that want to build internal knowledge bases
- 🎓 Educators creating interactive course assistants

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Agent** | Create unlimited specialized AI agents, one per discipline |
| 📂 **Multi-Format** | Upload PDF, DOC, TXT, MP3, WAV, MP4, or paste raw text |
| 🔍 **Academic Search** | Search across arXiv, PubMed, Google Scholar, and more |
| 🗂️ **Google Drive** | Import documents directly from your Google Drive |
| 💬 **Context-Aware Chat** | Responses always cite the actual uploaded sources |
| 📧 **AI Tools** | Send email summaries, web search, image generation, TTS |
| 📄 **PDF Export** | Export chat transcripts and AI-generated session summaries |
| 🔌 **Integrations** | Google Calendar, Gmail, Slack, Notion, HubSpot (coming soon) |
| 🌙 **Dark Mode** | Full light/dark theme support |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- A [Base44](https://base44.com) account (free tier available) — used for auth, database, and AI integrations

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/superagents.git
cd superagents

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your Base44 App ID in .env

# 4. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

```env
VITE_BASE44_APP_ID=your_app_id_here
```

> You can find your App ID in the Base44 dashboard under **Settings → General**.

---

## 🏗️ Architecture

```
superagents/
├── src/
│   ├── pages/              # Route-level page components
│   │   ├── Home.jsx        # Agent dashboard
│   │   ├── AgentDetail.jsx # Chat + Knowledge Base + Integrations
│   │   ├── CreateAgent.jsx # Agent creation flow
│   │   └── AcademicSearch.jsx
│   ├── components/
│   │   ├── agents/         # KnowledgeUploader, SourcesList, IntegrationsPanel
│   │   ├── chat/           # ChatInterface, ChatToolbar
│   │   ├── search/         # SearchBar, SearchResults, ResultCard
│   │   └── layout/         # AppLayout, navigation
│   ├── entities/           # Data schemas (SuperAgent, KnowledgeSource, ChatMessage)
│   └── functions/          # Backend serverless functions (Deno)
│       ├── academicSearch.js
│       └── googleDriveFiles.js
```

**Tech Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Base44 BaaS (auth, database, serverless functions)
- **AI:** Claude Sonnet (chat), Gemini Flash (web search), OpenAI (TTS, STT)
- **Animations:** Framer Motion
- **State:** TanStack Query

---

## 🧪 Testing the MVP

This is an **MVP release** — we're looking for community feedback on:

- [ ] Onboarding flow (create agent → upload doc → first chat)
- [ ] Chat response quality and source grounding
- [ ] Academic search relevance across sources
- [ ] Google Drive import reliability
- [ ] PDF export formatting
- [ ] Mobile responsiveness

### How to test

1. Fork & clone the repo
2. Create a free Base44 account and get your App ID
3. Run locally with `npm run dev`
4. Create a SuperAgent, upload a PDF, and start chatting
5. Open an [Issue](../../issues) with your findings — use the **MVP Feedback** template

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then submit a PR
git push origin feature/your-feature-name
```

**Good first issues:** look for the `good first issue` label in the Issues tab.

---

## 🗺️ Roadmap

- [ ] **v0.2** — Real-time integrations (Google Calendar agent actions, Gmail drafts)
- [ ] **v0.3** — Multi-user agent sharing & collaboration
- [ ] **v0.4** — Custom agent personas and system prompts
- [ ] **v0.5** — API access & webhooks for external apps
- [ ] **v1.0** — Self-hosted deployment guide (Docker)

---

## 📸 Screenshots

| Home Dashboard | Agent Chat | Knowledge Base |
|---|---|---|
| ![Home](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop) | ![Chat](https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=250&fit=crop) | ![KB](https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&h=250&fit=crop) |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 💬 Community & Support

- 🐛 **Bug reports:** [Open an issue](../../issues/new?template=bug_report.md)
- 💡 **Feature requests:** [Open a discussion](../../discussions)
- 📧 **Contact:** hello@superagents.ai

---

<div align="center">
  <p>Built with ❤️ using <a href="https://base44.com">Base44</a> + React</p>
  <p>If you find this useful, please ⭐ the repo!</p>
</div>