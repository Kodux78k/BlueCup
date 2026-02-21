
/* MOBILE-FIRST VERTICAL HARD-LOCK */
const LS = {
  cfg: "bluecup_cfg_v0",
  stacks: "bluecup_stacks_v0",
  apps: "bluecup_apps_cache_v0"
  ,appFiles: "kobllux_apps_files_v1"
};

const defaultCfg = {
  provider: "auto",
  model: "",
  openrouterKey: "",
  systemPrompt:
`Você é o BlueCup, agente local simbólico do ecossistema KOBLLUX/Infodose.
- Responda curto, colável, com trilhas Nebula Pro + Base Madeira.
- Quando fizer sentido, gere uma tríade simbólica.
- Se o usuário pedir registro, sugira Stack.`
};

let cfg = loadCfg();
let busy = false;
let lastBotEl = null;

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const ttsBtn = document.getElementById("ttsBtn");
const stackBtn = document.getElementById("stackBtn");
const clearBtn = document.getElementById("clearBtn");
const triadOut = document.getElementById("triadOut");
const genTriadBtn = document.getElementById("genTriadBtn");
const orbBtn = document.getElementById("orbBtn");
const stackList = document.getElementById("stackList");

const providerSel = document.getElementById("providerSel");
const modelInp = document.getElementById("modelInp");
const keyInp = document.getElementById("keyInp");
const sysPromptInp = document.getElementById("sysPromptInp");
const saveDevBtn = document.getElementById("saveDevBtn");
const resetDevBtn = document.getElementById("resetDevBtn");
const pingLocalBtn = document.getElementById("pingLocalBtn");
const importAppsBtn = document.getElementById("importAppsBtn");
const exportStacksBtn = document.getElementById("exportStacksBtn");
const newStackBtn = document.getElementById("newStackBtn");
const pingLocal = document.getElementById("pingLocalBtn");
const statusTxt = document.getElementById("statusTxt");
const localDot = document.getElementById("localDot");
const routeHint = document.getElementById("routeHint");

hydrateDevUI();
renderStacks();
bootMessage();

/* ---------- UI helpers ---------- */

/* ====================================================================== */
/* Render rico (MD-lite + callouts + tabelista + voz)                      */
/* ====================================================================== */

function escapeHtml(s){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}

