const sanitizeHtml = require("sanitize-html");

// Gambar disimpan langsung di dalam teks catatan, jadi ikut terkunci.
// Gambar dari link (https) dan script dibuang.
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i;

const SANITIZE_OPTIONS = {
  allowedTags: [
    "p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "s",
    "ol", "ul", "li", "blockquote", "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    // item checklist: bulatan yang dicentang atau tidak
    li: [{ name: "data-list", multiple: false, values: ["checked", "unchecked"] }],
  },
  // teks rata tengah/kanan dari editor (rata kiri tidak butuh class)
  allowedClasses: Object.fromEntries(
    ["p", "h2", "h3", "li", "blockquote"].map((tag) => [
      tag,
      ["ql-align-center", "ql-align-right"],
    ])
  ),
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["data"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !IMAGE_DATA_URL.test(frame.attribs.src || ""),
};

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Catatan lama (sebelum ada editor) cuma berisi teks biasa
const isHtml = (content) => /^\s*</.test(content || "");

// Teks biasa diubah jadi paragraf. Baris kosong memisahkan paragraf,
// satu enter tetap jadi baris baru
const textToHtml = (text) =>
  (text || "")
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");

// HTML catatan yang aman dipakai di halaman atau editor. Tag yang tidak
// diizinkan, seperti script, dibuang
const noteHtml = (content) =>
  isHtml(content)
    ? sanitizeHtml(content, SANITIZE_OPTIONS)
    : textToHtml(content);

const decodeEntities = (text) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&amp;/g, "&");

// Cuma teksnya (tanpa HTML), satu baris per paragraf. Dipakai untuk preview
// dan pencarian, supaya gambar tidak ikut dimuat atau dicari
const noteText = (content) => {
  if (!isHtml(content)) return (content || "").trim();

  const withBreaks = content.replace(
    /<\/(p|h2|h3|li|blockquote)>|<br\s*\/?>/gi,
    "$&\n"
  );
  return decodeEntities(
    sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
};

// Catatan dianggap terisi kalau ada teks atau gambar
const hasNoteContent = (content) =>
  noteText(content).length > 0 || /<img\s/i.test(noteHtml(content));

module.exports = { noteHtml, noteText, hasNoteContent };
