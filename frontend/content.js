// content.js
console.log("📄 content.js active on:", window.location.href);


// ========== MAIN CONTENT EXTRACTION FUNCTION ==========
function extractMainContent() {

  // Priority 1: <article> tag (best for blogs & news)
  const article = document.querySelector("article");
  if (article && article.innerText.trim().length > 100) {
    return article.innerText.trim();
  }

  // Priority 2: <main> content (modern websites)
  const main = document.querySelector("main");
  if (main && main.innerText.trim().length > 100) {
    return main.innerText.trim();
  }

  // Priority 3: Gmail email body
  // Gmail uses .ii.gt for email text nodes
  const gmailBody = document.querySelector(".ii.gt");
  if (gmailBody && gmailBody.innerText.trim().length > 20) {
    return gmailBody.innerText.trim();
  }

  // Priority 4: Outlook / Office 365 email body
  const outlookBody = document.querySelector("[aria-label='Message body']");
  if (outlookBody && outlookBody.innerText.trim().length > 20) {
    return outlookBody.innerText.trim();
  }

  // Priority 5: Article-like blocks on many sites
  const longDiv = [...document.querySelectorAll("div, section")]
    .filter(el => el.innerText && el.innerText.trim().length > 300)
    .sort((a, b) => b.innerText.length - a.innerText.length)[0];
  if (longDiv) {
    return longDiv.innerText.trim();
  }

  // Fallback: the whole page
  return document.body.innerText.trim();
}


// ========== LISTEN FOR SCRAPE REQUEST ==========
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "SCRAPE_PAGE") {
    const extracted = {
      url: window.location.href,
      title: document.title,
      content: extractMainContent()
    };

    console.log("📬 Extracted page data:", extracted);

    sendResponse(extracted);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "EXTRACT_WHATSAPP_CHAT") {
    try {
      // Get all elements representing messages
      const nodes = Array.from(document.querySelectorAll("[data-pre-plain-text]"));

      let messages = nodes.map(el => {
        const meta = el.getAttribute("data-pre-plain-text") || "";
        const text = el.innerText.trim() || "";
        return { meta, text };
      });

      // Filter only non-empty messages
      messages = messages.filter(m => m.text.length > 0);

      // Limit to last 200 messages
      messages = messages.slice(-200);

      console.log("Extracted WhatsApp messages:", messages);

      sendResponse({ messages });
    } catch (err) {
      console.error("WhatsApp Extract Error:", err);
      sendResponse({ messages: [], error: err.toString() });
    }
  }
});