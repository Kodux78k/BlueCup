
  /* ====================================================================== */
  /* Render rico (MD-lite + callouts + tabelista + voz)                    */
  /* ====================================================================== */

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function mdTablesToHtml(src) {
    const lines = String(src || "").split(/\n/);
    let out = [];
    let i = 0;
    let inPre = false;

    const cells = (row) => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const isNum = (v) => {
      const t = String(v || "").trim();
      if (!t) return false;
      return /^-?\d+([.,]\d+)?%?$/.test(t) || /^[R$€£]\s*-?\d+([.,]\d+)?%?$/.test(t);
    };

    while (i < lines.length) {
      let line = lines[i];

      if (line.includes("<pre><code>")) inPre = true;
      if (inPre) {
        out.push(line);
        if (line.includes("</code></pre>")) inPre = false;
        i++; continue;
      }

      const next = lines[i + 1] || "";
      const isHeader = /\|/.test(line);
      const isSep = /^[\s\|\-\:]+$/.test(next) && next.includes("-");

      if (isHeader && isSep) {
        const header = cells(line);
        i += 2;

        let rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== "") {
          rows.push(cells(lines[i]));
          i++;
        }

        const colCount = header.length;
        const numericCols = Array(colCount).fill(true);

        rows.forEach(r => {
          for (let c = 0; c < colCount; c++) {
            const v = r[c];
            if (v == null || String(v).trim() === "") continue;
            if (!isNum(v)) numericCols[c] = false;
          }
        });

        const ths = header.map((c, idx) => `<th class="${numericCols[idx] ? 'num' : ''}">${c || "&nbsp;"}</th>`).join("");
        const body = rows.map(r => {
          const tds = Array(colCount).fill(0).map((_, idx) => {
            const v = r[idx] || "";
            return `<td class="${numericCols[idx] ? 'num' : ''}">${v || "&nbsp;"}</td>`;
          }).join("");
          return `<tr>${tds}</tr>`;
        }).join("");

        out.push(`<table class="tabelista"><thead><tr>${ths}</tr></thead><tbody>${body}</tbody></table>`);
        continue;
      }

      out.push(line);
      i++;
    }
    return out.join("\n");
  }

  function parseCalloutsNested(md) {
    const lines = String(md || "").split(/\n/);
    let out = [];
    let stack = [];

    const open = (type, level) => stack.push({ type, level, raw: [] });

    const closeToLevel = (level) => {
      while (stack.length && stack[stack.length - 1].level >= level) {
        const blk = stack.pop();
        const rawText = blk.raw.join("\n");
        const arch = typeof detectDominantArchInBlock === 'function' ? detectDominantArchInBlock(rawText) : null;

        const iconMap = { info: "ℹ", aside: "◐", warn: "⚠", success: "✓", question: "?", danger: "!" };
        const icon = iconMap[blk.type] || "◐";
        const color = typeof archColorFor === 'function' ? archColorFor(arch || blk.type) : "rgba(27,228,255,.95)";

        const htmlBody = renderRich(rawText, { alreadyEscaped: true });

        const htmlBlock = `
<div class="callout ${blk.type} level-${blk.level}" style="--arch-color:${color}">
  <div class="callout-title"><span class="callout-icon">${icon}</span>${blk.type}${arch ? ` · ${arch}` : ""}</div>
  <div class="callout-body">${htmlBody}</div>
</div>`;

        if (stack.length) stack[stack.length - 1].raw.push(htmlBlock);
        else out.push(htmlBlock);
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(/^(\s*)::(info|aside|warn|success|question|danger)\s*$/i);
      if (m) {
        const indent = m[1].replace(/\t/g, "  ").length;
        const level = Math.max(1, Math.floor(indent / 2) + 1);
        const type = m[2].toLowerCase();
        closeToLevel(level);
        open(type, level);
        continue;
      }
      if (/^\s*::\s*$/.test(line)) {
        closeToLevel(1);
        continue;
      }
      if (stack.length) stack[stack.length - 1].raw.push(line);
      else out.push(line);
    }
    closeToLevel(1);
    return out.join("\n");
  }

  function wrapBlocks(html) {
    const parts = String(html || "").split(/(?=<h[1-3][^>]*>)/i);
    if (parts.length <= 1) return html;

    return parts.map(p => {
      if (!/^\s*<h[1-3]/i.test(p)) return p;

      let arch = null;
      const m1 = p.match(/data-voice="([^"]+)"/i);
      if (m1) arch = m1[1].toLowerCase().trim();

      const color = typeof archColorFor === 'function' ? archColorFor(arch || "madeira") : "#5cff9d";
      const tag = arch ? `<div class="md-block-tag"><span class="dot"></span>${arch}</div>` : "";

      return `<div class="md-block arch" data-arch="${arch || ''}" style="--arch-color:${color}">${tag}${p}</div>`;
    }).join("");
  }

  function detectDominantArchInBlock(rawText) {
    const text = String(rawText || "").toLowerCase();
    if (/atlas|plano|estratég|métrica|processo/.test(text)) return 'atlas';
    if (/nova|ideia|criar|inovar|imagina/.test(text)) return 'nova';
    if (/vitalis|energia|ação|vamos|agora/.test(text)) return 'vitalis';
    if (/pulse|sentir|emoção|pulso|ritmo/.test(text)) return 'pulse';
    if (/artemis|aventura|caminho|descobrir/.test(text)) return 'artemis';
    if (/serena|calma|acolher|cuidar|suave/.test(text)) return 'serena';
    if (/kaos|quebrar|caos|rebelde|insano/.test(text)) return 'kaos';
    if (/genus|fazer|prático|técnico|construir/.test(text)) return 'genus';
    if (/lumine|luz|brilho|alegr|sorriso/.test(text)) return 'lumine';
    if (/rhea|cura|nutrir|terra|raízes/.test(text)) return 'rhea';
    if (/solus|silêncio|meditar|sábio|contemplar/.test(text)) return 'solus';
    if (/aion|tempo|ciclo|loop|história/.test(text)) return 'aion';
    return null;
  }

  function archColorFor(id) {
    const key = String(id || "").toLowerCase().trim();
    const colors = {
      atlas: "#0B4F9C", nova: "#FF6EC7", vitalis: "#FF4D00", pulse: "#7A2CF3",
      artemis: "#10B6FF", serena: "#FFC6D0", kaos: "#FF1A1A", genus: "#FFD400",
      lumine: "#FFF36E", rhea: "#8E44FF", solus: "#6A737B", aion: "#20F2B3",
      madeira: "#5cff9d", info: "rgba(27,228,255,.95)", warn: "#fbbf24",
      success: "#34d399", question: "#a78bfa", danger: "#fb7185"
    };
    return colors[key] || "rgba(27,228,255,.95)";
  }

  function renderRich(text, options = {}) {
    const { alreadyEscaped = false } = options;
    
    let s = alreadyEscaped ? String(text || "") : escapeHtml(text);

    s = s.replace(/```([\s\S]*?)```/g, (m, code) => {
      const c = code.replace(/^\n+|\n+$/g, "");
      return `<pre><code>${c}</code></pre>`;
    });

    s = parseCalloutsNested(s);
    s = mdTablesToHtml(s);
    s = s.replace(/^&gt;\s?(.*)$/gmi, (m, line) => `<blockquote>${line}</blockquote>`);

    s = s.replace(/\*\*\*([^\*]+)\*\*\*/g, "<b><i>$1</i></b>");
    s = s.replace(/\*\*([^\*]+)\*\*/g, "<b>$1</b>");
    s = s.replace(/\*([^\*]+)\*/g, "<i>$1</i>");

    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");

    s = s.replace(/^###\s+(.*)$/gmi, "<h3>$1</h3>");
    s = s.replace(/^##\s+(.*)$/gmi, "<h2>$1</h2>");
    s = s.replace(/^#\s+(.*)$/gmi, "<h1>$1</h1>");

    s = wrapBlocks(s);
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  console.log('✅ Funções de renderização carregadas');
  