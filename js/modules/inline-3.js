
/* ====================================================================== */
/* Apps Stack (apps.json)                                                  */
/* ====================================================================== */
const DEFAULT_APPS = [
  { key:"uno", title:"⊙ Portal UNO", desc:"Entrada raiz do Hub.", icon:"icons/icon-192.png", url:"./apps/portal_uno_v2.html" }
];

function loadAppsCache(){
  try{
    const j = JSON.parse(localStorage.getItem(LS.apps)||"null");
    return Array.isArray(j) ? j : (j?.apps||j?.data||null);
  }catch(e){ return null; }
}

async function fetchAppsFile(){
  try{
    const r = await fetch("./apps.json", {cache:"no-store"});
    if(!r.ok) throw new Error("no apps.json");
    const j = await r.json();
    localStorage.setItem(LS.apps, JSON.stringify(j));
    return Array.isArray(j)? j : (j.apps||j.data||DEFAULT_APPS);
  }catch(e){
    return null;
  }
}

function normalizeApps(apps){
  if(!apps) return [];
  if(Array.isArray(apps)) return apps;
  if(Array.isArray(apps.apps)) return apps.apps;
  return [];
}

function addAppToStack(app){
  const stacks = loadStacks();
  const md = `# ${app.title}\n\n${app.desc||""}\n\n🔗 ${app.url}`;
  stacks.push({
    title: app.title,
    content: md,
    preview: md.slice(0,140),
    ts: Date.now()
  });
  saveStacks(stacks);
  renderStacks();
  addSys("App adicionado à Stack ✅");
}

function openApp(app){
  if(!app || !app.url) return;
  const title = app.title || app.key || "App";
  // se tiver DualBody/Viewer, abre lá pra ficar em stack
  if(typeof window.openInViewer === "function"){
    window.openInViewer(app.url, title, app._local ? {isLocal:true, localKey:app.key} : {});
    return;
  }
  if(typeof window.openDualBody === "function"){
    window.openDualBody(app.url, title, app._local ? {isLocal:true, localKey:app.key} : {});
    return;
  }
  window.open(app.url, "_blank", "noopener,noreferrer");
}

function renderApps(apps){
  appsGrid.innerHTML="";
  const remote = normalizeApps(apps);
  const locals = (window.getLocalAppsForHub ? window.getLocalAppsForHub() : []);
  const list = [...locals, ...remote];
  if(!list.length){
    appsHint.textContent = locals.length ? "Nenhum app remoto. Importe apps.json se quiser." : "Nenhum app encontrado. Use Apps Locais ou importe apps.json.";
    return;
  }
  appsHint.textContent = "";

  const q = (appsSearch.value||"").toLowerCase();
  list.filter(a=>{
    if(!q) return true;
    return (a.title||"").toLowerCase().includes(q) ||
           (a.desc||"").toLowerCase().includes(q) ||
           (a.key||"").toLowerCase().includes(q);
  }).forEach(app=>{
    const card = document.createElement("div");
    card.className = "appCard";
    card.innerHTML = `
      <div class="appIcon">${
        app.icon? `<img src="${app.icon}" alt="">` : "◐"
      }</div>
      <div class="appBody">
        <div class="appTitle">${escapeHtml(app.title||app.key||"App")}</div>
        <div class="appDesc">${escapeHtml(app.desc||"")}</div>
        <div class="appActions">
          <button class="appBtn primary" data-open>Open</button>
          <button class="appBtn" data-stack>Add Stack</button>
          <button class="appBtn" data-copy>Copy URL</button>
        </div>
      </div>
    `;
    card.querySelector("[data-open]").onclick = ()=>openApp(app);
    card.querySelector("[data-stack]").onclick = ()=>addAppToStack(app);
    card.querySelector("[data-copy]").onclick = async ()=>{
      try{ await navigator.clipboard.writeText(app.url); addSys("URL copiada ✅"); }catch(e){}
    };
    appsGrid.appendChild(card);
  });
}

async function bootApps(){
  let apps = loadAppsCache();
  if(!apps){
    const fetched = await fetchAppsFile();
    apps = fetched || DEFAULT_APPS;
  }
  renderApps(apps);
}

appsSearch?.addEventListener("input", ()=>renderApps(loadAppsCache()||DEFAULT_APPS));
appsReloadBtn?.addEventListener("click", async ()=>{
  const fetched = await fetchAppsFile();
  renderApps(fetched || loadAppsCache() || DEFAULT_APPS);
});

// DOM refs Apps (safe)
const appsGrid = document.getElementById("appsGrid");
const appsHint = document.getElementById("appsHint");
const appsSearch = document.getElementById("appsSearch");
const appsReloadBtn = document.getElementById("appsReloadBtn");
bootApps();

