
    (function() {
      if (!window.LS) window.LS = {};
      LS.db = LS.db || "kobllux_dual_brain_v1";

      function loadDB() {
        try { return JSON.parse(localStorage.getItem(LS.db) || "{}"); }
        catch { return {}; }
      }
      
      function saveDB(p) {
        const cur = loadDB();
        const next = { ...cur, ...p };
        localStorage.setItem(LS.db, JSON.stringify(next));
        return next;
      }

      const q = (id) => document.getElementById(id);
      const themeSelect = q("dbThemeSelect");
      const applyThemeBtn = q("dbApplyTheme");
      const autoThemeArch = q("dbAutoThemeArch");
      const voiceSelect = q("dbVoiceSelect");
      const testVoiceBtn = q("dbTestVoice");
      const rateR = q("dbRate");
      const pitchR = q("dbPitch");
      const rateVal = q("dbRateVal");
      const pitchVal = q("dbPitchVal");
      const autoVoiceArch = q("dbAutoVoiceArch");
      const exportAppsBtn = q("dbExportApps");
      const importAppsBtn = q("dbImportApps");
      const appsFile = q("dbAppsFile");
      const remoteUrl = q("dbRemoteUrl");
      const syncAppsBtn = q("dbSyncApps");
      const dumpLSBtn = q("dbDumpLS");
      const clearLSBtn = q("dbClearLS");
      const lsOut = q("dbLsOut");
      const openLogBtn = q("dbOpenLog");
      const exportLogBtn = q("dbExportLog");
      const logOut = q("dbLogOut");
      const autoHealChk = q("dbAutoHeal");
      const runHealBtn = q("dbRunHeal");
      const healStatus = q("dbHealStatus");

      if (!themeSelect) {
        console.log('⚠️ Dual Brain não inicializado (elementos não encontrados)');
        return;
      }

      const state = loadDB();

      // THEMES
      const THEMES = {
        nebula: { bg: "#050510", accent: "#1be4ff", gradA: "#ff00ff", gradB: "#00ffff" },
        madeira: { bg: "#04140a", accent: "#5cff9d", gradA: "#1bff6a", gradB: "#1be4ff" },
        blue: { bg: "#020712", accent: "#7ad7ff", gradA: "#3a7bff", gradB: "#00ffff" },
        gold: { bg: "#0a0612", accent: "#ffd36a", gradA: "#ffb000", gradB: "#ff00ff" },
        dark: { bg: "#000000", accent: "#e9ecff", gradA: "#444", gradB: "#111" }
      };

      function applyTheme(key) {
        const t = THEMES[key] || THEMES.nebula;
        document.documentElement.style.setProperty("--bg", t.bg);
        document.documentElement.style.setProperty("--accent", t.accent);
        document.documentElement.style.setProperty("--grad-a", t.gradA);
        document.documentElement.style.setProperty("--grad-b", t.gradB);

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", t.bg);

        saveDB({ theme: key });
        if (typeof addSys === 'function') addSys("🎨 Tema aplicado: " + key);
      }

      if (applyThemeBtn) applyThemeBtn.onclick = () => applyTheme(themeSelect.value);
      if (autoThemeArch) {
        autoThemeArch.checked = !!state.autoThemeArch;
        autoThemeArch.onchange = () => saveDB({ autoThemeArch: autoThemeArch.checked });
      }

      // VOICES
      function refreshVoices() {
        if (!voiceSelect) return;
        voiceSelect.innerHTML = "";
        const list = speechSynthesis.getVoices();
        list.forEach((v, i) => {
          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = `${v.name} · ${v.lang}`;
          voiceSelect.appendChild(opt);
        });
        if (state.voiceIndex != null) voiceSelect.value = state.voiceIndex;
      }

      if ('speechSynthesis' in window) {
        refreshVoices();
        speechSynthesis.onvoiceschanged = refreshVoices;
      }

      function pickVoice() {
        if (!voiceSelect) return null;
        const idx = Number(voiceSelect.value || 0);
        const v = speechSynthesis.getVoices()[idx];
        saveDB({ voiceIndex: idx });
        return v;
      }

      function applyVoiceParams() {
        if (!rateR || !pitchR) return;
        const r = Number(rateR.value || 1);
        const p = Number(pitchR.value || 1);
        if (rateVal) rateVal.textContent = r.toFixed(2);
        if (pitchVal) pitchVal.textContent = p.toFixed(2);
        saveDB({ rate: r, pitch: p });
      }

      if (rateR && pitchR) {
        rateR.value = state.rate || 1.0;
        pitchR.value = state.pitch || 1.0;
        applyVoiceParams();
        rateR.oninput = pitchR.oninput = applyVoiceParams;
      }

      if (autoVoiceArch) {
        autoVoiceArch.checked = !!state.autoVoiceArch;
        autoVoiceArch.onchange = () => saveDB({ autoVoiceArch: autoVoiceArch.checked });
      }

      if (testVoiceBtn) {
        testVoiceBtn.onclick = () => {
          const u = new SpeechSynthesisUtterance("◎ Dual Brain online. Base Madeira ativa.");
          u.voice = pickVoice();
          u.rate = Number(rateR?.value || 1);
          u.pitch = Number(pitchR?.value || 1);
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        };
      }

      // STORAGE SAFE (LS)
      if (dumpLSBtn) {
        dumpLSBtn.onclick = () => {
          if (!lsOut) return;
          const out = {};
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            out[k] = localStorage.getItem(k);
          }
          lsOut.textContent = JSON.stringify(out, null, 2);
        };
      }

      if (clearLSBtn) {
        clearLSBtn.onclick = () => {
          const kill = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (/^kobllux_/i.test(k) || /^bluecup_/i.test(k)) kill.push(k);
          }
          kill.forEach(k => localStorage.removeItem(k));
          if (lsOut) lsOut.textContent = "🧹 Limpo: " + kill.length + " chaves";
          if (typeof addSys === 'function') addSys("🧹 StorageSafe limpo (" + kill.length + ")");
        };
      }

      // LOG MISTICO
      function loadLogMistico() {
        try { return JSON.parse(localStorage.getItem('kobllux_log') || '[]'); }
        catch { return []; }
      }

      if (openLogBtn) {
        openLogBtn.onclick = () => {
          if (!logOut) return;
          const log = loadLogMistico().slice(-50);
          logOut.textContent = JSON.stringify(log, null, 2);
        };
      }

      if (exportLogBtn) {
        exportLogBtn.onclick = () => {
          const log = loadLogMistico();
          if (typeof downloadJson === 'function') downloadJson("logMistico.json", log);
        };
      }

      // AUTO‑HEAL
      if (autoHealChk) {
        autoHealChk.checked = state.autoHeal !== false;
        autoHealChk.onchange = () => saveDB({ autoHeal: autoHealChk.checked });
      }

      if (runHealBtn) {
        runHealBtn.onclick = () => {
          if (typeof window.loadAppsCache === 'function' && typeof window.renderApps === 'function') {
            const apps = window.loadAppsCache() || [];
            let fixed = 0;
            apps.forEach(a => {
              if (!a.key) { a.key = window.makeSafeKey ? window.makeSafeKey(a.title || a.url) : 'app'; fixed++; }
              if (!a.icon) { a.icon = "icons/icon-192.png"; fixed++; }
            });
            if (typeof window.saveAppsCache === 'function') window.saveAppsCache(apps);
            window.renderApps(apps);
            const msg = fixed ? "✅ Auto‑heal: " + fixed + " correções" : "✅ Nada pra curar";
            if (healStatus) healStatus.textContent = msg;
            if (typeof addSys === 'function') addSys(msg);
          }
        };
      }

      // APPS
      if (exportAppsBtn) {
        exportAppsBtn.onclick = () => {
          const apps = typeof window.loadAppsCache === 'function' ? window.loadAppsCache() : [];
          if (typeof downloadJson === 'function') downloadJson("apps.json", apps);
        };
      }

      if (importAppsBtn && appsFile) {
        importAppsBtn.onclick = () => appsFile.click();
        appsFile.onchange = async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const j = JSON.parse(await f.text());
            const apps = Array.isArray(j) ? j : (j.apps || j.data || []);
            if (typeof window.saveAppsCache === 'function') window.saveAppsCache(apps);
            if (typeof window.renderApps === 'function') window.renderApps(apps);
            if (typeof addSys === 'function') addSys("✅ apps.json importado (" + apps.length + ")");
          } catch (err) {
            if (typeof addSys === 'function') addSys("⚠️ apps.json inválido: " + err.message);
          } finally { appsFile.value = ""; }
        };
      }

      // Restaura seleções anteriores
      if (state.theme && themeSelect) themeSelect.value = state.theme;
      if (state.autoThemeArch && autoThemeArch) autoThemeArch.checked = true;
      if (state.autoVoiceArch && autoVoiceArch) autoVoiceArch.checked = true;
      if (state.remoteUrl && remoteUrl) remoteUrl.value = state.remoteUrl;

      console.log('✅ Dual Brain Engine inicializado');
    })();
  