
    (function() {
      const grid = document.getElementById("localAppsGrid");
      const hint = document.getElementById("localAppsHint");
      const uploadBtn = document.getElementById("localUploadBtn");
      const uploadInp = document.getElementById("localUploadInput");
      const newBtn = document.getElementById("localNewBtn");
      const exportBtn = document.getElementById("localExportBtn");
      const importBtn = document.getElementById("localImportBtn");
      const importInp = document.getElementById("localImportInput");

      const loadFiles = window.loadLocalAppFiles || (() => {
        try { return JSON.parse(localStorage.getItem(LS.appFiles) || "{}"); } catch (e) { return {}; }
      });

      const saveFiles = window.saveLocalAppFiles || (obj => localStorage.setItem(LS.appFiles, JSON.stringify(obj || {})));

      function normalizeEntry(val, key) {
        if (typeof val === "string") {
          return { key, title: key, desc: "", icon: "", html: val };
        }
        if (val && typeof val === "object") {
          return {
            key,
            title: val.title || key,
            desc: val.desc || "",
            icon: val.icon || "",
            html: val.html || val.content || ""
          };
        }
        return { key, title: key, desc: "", icon: "", html: "" };
      }

      function extractTitleFromHtml(src, fallback) {
        try {
          const m = String(src).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (m && m[1]) return m[1].trim().slice(0, 80);
        } catch (e) { }
        return fallback;
      }

      function listLocal() {
        const raw = loadFiles() || {};
        const out = [];
        for (const k of Object.keys(raw)) {
          const e = normalizeEntry(raw[k], k);
          if (e.html) out.push(e);
        }
        return out.sort((a, b) => (a.title || a.key).localeCompare(b.title || b.key));
      }

      function saveEntry(e) {
        const raw = loadFiles() || {};
        raw[e.key] = { title: e.title, desc: e.desc, icon: e.icon, html: e.html };
        saveFiles(raw);
      }

      function delEntry(key) {
        const raw = loadFiles() || {};
        delete raw[key];
        saveFiles(raw);
      }

      function render() {
        if (!grid) return;
        const items = listLocal();
        grid.innerHTML = "";
        if (!items.length) {
          if (hint) hint.textContent = "Nenhum app local ainda. Use Upload HTML ou Novo Local.";
          return;
        }
        if (hint) hint.textContent = "";

        items.forEach(e => {
          const app = {
            key: e.key,
            title: e.title,
            desc: e.desc,
            icon: e.icon,
            url: "#local:" + e.key,
            _local: true
          };
          const card = document.createElement("div");
          card.className = "appCard";
          card.innerHTML = `
            <div class="appIcon">${e.icon ? `<img src="${e.icon}" alt="">` : "⌘"}</div>
            <div class="appBody">
              <div class="appTitle">${escapeHtml(e.title || e.key)}</div>
              <div class="appDesc">${escapeHtml(e.desc || "")}</div>
              <div class="appActions">
                <button class="appBtn primary" data-open>Open</button>
                <button class="appBtn" data-edit>Edit</button>
                <button class="appBtn" data-rename>Meta</button>
                <button class="appBtn" data-del>Del</button>
              </div>
            </div>
          `;
          card.querySelector("[data-open]").onclick = () => window.openApp ? window.openApp(app) : window.open(app.url);
          card.querySelector("[data-edit]").onclick = () => {
            if (window.openApp) window.openApp(app);
            if (typeof window.openDualTab === "function") window.openDualTab("editor");
          };
          card.querySelector("[data-rename]").onclick = () => {
            const title = prompt("Título do card", e.title || e.key) || e.title || e.key;
            const desc = prompt("Descrição", e.desc || "") || e.desc || "";
            const icon = prompt("Icon (url relativo/absoluto)", e.icon || "") || e.icon || "";
            const key = e.key;
            saveEntry({ key, title, desc, icon, html: e.html });
            render();
            try { if (typeof renderApps === 'function') renderApps(loadAppsCache() || DEFAULT_APPS); } catch (err) { }
          };
          card.querySelector("[data-del]").onclick = () => {
            if (!confirm("Apagar app local '" + (e.title || e.key) + "'?")) return;
            delEntry(e.key);
            render();
            try { if (typeof renderApps === 'function') renderApps(loadAppsCache() || DEFAULT_APPS); } catch (err) { }
          };
          grid.appendChild(card);
        });
      }

      window.getLocalAppsForHub = function() {
        return listLocal().map(e => ({
          key: e.key,
          title: e.title || e.key,
          desc: e.desc || "",
          icon: e.icon || "",
          url: "#local:" + e.key,
          _local: true
        }));
      };

      if (uploadBtn && uploadInp) {
        uploadBtn.addEventListener("click", () => uploadInp.click());
        uploadInp.addEventListener("change", async () => {
          const files = Array.from(uploadInp.files || []);
          if (!files.length) return;
          const raw = loadFiles() || {};
          for (const f of files) {
            const html = await f.text();
            const base = (f.name || "app").replace(/\.html?$/i, "");
            const title = extractTitleFromHtml(html, base);
            const key = (window.makeSafeKey ? window.makeSafeKey(title) : base.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
            if (raw[key] && !confirm("Sobrescrever '" + key + "'?")) continue;
            raw[key] = { title, desc: "", icon: "", html };
          }
          saveFiles(raw);
          uploadInp.value = "";
          render();
          try { if (typeof renderApps === 'function') renderApps(loadAppsCache() || DEFAULT_APPS); } catch (err) { }
        });
      }

      if (newBtn) {
        newBtn.addEventListener("click", () => {
          const title = prompt("Nome do novo app local?", "Novo App Local");
          if (!title) return;
          const key = (window.makeSafeKey ? window.makeSafeKey(title) : title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
          const raw = loadFiles() || {};
          if (raw[key] && !confirm("Já existe '" + key + "'. Sobrescrever?")) return;
          const html = `<!doctype html>
<html lang="pt-br">
<head><meta charset="utf-8"/><title>${title}</title><style>body{margin:0;font-family:system-ui;background:#050510;color:#e9ecff;min-height:100vh;display:flex;align-items:center;justify-content:center;}.box{padding:20px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(42deg,#120022,#001a22);text-align:center;}h1{margin:0 0 6px;font-size:22px;}p{opacity:.8}</style></head>
<body><div class="box"><h1>${title}</h1><p>App local criado no BlueCup. Edite à vontade ✨</p></div></body>
</html>`;
          raw[key] = { title, desc: "", icon: "", html };
          saveFiles(raw);
          render();
          try { if (typeof renderApps === 'function') renderApps(loadAppsCache() || DEFAULT_APPS); } catch (err) { }
          if (window.openApp) window.openApp({ key, title, desc: "", icon: "", url: "#local:" + key, _local: true });
          if (typeof window.openDualTab === "function") window.openDualTab("editor");
        });
      }

      if (exportBtn) {
        exportBtn.addEventListener("click", () => {
          const raw = loadFiles() || {};
          if (typeof downloadJson === 'function') downloadJson("local_apps.json", raw);
        });
      }

      if (importBtn && importInp) {
        importBtn.addEventListener("click", () => importInp.click());
        importInp.addEventListener("change", async () => {
          const f = importInp.files?.[0];
          if (!f) return;
          try {
            const j = JSON.parse(await f.text());
            if (!j || typeof j !== "object") throw new Error("json inválido");
            const raw = loadFiles() || {};
            Object.assign(raw, j);
            saveFiles(raw);
            render();
            try { if (typeof renderApps === 'function') renderApps(loadAppsCache() || DEFAULT_APPS); } catch (err) { }
            if (typeof addSys === 'function') addSys("Locais importados ✅");
          } catch (e) {
            alert("Falha ao importar locais: " + e.message);
          } finally {
            importInp.value = "";
          }
        });
      }

      render();
    })();
  