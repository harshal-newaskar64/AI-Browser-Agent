# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import numpy as np
import os
from dotenv import load_dotenv


class ShortTermMemory:
    def __init__(self, limit=10):
        self.limit = limit
        self.messages = []

    def add(self, role, content):
        self.messages.append({"role": role, "content": content})
        if len(self.messages) > self.limit:
            self.messages.pop(0)

    def get(self):
        return self.messages
app = Flask(__name__)
CORS(app)   # allow Chrome extension to call this backend

# services/groq_client.py

from groq import Groq
import os

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    def chat(self, messages):
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.5
        )
        return response.choices[0].message.content

groq = GroqClient()
memory = ShortTermMemory(limit=15)
user_name = "Harshal Newaskar"


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()

    user_msg = data.get("message", "")
    bookmarks = data.get("bookmarks", [])
    emails = data.get("emails", [])
    chat_msgs = data.get("chat", [])

    # Build context text
    context_sections = []

    if bookmarks:
        bookmark_text = "\n\n".join(
            [f"Title: {b['title']}\nSummary: {b['summary']}" for b in bookmarks]
        )
        context_sections.append(f"[BOOKMARKS]\n{bookmark_text}")

    if emails:
        email_text = "\n\n".join(
            [f"Subject: {e['title']}\nDetails: {e['summary']}" for e in emails]
        )
        context_sections.append(f"[EMAILS]\n{email_text}")

    if chat_msgs:
        chat_text = "\n".join(
            [f"{m['meta']} {m['text']}" for m in chat_msgs]
        )
        context_sections.append(f"[WHATSAPP CHAT]\n{chat_text}")

    full_context = "\n\n".join(context_sections)

    prompt = [
        {
            "role": "system",
            "content": (
                "You are an AI assistant with access to:\n"
                "- Saved bookmarks\n"
                "- Summarized emails\n"
                "- Recent WhatsApp messages\n\n"
                "Rules:\n"
                "1. Use ONLY the relevant section of context based on the user's question.\n"
                "2. If the question is about WhatsApp messages -> answer only from [WHATSAPP CHAT].\n"
                "3. If about emails -> answer from [EMAILS].\n"
                "4. If about bookmarks -> use [BOOKMARKS].\n"
                "5. If general, answer normally.\n"
                "6. Never hallucinate missing facts.\n"
            )
        },
        {
            "role": "user",
            "content": f"Context:\n{full_context}\n\nUser question:\n{user_msg}"
        }
    ]

    reply = call_groq(prompt)
    return jsonify({ "reply": reply })


# ========= LLM CALL HELPER =========
def call_groq(messages):
    """Reusable helper for calling Groq LLM."""
    res = groq.client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.4
    )
    return res.choices[0].message.content


