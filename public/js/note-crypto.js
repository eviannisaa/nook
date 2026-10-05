// Locked notes are encrypted and decrypted here in the browser, so the key
// never leaves it: the server only keeps the ciphertext with its salt and iv.
// AES-256-GCM (a wrong key fails its auth check), the key stretched from the
// passphrase with PBKDF2-SHA256
(() => {
  // OWASP's guidance for PBKDF2-SHA256; it costs every guess at a key the
  // same, about half a second
  const ITERATIONS = 600000;
  const MIN_KEY_LENGTH = 8;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // in chunks: a note with photos is several MB, too long for one call
  const toBase64 = (bytes) => {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  };

  const fromBase64 = (text) => {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  async function deriveKey(passphrase, salt) {
    const material = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // the fields the server stores: a fresh salt and iv every time it's saved
  async function encrypt(html, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(html)
    );
    return {
      content: toBase64(new Uint8Array(cipher)),
      salt: toBase64(salt),
      iv: toBase64(iv),
    };
  }

  // the note's HTML, cleaned for the page; throws "Wrong key!" when the key
  // doesn't fit
  async function decrypt(note, passphrase) {
    const key = await deriveKey(passphrase, fromBase64(note.salt));
    let plain;
    try {
      plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(note.iv) },
        key,
        fromBase64(note.content)
      );
    } catch {
      throw new Error("Wrong key!");
    }
    return sanitize(decoder.decode(plain));
  }

  // The same rules as utils/note-html.js on the server, which never sees a
  // locked note's words: whatever a ciphertext holds, only these tags and
  // attributes reach the page
  const ALLOWED_TAGS = new Set([
    "P", "BR", "H2", "H3", "STRONG", "B", "EM", "I", "U", "S",
    "OL", "UL", "LI", "BLOCKQUOTE", "A", "IMG",
  ]);
  // dropped along with what's inside them, not just unwrapped
  const DROPPED_TAGS = new Set([
    "SCRIPT", "STYLE", "TEXTAREA", "OPTION", "NOSCRIPT", "TEMPLATE",
    "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TITLE", "HEAD",
  ]);
  const ALIGN_TAGS = new Set(["P", "H2", "H3", "LI", "BLOCKQUOTE"]);
  const ALIGN_CLASSES = ["ql-align-center", "ql-align-right"];
  const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i;
  const LINK_URL = /^(https?:|mailto:)/i;

  function cleanInto(source, target) {
    source.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(node.data));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tag = node.tagName.toUpperCase();
      if (DROPPED_TAGS.has(tag)) return;
      if (!ALLOWED_TAGS.has(tag)) {
        cleanInto(node, target);
        return;
      }

      if (tag === "IMG" && !IMAGE_DATA_URL.test(node.getAttribute("src") || "")) return;

      const el = document.createElement(tag);
      if (tag === "IMG") {
        el.setAttribute("src", node.getAttribute("src"));
        if (node.hasAttribute("alt")) el.setAttribute("alt", node.getAttribute("alt"));
      }
      if (tag === "A") {
        const href = (node.getAttribute("href") || "").trim();
        if (LINK_URL.test(href)) el.setAttribute("href", href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
      if (tag === "LI") {
        const list = node.getAttribute("data-list");
        if (list === "checked" || list === "unchecked") el.setAttribute("data-list", list);
      }
      if (ALIGN_TAGS.has(tag)) {
        ALIGN_CLASSES.forEach((cls) => {
          if (node.classList.contains(cls)) el.classList.add(cls);
        });
      }

      cleanInto(node, el);
      target.appendChild(el);
    });
  }

  const escapeHtml = (text) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  function sanitize(html) {
    // notes written before the editor are plain text: paragraphs, as on the
    // server
    if (!/^\s*</.test(html || "")) {
      return (html || "")
        .split(/\r?\n\s*\r?\n/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para) => `<p>${escapeHtml(para).replace(/\r?\n/g, "<br>")}</p>`)
        .join("");
    }

    // parsed in a document of its own, where nothing runs or loads
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const out = document.createElement("div");
    cleanInto(parsed.body, out);
    return out.innerHTML;
  }

  // a key good enough to lock with; opening an older note takes any key
  const keyProblem = (passphrase) =>
    (passphrase || "").length < MIN_KEY_LENGTH
      ? `Use a key of at least ${MIN_KEY_LENGTH} characters.`
      : "";

  // Notes locked before the browser did the encryption: the server opens
  // them one last time (the key goes there once more), and they're locked
  // again here straight away, so from then on they're like any other
  async function openLegacy(note, passphrase) {
    const res = await fetch(`/writing/${note.id}/legacy-open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: passphrase }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Couldn't open this note.");

    const relocked = await encrypt(data.content, passphrase);
    const saved = await fetch(`/writing/${note.id}/relock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(relocked),
    });
    if (!saved.ok) throw new Error("Couldn't upgrade this note's lock. Try again.");
    // what the page holds now matches the server
    Object.assign(note, relocked, { legacy: false });

    return sanitize(data.content);
  }

  // a locked note's HTML from what the page was given: { id, legacy } or
  // { id, content, salt, iv }
  const open = (note, passphrase) =>
    note.legacy ? openLegacy(note, passphrase) : decrypt(note, passphrase);

  window.noteCrypto = { encrypt, decrypt, open, sanitize, keyProblem };
})();
