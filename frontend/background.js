// background.js
const API_BASE = "http://localhost:5000";
console.log("🟣 Background service worker loaded");

// Listen for content extraction request from popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Simple ping test (keep this)
  if (msg.action === "PING") {
    sendResponse({ status: "PONG from background!" });
  }

  // Main: Extract content from active tab
  if (msg.action === "BOOKMARK_PAGE") {
    handleBookMarkReuqest(sendResponse);
    return true; // keep sendResponse alive for async
  }
});

// ========== FUNCTION: Extract content through content.js ==========
function handleBookMarkReuqest(sendResponse) {
  // Step 1: Get active tab
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs || !tabs.length) {
      sendResponse({ success: false, error: "No active tab found." });
      return;
    }

    const tabId = tabs[0].id;

    // Step 2: Ask content.js to extract data
    chrome.tabs.sendMessage(tabId, { action: "SCRAPE_PAGE" }, async pageData => {
      if (!pageData) {
        sendResponse({ success: false, error: "Could not extract content." });
        return;
      }

      console.log("📄 Extracted page data (background):", pageData);

      // Step 3: Send data back to popup.js
      sendResponse({ success: true, data: pageData });

      // Send to Flask to generate summary
      try {
        const res = await fetch(`${API_BASE}/bookmark`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pageData)
        });

        const aiBookmark = await res.json();

        // Save inside browser storage
        chrome.storage.local.get({ bookmarks: [] }, data => {
          data.bookmarks.push(aiBookmark);
          chrome.storage.local.set({ bookmarks: data.bookmarks });
        });

        sendResponse({ success: true, bookmark: aiBookmark });
        if (aiBookmark.has_deadline && aiBookmark.email_data.deadlines.length > 0) {
  scheduleDeadlineAlarms(aiBookmark);
}

      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    });
  });
}

function parseDateString(dateStr) {
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
// After saving bookmark


function getReminderOffset(deadlineType) {
  switch (deadlineType) {
    case "event":
      return 24 * 60 * 60 * 1000;   // 1 day before
    case "assignment":
      return 4 * 60 * 60 * 1000;    // 4 hours before (midpoint of 3–5)
    case "meeting":
      return 20 * 60 * 1000;        // 20 minutes before
    default:
      return 60 * 60 * 1000;        // fallback: 1 hour before
  }
}

function scheduleDeadlineAlarms(bookmark) {
  const deadlines = bookmark.email_data.deadlines;
  const type = bookmark.email_data.deadline_type || "other";

  deadlines.forEach((dateString, i) => {
    const parsed = parseDateString(dateString);
    if (!parsed) return;

    const offset = getReminderOffset(type);

    const when = parsed.getTime() - offset;
    if (when <= Date.now()) return; // ignore past alarms

    const alarmName = `deadline_${bookmark.url}_${i}`;

    chrome.alarms.create(alarmName, { when });

    console.log(
      `⏰ Alarm for "${bookmark.title}" set for ${new Date(when)}`,
      `(type: ${type}, offset: ${offset / 60000} min)`
    );
  });
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (!alarm.name.startsWith("deadline_")) return;

  const [_, url] = alarm.name.split("_");

  chrome.storage.local.get({ bookmarks: [] }, data => {
    const bm = data.bookmarks.find(b => b.url === url);
    if (!bm) return;

    const type = bm.email_data.deadline_type || "other";

    const messages = {
      event: `Reminder: ${bm.title}\nYour event is tomorrow.`,
      assignment: `Reminder: Your assignment is due soon.\n${bm.title}`,
      meeting: `Reminder: Your meeting starts soon.\n${bm.title}`,
      other: `Reminder: Upcoming deadline.\n${bm.title}`,
    };

    chrome.notifications.create(alarm.name, {
      type: "basic",
      iconUrl: "icon48.png",
      title: "Deadline Reminder ⏳",
      message: messages[type],
      priority: 2
    });
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "DELETE_DEADLINE_ALARMS") {
    const targetUrl = msg.url;

    chrome.alarms.getAll(alarms => {
      alarms.forEach(a => {
        if (a.name.includes(targetUrl)) {
          chrome.alarms.clear(a.name);
          console.log("🗑 Cleared alarm:", a.name);
        }
      });
    });
  }
});