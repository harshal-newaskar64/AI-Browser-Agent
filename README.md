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

### 🤖 Unified AI Chatbot  
One chatbot handles everything:
- Bookmark questions  
- Email questions  
- WhatsApp chat questions  
- General AI conversation  

AI intelligently picks the right context.

---

## 🛠️ Tech Stack

- **Frontend:** Chrome Extension (JS, HTML, CSS)  
- **Backend:** Python Flask  
- **AI Model:** Groq LLM  
- **Storage:** Chrome local storage  
- **Deployment:** Render / Railway-ready  

---

## 📁 Project Structure

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

### 1️⃣ Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Environment variables (.env):

GROQ_API_KEY=your_key_here
2️⃣ Chrome Extension

Go to chrome://extensions/

Enable Developer Mode

Click Load Unpacked

Select the extension/ folder

🌐 Deployment (Render)

Connect GitHub repo

Build command: pip install -r backend/requirements.txt

Start command: gunicorn app:app

Add environment variable: GROQ_API_KEY

🏆 Highlights

Fast AI summarization via Groq

Unified memory across bookmarks, emails, and chats

Clean Chrome extension UI

Works on real-world content (WhatsApp Web, Gmail, articles)