# ========= BOOKMARK ENDPOINT =========
@app.route("/bookmark", methods=["POST"])
def bookmark():
    try:
        data = request.get_json()
        url = data.get("url", "")
        original_title = data.get("title", "")
        full_text = data.get("content", "")

        if not full_text or len(full_text.strip()) < 10:
            return jsonify({"success": False, "error": "No content extracted"}), 400

        # ========== Detect EMAIL ==========
        is_email = (
            "mail.google.com" in url
            or "gmail.com" in url
            or "outlook.com" in url
            or "office.com" in url
        )

        intro_text = full_text[:1500]  # use only intro

        # ========== JSON CLEANUP HELPER ==========
        import re, json

        def extract_json_block(text):
            """Extract the first JSON object from LLM output."""
            try:
                match = re.search(r"\{[\s\S]*\}", text)
                if match:
                    return match.group(0)
                return text
            except:
                return text

        # =====================================================================
        #                            EMAIL MODE
        # =====================================================================
        if is_email:
            email_prompt = [
                {
                    "role": "system",
                    "content":
                    "Extract structured information from an email. "
                    "Return ONLY valid JSON with these fields:\n"
                    "topic: short subject (string)\n"
                    "summary: 2-3 sentences (string)\n"
                    "action_items: list of tasks (array)\n"
                    "deadlines: list of dates/due times (array)\n"
                    "sender: sender name if mentioned (string)\n"
                    "urgency: high | medium | low\n\n"
                    "7. deadline_type: one of ['event', 'assignment', 'meeting', 'other']"
                    "STRICT RULES:\n"
                    "- Output ONLY JSON.\n"
                    "- No explanation.\n"
                    "- No commentary.\n"
                    "- If unsure, guess reasonably.\n"
                    "- Use ONLY the email content provided."
                },
                {
                    "role": "user",
                    "content": f"Email Content:\n\n{intro_text}\n\nReturn ONLY JSON."
                }
            ]

            raw_json = call_groq(email_prompt)
            clean_json = extract_json_block(raw_json)

            try:
                parsed_email = json.loads(clean_json)
            except:
                # fallback safety structure
                parsed_email = {
                    "topic": original_title or "Email",
                    "summary": "Unable to fully parse email.",
                    "action_items": [],
                    "deadlines": [],
                    "sender": "",
                    "urgency": "low"
                }

            bookmark_data = {
                "success": True,
                "mode": "email",
                "url": url,
                "title": parsed_email.get("topic", original_title),
                "summary": parsed_email.get("summary", ""),
                "category": "Email",
                "email_data": parsed_email,
                "has_deadline": len(parsed_email.get("deadlines", [])) > 0,
                "saved_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

            return jsonify(bookmark_data)

        # =====================================================================
        #                        NORMAL WEBPAGE MODE
        # =====================================================================

        overview_prompt = [
            {
                "role": "system",
                "content":
                "You will receive the article title and its introduction. "
                "Write a short abstract describing the overall theme and purpose. "
                "Do NOT summarize details. Explain only the 'what' and 'why'."
            },
            {
                "role": "user",
                "content": f"Title: {original_title}\n\nIntro:\n{intro_text}"
            }
        ]

        overview = call_groq(overview_prompt)

        # Smart Title
        smart_title = call_groq([
            {"role": "system", "content": "Generate a short 5–7 word title."},
            {"role": "user", "content": overview}
        ])

        # Category
        category = call_groq([
            {"role": "system", "content": "Classify the topic using ONE WORD."},
            {"role": "user", "content": overview}
        ])

        bookmark_data = {
            "success": True,
            "mode": "webpage",
            "url": url,
            "original_title": original_title,
            "title": smart_title.strip(),
            "summary": overview.strip(),
            "category": category.strip(),
            "saved_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        return jsonify(bookmark_data)

    except Exception as e:
        print("❌ ERROR in /bookmark:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    

@app.route("/ask_rag", methods=["POST"])
def ask_rag():
    data = request.get_json()
    query = data.get("query", "")
    bookmarks = data.get("bookmarks", [])

    # Build context even if empty
    context_block = ""

    for bm in bookmarks[:12]:
        if bm.get("mode") == "email":
            ed = bm["email_data"]
            context_block += (
                f"\nEMAIL:\n"
                f"Topic: {ed.get('topic')}\n"
                f"Summary: {ed.get('summary')}\n"
                f"Deadlines: {ed.get('deadlines')}\n"
                f"Action Items: {ed.get('action_items')}\n"
            )
        else:
            context_block += (
                f"\nWEBPAGE:\n"
                f"Title: {bm.get('title')}\n"
                f"Summary: {bm.get('summary')}\n"
                f"Category: {bm.get('category')}\n"
            )

    prompt = [
        {
            "role": "system",
            "content":
            "You are an AI assistant that answers questions "
            "using the provided bookmarks and emails as context, only when the query of user is something related to personal, and you have no idea about it. "
            "If context is empty, just say: 'You have no saved bookmarks yet.' "
            "Never ask the user for context. Use what is provided."
            "You can also generally talk with the user, and help them with their queries, even though there's no context given."
        },
        {
            "role": "user",
            "content": f"Query: {query}\n\nContext:\n{context_block}"
        }
    ]

    reply = call_groq(prompt)
    return jsonify({"success": True, "reply": reply})


@app.route("/summarize_chat", methods=["POST"])
def summarize_chat():
    data = request.get_json()
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"summary": "No messages found."})

    chat_text = "\n".join([
        f"{m.get('meta','')} {m.get('text','')}"
        for m in messages
    ])

    prompt = [
        {
            "role": "system",
            "content": (
                "You are an AI assistant summarizing a WhatsApp group chat.\n"
                "Extract only important information:\n"
                "- Key discussions\n"
                "- Decisions made\n"
                "- Tasks or deadlines\n"
                "- Questions asked\n"
                f"- Any message mentioning the user:{user_name}\n"
                "- Any conflicts or arguments\n"
                "Give detailed and meaningful summary of the chats"
            )
        },
        {"role": "user", "content": chat_text}
    ]

    reply = call_groq(prompt)
    return jsonify({ "summary": reply })

@app.route("/", methods=["GET"])
def home():
    return {"status": "Groq Backend Running"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)