
    (function() {
      const DEFAULT_APPS = [
        { key: "uno", title: "⊙ Portal UNO", desc: "Entrada raiz do Hub.", icon: "icons/icon-192.png", url: "./apps/portal_uno_v2.html" }
      ];

      function loadAppsCache() {
        try {
          const j = JSON.parse(localStorage.getItem(LS.apps) || "null");
          return Array.isArray(j) ? j : (j?.apps || j?.data || null);
        } catch (e) { return null; }
      }

      function saveAppsCache(apps) {
        localStorage.setItem(LS.apps, JSON.stringify(apps));
      }

      async function fetchAppsFile() {
        try {
          const r = await fetch("./apps.json", { cache: "no-store" });
          if (!r.ok) throw new Error("no apps.json");
          const j = await r.json();
          localStorage.setItem(LS.apps, JSON.stringify(j));
          return Array.isArray(j) ? j : (j.apps || j.data || DEFAULT_APPS);
        } catch (e) {
          return null;
        }
      }

      function normalizeApps(apps) {
        if (!apps) return [];
        if (Array.isArray(apps)) return apps;
        if (Array.isArray(apps.apps)) return apps.apps;
        return [];
      }

      function renderApps(apps) {
        const appsGrid = document.getElementById("appsGrid");
        const appsHint = document.getElementById("appsHint");
        const appsSearch = document.getElementById("appsSearch");

        if (!appsGrid || !appsHint) {
          console.error('Elementos appsGrid ou appsHint não encontrados');
          return;
        }

        appsGrid.innerHTML = "";
        const remote = normalizeApps(apps);
        const locals = (window.getLocalAppsForHub ? window.getLocalAppsForHub() : []);
        const list = [...locals, ...remote];

        if (!list.length) {
          appsHint.textContent = locals.length ? "Nenhum app remoto. Importe apps.json se quiser." : "Nenhum app encontrado. Use Apps Locais ou importe apps.json.";
          return;
        }
        appsHint.textContent = "";

        const q = (appsSearch ? appsSearch.value || "" : "").toLowerCase();
        list.filter(a => {
          if (!q) return true;
          return (a.title || "").toLowerCase().includes(q) ||
            (a.desc || "").toLowerCase().includes(q) ||
            (a.key || "").toLowerCase().includes(q);
        }).forEach(app => {
          const card = document.createElement("div");
          card.className = "appCard";
          card.innerHTML = `
            <div class="appIcon">${app.icon ? `<img src="${app.icon}" alt="">` : "◐"}</div>
            <div class="appBody">
              <div class="appTitle">${escapeHtml(app.title || app.key || "App")}</div>
              <div class="appDesc">${escapeHtml(app.desc || "")}</div>
              <div class="appActions">
                <button class="appBtn primary" data-open>Open</button>
                <button class="appBtn" data-stack>Add Stack</button>
                <button class="appBtn" data-copy>Copy URL</button>
              </div>
            </div>
          `;
          card.querySelector("[data-open]").onclick = () => window.openApp ? window.openApp(app) : window.open(app.url);
          card.querySelector("[data-stack]").onclick = () => {
            if (typeof addAppToStack === 'function') addAppToStack(app);
          };
          card.querySelector("[data-copy]").onclick = async () => {
            try { await navigator.clipboard.writeText(app.url); if (typeof addSys === 'function') addSys("URL copiada ✅"); } catch (e) { }
          };
          appsGrid.appendChild(card);
        });
      }

      function addAppToStack(app) {
        const stacks = typeof loadStacks === 'function' ? loadStacks() : [];
        const md = `# ${app.title}\n\n${app.desc || ""}\n\n🔗 ${app.url}`;
        stacks.push({
          title: app.title,
          content: md,
          preview: md.slice(0, 140),
          ts: Date.now()
        });
        if (typeof saveStacks === 'function') saveStacks(stacks);
        if (typeof renderStacks === 'function') renderStacks();
        if (typeof addSys === 'function') addSys("App adicionado à Stack ✅");
      }

      async function bootApps() {
        let apps = loadAppsCache();
        if (!apps) {
          const fetched = await fetchAppsFile();
          apps = fetched || DEFAULT_APPS;
        }
        renderApps(apps);
      }

      const appsGrid = document.getElementById("appsGrid");
      const appsHint = document.getElementById("appsHint");
      const appsSearch = document.getElementById("appsSearch");
      const appsReloadBtn = document.getElementById("appsReloadBtn");

      if (appsGrid && appsHint && appsSearch && appsReloadBtn) {
        window.addAppToStack = addAppToStack;
        window.renderApps = renderApps;
        window.loadAppsCache = loadAppsCache;
        window.saveAppsCache = saveAppsCache;

        bootApps();

        appsSearch.addEventListener("input", () => {
          const apps = loadAppsCache() || DEFAULT_APPS;
          renderApps(apps);
        });

        appsReloadBtn.addEventListener("click", async () => {
          const fetched = await fetchAppsFile();
          renderApps(fetched || loadAppsCache() || DEFAULT_APPS);
        });
      } else {
        console.error('❌ Elementos do Apps não encontrados no DOM');
      }
    })();
  