// --- Tabelista: markdown table -> html
function mdTablesToHtml(src){
  const lines = String(src||"").split(/\n/);
  let out = [];
  let i = 0;
  let inPre = false;

  const cells = (row)=> row.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
  const isNum = (v)=>{
    const t = String(v||"").trim();
    if(!t) return false;
    return /^-?\d+([.,]\d+)?%?$/.test(t) || /^[R$€£]\s*-?\d+([.,]\d+)?%?$/.test(t);
  };

  while(i < lines.length){
    let line = lines[i];

    // não tentar tabelista dentro de <pre><code>
    if(line.includes("<pre><code>")) inPre = true;
    if(inPre){
      out.push(line);
      if(line.includes("</code></pre>")) inPre = false;
      i++; continue;
    }

    const next = lines[i+1] || "";
    const isHeader = /\|/.test(line);
    const isSep = /^[\s\|\-\:]+$/.test(next) && next.includes("-");

    if(isHeader && isSep){
      const header = cells(line);
      i += 2;

      let rows = [];
      while(i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== ""){
        rows.push(cells(lines[i]));
        i++;
      }

      const colCount = header.length;
      const numericCols = Array(colCount).fill(true);

      rows.forEach(r=>{
        for(let c=0;c<colCount;c++){
          const v = r[c];
          if(v==null || String(v).trim()==="") continue;
          if(!isNum(v)) numericCols[c]=false;
        }
      });

      const ths = header.map((c,idx)=>`<th class="${numericCols[idx]?'num':''}">${c || "&nbsp;"}</th>`).join("");
      const body = rows.map(r=>{
        const tds = Array(colCount).fill(0).map((_,idx)=>{
          const v = r[idx] || "";
          return `<td class="${numericCols[idx]?'num':''}">${v || "&nbsp;"}</td>`;
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

// --- Callouts aninhados ::info ::aside ::warn ::success ::question ::danger
function parseCalloutsNested(md){
  const lines = String(md||"").split(/\n/);
  let out = [];
  let stack = []; // {type, level, raw:[]}

  const open = (type, level)=> stack.push({type, level, raw:[]});

  const closeToLevel = (level)=>{
    while(stack.length && stack[stack.length-1].level >= level){
      const blk = stack.pop();
      const rawText = blk.raw.join("\n");
      const arch = detectDominantArchInBlock(rawText);

      const iconMap = { info:"ℹ", aside:"◐", warn:"⚠", success:"✓", question:"?", danger:"!" };
      const icon = iconMap[blk.type] || "◐";
      const color = archColorFor(arch || blk.type);

      // rawText já vem escapado porque parse roda depois do escapeHtml
      const htmlBody = renderRich(rawText, {alreadyEscaped:true});

      const htmlBlock = `
<div class="callout ${blk.type} level-${blk.level}" style="--arch-color:${color}">
  <div class="callout-title"><span class="callout-icon">${icon}</span>${blk.type}${arch?` · ${arch}`:""}</div>
  <div class="callout-body">${htmlBody}</div>
</div>`;

      if(stack.length) stack[stack.length-1].raw.push(htmlBlock);
      else out.push(htmlBlock);
    }
  };

  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    const m = line.match(/^(\s*)::(info|aside|warn|success|question|danger)\s*$/i);
    if(m){
      const indent = m[1].replace(/\t/g,"  ").length;
      const level = Math.max(1, Math.floor(indent/2)+1);
      const type = m[2].toLowerCase();
      closeToLevel(level);
      open(type, level);
      continue;
    }
    if(/^\s*::\s*$/.test(line)){
      closeToLevel(1);
      continue;
    }
    if(stack.length) stack[stack.length-1].raw.push(line);
    else out.push(line);
  }
  closeToLevel(1);
  return out.join("\n");
}

// --- wrap headings inside md-blocks (com cor do arquétipo)
function wrapBlocks(html){
  const parts = String(html||"").split(/(?=<h[1-3][^>]*>)/i);
  if(parts.length <= 1) return html;

  return parts.map(p=>{
    if(!/^\s*<h[1-3]/i.test(p)) return p;

    let arch = null;
    const m1 = p.match(/data-voice="([^"]+)"/i);
    if(m1) arch = m1[1].toLowerCase().trim();

    const color = archColorFor(arch || "madeira");
    const tag = arch ? `<div class="md-block-tag"><span class="dot"></span>${arch}</div>` : "";

    return `<div class="md-block arch" data-arch="${arch||''}" style="--arch-color:${color}">${tag}${p}</div>`;
  }).join("");
}

function renderRich(text, {alreadyEscaped=false}={}){
  // 1) escape (só uma vez)
  let s = alreadyEscaped ? String(text||"") : escapeHtml(text);

  // 2) fenced code
  s = s.replace(/```([\s\S]*?)```/g, (m, code)=>{
    const c = code.replace(/^\n+|\n+$/g,"");
    return `<pre><code>${c}</code></pre>`;
  });

  // 3) callouts nested
  s = parseCalloutsNested(s);

  // 4) tabelista
  s = mdTablesToHtml(s);

  // 5) blockquote simples
  s = s.replace(/^&gt;\s?(.*)$/gmi, (m, line)=>`<blockquote>${line}</blockquote>`);

  // 6) voice blocks: > ATLAS: ... (agrupa)
  s = s.replace(
    /(<blockquote>\s*([A-Za-zÀ-ÿ0-9_\- ]+):\s*<\/blockquote>(?:\s*<blockquote>[\s\S]*?<\/blockquote>)*)/g,
    (whole)=>{
      const tagMatch = whole.match(/<blockquote>\s*([^:]+):\s*<\/blockquote>/);
      const tag = tagMatch? tagMatch[1].trim(): 'VOZ';
      const inner = whole
        .replace(/<blockquote>\s*[^:]+:\s*<\/blockquote>/,'')
        .replace(/<blockquote>|<\/blockquote>/g,'')
        .replace(/\n/g,'<br>');
      return `<div class="voice-block" data-voice="${tag}"><span class="voice-tag">${tag}</span>${inner}</div>`;
    }
  );

  // 7) bold/italic
  s = s.replace(/\*\*\*([^\*]+)\*\*\*/g, "<b><i>$1</i></b>");
  s = s.replace(/\*\*([^\*]+)\*\*/g, "<b>$1</b>");
  s = s.replace(/\*([^\*]+)\*/g, "<i>$1</i>");

  // 8) inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 9) headings
  s = s.replace(/^###\s+(.*)$/gmi, "<h3>$1</h3>");
  s = s.replace(/^##\s+(.*)$/gmi, "<h2>$1</h2>");
  s = s.replace(/^#\s+(.*)$/gmi, "<h1>$1</h1>");

  // 10) decorar voz (se existir)
  if(typeof decorateVoiceBlocksHtml === "function"){
    s = decorateVoiceBlocksHtml(s);
  }

  // 11) wrap blocks
  s = wrapBlocks(s);

  // 12) line breaks finais (fora de tags grandes)
  s = s.replace(/\n/g,"<br>");
  return s;
}

/* ====================================================================== */
/* Dual Response Parser                                                    */
/* ====================================================================== */
function tryParseDual(raw){
  const text = String(raw || "").trim();

  // primary: JSON fenced block
  const jm = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if(jm){
    try{
      const obj = JSON.parse(jm[1]);
      if(obj && typeof obj.primary==="string" && typeof obj.secondary==="string"){
        return obj;
      }
    }catch(e){}
  }

  // fallback: delimiters
  if(text.includes("<<PRIMARY>>") && text.includes("<<SECONDARY>>")){
    try{
      const p = text.split("<<PRIMARY>>")[1].split("<<SECONDARY>>")[0].trim();
      const s = text.split("<<SECONDARY>>")[1].trim();
      if(p && s) return {primary:p, secondary:s};
    }catch(e){}
  }

  return null;
}


/* ====================================================================== */
/* Dual Mode Engine (front)                                                */
/* ====================================================================== */
const DUAL_STATE = window.DUAL_STATE || {
  dualOn: true,
  triadeOn: false,
  lock: false
};
window.DUAL_STATE = DUAL_STATE;

// Buttons (FAB or inline)
const btnDual = document.getElementById("btnDual");
const btnTriade = document.getElementById("btnTriade");

function paintDualUI(){
  if(btnDual){
    btnDual.classList.toggle("primary", DUAL_STATE.dualOn);
    btnDual.textContent = DUAL_STATE.dualOn ? "⇄ Dual" : "→ Dual";
  }
  if(btnTriade){
    btnTriade.classList.toggle("primary", DUAL_STATE.triadeOn);
    btnTriade.textContent = DUAL_STATE.triadeOn ? "3·6·9 ON" : "3·6·9 OFF";
    btnTriade.style.opacity = DUAL_STATE.triadeOn ? "1" : ".65";
  }
}
btnDual?.addEventListener("click", ()=>{
  DUAL_STATE.dualOn = !DUAL_STATE.dualOn;
  if(typeof addSys==="function") addSys(`Dual ${DUAL_STATE.dualOn ? "ON" : "OFF"} ✅`);
  paintDualUI();
});
btnTriade?.addEventListener("click", ()=>{
  DUAL_STATE.triadeOn = !DUAL_STATE.triadeOn;
  if(typeof addSys==="function") addSys(`Triade ${DUAL_STATE.triadeOn ? "ON" : "OFF"} ✅`);
  paintDualUI();
});
paintDualUI();

// triade symbolic maker
function makeTriad(){
  const pool = ["⚡️","⭕️","🌿","🔮","🌀","✨"];
  const pick = ()=> pool[Math.floor(Math.random()*pool.length)];
  return `🌐 Tríade simbólica: ${pick()}${pick()}${pick()}`;
}

/* ====================================================================== */
/* runWithDual wrapper                                                     */
/* ====================================================================== */
async function runWithDual(txt){
  if(DUAL_STATE.lock) return;
  DUAL_STATE.lock = true;
  try{
    const out = await routeRun(txt);

    if(!DUAL_STATE.dualOn){
      lastBotEl?.classList.add("primary");
      fakeStream(lastBotEl, out, 12);
      return;
    }

    const dual = tryParseDual(out);

    if(dual){
      lastBotEl?.classList.add("primary");
      lastBotEl.innerHTML = renderRich(dual.primary);
      lastBotEl.dataset.plain = stripHtml(lastBotEl.innerHTML);
      fakeStream(lastBotEl, dual.primary, 12);

      const el2 = addMsg("bot secondary", dual.secondary);
      fakeStream(el2, dual.secondary, 10);

      if(DUAL_STATE.triadeOn){
        const t = makeTriad();
        const el3 = addMsg("bot triad", t);
        fakeStream(el3, t, 6);
      }
    }else{
      lastBotEl?.classList.add("primary");
      fakeStream(lastBotEl, out, 12);

      if(DUAL_STATE.triadeOn){
        const t = makeTriad();
        const el3 = addMsg("bot triad", t);
        fakeStream(el3, t, 6);
      }
    }
  } finally{
    DUAL_STATE.lock = false;
  }
}


/* ====================================================================== */
/* Voz por bloco (Gerardo MD)                                              */
/* ====================================================================== */
const ARCH_VOICES = window.ARCH_VOICES || {
  Atlas:{pitch:0.9, rate:0.95},
  Nova:{pitch:1.25, rate:1.10},
  Vitalis:{pitch:1.45, rate:1.2},
  Pulse:{pitch:1.1, rate:1.05},
  Artemis:{pitch:1.0, rate:1.0},
  Serena:{pitch:0.75, rate:0.85},
  Kaos:{pitch:1.6, rate:1.3},
  Genus:{pitch:0.9, rate:0.9},
  Lumine:{pitch:1.15, rate:1.0},
  Rhea:{pitch:0.85, rate:0.9},
  Solus:{pitch:0.7, rate:0.8},
  Aion:{pitch:0.95, rate:0.8}
};

function getVoiceSettings(tag){
  const key = String(tag||'').trim();
  // if user provided KOBLLUX_VOICES, prefer it
  try{
    const km = window.KOBLLUX_VOICES;
    if(km){
      const k = key.toLowerCase();
      if(km[k]) return {pitch: km[k].pitch ?? 1, rate: km[k].rate ?? 1, voice: km[k].voice};
    }
  }catch{}
  return ARCH_VOICES[key] || ARCH_VOICES[key[0]?.toUpperCase()+key.slice(1)] || {pitch:1, rate:1};
}

function speakByBlocks(containerEl){
  // se não tiver bloco, cai pra speak normal
  const blocks = containerEl ? [...containerEl.querySelectorAll('.voice-block')] : [];
  if(!blocks.length){
    const plain = containerEl?.dataset?.plain || containerEl?.textContent || '';
    return speak(plain);
  }

  let idx = 0;
  function next(){
    if(idx>=blocks.length) return;
    const b = blocks[idx];
    blocks.forEach(x=>x.classList.remove('speaking'));
    b.classList.add('speaking');

    const tag = b.dataset.voice || 'VOZ';
    const text = b.textContent.replace(new RegExp("^"+tag+"\s*","i"), '').trim();
    const set = getVoiceSettings(tag);

    try{
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = set.pitch ?? 1;
      u.rate  = set.rate ?? 1;
      u.onend = ()=>{ idx++; next(); };
      u.onerror = ()=>{ idx++; next(); };
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }catch(e){
      // fallback
      speak(text);
      idx++; next();
    }
  }
  next();
}

function stripHtml(htmlStr){
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlStr;
  return tmp.textContent || tmp.innerText || "";
}
function addMsg(role, text){
  const el = document.createElement("div");
  el.className = "chat-message " + role;

  if(role==="bot"){
    const rich = renderRich(text);
    el.innerHTML = rich;
    el.dataset.plain = stripHtml(rich);

    // botões
    const copyBtn = document.createElement("button");
    copyBtn.className="copy-btn";
    copyBtn.type="button";
    copyBtn.ariaLabel="Copiar resposta";
    copyBtn.onclick = ()=>{
      const plain = el.dataset.plain || el.textContent;
      navigator.clipboard?.writeText(plain);
      addSys("Copiado. ✅");
    };

    const listenBtn = document.createElement("button");
    listenBtn.className="listen-btn";
    listenBtn.type="button";
    listenBtn.ariaLabel="Ouvir resposta";
    listenBtn.onclick = ()=>{ speakByBlocks(el); };

    el.appendChild(copyBtn);
    el.appendChild(listenBtn);
    lastBotEl = el;
  }else{
    el.textContent = text;
  }

  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
  return el;
}
function addSys(text){ addMsg("sys", text); }
function fakeStream(el, full, speed=18){
  if(!el) return;
  let i=0;
  const plainFull = String(full);
  const t = setInterval(()=>{
    i++;
    const chunk = plainFull.slice(0,i);
    if(el.classList.contains("bot")){
      const rich = renderRich(chunk);
      el.innerHTML = rich;
      el.dataset.plain = stripHtml(rich);
      // reappend buttons if got wiped
      if(!el.querySelector(".copy-btn")){
        const cb=document.createElement("button"); cb.className="copy-btn"; cb.type="button";
        cb.onclick=()=>{navigator.clipboard?.writeText(el.dataset.plain||el.textContent); addSys("Copiado. ✅");};
        const lb=document.createElement("button"); lb.className="listen-btn"; lb.type="button";
        lb.onclick=()=>{speakByBlocks(el);};
        el.appendChild(cb); el.appendChild(lb);
      }
    }else{
      el.textContent = chunk;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
    if(i>=plainFull.length) clearInterval(t);
  }, speed);
}
function setStatus(mode){
  statusTxt.textContent = mode;
  if(mode.includes("local")) localDot.classList.add("on");
  else localDot.classList.remove("on");
}

/* ---------- localStorage ---------- */
function loadCfg(){
  try{
    const c = JSON.parse(localStorage.getItem(LS.cfg)||"null");
    return {...defaultCfg, ...(c||{})};
  }catch(e){ return {...defaultCfg}; }
}
function saveCfg(){
  localStorage.setItem(LS.cfg, JSON.stringify(cfg));
}
function loadStacks(){
  try{ return JSON.parse(localStorage.getItem(LS.stacks)||"[]"); }
  catch{ return []; }
}
function saveStacks(st){
  localStorage.setItem(LS.stacks, JSON.stringify(st));
}

/* ---------- Triads ---------- */
function genTriad(){
  const triads = ["⚡️⭕️⚡️","🌫⭕️⚡️","💧⭕️🌱","🔥⭕️🌀","✨⭕️⚙️","🪷⭕️🌌"];
  const t = triads[Math.floor(Math.random()*triads.length)];
  triadOut.textContent = t;
  return t;
}
genTriadBtn.onclick = genTriad;
orbBtn.onclick = genTriad;

/* ---------- Chat actions ---------- */
sendBtn.onclick = onSend;
chatInput.addEventListener("keydown", (e)=>{
  if(e.key==="Enter" && !e.shiftKey){
    e.preventDefault(); onSend();
  }
});

ttsBtn.onclick = ()=>{
  const last = [...chatBox.querySelectorAll(".chat-message.bot")].pop();
  if(!last) return;
  speak(last.textContent);
};

stackBtn.onclick = ()=>{
  const last = [...chatBox.querySelectorAll(".chat-message.bot")].pop();
  if(!last) return;
  openNewStack(last.textContent);
};

clearBtn.onclick = ()=>{
  if(confirm("Limpar chat?")) {
    chatBox.innerHTML="";
    bootMessage();
  }
};

async function onSend(){
  const txt = chatInput.value.trim();
  if(!txt || busy) return;
  busy = true;
  sendBtn.disabled = true;

  addMsg("you", txt);
  chatInput.value = "";

  lastBotEl = addMsg("bot","⌛ BlueCup pensando...");
  try{
    await runWithDual(txt);
  }catch(err){
    lastBotEl.textContent = "⚠️ "+err.message;
  }finally{
    busy = false;
    sendBtn.disabled = false;
  }
}

/* ---------- Routing ---------- */
async function routeRun(userText){
  const provider = cfg.provider;
  if(provider==="offline") {
    setStatus("offline");
    return offlineReply(userText);
  }

  if(provider==="bluelocal"){
    setStatus("local");
    return await runBlueLocal(userText);
  }

  if(provider==="openrouter"){
    setStatus("router");
    return await runOpenRouter(userText);
  }

  // auto: tenta local → router → offline
  try{
    setStatus("local?");
    const r = await runBlueLocal(userText);
    setStatus("local");
    routeHint.textContent = "Rota: BlueLocal";
    return r;
  }catch(e1){
    try{
      setStatus("router?");
      const r2 = await runOpenRouter(userText);
      setStatus("router");
      routeHint.textContent = "Rota: OpenRouter";
      return r2;
    }catch(e2){
      setStatus("offline");
      routeHint.textContent = "Rota: Offline (fallback)";
      return offlineReply(userText);
    }
  }
}

/* ---------- BlueLocal (agent on :4040) ---------- */
async function runBlueLocal(prompt){
  const token = localStorage.getItem("openauth_token") || "dev";
  const url = "http://localhost:4040/agent/run";
  const res = await fetch(url,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+token
    },
    body: JSON.stringify({prompt})
  });
  if(!res.ok) throw new Error("BlueLocal indisponível");
  const j = await res.json();
  return j.output || "(vazio)";
}

/* ---------- OpenRouter ---------- */
async function runOpenRouter(prompt){
  const key = cfg.openrouterKey;
  if(!key) throw new Error("Sem chave OpenRouter");
  const model = cfg.model || "openrouter/auto";

  const body = {
    model,
    messages: [
      {role:"system", content: cfg.systemPrompt},
      {role:"user", content: prompt}
    ]
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+key,
      "HTTP-Referer": location.origin,
      "X-Title":"BlueCup"
    },
    body: JSON.stringify(body)
  });

  if(!res.ok) throw new Error("OpenRouter erro "+res.status);
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() || "(sem texto)";
}

/* ---------- Offline fallback ---------- */
function offlineReply(prompt){
  const tri = genTriad();
  return `(${tri})\nModo offline.\nVocê disse: “${prompt}”.\nSe quiser IA real, abre DevPanel e cola tua chave/modelo.`;
}

/* ---------- Stacks ---------- */
function renderStacks(){
  const stacks = loadStacks();
  stackList.innerHTML="";
  if(!stacks.length){
    const empty = document.createElement("div");
    empty.className="tiny";
    empty.textContent="Nenhuma stack ainda.";
    stackList.appendChild(empty);
    return;
  }
  stacks.slice().reverse().forEach((s, idx)=>{
    const el = document.createElement("div");
    el.className="stackItem";
    el.innerHTML = `
      <div class="title">${escapeHtml(s.title)}</div>
      <div class="meta">${new Date(s.ts).toLocaleString()}</div>
      <div class="tiny">${escapeHtml(s.preview)}</div>
      <div class="btnRow">
        <button data-open="${idx}">Abrir</button>
        <button data-del="${idx}">Apagar</button>
      </div>
    `;
    stackList.appendChild(el);
  });

  stackList.querySelectorAll("button[data-open]").forEach(b=>{
    b.onclick = ()=>{
      const i = Number(b.dataset.open);
      openStack(i);
    };
  });
  stackList.querySelectorAll("button[data-del]").forEach(b=>{
    b.onclick = ()=>{
      const i = Number(b.dataset.del);
      delStack(i);
    };
  });
}

function openNewStack(seedText=""){
  const title = prompt("Título da stack?");
  if(!title) return;
  const content = prompt("Conteúdo (MD):", seedText) || seedText;
  const stacks = loadStacks();
  stacks.push({
    title,
    content,
    preview: content.slice(0,140),
    ts: Date.now()
  });
  saveStacks(stacks);
  renderStacks();
  addSys("Stack salva. ✅");
}

function openStack(i){
  const stacks = loadStacks();
  const s = stacks[i];
  if(!s) return;
  const edited = prompt(`Editar stack: ${s.title}`, s.content);
  if(edited===null) return;
  s.content = edited;
  s.preview = edited.slice(0,140);
  s.ts = Date.now();
  saveStacks(stacks);
  renderStacks();
}

function delStack(i){
  const stacks = loadStacks();
  const s = stacks[i];
  if(!s) return;
  if(!confirm("Apagar stack “"+s.title+"”?")) return;
  stacks.splice(i,1);
  saveStacks(stacks);
  renderStacks();
}

exportStacksBtn.onclick = ()=>{
  const stacks = loadStacks();
  const md = stacks.map(s=>
`# ${s.title}\n\n${s.content}\n\n---\n`
  ).join("\n");
  const blob = new Blob([md],{type:"text/markdown"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bluecup_stacks.md";
  a.click();
  URL.revokeObjectURL(a.href);
};

newStackBtn.onclick = ()=>openNewStack("");

/* Import apps.json (cache local só pra consulta futura) */
importAppsBtn.onclick = ()=>{
  const inp = document.createElement("input");
  inp.type="file"; inp.accept="application/json";
  inp.onchange = async ()=>{
    const file = inp.files[0];
    if(!file) return;
    const txt = await file.text();
    try{
      const j = JSON.parse(txt);
      localStorage.setItem(LS.apps, JSON.stringify(j));
      addSys("apps.json importado. ✅");
    }catch(e){
      alert("JSON inválido");
    }
  };
  inp.click();
};

/* ---------- DevPanel ---------- */
saveDevBtn.onclick = ()=>{
  cfg.provider = providerSel.value;
  cfg.model = modelInp.value.trim();
  cfg.openrouterKey = keyInp.value.trim();
  cfg.systemPrompt = sysPromptInp.value.trim() || defaultCfg.systemPrompt;
  saveCfg();
  addSys("Config salva. ✅");
};

resetDevBtn.onclick = ()=>{
  if(!confirm("Resetar DevPanel?")) return;
  cfg = {...defaultCfg};
  saveCfg();
  hydrateDevUI();
  addSys("Reset ok.");
};

pingLocalBtn.onclick = async ()=>{
  try{
    const res = await fetch("http://localhost:4040/health");
    if(!res.ok) throw 0;
    addSys("BlueBrain local vivo. 🟢");
  }catch(e){
    addSys("BlueBrain local não respondeu. ⚫");
  }
};

function hydrateDevUI(){
  providerSel.value = cfg.provider;
  modelInp.value = cfg.model;
  keyInp.value = cfg.openrouterKey;
  sysPromptInp.value = cfg.systemPrompt;
}

/* ---------- TTS COM ARQUÉTIPOS ---------- */

// Mapa de vozes por arquétipo (ajusta os hints conforme as vozes do teu device)
const ARCH_TTS = {
  ATLAS:   { label:"ATLAS",   voiceHint:"Reed", rate:1.0, pitch:0.80 },
  NOVA:    { label:"NOVA",    voiceHint:"Luciana",  rate:1.02, pitch:1.28 },
  VITALIS: { label:"VITALIS", voiceHint:"Rocko",   rate:1.05, pitch:1.1 },
  PULSE:   { label:"PULSE",   voiceHint:"Reed",    rate:1.1,  pitch:1.0 },
  ARTEMIS: { label:"ARTEMIS", voiceHint:"Monica",  rate:1.0,  pitch:1.15 },
  SERENA:  { label:"SERENA",  voiceHint:"Joana", rate:0.95, pitch:0.95 },
  KAOS:    { label:"KAOS",    voiceHint:"Reed",    rate:1.15, pitch:0.605 },
  GENUS:   { label:"GENUS",   voiceHint:"Daniel",  rate:0.98, pitch:1.10 },
  LUMINE:  { label:"LUMINE",  voiceHint:"Shelley",   rate:1.0,  pitch:1.35 },
  RHEA:    { label:"RHEA",    voiceHint:"Luciana", rate:0.97, pitch:0.88 },
  SOLUS:   { label:"SOLUS",   voiceHint:"Daniel",  rate:0.96, pitch:0.86 },
  AION:    { label:"AION",    voiceHint:"Monica",    rate:0.94, pitch:0.78 },

  DEFAULT: { label:"DEFAULT", voiceHint:"Luciana", rate:1.0,  pitch:1.0 }
};

// Detecta se a linha é tipo: "> ATLAS: texto"
function detectArchetypeTag(line){
  const m = line.match(/^\s*>\s*([A-ZÇÃÕ]+)\s*:/);
  if(!m) return null;
  const key = m[1].toUpperCase();
  if(ARCH_TTS[key]) return key;
  return null;
}

/* ====================================================================== */
/* Dominância por contagem (voz / tags) + cor por arquétipo (SAFE)         */
/* ====================================================================== */

// Detecta arquétipo dominante dentro de um bloco md/callout.
// Conta ocorrências de marcas tipo: "> ATLAS:" ou "&gt; ATLAS:"
function detectDominantArchInBlock(rawText){
  const text = String(rawText || "");
  const counts = Object.create(null);

  const lines = text.split(/\r?\n/);
  for(const l of lines){
    const m = l.match(/^\s*(?:>|&gt;)\s*([A-ZÇÃÕ]+)\s*:/);
    if(m){
      const key = m[1].toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  // também conta ocorrências soltas no texto (ex.: "ATLAS:" fora de blockquote)
  const loose = text.match(/\b(ATLAS|NOVA|VITALIS|PULSE|ARTEMIS|SERENA|KAOS|GENUS|LUMINE|RHEA|SOLUS|AION|KOBLLUX|UNO|DUAL|TRINITY|INFODOSE|KODUX|BLLUE|MINUZ|METALUX)\b/gi) || [];
  for(const k of loose){
    const key = k.toUpperCase();
    counts[key] = (counts[key] || 0) + 0.25; // peso menor
  }

  // === Se não há tags suficientes, aplica densidade semântica (keywords) ===
  const hasStrongTag = Object.values(counts).some(v => v >= 1);
  if(!hasStrongTag){
    const T = text.toLowerCase();

    const SEM = {
      ATLAS:   ["plano","estratég","métrica","processo","roadmap","objetivo","prioridade","estrutura","organiza","sistema","framework","detalhe"],
      NOVA:    ["ideia","criar","inovar","imagina","insight","explora","futuro","visão","estelar","poético","metáfora","novo"],
      VITALIS: ["energia","ação","vamos","agora","urgente","foco","força","movimento","treino","meta","bora","intenso"],
      PULSE:   ["sentir","emoção","pulso","ritmo","vibra","coração","fluxo","conexão","presença","onda","respira"],
      ARTEMIS: ["aventura","caminho","descobrir","viagem","porta","mapa","explorar","missão","curioso","trilha"],
      SERENA:  ["calma","acolher","cuidar","suave","pausa","gentil","silêncio","seguro","respirar","equilíbrio"],
      KAOS:    ["quebrar","caos","rebelde","imprevis","hack","bug","explodir","disrupt","subverter","insano"],
      GENUS:   ["fazer","mão na massa","prático","técnico","passo a passo","construir","implement","patch","código","resolver"],
      LUMINE:  ["luz","brilho","alegr","sorriso","leve","colorido","jogar","divert","boom","spark"],
      RHEA:    ["cura","nutrir","terra","raízes","ciclo","mãe","sensível","profundo","integra","regenera"],
      SOLUS:   ["silêncio","meditar","sábio","contemplar","lento","essência","interior","monge","introspec"],
      AION:    ["tempo","ciclo","loop","história","memória","futuro","cron","eterno","evolução","timeline"],
      KOBLLUX: ["infodose","kobllux","dual","trinity","oráculo","metaLux","nebula","base madeira","pulso 3·6·9"]
    };

    const semCounts = Object.create(null);
    for(const [arch, kws] of Object.entries(SEM)){
      let score = 0;
      for(const kw of kws){
        if(!kw) continue;
        // conta ocorrências simples
        const rekw = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), "g");
        const n = (T.match(rekw)||[]).length;
        score += n;
      }
      if(score>0) semCounts[arch]=score;
    }

    for(const [k,score] of Object.entries(semCounts)){
      counts[k] = (counts[k]||0) + score*0.2; // peso semântico leve
    }
  }

  let best = null, bestScore = 0;
  for(const [k,score] of Object.entries(counts)){
    if(score > bestScore){
      bestScore = score;
      best = k;
    }
  }
  return best ? best.toLowerCase() : null;
}

// Retorna cor de arquétipo de forma compatível (lowercase / ALL / fallbacks)
function archColorFor(id){
  const key = String(id||"").toLowerCase().trim();
  const api = window.KOBLLUX_ARCH;
  if(api){
    const cap = key ? (key.charAt(0).toUpperCase()+key.slice(1)) : "";
    const entry = api[key] || api[cap] || api.ALL?.[cap];
    if(entry && entry.color) return entry.color;
  }

  const fallback = {
    madeira:"#5cff9d", fogo:"#ff5c7a", agua:"#5cc8ff", terra:"#f5d76e", metal:"#d0d5dd",
    info:"rgba(27,228,255,.95)", aside:"rgba(240,0,255,.95)", warn:"#fbbf24",
    success:"#34d399", question:"#a78bfa", danger:"#fb7185"
  };
  return fallback[key] || "rgba(27,228,255,.95)";
}



// Quebra o texto em segmentos [ {arch, text} ]
function splitByArchetypeSegments(text){
  const lines = text.split(/\r?\n/);
  const segments = [];

  for(const rawLine of lines){
    const line = rawLine.trim();
    if(!line) continue;

    const arch = detectArchetypeTag(line);
    if(arch){
      // remove o prefixo "> ARCH:" e guarda só o conteúdo
      const clean = line.replace(/^\s*>\s*[A-ZÇÃÕ]+\s*:\s*/, "").trim();
      if(clean) segments.push({ arch, text: clean });
    }else{
      segments.push({ arch: null, text: line });
    }
  }

  return segments;
}

// Escolhe voz do device com base no hint
function pickVoiceForCfg(voices, cfg){
  if(!voices || !voices.length) return null;
  if(!cfg || !cfg.voiceHint) return voices.find(v => v.lang && v.lang.startsWith("pt")) || voices[0];

  // tenta pt-BR com hint
  let v = voices.find(v => v.lang === "pt-BR" && v.name && v.name.includes(cfg.voiceHint));
  if(v) return v;

  // tenta qualquer pt-*
  v = voices.find(v => v.lang && v.lang.startsWith("pt"));
  if(v) return v;

  // último fallback
  return voices[0];
}

// Fala vários segmentos em sequência, trocando de voz por arquétipo
function speak(text){
  try{
    const segments = splitByArchetypeSegments(text);
    if(!segments.length) return;

    const voices = speechSynthesis.getVoices();
    speechSynthesis.cancel();

    let i = 0;

    const speakNext = ()=>{
      if(i >= segments.length) return;

      const seg = segments[i++];
      const cfg = ARCH_TTS[seg.arch] || ARCH_TTS.DEFAULT;

      const u = new SpeechSynthesisUtterance(seg.text);
      u.lang = "pt-BR";
      u.rate = cfg.rate;
      u.pitch = cfg.pitch;

      const v = pickVoiceForCfg(voices, cfg);
      if(v) u.voice = v;

      u.onend = ()=>{ speakNext(); };
      speechSynthesis.speak(u);
    };

    speakNext();
  }catch(e){
    console.warn("Erro no TTS com arquétipos:", e);
  }
}

/* ---------- Boot ---------- */
function bootMessage(){
  addSys("BlueCup v0 online.");
  addMsg("bot",
`Fala, Kodux. ☕⚡️
Eu posso rodar:
• BlueBrain local (Termux)
• OpenRouter (se você colar a chave)
• Offline eco (fallback)

Manda intenção.`);
  // tenta auto detectar local
  autoDetectLocal();
}

async function autoDetectLocal(){
  try{
    const r = await fetch("http://localhost:4040/health",{method:"GET"});
    if(r.ok){
      setStatus("local");
      routeHint.textContent="Rota: BlueLocal (auto detect)";
      return;
    }
  }catch(e){}
  setStatus("offline");
}

/* ---------- Utils ---------- */
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
/* patch-inline-0-di-sync.js
   Patch override para inline-0.js — prioriza leitura de configs em localStorage di_* ou via Uno.getConfig()
   (Respeita obrigatoriedade: NÃO renomeia/REMOVE chaves que começam com "di_")
*/
(function(){
  if(window.__inline0_di_patch) return;
  window.__inline0_di_patch = true;

  // helpers seguros (LS, Uno)
  const safeLSget = (k) => {
    try { return localStorage.getItem(k) || ''; } catch(e) { return ''; }
  };
  const safeLSset = (k, v) => {
    try { if(v==null) localStorage.removeItem(k); else localStorage.setItem(k, String(v)); } catch(e) {}
  };
  const unoGet = (alias) => {
    try {
      if(window.Uno && typeof Uno.getConfig === 'function') {
        return Uno.getConfig(alias) || '';
      }
    } catch(e){}
    return safeLSget(alias); // fallback: maybe di_* directly
  };

  // --- New loadCfg: mescla defaultCfg / existing bluecup_cfg_v0 / di_*
  const newLoadCfg = function(){
    try{
      // assume defaultCfg var exists
      const raw = safeLSget(typeof LS !== 'undefined' && LS?.cfg ? LS.cfg : 'bluecup_cfg_v0');
      let parsed = null;
      try{ parsed = JSON.parse(raw || "null"); }catch(e){ parsed = null; }
      const base = (typeof defaultCfg !== 'undefined') ? {...defaultCfg} : { provider: "auto", model: "", openrouterKey: "", systemPrompt: "" };
      const merged = {...base, ...(parsed||{})};

      // Prefer Uno.getConfig('API_KEY'|'MODEL') -> di_* direct keys -> existing merged
      const diKey = unoGet('API_KEY') || safeLSget('di_apiKey') || merged.openrouterKey || '';
      const diModel = unoGet('MODEL') || safeLSget('di_modelName') || merged.model || '';
      // training/instruction text: prefer di_trainingText, then di_infodoseName (assistant name) as hint
      const diTraining = safeLSget('di_trainingText') || safeLSget('di_training') || safeLSget('di_infodoseName') || merged.systemPrompt || '';

      if(diKey) merged.openrouterKey = diKey;
      if(diModel) merged.model = diModel;
      if(diTraining) merged.systemPrompt = diTraining;

      // If we have an API key, prefer openrouter provider by default (but don't override explicit "offline")
      if(merged.openrouterKey && (!merged.provider || merged.provider === 'auto' || merged.provider === 'router?')) {
        merged.provider = 'openrouter';
      }

      return merged;
    }catch(err){
      console.warn('[patch-inline0] loadCfg fallback', err);
      return (typeof defaultCfg !== 'undefined') ? {...defaultCfg} : { provider: "auto", model: "", openrouterKey: "", systemPrompt: "" };
    }
  };

  // --- New saveCfg: persiste no bluecup_cfg_v0 e sincroniza di_* (sem apagar nada)
  const newSaveCfg = function(){
    try{
      // 'cfg' is expected to be in global scope
      const theCfg = window.cfg || (typeof cfg !== 'undefined' ? cfg : null);
      if(!theCfg) {
        console.warn('[patch-inline0] saveCfg: cfg not found');
        return;
      }
      const keyName = (typeof LS !== 'undefined' && LS?.cfg) ? LS.cfg : 'bluecup_cfg_v0';
      safeLSset(keyName, JSON.stringify(theCfg));

      // mirror important fields to di_ keys (only when present)
      if(theCfg.openrouterKey) safeLSset('di_apiKey', theCfg.openrouterKey);
      if(theCfg.model) safeLSset('di_modelName', theCfg.model);
      if(theCfg.systemPrompt) safeLSset('di_trainingText', theCfg.systemPrompt);

      // also keep a boolean flag of assistant enabled if present
      if(typeof theCfg.assistantEnabled !== 'undefined') safeLSset('di_assistantEnabled', theCfg.assistantEnabled);

      console.log('[patch-inline0] saveCfg → bluecup_cfg_v0 + di_* synced');
      // attempt to call original addSys if available
      try{ if(typeof addSys === 'function') addSys('Config salva e sincronizada com di_ ✓'); }catch(e){}
    }catch(err){
      console.warn('[patch-inline0] saveCfg failed', err);
    }
  };

  // --- New hydrateDevUI: preenche inputs priorizando di_* / Uno.getConfig
  const newHydrateDevUI = function(){
    try{
      // ensure cfg is up to date
      const theCfg = window.cfg || (typeof cfg !== 'undefined' ? cfg : {}) || {};
      // prefer theCfg values but override with di_* if available
      const modelVal = theCfg.model || unoGet('MODEL') || safeLSget('di_modelName') || '';
      const keyVal = theCfg.openrouterKey || unoGet('API_KEY') || safeLSget('di_apiKey') || '';
      const sysVal = theCfg.systemPrompt || safeLSget('di_trainingText') || safeLSget('di_training') || '';

      if(typeof providerSel !== 'undefined' && providerSel) {
        providerSel.value = theCfg.provider || (keyVal ? 'openrouter' : (theCfg.provider || 'auto'));
      }
      if(typeof modelInp !== 'undefined' && modelInp) modelInp.value = modelVal;
      if(typeof keyInp !== 'undefined' && keyInp) keyInp.value = keyVal;
      if(typeof sysPromptInp !== 'undefined' && sysPromptInp) sysPromptInp.value = sysVal || defaultCfg.systemPrompt || '';

      console.log('[patch-inline0] hydrateDevUI applied (di_* preferred when present)');
    }catch(err){
      console.warn('[patch-inline0] hydrateDevUI failed', err);
    }
  };

  // Apply overrides into global scope if original functions exist
  try{
    // override global functions
    window.loadCfg = newLoadCfg;
    window.saveCfg = newSaveCfg;
    window.hydrateDevUI = newHydrateDevUI;

    // Immediately re-load cfg and update global cfg variable + UI
    try{
      const newCfg = newLoadCfg();
      // update both possible references
      try{ window.cfg = newCfg; }catch(e){}
      try{ cfg = newCfg; }catch(e){}
      // call hydrate to refresh inputs
      newHydrateDevUI();
      // inform in UI/console
      try{ if(typeof addSys === 'function') addSys('Patch TRINITY: configs di_* carregadas.'); }catch(e){}
      console.log('%c[patch-inline0] di_* config sync active', 'background:#0b0f14;color:#39ffb6;padding:2px 6px;border-radius:4px');
    }catch(e){
      console.warn('[patch-inline0] failed to rehydrate immediately', e);
    }
  }catch(err){
    console.warn('[patch-inline0] apply failed', err);
  }

  // Expose helper for manual sync if needed
  window.__inline0_di_patch_helpers = {
    syncNow: function(){
      try{
        const updated = newLoadCfg();
        window.cfg = updated; if(typeof cfg !== 'undefined') cfg = updated;
        newHydrateDevUI();
        console.log('[patch-inline0] syncNow completed');
        if(typeof addSys === 'function') addSys('Sync di_* executado manualmente.');
      }catch(e){ console.warn(e); }
    },
    readDI: function(k){ return unoGet(k) || safeLSget(k); }
  };

})();
