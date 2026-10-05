const sanitizeHtml = require("sanitize-html");

// Images live inside the note as data URLs, so encrypting the note covers
// them too. Anything else (a pasted https image, a script) is dropped.
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i;

const SANITIZE_OPTIONS = {
  allowedTags: [
    "p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "s",
    "ol", "ul", "li", "blockquote", "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    // checklist items: a round box that is ticked or not
    li: [{ name: "data-list", multiple: false, values: ["checked", "unchecked"] }],
  },
  // text alignment from the editor (left is the default, so no class)
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

// Notes written before the editor are plain text
const isHtml = (content) => /^\s*</.test(content || "");

// Plain-text notes become paragraphs: a blank line splits them, a single
// line break stays a line break
const textToHtml = (text) =>
  (text || "")
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");

// Safe HTML for showing a note or loading it into the editor
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

// Words only, one line per block: used for previews and search, so the
// image data never has to be loaded or matched
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

// A note counts as written once it has words or a picture
const hasNoteContent = (content) =>
  noteText(content).length > 0 || /<img\s/i.test(noteHtml(content));

module.exports = { noteHtml, noteText, hasNoteContent };
