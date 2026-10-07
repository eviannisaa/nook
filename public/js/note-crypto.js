// Catatan terkunci di-encrypt dan di-decrypt di browser, sehingga key tidak
// dikirim ke server (kecuali sekali untuk catatan lama, lihat openLegacy).
// Server hanya menyimpan ciphertext beserta salt dan iv-nya. Algoritmanya
// AES-256-GCM (key yang salah gagal di auth check), dengan key yang
// diturunkan dari passphrase memakai PBKDF2-SHA256
(() => {
  // Jumlah iterasi sesuai rekomendasi OWASP untuk PBKDF2-SHA256. Setiap
  // percobaan menebak key butuh waktu sekitar setengah detik
  const ITERATIONS = 600000;
  const MIN_KEY_LENGTH = 8;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // diproses per bagian karena catatan berisi foto bisa beberapa MB,
  // terlalu besar untuk satu kali pemanggilan
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

  // menghasilkan field yang disimpan server. Salt dan iv selalu dibuat baru
  // setiap kali catatan disimpan
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

  // menghasilkan HTML catatan yang sudah dibersihkan untuk halaman. Melempar
  // error "Wrong key!" jika key salah
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

  // Aturannya sama dengan utils/note-html.js di server, yang tidak pernah
  // melihat isi catatan terkunci. Apa pun isi ciphertext-nya, hanya tag dan
  // atribut berikut yang ditampilkan di halaman
  const ALLOWED_TAGS = new Set([
    "P", "BR", "H2", "H3", "STRONG", "B", "EM", "I", "U", "S",
    "OL", "UL", "LI", "BLOCKQUOTE", "A", "IMG",
  ]);
  // tag ini dibuang beserta isinya, bukan hanya tag-nya
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
    // catatan dari sebelum ada editor berupa teks biasa dan diubah menjadi
    // paragraf, sama seperti di server
    if (!/^\s*</.test(html || "")) {
      return (html || "")
        .split(/\r?\n\s*\r?\n/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para) => `<p>${escapeHtml(para).replace(/\r?\n/g, "<br>")}</p>`)
        .join("");
    }

    // di-parse di dokumen terpisah, sehingga tidak ada script yang berjalan
    // atau resource yang dimuat
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const out = document.createElement("div");
    cleanInto(parsed.body, out);
    return out.innerHTML;
  }

  // mengecek panjang minimum key untuk mengunci catatan. Untuk membuka
  // catatan lama, key apa pun diterima
  const keyProblem = (passphrase) =>
    (passphrase || "").length < MIN_KEY_LENGTH
      ? `Use a key of at least ${MIN_KEY_LENGTH} characters.`
      : "";

  // Catatan lama yang di-encrypt di server. Key dikirim ke server sekali
  // lagi untuk decrypt, lalu catatan langsung di-encrypt ulang di sini.
  // Setelah itu, catatan diperlakukan sama seperti catatan lain
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
    // data di halaman kini sama dengan yang tersimpan di server
    Object.assign(note, relocked, { legacy: false });

    return sanitize(data.content);
  }

  // menghasilkan HTML catatan terkunci dari data yang diterima halaman:
  // { id, legacy } atau { id, content, salt, iv }
  const open = (note, passphrase) =>
    note.legacy ? openLegacy(note, passphrase) : decrypt(note, passphrase);

  window.noteCrypto = { encrypt, decrypt, open, sanitize, keyProblem };
})();
