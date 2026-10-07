// Download catatan sebagai PDF yang dibuat langsung di browser dari catatan
// di halaman, sehingga catatan yang sudah dibuka kuncinya tidak dikirim lagi
// ke server. Teks di PDF memakai font Comic Neue dan berupa teks asli: bisa
// dipilih, dicari, dan tetap tajam di zoom berapa pun.
//
//   notePdf({ body, title, meta, fileName, decrypted })
//
// body: elemen .note-body; title / meta: judul dan baris di bawahnya
// (tanggal · mood); decrypted: true untuk catatan terkunci yang dibuka dengan
// key-nya, lalu baris meta diakhiri "· Decrypted". jsPDF dan file font baru
// dimuat saat download pertama.
(function () {
  const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  const FONT = "ComicNeue";
  const FONT_FILES = {
    normal: "/fonts/comic-neue/ComicNeue-Regular.ttf",
    bold: "/fonts/comic-neue/ComicNeue-Bold.ttf",
    italic: "/fonts/comic-neue/ComicNeue-Italic.ttf",
    bolditalic: "/fonts/comic-neue/ComicNeue-BoldItalic.ttf",
  };

  // ukuran A4 dalam point, dengan margin yang cukup lebar
  const PAGE = { w: 595.28, h: 841.89, margin: 56 };
  const SIZE = { title: 22, meta: 10, body: 11, h2: 16, h3: 13, footer: 8 };
  const LINE = 1.6; // tinggi baris, kelipatan dari ukuran font
  const INDENT = 18; // per level list
  const QUOTE_INDENT = 14;

  let ready = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Couldn't load the PDF maker"));
      document.head.append(s);
    });
  }

  async function fontBase64(url) {
    const buf = await (await fetch(url)).arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  // jsPDF dan keempat gaya font di-fetch sekali lalu disimpan. Jika gagal,
  // dicoba lagi pada download berikutnya
  function prepare() {
    if (!ready) {
      ready = Promise.all([
        window.jspdf ? null : loadScript(JSPDF_URL),
        ...Object.entries(FONT_FILES).map(async ([style, url]) => [style, await fontBase64(url)]),
      ]).then((parts) => parts.slice(1));
      ready.catch(() => (ready = null));
    }
    return ready;
  }

  // memakai warna dari halaman agar PDF sesuai dengan tema
  function cssColor(name, fallback) {
    const probe = document.createElement("span");
    probe.style.color = `var(${name}, ${fallback})`;
    document.body.append(probe);
    const [r, g, b] = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number);
    probe.remove();
    return [r, g, b];
  }

  // emoji dibuang karena tidak ada di font, agar tidak tercetak sebagai kotak kosong
  const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;
  const clean = (text) => text.replace(EMOJI, "").replace(/ {2,}/g, " ");

  function imageSize(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function notePdf({ body, title, meta, fileName, decrypted = false }) {
    const fonts = await prepare();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    fonts.forEach(([style, data]) => {
      const file = `${FONT}-${style}.ttf`;
      pdf.addFileToVFS(file, data);
      pdf.addFont(file, FONT, style);
    });

    const ink = cssColor("--color-ink", "#30332f");
    const soft = cssColor("--color-ink-soft", "#8d928c");
    const link = cssColor("--color-crayon", "#5b6f63");
    const marker = cssColor("--color-marker", "#e8b4a0");
    const line = cssColor("--color-line", "#dcd8cf");

    const left = PAGE.margin;
    const width = PAGE.w - PAGE.margin * 2;
    const bottom = PAGE.h - PAGE.margin;
    let y = PAGE.margin;

    const setFont = (size, { bold, italic } = {}) => {
      pdf.setFont(FONT, bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal");
      pdf.setFontSize(size);
    };
    const room = (h) => {
      if (y + h > bottom) {
        pdf.addPage();
        y = PAGE.margin;
      }
    };

    // ---- judul, dengan coretan marker seperti heading di halaman ----
    setFont(SIZE.title, { bold: true });
    const titleLines = pdf.splitTextToSize(clean(title) || "Untitled", width);
    titleLines.forEach((text) => {
      const lh = SIZE.title * 1.3;
      room(lh);
      const w = pdf.getTextWidth(text);
      pdf.setGState(new pdf.GState({ opacity: 0.35 }));
      pdf.setFillColor(...marker);
      pdf.roundedRect(left - 2, y + lh * 0.5, w + 4, SIZE.title * 0.36, 3, 3, "F");
      pdf.setGState(new pdf.GState({ opacity: 1 }));
      pdf.setTextColor(...ink);
      pdf.text(text, left, y + SIZE.title, { baseline: "alphabetic" });
      y += lh;
    });

    // tanggal dan mood, ditambah "Decrypted" untuk catatan terkunci yang
    // dibuka dengan key-nya, semuanya dipisahkan dengan titik yang sama
    const metaLine = [meta, decrypted && "Decrypted"].filter(Boolean).join("  ·  ");
    if (metaLine) {
      y += 4;
      setFont(SIZE.meta, { bold: true });
      pdf.setTextColor(...soft);
      pdf.text(clean(metaLine), left, y + SIZE.meta);
      y += SIZE.meta * 1.6;
    }

    // garis putus-putus tipis sebelum isi catatan
    y += 8;
    pdf.setDrawColor(...line);
    pdf.setLineWidth(0.8);
    pdf.setLineDashPattern([3, 3], 0);
    pdf.line(left, y, left + width, y);
    pdf.setLineDashPattern([], 0);
    y += 18;

    // ---- teks inline: potongan kata beserta gayanya, di-wrap sesuai lebar ----
    function runsOf(node, style = {}, out = []) {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = clean(child.textContent.replace(/\s+/g, " "));
          if (text) out.push({ text, ...style });
          return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        const tag = child.tagName.toLowerCase();
        if (tag === "br") return out.push({ br: true });
        if (tag === "ol" || tag === "ul" || tag === "img") return; // block, diproses terpisah
        const next = { ...style };
        if (tag === "strong" || tag === "b") next.bold = true;
        if (tag === "em" || tag === "i") next.italic = true;
        if (tag === "u") next.underline = true;
        if (tag === "s") next.strike = true;
        if (tag === "a") next.href = child.getAttribute("href");
        runsOf(child, next, out);
      });
      return out;
    }

    // menyusun runs baris per baris mulai dari y saat ini, di posisi `x` dengan lebar `w`
    function paragraph(runs, { size, x = left, w = width, align = "left", color = ink, bold = false, strike = false }) {
      const lh = size * LINE;
      // spasi di akhir kata tetap disimpan agar total lebarnya sesuai dengan teks
      const words = [];
      runs.forEach((run) => {
        if (run.br) return words.push({ br: true });
        run.text.split(/(?<= )/).forEach((part) => part && words.push({ ...run, bold: run.bold || bold, text: part }));
      });
      while (words.length && words[0].text === " ") words.shift();

      const lines = [];
      let current = [];
      let used = 0;
      const push = () => {
        while (current.length && /^\s+$/.test(current[current.length - 1].text)) current.pop();
        lines.push(current);
        current = [];
        used = 0;
      };
      words.forEach((word) => {
        if (word.br) return push();
        setFont(size, word);
        let wWidth = pdf.getTextWidth(word.text);
        const bare = pdf.getTextWidth(word.text.trimEnd());
        if (used + bare > w && current.length) push();
        if (!current.length && word.text === " ") return;
        // kata yang lebih panjang dari satu baris dipotong per karakter
        if (bare > w) {
          let piece = "";
          for (const ch of word.text) {
            if (pdf.getTextWidth(piece + ch) > w - used && piece) {
              current.push({ ...word, text: piece });
              push();
              piece = "";
            }
            piece += ch;
          }
          word = { ...word, text: piece };
          wWidth = pdf.getTextWidth(piece);
        }
        current.push(word);
        used += wWidth;
      });
      if (current.length || !lines.length) push();

      const top = y;
      lines.forEach((parts) => {
        room(lh);
        const lineWidth = parts.reduce((sum, p) => (setFont(size, p), sum + pdf.getTextWidth(p.text)), 0);
        let cx = x + (align === "center" ? (w - lineWidth) / 2 : align === "right" ? w - lineWidth : 0);
        const base = y + size * 1.05 + (lh - size * 1.3) / 2;
        parts.forEach((p) => {
          setFont(size, p);
          const pw = pdf.getTextWidth(p.text);
          const inkColor = p.href ? link : color;
          pdf.setTextColor(...inkColor);
          pdf.text(p.text, cx, base);
          pdf.setDrawColor(...inkColor);
          pdf.setLineWidth(size / 16);
          const tw = pdf.getTextWidth(p.text.trimEnd());
          if (p.underline || p.href) pdf.line(cx, base + size * 0.14, cx + tw, base + size * 0.14);
          if (p.strike || strike) pdf.line(cx, base - size * 0.3, cx + tw, base - size * 0.3);
          if (p.href) pdf.link(cx, base - size, tw, size * 1.25, { url: p.href });
          cx += pw;
        });
        y += lh;
      });
      return { top, lineHeight: lh };
    }

    const alignOf = (el) =>
      el.classList.contains("ql-align-center") ? "center" : el.classList.contains("ql-align-right") ? "right" : "left";

    async function picture(img, x, w) {
      const size = await imageSize(img.src);
      if (!size) return;
      // gambar tetap proporsional, maksimal selebar teks (dan setinggi satu halaman)
      let dw = Math.min(w, size.w * 0.75);
      let dh = (dw / size.w) * size.h;
      const maxH = bottom - PAGE.margin;
      if (dh > maxH) {
        dh = maxH;
        dw = (dh / size.h) * size.w;
      }
      room(dh);
      const format = (img.src.match(/^data:image\/(\w+)/) || [])[1] || "PNG";
      try {
        pdf.addImage(img.src, format.toUpperCase().replace("JPG", "JPEG"), x, y, dw, dh);
      } catch (e) {
        return;
      }
      y += dh + 8;
    }

    // ---- elemen block ----
    async function blocks(parent, { x = left, w = width, level = 0, color = ink } = {}) {
      for (const el of parent.children) {
        const tag = el.tagName.toLowerCase();
        const size = tag === "h2" ? SIZE.h2 : tag === "h3" ? SIZE.h3 : SIZE.body;

        if (tag === "h2" || tag === "h3") {
          y += size * 0.5;
          paragraph(runsOf(el), { size, x, w, align: alignOf(el), color, bold: true });
          y += size * 0.15;
        } else if (tag === "p") {
          const pics = el.querySelectorAll("img");
          const runs = runsOf(el);
          if (runs.some((r) => r.br || r.text.trim()) || !pics.length) {
            paragraph(runs, { size, x, w, align: alignOf(el), color });
          }
          for (const img of pics) await picture(img, x, w);
        } else if (tag === "img") {
          await picture(el, x, w);
        } else if (tag === "blockquote") {
          const top = y;
          paragraph(runsOf(el), { size, x: x + QUOTE_INDENT, w: w - QUOTE_INDENT, align: alignOf(el), color: soft });
          // garis di sisi kutipan (hanya di halaman terakhir jika kutipan terpotong)
          const barTop = y < top ? PAGE.margin : top;
          pdf.setDrawColor(...marker);
          pdf.setLineWidth(2.5);
          pdf.line(x + 3, barTop + 3, x + 3, y - 3);
        } else if (tag === "ul" || tag === "ol") {
          let n = 0;
          for (const li of el.children) {
            if (li.tagName.toLowerCase() !== "li") continue;
            n += 1;
            const check = li.getAttribute("data-list");
            const ix = x + INDENT * (level + 1);
            const top = y;
            const done = check === "checked";
            const { lineHeight } = paragraph(runsOf(li), {
              size: SIZE.body, x: ix, w: w - INDENT * (level + 1), align: alignOf(li),
              color: done ? soft : color, strike: done,
            });
            // penanda di baris pertama item (pindah ke atas halaman baru jika ada pergantian halaman)
            const markTop = y - lineHeight < top ? PAGE.margin : top;
            const mid = markTop + lineHeight / 2;
            pdf.setDrawColor(...soft);
            pdf.setFillColor(...soft);
            if (check) {
              pdf.setLineWidth(1);
              pdf.roundedRect(ix - 13, mid - 4.5, 9, 9, 2.5, 2.5, "S");
              if (done) {
                pdf.setLineWidth(1.3);
                pdf.lines([[2, 2.2], [4, -5]], ix - 11, mid, [1, 1], "S");
              }
            } else if (tag === "ol") {
              setFont(SIZE.body, { bold: true });
              pdf.setTextColor(...soft);
              pdf.text(`${n}.`, ix - 4, mid + SIZE.body * 0.35, { align: "right" });
            } else {
              pdf.circle(ix - 8, mid, 1.8, "F");
            }
            // list di dalam item, menjorok satu level lebih dalam
            for (const sub of li.children) {
              const t = sub.tagName.toLowerCase();
              if (t === "ul" || t === "ol") await blocks({ children: [sub] }, { x, w, level: level + 1, color });
            }
          }
          y += 4;
        }
      }
    }

    await blocks(body);

    // ---- footer: judul dan nomor halaman di setiap halaman ----
    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      setFont(SIZE.footer);
      pdf.setTextColor(...soft);
      pdf.text(`${clean(title)}  ·  ${i} / ${pages}`, PAGE.w / 2, PAGE.h - PAGE.margin / 2, { align: "center" });
    }

    pdf.save(fileName);
  }

  window.notePdf = notePdf;
})();
