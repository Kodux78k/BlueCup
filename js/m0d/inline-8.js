
    (function() {
      window.LS = window.LS || {};
      LS.stacksDB = LS.stacksDB || "kobllux_stacks_v1";

      const dualBody = document.getElementById("dualBody");
      if (!dualBody) return;

      const tabs = [...dualBody.querySelectorAll(".dbody-tab")];
      const panels = [...dualBody.querySelectorAll(".dbody-panel")];
      const frame = document.getElementById("dbodyFrame");
      const previewFrame = document.getElementById("dbodyPreviewFrame");
      const viewerTitle = document.getElementById("dbodyViewerTitle");
      const viewerMeta = document.getElementById("dbodyViewerMeta");
      const stacksList = document.getElementById("dbodyStacksList");
      const editorArea = document.getElementById("dbodyEditorArea");
      const editorHint = document.getElementById("dbodyEditorHint");
      const btnHome = document.getElementById("dbodyHomeBtn");
      const btnMin = document.getElementById("dbodyMinBtn");
      const btnClose = document.getElementById("dbodyCloseBtn");
      const btnStack = document.getElementById("dbodyStackBtn");
      const btnOpenExt = document.getElementById("dbodyOpenExtBtn");
      const btnListen = document.getElementById("dbodyListenBtn");
      const btnSaveLocal = document.getElementById("dbodySaveLocalBtn");
      const btnToPreview = document.getElementById("dbodyToPreviewBtn");
      const btnApplyPreview = document.getElementById("dbodyApplyPreviewBtn");
      const btnBackEditor = document.getElementById("dbodyBackEditorBtn");

      let current = { url: null, title: null, isLocal: false, localKey: null };

      function loadStacks() {
        try { return JSON.parse(localStorage.getItem(LS.stacksDB) || "[]"); }
        catch { return []; }
      }

      function saveStacks(s) {
        localStorage.setItem(LS.stacksDB, JSON.stringify(s));
      }

      function renderStacks() {
        if (!stacksList) return;
        const s = loadStacks();
        stacksList.innerHTML = "";
        if (!s.length) {
          stacksList.innerHTML = `<div class="dbody-small">Nenhum stack ainda.</div>`;
          return;
        }
        s.slice().reverse().forEach((it, idxRev) => {
          const idx = s.length - 1 - idxRev;
          const row = document.createElement("div");
          row.className = "stack-item";
          row.innerHTML = `
            <div class="meta">
              <div class="title">${it.title || it.url}</div>
              <div class="url">${it.url}</div>
            </div>
            <div class="actions">
              <button class="dbody-btn" data-act="open">Abrir</button>
              <button class="dbody-btn" data-act="del">Del</button>
            </div>
          `;
          row.querySelector('[data-act="open"]').onclick = () => {
            openTab("viewer");
            openInDualViewer(it.url, it.title, it.opts || {});
          };
          row.querySelector('[data-act="del"]').onclick = () => {
            const arr = loadStacks();
            arr.splice(idx, 1); saveStacks(arr); renderStacks();
          };
          stacksList.appendChild(row);
        });
      }

      function openTab(name) {
        tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
        panels.forEach(p => p.classList.toggle("show", p.dataset.panel === name));
      }
      window.openDualTab = openTab;

      if (tabs.length) {
        tabs.forEach(t => t.addEventListener("click", () => openTab(t.dataset.tab)));
      }

      function openInDualViewer(url, title, opts = {}) {
        current = { url, title, isLocal: !!opts.isLocal, localKey: opts.localKey || null };
        if (frame) frame.src = url || "about:blank";
        if (viewerTitle) viewerTitle.textContent = title || url || "Nenhum app aberto";
        if (viewerMeta) viewerMeta.textContent = opts.isLocal ? ("#local:" + opts.localKey) : (url || "");
        renderStacks();

        if (current.isLocal && current.localKey && editorArea && editorHint) {
          const files = typeof loadLocalAppFiles === 'function' ? loadLocalAppFiles() : {};
          editorArea.value = files[current.localKey] || "";
          editorHint.textContent = "Editando: #local:" + current.localKey;
        } else if (editorArea && editorHint) {
          editorArea.value = "";
          editorHint.textContent = "Abra um app #local: para editar.";
        }
      }

      window.openDualBody = function(url, title, opts = {}) {
        dualBody.classList.add("show");
        openTab("viewer");
        openInDualViewer(url, title, opts);
      };
      window.closeDualBody = function() { dualBody.classList.remove("show"); };
      window.minDualBody = function() { dualBody.classList.remove("show"); };
      window.openInViewer = function(url, title, opts) {
        window.openDualBody(url, title, opts);
      };

      if (btnClose) btnClose.addEventListener("click", () => window.closeDualBody());
      if (btnMin) btnMin.addEventListener("click", () => window.minDualBody());
      if (btnHome) {
        btnHome.addEventListener("click", () => {
          window.closeDualBody();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }

      if (btnStack) {
        btnStack.addEventListener("click", () => {
          if (!current.url) { if (typeof addSys === 'function') addSys("⚠️ Nada aberto pra stack."); return; }
          const s = loadStacks();
          s.push({ url: current.url, title: current.title, opts: { isLocal: current.isLocal, localKey: current.localKey } });
          saveStacks(s);
          renderStacks();
          if (typeof addSys === 'function') addSys("✅ Stack criado.");
        });
      }

      if (btnOpenExt) {
        btnOpenExt.addEventListener("click", () => {
          if (!current.url) return;
          window.open(current.url, "_blank", "noopener,noreferrer");
        });
      }

      if (btnListen) {
        btnListen.addEventListener("click", () => {
          if (typeof window.readViewerLocal === 'function') window.readViewerLocal();
        });
      }

      if (btnToPreview && previewFrame) {
        btnToPreview.addEventListener("click", () => {
          const html = editorArea ? editorArea.value.trim() : "";
          if (!html) { if (typeof addSys === 'function') addSys("⚠️ Nada no editor."); return; }
          if (typeof openLocalBlob === 'function') {
            const u = openLocalBlob(html);
            previewFrame.src = u;
            openTab("preview");
            setTimeout(() => URL.revokeObjectURL(u), 60000);
          }
        });
      }

      if (btnBackEditor) {
        btnBackEditor.addEventListener("click", () => openTab("editor"));
      }

      if (btnSaveLocal) {
        btnSaveLocal.addEventListener("click", () => {
          if (!current.isLocal || !current.localKey) {
            if (typeof addSys === 'function') addSys("⚠️ Nenhum local aberto.");
            return;
          }
          if (typeof loadLocalAppFiles === 'function' && typeof saveLocalAppFiles === 'function') {
            const files = loadLocalAppFiles();
            files[current.localKey] = editorArea ? editorArea.value : "";
            saveLocalAppFiles(files);
            if (typeof addSys === 'function') addSys("✅ Local salvo: " + current.localKey);
          }
        });
      }

      if (btnApplyPreview && previewFrame && frame) {
        btnApplyPreview.addEventListener("click", () => {
          const html = editorArea ? editorArea.value.trim() : "";
          if (!html) return;
          if (typeof openLocalBlob === 'function') {
            const u = openLocalBlob(html);
            openTab("viewer");
            frame.src = u;
            if (viewerTitle) viewerTitle.textContent = current.title || "Local Preview";
            if (viewerMeta) viewerMeta.textContent = "#local:" + current.localKey;
            setTimeout(() => URL.revokeObjectURL(u), 60000);
          }
        });
      }

      renderStacks();
    })();
  