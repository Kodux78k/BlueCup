

/* ====================================================================== */
/* SAFETY UTILS (only if missing)                                         */
/* ====================================================================== */
(function(){
  window.LS = window.LS || {};
  window.addSys = window.addSys || function(msg){
    try{ console.log("[SYS]", msg); }catch(e){}
  };
  window.downloadJson = window.downloadJson || function(name, data){
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  };
  window.makeSafeKey = window.makeSafeKey || function(s){
    return String(s||"app").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  };
})();


/* ====================================================================== */
/* ZERO-COLAGEM PATCH — Viewer Local + Ouvir Local + Icons Lab            */
/* ====================================================================== */
(function(){
  window.LS = window.LS || {};
  const LSx = {
    appFiles: (window.LS && LS.appFiles) || "kobllux_apps_files_v1",
    apps: (window.LS && LS.apps) || "kobllux_apps_v3"
  };
  function loadLocalAppFiles(){
    try{ return JSON.parse(localStorage.getItem(LSx.appFiles) || "{}"); }
    catch{ return {}; }
  }
  function saveLocalAppFiles(obj){
    localStorage.setItem(LSx.appFiles, JSON.stringify(obj||{}));
  }
  function openLocalBlob(html){
    const blob = new Blob([html], {type:"text/html"});
    return URL.createObjectURL(blob);
  }
  window.loadLocalAppFiles = window.loadLocalAppFiles || loadLocalAppFiles;
  window.saveLocalAppFiles = window.saveLocalAppFiles || saveLocalAppFiles;
  window.openLocalBlob = window.openLocalBlob || openLocalBlob;

  // intercepta openApp
  const _openApp = window.openApp;
  window.openApp = function(app){
    if(!app || !app.url) return;
    if(String(app.url).startsWith("#local:")){
      const key = app.url.split(":")[1];
      const files = loadLocalAppFiles();
      const html = files[key];
      if(!html){ window.addSys?.("⚠️ HTML local não encontrado."); return; }
      const url = openLocalBlob(html);
      if(typeof window.openInViewer === "function"){
        window.openInViewer(url, app.title || key, {isLocal:true, localKey:key});
      }else{
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
      return;
    }
    if(_openApp) return _openApp(app);
    window.open(app.url, "_blank", "noopener,noreferrer");
  };

  // ouvir local do iframe
  window.readViewerLocal = async function(){
    try{
      const iframe = document.querySelector("#dbodyFrame") || document.querySelector("iframe");
      if(!iframe){ addSys?.("⚠️ Viewer vazio."); return; }
      let docText = "";
      try{
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        docText = doc?.body?.innerText || "";
      }catch(e){
        addSys?.("⚠️ Não consegui ler esse app (origem externa).");
        return;
      }
      docText = (docText||"").trim();
      if(!docText){ addSys?.("⚠️ Nada pra ouvir no local."); return; }

      const arch = (window.detectDominantArchInBlock && detectDominantArchInBlock(docText)) || "madeira";
      addSys?.(`◎ Ouvindo o local (${arch})…`);
      if(typeof window.speakText === "function"){
        window.speakText(docText, {arch});
      }else if("speechSynthesis" in window){
        const u = new SpeechSynthesisUtterance(docText);
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      }
    }catch(err){
      addSys?.("⚠️ Falha ao ouvir o local: "+err.message);
    }
  };

  // DevPanel toggle
  function toggleDevPanel(force){
    const overlay = document.getElementById("devpanelOverlay");
    if(!overlay) return;
    const show = (force!=null) ? !!force : !overlay.classList.contains("show");
    overlay.classList.toggle("show", show);
    overlay.setAttribute("aria-hidden", show?"false":"true");
    if(show) setTimeout(ensureDevPanelIconsLab, 120);
  }
  window.toggleDevPanel = window.toggleDevPanel || toggleDevPanel;

  document.getElementById("devpanelOpenBtn")?.addEventListener("click", ()=>toggleDevPanel(true));
  document.getElementById("devpanelCloseBtn")?.addEventListener("click", ()=>toggleDevPanel(false));
  document.getElementById("devpanelOverlay")?.addEventListener("click", (e)=>{
    if(e.target.id==="devpanelOverlay") toggleDevPanel(false);
  });

  // Icons lab
  function ensureDevPanelIconsLab(){
    const dev = document.getElementById("devpanelBody");
    if(!dev || dev.querySelector(".section.icons-lab")) return;
    const sec = document.createElement("div");
    sec.className = "section icons-lab";
    sec.innerHTML = `
      <div style="font-weight:700; margin-bottom:8px;">Icons Lab (Nebula Pro)</div>
      <div class="icons-row">
        <button class="btn" id="dlIconNebula">Baixar Icon Nebula (SVG)</button>
        <button class="btn" id="dlIconGold">Baixar Icon Gold (SVG)</button>
        <button class="btn" id="dlIconBlue">Baixar Icon Blue (SVG)</button>
        <button class="btn" id="readLocalBtn">◎ Ouvir o Local (Viewer)</button>
      </div>
      <div class="local-audio-hint">Abre um app local no Dual Body e toca em “◎ Ouvir o Local”.</div>
    `;
    dev.appendChild(sec);

    const files = {
      nebula: "icons/icon-bluecup.svg",
      gold:   "icons/icon-bluecup-gold.svg",
      blue:   "icons/icon-bluecup-blue.svg"
    };
    function dl(href, name){
      const a = document.createElement("a");
      a.href = href; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
    }
    sec.querySelector("#dlIconNebula")?.addEventListener("click", ()=> dl(files.nebula, "icon-bluecup.svg"));
    sec.querySelector("#dlIconGold")?.addEventListener("click", ()=> dl(files.gold, "icon-bluecup-gold.svg"));
    sec.querySelector("#dlIconBlue")?.addEventListener("click", ()=> dl(files.blue, "icon-bluecup-blue.svg"));
    sec.querySelector("#readLocalBtn")?.addEventListener("click", ()=> window.readViewerLocal());
  }
  window.ensureDevPanelIconsLab = ensureDevPanelIconsLab;
  setTimeout(ensureDevPanelIconsLab, 400);
})();

/* ====================================================================== */
/* DUAL BRAIN ENGINE v1                                                  */
/* ====================================================================== */
(function(){
  // chaves persistentes
  LS.db = LS.db || "kobllux_dual_brain_v1";

  function loadDB(){
    try{ return JSON.parse(localStorage.getItem(LS.db)||"{}"); }
    catch{ return {}; }
  }
  function saveDB(p){
    const cur = loadDB();
    const next = {...cur, ...p};
    localStorage.setItem(LS.db, JSON.stringify(next));
    return next;
  }

  // refs
  const q = (id)=>document.getElementById(id);
  const themeSelect = q("dbThemeSelect");
  const applyThemeBtn = q("dbApplyTheme");
  const autoThemeArch = q("dbAutoThemeArch");

  const voiceSelect = q("dbVoiceSelect");
  const testVoiceBtn = q("dbTestVoice");
  const rateR = q("dbRate"), pitchR = q("dbPitch");
  const rateVal = q("dbRateVal"), pitchVal = q("dbPitchVal");
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

  if(!themeSelect) return; // dual brain não inserido

  // --- init state
  const state = loadDB();

  // ---------- THEMES ----------
  const THEMES = {
    nebula:  {bg:"#050510", accent:"#1be4ff", gradA:"#ff00ff", gradB:"#00ffff"},
    madeira: {bg:"#04140a", accent:"#5cff9d", gradA:"#1bff6a", gradB:"#1be4ff"},
    blue:    {bg:"#020712", accent:"#7ad7ff", gradA:"#3a7bff", gradB:"#00ffff"},
    gold:    {bg:"#0a0612", accent:"#ffd36a", gradA:"#ffb000", gradB:"#ff00ff"},
    dark:    {bg:"#000000", accent:"#e9ecff", gradA:"#444",   gradB:"#111"}
  };

  function applyTheme(key){
    const t = THEMES[key] || THEMES.nebula;
    document.documentElement.style.setProperty("--bg", t.bg);
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--grad-a", t.gradA);
    document.documentElement.style.setProperty("--grad-b", t.gradB);

    // meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute("content", t.bg);

    saveDB({theme:key});
    addSys?.("🎨 Tema aplicado: "+key);
  }

  applyThemeBtn.onclick = ()=> applyTheme(themeSelect.value);

  // auto tema por arquétipo (quando fala)
  autoThemeArch.onchange = ()=>{
    saveDB({autoThemeArch:autoThemeArch.checked});
    addSys?.("Auto‑tema: "+(autoThemeArch.checked?"on":"off"));
  };

  // ---------- VOICES ----------
  function refreshVoices(){
    voiceSelect.innerHTML = "";
    const list = speechSynthesis.getVoices();
    list.forEach((v,i)=>{
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `${v.name} · ${v.lang}`;
      voiceSelect.appendChild(opt);
    });
    if(state.voiceIndex!=null) voiceSelect.value = state.voiceIndex;
  }
  if("speechSynthesis" in window){
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function pickVoice(){
    const idx = Number(voiceSelect.value||0);
    const v = speechSynthesis.getVoices()[idx];
    saveDB({voiceIndex:idx});
    return v;
  }

  function applyVoiceParams(){
    const r = Number(rateR.value||1);
    const p = Number(pitchR.value||1);
    rateVal.textContent = r.toFixed(2);
    pitchVal.textContent = p.toFixed(2);
    saveDB({rate:r, pitch:p});
  }

  rateR.value = state.rate || 1.0;
  pitchR.value = state.pitch || 1.0;
  applyVoiceParams();

  rateR.oninput = pitchR.oninput = applyVoiceParams;

  autoVoiceArch.checked = !!state.autoVoiceArch;
  autoVoiceArch.onchange = ()=>{
    saveDB({autoVoiceArch:autoVoiceArch.checked});
    addSys?.("Auto‑voz arquétipo: "+(autoVoiceArch.checked?"on":"off"));
  };

  testVoiceBtn.onclick = ()=>{
    const u = new SpeechSynthesisUtterance("◎ Dual Brain online. Base Madeira ativa.");
    u.voice = pickVoice();
    u.rate = Number(rateR.value||1);
    u.pitch = Number(pitchR.value||1);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  };

  // hook speakText global
  const _speakText = window.speakText;
  window.speakText = function(text, opts={}){
    const st = loadDB();
    if("speechSynthesis" in window){
      const u = new SpeechSynthesisUtterance(text);
      u.voice = speechSynthesis.getVoices()[st.voiceIndex||0] || null;
      u.rate = st.rate || 1;
      u.pitch = st.pitch || 1;

      // auto voz por arquétipo
      if(st.autoVoiceArch && window.detectDominantArchInBlock){
        const arch = detectDominantArchInBlock(text);
        const meta = (window.ARCHETYPES||[]).find(a=>a.id===arch);
        if(meta){
          const voices = speechSynthesis.getVoices();
          const vv = voices.find(v=>v.name.toLowerCase().includes(meta.voice.toLowerCase()));
          if(vv) u.voice = vv;
          if(meta.rate) u.rate = meta.rate;
          if(meta.pitch) u.pitch = meta.pitch;
        }
        if(st.autoThemeArch) applyTheme(archColorThemeKey(arch));
      }

      speechSynthesis.cancel(); speechSynthesis.speak(u);
      return;
    }
    return _speakText ? _speakText(text, opts) : null;
  };

  // mapeia arquétipo → tema simples
  function archColorThemeKey(arch){
    if(!arch) return "nebula";
    if(arch==="nova") return "nebula";
    if(arch==="atlas") return "dark";
    if(arch==="vitalis") return "gold";
    if(arch==="pulse") return "blue";
    return "madeira";
  }

  // ---------- APPS ----------
  exportAppsBtn.onclick = ()=>{
    const apps = normalizeApps(loadAppsCache()||DEFAULT_APPS);
    downloadJson("apps.json", apps);
  };
  importAppsBtn.onclick = ()=> appsFile.click();
  appsFile.onchange = async (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    try{
      const j = JSON.parse(await f.text());
      const apps = normalizeApps(j);
      saveAppsCache(apps);
      renderApps(apps);
      addSys?.("✅ apps.json importado ("+apps.length+")");
    }catch(err){
      addSys?.("⚠️ apps.json inválido: "+err.message);
    }finally{ appsFile.value=""; }
  };
  syncAppsBtn.onclick = ()=>{
    syncAppsFromRemote(remoteUrl.value.trim());
  };

  // ---------- STORAGE ----------
  dumpLSBtn.onclick = ()=>{
    const out = {};
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k);
    }
    lsOut.textContent = JSON.stringify(out, null, 2);
  };

  clearLSBtn.onclick = ()=>{
    // limpa só chaves KOBLLUX para não destruir PWA do sistema
    const kill = [];
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(/^kobllux_/i.test(k)) kill.push(k);
    }
    kill.forEach(k=>localStorage.removeItem(k));
    lsOut.textContent = "limpo: "+kill.length+" chaves";
    addSys?.("🧹 StorageSafe limpo ("+kill.length+")");
  };

  // ---------- LOG MISTICO ----------
  openLogBtn.onclick = ()=>{
    const log = loadLogMistico().slice(-50);
    logOut.textContent = JSON.stringify(log, null, 2);
  };
  exportLogBtn.onclick = ()=>{
    const log = loadLogMistico();
    downloadJson("logMistico.json", log);
  };

  // ---------- AUTO‑HEAL ----------
  autoHealChk.checked = state.autoHeal !== false;
  autoHealChk.onchange = ()=>{
    saveDB({autoHeal:autoHealChk.checked});
  };

  runHealBtn.onclick = ()=>{
    const apps = normalizeApps(loadAppsCache()||DEFAULT_APPS);
    let fixed = 0;

    apps.forEach(a=>{
      if(!a.key){ a.key = makeSafeKey(a.title||a.url); fixed++; }
      if(!a.icon){ a.icon = "icons/icon-192.png"; fixed++; }
      if(!a.title){ a.title = a.key; fixed++; }
    });

    saveAppsCache(apps);
    renderApps(apps);
    const msg = fixed?("✅ Auto‑heal: "+fixed+" correções"):"✅ Nada pra curar";
    healStatus.textContent = msg;
    addSys?.(msg);
  };

  // ---------- restore previous selections
  if(state.theme) themeSelect.value = state.theme;
  if(state.autoThemeArch) autoThemeArch.checked = true;
  if(state.autoVoiceArch) autoVoiceArch.checked = true;
  if(state.remoteUrl) remoteUrl.value = state.remoteUrl;

})();

