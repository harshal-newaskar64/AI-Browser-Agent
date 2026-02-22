# 🧠 AI Browser Agent — Chrome Extension + AI Backend

A smart browser assistant that summarizes webpages, WhatsApp chats, and emails, extracts deadlines, manages bookmarks intelligently, and answers questions using a unified AI memory system.

---

## 🚀 Features

### 🔍 Smart Webpage Bookmarking  
- Auto-extracts content  
- Creates concise AI summaries  
- Generates smart titles & categories  
- Lets you ask questions about saved bookmarks  

### 💬 WhatsApp Chat Summarizer  
- Auto-scrolls & loads last ~200 messages  
- Finds decisions, tasks, arguments, mentions  
- Stores chat context for follow-up questions  

### ✉️ Email Understanding  
- Extracts deadlines, tasks, and reminders  
- Saves them into a “Deadlines” section  
- AI can answer questions about your emails  

### 🧠 AI Bookmark LinkFinder (Topic Clustering & Insight Linking)

Save multiple bookmarks and let the AI analyze them **together** to uncover deeper insights.

The AI automatically:
- Finds relationships between your saved pages  
- Detects common themes and overlapping topics  
- Groups similar bookmarks into topic clusters  
- Highlights contradictions or missing information  
- Builds a mini “learning path” based on your saved articles  
- Helps you understand how all your bookmarks connect

This turns your collection of webpages into a **unified knowledge graph**, powered by AI — perfect for research, work, and studying.

### 🤖 Unified AI Chatbot  
One chatbot handles everything:
- Bookmark questions  
- Email questions  
- WhatsApp chat questions  
- General AI conversation  

AI intelligently picks the right context.

### 🔍 Multi-Source Question Answering
Ask real questions like:
> “What do I need to do before Friday?”

The AI checks information across:
- WhatsApp  
- Emails  
- Bookmarks  

…and returns a **single, unified answer**.

---

## 🛠️ Tech Stack

- **Frontend:** Chrome Extension (JS, HTML, CSS)  
- **Backend:** Python Flask  
- **AI Model:** Groq LLM  
- **Storage:** Chrome local storage  
- **Deployment:** Render / Railway-ready  

---

## 📁 Project Structure

### **backend/**
- `app.py` — Flask backend (API routes & LLM logic)
- `requirements.txt` — Backend Python dependencies
- `.env` — Secret API keys (ignored in Git)

### **extension/**
- `manifest.json` — Extension configuration  
- `popup.html` — Extension UI  
- `popup.js` — UI logic + API calls  
- `background.js` — Background service worker  
- `content.js` — Webpage / WhatsApp extraction scripts  
- `styles.css` — Extension styling  
- `icons/` — Extension icons (16, 48, 128)

### Root
- `.gitignore`  
- `README.md`
---

## ⚙️ Setup Instructions

This project has two parts:

1. **Chrome Extension (Frontend)** – what users install and use directly  
2. **AI Backend (Flask + Groq)** – optional, only needed if you want to run your own server

---

## 🧩 1️⃣ Chrome Extension (Frontend) — Quick Setup

You only need to download the `extension/` folder to start using the tool.

### ✔️ Steps:
1. Download or clone this repository.
2. Open Chrome and go to:  
   `chrome://extensions/`
3. Enable **Developer Mode** (top-right corner).
4. Click **Load Unpacked**.
5. Select the **frontend/** folder from the repository.

Your extension is now installed and ready to use.

### ⚠️ Note on Backend Startup Time (Render Free Tier)

The backend API is hosted on **Render’s free tier**, which means the server goes to sleep when inactive.  
When you use the extension after some time, the first request may take **30–60 seconds** while the server wakes up.

After this initial startup, everything works normally and responses are fast.

---

## 🧠 2️⃣ Backend (Optional – Only if running your own AI Server)

If you want to self-host the backend instead of using the deployed API, follow these steps:

### ✔️ Steps:
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## 🏆 Highlights

- Fast AI summarization via Groq
- Unified memory across bookmarks, emails, and chats
- Clean Chrome extension UI
- Works on real-world content (WhatsApp Web, Gmail, articles)


## 🤖 AI & "Vibe Coding" Disclosure

This project embraces AI-assisted development using tools like GitHub Copilot, and LLM-based coding assistant: ChatGPT.  

---

## 📓 Vibe Log — How AI Helped in This Project

- Used AI tools to brainstorm the overall architecture (Chrome Extension + Flask backend + unified memory system).
- Generated initial scaffolding for `content.js`, `background.js`, and bookmark extraction logic.
- Assisted in writing complex DOM extraction for WhatsApp chat parsing.
- Helped shape API request/response patterns for the backend.
- Co-created summarization prompts and extraction logic for Groq LLM.
- Assisted with debugging issues in auto-scrolling, asynchronous fetch logic, and message retrieval limits.
- Helped format and refine the README, deployment steps, and general documentation.
- Contributed to UI copywriting (summary texts, feature descriptions, user-facing messages).
- Provided suggestions for project structure, better modularization, and extension performance improvements.

AI tools acted as **accelerators**, but final decisions, debugging, testing, and system integration were all done manually.
