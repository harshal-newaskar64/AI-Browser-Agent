const API_BASE = "https://your-render-url.onrender.com";

// ========== TAB SWITCHING ==========
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".tab-btn.active").classList.remove("active");
    btn.classList.add("active");

    document.querySelector(".tab-content.active").classList.remove("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});



// ========== LOAD AND DISPLAY BOOKMARKS ==========
function loadBookmarks() {
  const list = document.getElementById("bookmarkList");
  if (!list) return;

  list.innerHTML = ""; // clear UI first

  chrome.storage.local.get({ bookmarks: [] }, data => {
    const items = [...data.bookmarks].reverse(); // newest first

    if (items.length === 0) {
      list.innerHTML = "<p>No bookmarks yet.</p>";
      return;
    }

    items.forEach((bm, index) => {
      const card = document.createElement("div");
      card.className = "bookmark-card";

      card.innerHTML = `
        <div class="bookmark-title">${bm.title}</div>
        <div class="bookmark-summary">${bm.summary}</div>

        <div class="bookmark-footer">
          <span class="bookmark-category">${bm.category}</span>

          <div style="display:flex; gap:6px;">
            <button class="open-btn" data-url="${bm.url}">Open</button>
            <button class="delete-btn" data-index="${index}">Delete</button>
          </div>
        </div>

        <small style="color:#777;">Saved on: ${bm.saved_on}</small>
      `;

      list.appendChild(card);
    });

    // OPEN PAGE HANDLERS
    document.querySelectorAll(".open-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        chrome.tabs.create({ url: btn.dataset.url });
      });
    });

    // DELETE HANDLERS
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteBookmark(btn.dataset.index);
      });
    });
  });
}

function deleteBookmark(index) {
  chrome.storage.local.get({ bookmarks: [] }, data => {
    const updated = data.bookmarks;
    updated.splice(updated.length - 1 - index, 1); // because we reversed

    chrome.storage.local.set({ bookmarks: updated }, () => {
      loadBookmarks(); // refresh UI
    });
  });
}

//Deadlines Tab

function loadDeadlines() {
  const list = document.getElementById("deadlineList");
  if (!list) return;

  list.innerHTML = "";

  chrome.storage.local.get({ bookmarks: [] }, data => {
    // Only email bookmarks with deadlines
    const deadlineItems = data.bookmarks.filter(b => b.has_deadline);

    if (deadlineItems.length === 0) {
      list.innerHTML = "<p>No deadlines found.</p>";
      return;
    }

    deadlineItems.forEach((bm, index) => {
      const email = bm.email_data;

      const card = document.createElement("div");
      card.className = "bookmark-card";

      const actions = email.action_items
        .map(item => `<li>${item}</li>`)
        .join("");

      const deadlines = email.deadlines
        .map(d => `<span class="deadline-badge">${d}</span>`)
        .join("");

      card.innerHTML = `
  <div class="deadline-header">
    <div class="deadline-title">${email.topic}</div>
    <div class="deadline-badges">${deadlines}</div>
  </div>

  <div class="deadline-summary">${email.summary}</div>

  ${
    actions
      ? `<ul class="deadline-actions">${actions}</ul>`
      : ""
  }

  <div class="deadline-footer">
    <span class="deadline-chip">Email</span>

    <div class="deadline-buttons">
      <button class="open-btn" data-url="${bm.url}">Open</button>
      <button class="delete-btn" data-index="${index}">Delete</button>
    </div>
  </div>

  <small class="deadline-date">Saved on: ${bm.saved_on}</small>
`;

      list.appendChild(card);
    });

    // Open email
    document.querySelectorAll(".open-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        chrome.tabs.create({ url: btn.dataset.url });
      });
    });

    // Delete bookmark
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteDeadline(btn.dataset.index);
      });
    });
  });
}

function deleteDeadline(index) {
  chrome.storage.local.get({ bookmarks: [] }, data => {
    const arr = data.bookmarks;

    // Filter only deadline items
    const deadlineItems = arr.filter(b => b.has_deadline);
    const itemToDelete = deadlineItems[index];

    // Remove from original array by URL match
    const finalArr = arr.filter(b => b.url !== itemToDelete.url);

    chrome.storage.local.set({ bookmarks: finalArr }, () => {
      loadDeadlines();
    });
  });
}

// Reload bookmarks whenever user opens the Bookmarks tab
document.querySelector("[data-tab='bookmarks']").addEventListener("click", loadBookmarks);

// ========== CHAT UI HANDLER ==========
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("userInput");
const messagesDiv = document.getElementById("messages");

// Add message to UI
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.classList.add("msg", type);
  msg.innerText = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function getRelevantBookmarks(query, bookmarks) {
  const q = query.toLowerCase();

  return bookmarks.filter(b => {
    return (
      b.title?.toLowerCase().includes(q) ||
      b.summary?.toLowerCase().includes(q) ||
      (b.email_data?.summary?.toLowerCase().includes(q)) ||
      (b.email_data?.topic?.toLowerCase().includes(q))
    );
  });
}

// Send message to Flask backend
async function sendToBackend(userText) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText })
  });

  const data = await res.json();
  return data.reply;
}

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // ⭐ GET ALL CONTEXTS AT ONCE
  chrome.storage.local.get(
    {
      bookmarks: [],
      deadlineEmails: [],
      lastChatMessages: []
    },
    async ctx => {
      const res = await fetch(`${API_BASE}chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          bookmarks: ctx.bookmarks,
          emails: ctx.deadlineEmails,
          chat: ctx.lastChatMessages
        })
      });

      const data = await res.json();
      addMessage(data.reply, "ai");
    }
  );
};



// When user clicks the button → tell background.js to bookmark the page
bookmarkBtn.onclick = () => {
  chrome.runtime.sendMessage({ action: "BOOKMARK_PAGE" }, response => {

    // If something went wrong
    if (!response || !response.success) {
      alert("❌ Failed to bookmark page.\n" + (response?.error || ""));
      return;
    }

    // If successful
    alert("📌 Bookmark saved successfully!");
  });
};



function deleteBookmark(index) {
  chrome.storage.local.get({ bookmarks: [] }, data => {
    const updated = data.bookmarks;
    updated.splice(index, 1);  // remove one entry

    chrome.storage.local.set({ bookmarks: updated }, () => {
      loadBookmarks();  // refresh the UI
    });
  });
  chrome.runtime.sendMessage({
  action: "DELETE_DEADLINE_ALARMS",
  url: itemToDelete.url
});
}

const summarizeBtn = document.getElementById("summarizeChatBtn");

summarizeBtn.onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;

    chrome.tabs.sendMessage(
      tabId,
      { action: "EXTRACT_WHATSAPP_CHAT" },
      async response => {
        if (!response || !response.messages) {
          addMessage("❌ Could not extract chat messages.", "ai");
          return;
        }
        // ⭐ Save chat messages for future RAG
        chrome.storage.local.set({ lastChatMessages: response.messages });

        addMessage("Summarizing WhatsApp chat...", "ai");

        const res = await fetch(`${API_BASE}/summarize_chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: response.messages })
        });

        const data = await res.json();
        addMessage(data.summary, "ai");
      }
    );
  });
};

document
  .querySelector("[data-tab='deadlines']")
  .addEventListener("click", loadDeadlines);

// Optional: PING test to check background.js connection
chrome.runtime.sendMessage({ action: "PING" }, res => {
  console.log("Background:", res);
});

