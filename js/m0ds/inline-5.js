
    (function() {
      window.LS = window.LS || {};
      window.addSys = window.addSys || function(msg) {
        try { console.log("[SYS]", msg); } catch (e) { }
      };
      window.downloadJson = window.downloadJson || function(name, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      };
      window.makeSafeKey = window.makeSafeKey || function(s) {
        return String(s || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      };

      const LSx = {
        appFiles: (window.LS && LS.appFiles) || "kobllux_apps_files_v1",
        apps: (window.LS && LS.apps) || "kobllux_apps_v3"
      };

      function loadLocalAppFiles() {
        try { return JSON.parse(localStorage.getItem(LSx.appFiles) || "{}"); }
        catch { return {}; }
      }

      function saveLocalAppFiles(obj) {
        localStorage.setItem(LSx.appFiles, JSON.stringify(obj || {}));
      }

      function openLocalBlob(html) {
        const blob = new Blob([html], { type: "text/html" });
        return URL.createObjectURL(blob);
      }

      window.loadLocalAppFiles = window.loadLocalAppFiles || loadLocalAppFiles;
      window.saveLocalAppFiles = window.saveLocalAppFiles || saveLocalAppFiles;
      window.openLocalBlob = window.openLocalBlob || openLocalBlob;

      const _openApp = window.openApp;
      window.openApp = function(app) {
        if (!app || !app.url) return;
        if (String(app.url).startsWith("#local:")) {
          const key = app.url.split(":")[1];
          const files = loadLocalAppFiles();
          const html = files[key];
          if (!html) { window.addSys?.("⚠️ HTML local não encontrado."); return; }
          const url = openLocalBlob(html);
          if (typeof window.openInViewer === "function") {
            window.openInViewer(url, app.title || key, { isLocal: true, localKey: key });
          } else {
            window.open(url, "_blank", "noopener,noreferrer");
          }
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          return;
        }
        if (_openApp) return _openApp(app);
        window.open(app.url, "_blank", "noopener,noreferrer");
      };

      window.readViewerLocal = async function() {
        try {
          const iframe = document.querySelector("#dbodyFrame") || document.querySelector("iframe");
          if (!iframe) { addSys?.("⚠️ Viewer vazio."); return; }
          let docText = "";
          try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            docText = doc?.body?.innerText || "";
          } catch (e) {
            addSys?.("⚠️ Não consegui ler esse app (origem externa).");
            return;
          }
          docText = (docText || "").trim();
          if (!docText) { addSys?.("⚠️ Nada pra ouvir no local."); return; }
          addSys?.(`◎ Ouvindo o local…`);
          if (typeof window.speakText === "function") {
            window.speakText(docText);
          } else if ("speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(docText);
            speechSynthesis.cancel(); speechSynthesis.speak(u);
          }
        } catch (err) {
          addSys?.("⚠️ Falha ao ouvir o local: " + err.message);
        }
      };

      function toggleDevPanel(force) {
        const overlay = document.getElementById("devpanelOverlay");
        if (!overlay) return;
        const show = (force != null) ? !!force : !overlay.classList.contains("show");
        overlay.classList.toggle("show", show);
        overlay.setAttribute("aria-hidden", show ? "false" : "true");
      }
      window.toggleDevPanel = window.toggleDevPanel || toggleDevPanel;

      const openBtn = document.getElementById("devpanelOpenBtn");
      const closeBtn = document.getElementById("devpanelCloseBtn");
      const overlay = document.getElementById("devpanelOverlay");

      if (openBtn) openBtn.addEventListener("click", () => toggleDevPanel(true));
      if (closeBtn) closeBtn.addEventListener("click", () => toggleDevPanel(false));
      if (overlay) {
        overlay.addEventListener("click", (e) => {
          if (e.target.id === "devpanelOverlay") toggleDevPanel(false);
        });
      }
    })();
  