/* ====================================================================== */
/* DUAL BODY ENGINE v1                                                    */
/* ====================================================================== */
(function(){
  window.LS = window.LS || {};
  LS.stacksDB = LS.stacksDB || "kobllux_stacks_v1";

  const dualBody = document.getElementById("dualBody");
  if(!dualBody) return;

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

  let current = { url:null, title:null, isLocal:false, localKey:null };

  // ---------- show/hide dual body ----------
  window.openDualBody = function(url, title, opts={}){
    dualBody.classList.add("show");
    openTab("viewer");
    openInDualViewer(url, title, opts);
  };
  window.closeDualBody = function(){
    dualBody.classList.remove("show");
  };
  window.minDualBody = function(){
    dualBody.classList.remove("show");
  };

  btnClose?.addEventListener("click", ()=>closeDualBody());
  btnMin?.addEventListener("click", ()=>minDualBody());
  btnHome?.addEventListener("click", ()=>{ closeDualBody(); window.scrollTo({top:0,behavior:"smooth"}); });

  // ---------- tabs ----------
  function openTab(name){
    tabs.forEach(t=>t.classList.toggle("active", t.dataset.tab===name));
    panels.forEach(p=>p.classList.toggle("show", p.dataset.panel===name));
  }
  window.openDualTab = openTab;
  tabs.forEach(t=> t.addEventListener("click", ()=> openTab(t.dataset.tab)));

  // ---------- stacks ----------
  function loadStacks(){
    try{ return JSON.parse(localStorage.getItem(LS.stacksDB)||"[]"); }
    catch{ return []; }
  }
  function saveStacks(s){ localStorage.setItem(LS.stacksDB, JSON.stringify(s)); }

  function renderStacks(){
    const s = loadStacks();
    stacksList.innerHTML = "";
    if(!s.length){
      stacksList.innerHTML = `<div class="dbody-small">Nenhum stack ainda.</div>`;
      return;
    }
    s.slice().reverse().forEach((it,idxRev)=>{
      const idx = s.length-1-idxRev;
      const row = document.createElement("div");
      row.className = "stack-item";
      row.innerHTML = `
        <div class="meta">
          <div class="title">${it.title||it.url}</div>
          <div class="url">${it.url}</div>
        </div>
        <div class="actions">
          <button class="dbody-btn" data-act="open">Abrir</button>
          <button class="dbody-btn" data-act="del">Del</button>
        </div>
      `;
      row.querySelector('[data-act="open"]').onclick = ()=>{
        openTab("viewer");
        openInDualViewer(it.url, it.title, it.opts||{});
      };
      row.querySelector('[data-act="del"]').onclick = ()=>{
        const arr = loadStacks();
        arr.splice(idx,1); saveStacks(arr); renderStacks();
      };
      stacksList.appendChild(row);
    });
  }

  btnStack?.addEventListener("click", ()=>{
    if(!current.url) return addSys?.("⚠️ Nada aberto pra stack.");
    const s = loadStacks();
    s.push({ url:current.url, title:current.title, opts:{isLocal:current.isLocal, localKey:current.localKey} });
    saveStacks(s);
    renderStacks();
    addSys?.("✅ Stack criado.");
  });

  // ---------- open in viewer ----------
  function openInDualViewer(url, title, opts={}){
    current = { url, title, isLocal:!!opts.isLocal, localKey:opts.localKey||null };
    frame.src = url || "about:blank";
    viewerTitle.textContent = title || url || "Nenhum app aberto";
    viewerMeta.textContent = opts.isLocal ? ("#local:"+opts.localKey) : (url||"");
    renderStacks();

    if(current.isLocal && current.localKey){
      const files = loadLocalAppFiles();
      editorArea.value = files[current.localKey] || "";
      editorHint.textContent = "Editando: #local:"+current.localKey;
    }else{
      editorArea.value = "";
      editorHint.textContent = "Abra um app #local: para editar.";
    }
  }

  // expõe para o resto do app
  window.openInViewer = function(url, title, opts){
    openDualBody(url, title, opts);
  };

  btnOpenExt?.addEventListener("click", ()=>{
    if(!current.url) return;
    window.open(current.url, "_blank", "noopener,noreferrer");
  });

  btnListen?.addEventListener("click", ()=> window.readViewerLocal?.());

  // ---------- editor / preview ----------
  btnToPreview?.addEventListener("click", ()=>{
    const html = editorArea.value.trim();
    if(!html){ addSys?.("⚠️ Nada no editor."); return; }
    const u = openLocalBlob(html);
    previewFrame.src = u;
    openTab("preview");
    setTimeout(()=>URL.revokeObjectURL(u), 60000);
  });

  btnBackEditor?.addEventListener("click", ()=> openTab("editor"));

  btnSaveLocal?.addEventListener("click", ()=>{
    if(!current.isLocal || !current.localKey){
      addSys?.("⚠️ Nenhum local aberto.");
      return;
    }
    const files = loadLocalAppFiles();
    files[current.localKey] = editorArea.value;
    saveLocalAppFiles(files);
    addSys?.("✅ Local salvo: "+current.localKey);
  });

  btnApplyPreview?.addEventListener("click", ()=>{
    const html = editorArea.value.trim();
    if(!html) return;
    const u = openLocalBlob(html);
    openTab("viewer");
    openInDualViewer(u, current.title || "Local Preview", {isLocal:true, localKey:current.localKey});
    setTimeout(()=>URL.revokeObjectURL(u), 60000);
  });

  renderStacks();
})();

