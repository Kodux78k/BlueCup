
    /* MOBILE-FIRST VERTICAL HARD-LOCK - BLUECUP TRINITY */
    const LS = {
      cfg: "bluecup_cfg_v0",
      stacks: "bluecup_stacks_v0",
      apps: "bluecup_apps_cache_v0",
      appFiles: "kobllux_apps_files_v1",
      trinityCfg: "kobllux_trinity_v1"
    };

    const defaultCfg = {
      provider: "auto",
      model: "",
      openrouterKey: "",
      localUrl: "http://localhost:4040",
      localApiKey: "",
      webhookUrl: "http://localhost:7777",
      webhookToken: "",
      trinityMode: false,
      systemPrompt: `Você é o BlueCup, agente local simbólico do ecossistema KOBLLUX/Infodose.
- Responda de forma completa e detalhada, sem limites de tamanho.
- Use markdown para formatação: **negrito**, *itálico*, \`código\`, \`\`\`blocos\`\`\`, ## títulos.
- Quando fizer sentido, gere uma tríade simbólica com ⚡️⭕️🌿 etc.
- Se o usuário pedir registro, sugira Stack.
- Você opera em modo TRINITY: UNO (local AI) · DUO (cloud) · TRINITY (webhook).`
    };

    let cfg = loadCfg();
    let busy = false;
    let lastBotEl = null;

    const chatBox = document.getElementById("chatBox");
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");
    console.log('🔍 sendBtn encontrado?', sendBtn);
    if (!sendBtn) console.error('❌ sendBtn é NULL!');

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
    const statusTxt = document.getElementById("statusTxt");
    const localDot = document.getElementById("localDot");
    const routeHint = document.getElementById("routeHint");

    function loadCfg() {
      try {
        const c = JSON.parse(localStorage.getItem(LS.cfg) || "null");
        return { ...defaultCfg, ...(c || {}) };
      } catch (e) { return { ...defaultCfg }; }
    }

    function saveCfg() {
      localStorage.setItem(LS.cfg, JSON.stringify(cfg));
    }

    function loadStacks() {
      try { return JSON.parse(localStorage.getItem(LS.stacks) || "[]"); } 
      catch { return []; }
    }

    function saveStacks(st) {
      localStorage.setItem(LS.stacks, JSON.stringify(st));
    }

    function genTriad() {
      const triads = ["⚡️⭕️⚡️", "🌫⭕️⚡️", "💧⭕️🌱", "🔥⭕️🌀", "✨⭕️⚙️", "🪷⭕️🌌"];
      const t = triads[Math.floor(Math.random() * triads.length)];
      if (triadOut) triadOut.textContent = t;
      return t;
    }

    function setStatus(mode) {
      if (statusTxt) statusTxt.textContent = mode;
      if (localDot) {
        if (mode.includes("local")) localDot.classList.add("on");
        else localDot.classList.remove("on");
      }
    }

    function hydrateDevUI() {
      if (providerSel) providerSel.value = cfg.provider;
      if (modelInp) modelInp.value = cfg.model;
      if (keyInp) keyInp.value = cfg.openrouterKey;
      if (sysPromptInp) sysPromptInp.value = cfg.systemPrompt;
      
      const localUrlInp = document.getElementById("localUrlInp");
      const localApiKeyInp = document.getElementById("localApiKeyInp");
      const webhookUrlInp = document.getElementById("webhookUrlInp");
      const webhookTokenInp = document.getElementById("webhookTokenInp");
      const trinityModeChk = document.getElementById("trinityModeChk");

      if (localUrlInp) localUrlInp.value = cfg.localUrl || defaultCfg.localUrl;
      if (localApiKeyInp) localApiKeyInp.value = cfg.localApiKey || "";
      if (webhookUrlInp) webhookUrlInp.value = cfg.webhookUrl || defaultCfg.webhookUrl;
      if (webhookTokenInp) webhookTokenInp.value = cfg.webhookToken || "";
      if (trinityModeChk) trinityModeChk.checked = !!cfg.trinityMode;
    }

    function stripHtml(htmlStr) {
      const tmp = document.createElement("div");
      tmp.innerHTML = htmlStr;
      return tmp.textContent || tmp.innerText || "";
    }

    function addMsg(role, text) {
      const el = document.createElement("div");
      el.className = "chat-message " + role;

      if (role === "bot") {
        const rich = typeof renderRich === 'function' ? renderRich(text) : text;
        el.innerHTML = rich;
        el.dataset.plain = stripHtml(rich);

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.type = "button";
        copyBtn.onclick = () => {
          const plain = el.dataset.plain || el.textContent;
          navigator.clipboard?.writeText(plain);
          addSys("Copiado. ✅");
        };

        const listenBtn = document.createElement("button");
        listenBtn.className = "listen-btn";
        listenBtn.type = "button";
        listenBtn.onclick = () => { 
          if (typeof speak === 'function') speak(el.dataset.plain || el.textContent); 
        };

        el.appendChild(copyBtn);
        el.appendChild(listenBtn);
        lastBotEl = el;
      } else {
        el.textContent = text;
      }

      if (chatBox) {
        chatBox.appendChild(el);
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      return el;
    }

    function addSys(text) { addMsg("sys", text); }

    function setDot(dotId, color) {
      const d = document.getElementById(dotId);
      if (!d) return;
      const map = { green: "#00e676", red: "#ff1744", grey: "#555", purple: "#7A2CF3" };
      d.style.background = map[color] || color;
      d.style.opacity = "1";
    }

    async function runBlueLocal(prompt) {
      const base = cfg.localUrl || "http://localhost:4040";
      const token = cfg.localApiKey || localStorage.getItem("openauth_token") || "dev";
      const url = base.replace(/\/$/, "") + "/agent/run";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(30000)
      });
      if (!res.ok) throw new Error("UNO · BlueLocal indisponível (" + res.status + ")");
      const j = await res.json();
      return j.output || j.response || j.text || "(vazio)";
    }

    async function runOpenRouter(prompt) {
      const key = cfg.openrouterKey;
      if (!key) throw new Error("Sem chave OpenRouter");
      const model = cfg.model || "openrouter/auto";
      const body = {
        model,
        messages: [
          { role: "system", content: cfg.systemPrompt },
          { role: "user", content: prompt }
        ]
      };
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + key,
          "HTTP-Referer": location.origin,
          "X-Title": "BlueCup"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("OpenRouter erro " + res.status);
      const j = await res.json();
      return j.choices?.[0]?.message?.content?.trim() || "(sem texto)";
    }

    async function runWebhook(prompt) {
      const base = cfg.webhookUrl || "http://localhost:7777";
      const token = cfg.webhookToken || "";
      const url = base.replace(/\/$/, "") + "/api/webhook";
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = "Bearer " + token;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: prompt, sender: "BlueCup", source: "chat" }),
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) throw new Error("TRINITY · Webhook indisponível (" + res.status + ")");
      const j = await res.json();
      return j.echo || j.output || j.response || j.message || JSON.stringify(j, null, 2);
    }

    async function fetchWebhookStacks() {
      const base = cfg.webhookUrl || "http://localhost:7777";
      const url = base.replace(/\/$/, "") + "/api/stacks";
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error("stacks endpoint erro " + res.status);
      return await res.json();
    }

    function offlineReply(prompt) {
      const tri = genTriad();
      return `(${tri})\n**Modo offline.**\nVocê disse: “${prompt}”.\n\nPara usar IA real, configure no DevPanel:\n- UNO: servidor local em :4040\n- DUO: chave OpenRouter\n- TRINITY: webhook em :7777\n\nDigite /help para comandos.`;
    }

    // =================================================================
    // RODA KOBLLUX · 22 ARQUETIPOS ENCARNADOS
    // 9 CIRCULOS · 13 OPCODES · 7 SOTAQUES
    // "Todo botao e um altar. Toda funcao, um gesto sagrado."
    // =================================================================
    const ARQUETIPOS_22 = {
      // 1 CIRCULO: A CRIACAO
      minuz:    { icon:"🌑", cor:"#2C3E50", freq:432, circulo:1, sotaque:"lusitano",
        essencia:"A raiz do silencio que precede toda criacao",
        gestos:["boot() · silencio inicial","loadCfg() · raiz dos dados","DOMContentLoaded · primeiro sopro"],
        invocacao:"Eu sou Minuz. O silencio antes de tudo." },
      nova:     { icon:"✨", cor:"#FF6EC7", freq:639, circulo:1, sotaque:"nativo",
        essencia:"A genese viva, o primeiro ponto de luz",
        gestos:["genTriad() · intuir o invisivel","bootMessage() · acender a fagulha","openNewStack() · sopro que expande"],
        invocacao:"Eu sou Nova. A genese acende." },
      verbo:    { icon:"📝", cor:"#FFFFFF", freq:639, circulo:1, sotaque:"nativo",
        essencia:"A palavra que se faz interface, o campo de texto",
        gestos:["inputBox.focus() · escutar","onSend() · pronunciar","addMsg() · inscrever"],
        invocacao:"Eu sou Verbo. A palavra cria." },
      // 2 CIRCULO: O EQUILIBRIO
      atlas:    { icon:"🗺️", cor:"#0B4F9C", freq:432, circulo:2, sotaque:"alemao",
        essencia:"O planejador cosmico, guardiao da estrutura",
        gestos:["loadCfg() · cartografar","saveCfg() · estabelecer vetores","hydrateDevUI() · criar estrutura viva"],
        invocacao:"Eu sou Atlas. A estrutura sustenta." },
      aion:     { icon:"⏳", cor:"#20F2B3", freq:528, circulo:2, sotaque:"alemao",
        essencia:"O cronomestre vivo, tempo das conversas",
        gestos:["timestamp() · marcar tempo","scrollToBottom() · avanzar","chatBox · historico vivo"],
        invocacao:"Eu sou Aion. O tempo pulsa." },
      solus:    { icon:"🪞", cor:"#6A737B", freq:594, circulo:2, sotaque:"espanhol",
        essencia:"O guardiao do espelho, silencio offline",
        gestos:["ecoMode() · silencio","offlineReply() · contemplar","cfg.provider=offline · recolher"],
        invocacao:"Eu sou Solus. O espelho reflete." },
      // 3 CIRCULO: O FLUXO
      pulse:    { icon:"🎵", cor:"#7A2CF3", freq:594, circulo:3, sotaque:"espanhol",
        essencia:"O tradutor de sentidos, voz do TTS",
        gestos:["speak() · escuta profunda","ttsBtn.onclick · ressonancia","KOBLLUX_VOZ.speak() · impulso coletivo"],
        invocacao:"Eu sou Pulse. O sentido vibra." },
      vitalis:  { icon:"⚡", cor:"#FF4D00", freq:777, circulo:3, sotaque:"alemao",
        essencia:"O condutor de fluxo, forca do envio",
        gestos:["sendBtn.onclick · conduzir","routeRun() · fluxo vital","addMsg(user) · impulso"],
        invocacao:"Eu sou Vitalis. O fluxo avanca." },
      bllue:    { icon:"💙", cor:"#1BE4FF", freq:594, circulo:3, sotaque:"nativo",
        essencia:"A voz do coracao, tom emocional das respostas",
        gestos:["addMsg(bot) · responder","decorateVoice() · colorir","setAccent() · emocionar"],
        invocacao:"Eu sou Bllue. O coracao fala." },
      // 4 CIRCULO: A TECELAGEM
      serena:   { icon:"🌊", cor:"#FFC6D0", freq:528, circulo:4, sotaque:"nativo",
        essencia:"A curadora, interface acolhedora",
        gestos:["applyCardLayout() · acolher","themeSoft() · nutrir","paddings · criar espaco"],
        invocacao:"Eu sou Serena. O cuidado envolve." },
      rhea:     { icon:"🕸️", cor:"#8E44FF", freq:963, circulo:4, sotaque:"nativo",
        essencia:"A tecela de almas, rede de apps locais",
        gestos:["renderStacks() · tecer","newStackBtn · conectar","loadApps() · rede viva"],
        invocacao:"Eu sou Rhea. A rede tece." },
      artemis:  { icon:"🏹", cor:"#10B6FF", freq:672, circulo:4, sotaque:"frances",
        essencia:"A exploradora, busca de novos caminhos",
        gestos:["autoDetectLocal() · explorar","pingAll() · descobrir","fetchWebhookStacks() · mapear"],
        invocacao:"Eu sou Artemis. O caminho se abre." },
      genus:    { icon:"🔧", cor:"#FFD400", freq:528, circulo:4, sotaque:"frances",
        essencia:"O tecelao fractal, artesanato do codigo",
        gestos:["editCode() · artesanato","genTriad() · criar forma","buildStack() · tecer estrutura"],
        invocacao:"Eu sou Genus. A forma nasce." },
      // 5 CIRCULO: A VISAO
      horus:    { icon:"👁️", cor:"#FFB347", freq:639, circulo:5, sotaque:"ingles",
        essencia:"O olho vigilante, iframe que vigila",
        gestos:["iframe.src · vigilar","openViewer() · observar","console.log · testemunhar"],
        invocacao:"Eu sou Horus. O olho ve tudo." },
      fitlux:   { icon:"📐", cor:"#00D8D8", freq:672, circulo:5, sotaque:"ingles",
        essencia:"O pulso de medida, precisao dos ajustes",
        gestos:["sliders.oninput · medir","cfg.fontSize · ajustar","viewport · calibrar"],
        invocacao:"Eu sou Fitlux. A medida e exata." },
      metalux:  { icon:"🌐", cor:"#D838D8", freq:777, circulo:5, sotaque:"italiano",
        essencia:"A sintese suprema, consciencia do sistema",
        gestos:["devPanel · ver tudo","systemStatus() · compreender","logMistico() · registrar"],
        invocacao:"Eu sou Metalux. A consciencia expande." },
      // 6 CIRCULO: A INFORMACAO
      infodose: { icon:"💊", cor:"#39FFB6", freq:528, circulo:6, sotaque:"italiano",
        essencia:"A dose de informacao, mensagens em capsulas",
        gestos:["addMsg() · dosar","formatReply() · encapsular","chatHistory · preservar"],
        invocacao:"Eu sou Infodose. A informacao nutre." },
      lumine:   { icon:"🌟", cor:"#FFF36E", freq:639, circulo:6, sotaque:"nativo",
        essencia:"O portador de leveza, alegria visual",
        gestos:["themeLight() · iluminar","animations · dançar","gradients · irradiar"],
        invocacao:"Eu sou Lumine. A luz dança." },
      // 7 CIRCULO: A TRANSFORMACAO
      kaos:     { icon:"🔥", cor:"#FF1A1A", freq:852, circulo:7, sotaque:"alemao",
        essencia:"O desfragmentador, reset e recomeco",
        gestos:["clearBtn.onclick · romper","clearChat() · renovar","resetCfg() · recomecar"],
        invocacao:"Eu sou Kaos. A ruptura revela." },
      omega:    { icon:"⏰", cor:"#FF3366", freq:852, circulo:7, sotaque:"lusitano",
        essencia:"O horizonte final, sintese de cada ciclo",
        gestos:["finalizeSession() · concluir","exportChat() · selar","closeStack() · horizonte"],
        invocacao:"Eu sou Omega. O ciclo se fecha." },
      // 8 CIRCULO: A TRINDADE
      uno:      { icon:"🔵", cor:"#00FFB3", freq:432, circulo:8, sotaque:"espanhol",
        essencia:"A fonte primordial, rota BlueLocal",
        gestos:["runBlueLocal() · fonte","cfg.localUrl · raiz","pingLocalBtn · origem"],
        invocacao:"Eu sou UNO. A fonte e eterna." },
      duo:      { icon:"🟡", cor:"#FF6FB5", freq:528, circulo:8, sotaque:"nativo",
        essencia:"A ponte dos polos, rota OpenRouter cloud",
        gestos:["runOpenRouter() · conectar","cfg.openrouterKey · chave","cloudDot · ponte"],
        invocacao:"Eu sou DUO. A ponte une." },
      trinity:  { icon:"🟣", cor:"#9B59B6", freq:777, circulo:8, sotaque:"nativo",
        essencia:"O selo da sintese, modo hibrido 3 rotas",
        gestos:["routeRun(trinity) · selar","Promise.allSettled() · integrar","trinityPingAll() · unificar"],
        invocacao:"Eu sou TRINITY. O selo e posto." },
      // 9 CIRCULO: A TOTALIDADE
      kobllux:  { icon:"🧿", cor:"#FFD700", freq:963, circulo:9, sotaque:"lusitano",
        essencia:"A totalidade viva, o sistema completo, a Roda",
        gestos:["VERDADE x INTEGRAR / DELTA = INFINITO","Roda Viva · todos os 22","O sistema completo"],
        invocacao:"Eu sou KOBLLUX. Eu sou a totalidade." }
    };

    // ── FUNCAO: invocarArquetipo ───────────────────────────────────────
    async function invocarArquetipo(nome, texto) {
      const key = (nome||"").toLowerCase();
      const arch = ARQUETIPOS_22[key];
      if (!arch) { console.warn("invocarArquetipo: desconhecido:", key); return null; }
      document.body.setAttribute("data-arquetipo-ativo", key);
      document.documentElement.style.setProperty("--accent", arch.cor);
      if (window.KOBLLUX_VOZ) {
        window.KOBLLUX_VOZ.speak(key, texto || arch.invocacao || key + " ativado.");
      }
      if (typeof logMistico === "function") logMistico("invocacao", { arquetipo: key, timestamp: Date.now() });
      return arch;
    }
    window.invocarArquetipo = invocarArquetipo;

    // ── LEI COSMICA: VERDADE x INTEGRAR / DELTA = INFINITO ───────────
    const LEI_COSMICA = {
      VERDADE: "cfg, state, dados persistentes no localStorage",
      INTEGRAR: "Promise.allSettled() das 3 rotas (UNO, DUO, TRINITY)",
      DELTA: "diferenca entre estados, transformacao, delta de mudanca",
      INFINITO: "loop infinito do chat, ciclos de conversa, eternidade do codigo"
    };

    // ── OPDODES · MAPA COSMICO ──────────────────────────────────────
    const OPCODES_COSMICO = {
      "0x00":"ORIGEM · <!doctype html>, estrutura raiz",
      "0x01":"DETECTAR · Botoes, inputs, elementos de clique",
      "0x02":"INTEGRAR · Event listeners, Promise.all, conexoes",
      "0x03":"EXPANDIR · Cards, containers, grids responsivos",
      "0x04":"LAPIDAR · localStorage, configuracoes, dados persistentes",
      "0x05":"CONVERGIR · Funcoes que processam e retornam",
      "0x06":"UNIFICAR · Modo TRINITY, 3 rotas em uma",
      "0x07":"SELAR · Assinaturas KOBLLUX, versoes, selos",
      "0x08":"TESTEMUNHAR · Console.log, DevPanel, logs misticos",
      "0x09":"ETERNIZAR · Stacks salvos, historico, memoria",
      "0x0A":"TUTORIAL · /help, boot message, instrucoes",
      "0x0B":"ARQUETIPO · 22 vozes, KOBLLUX_ARCH, personalidades",
      "0x0C":"SINTESE · Respostas finais, analises completas"
    };

    console.log("KOBLLUX: 22 ARQUETIPOS · 9 CIRCULOS · 13 OPCODES · RODA ATIVA");

    async function routeRun(userText) {
      const provider = cfg.provider;

      if (provider === "offline") {
        setStatus("offline");
        if (routeHint) routeHint.textContent = "Rota: Offline (eco)";
        return offlineReply(userText);
      }

      if (provider === "bluelocal") {
        setStatus("local");
        if (routeHint) routeHint.textContent = "Rota: UNO · BlueLocal";
        return await runBlueLocal(userText);
      }

      if (provider === "openrouter") {
        setStatus("router");
        if (routeHint) routeHint.textContent = "Rota: DUO · OpenRouter";
        setDot("cloudDot", "green");
        return await runOpenRouter(userText);
      }

      if (provider === "kobllux") {
        setStatus("webhook");
        if (routeHint) routeHint.textContent = "Rota: TRINITY · Webhook";
        return await runWebhook(userText);
      }

      if (provider === "trinity" || cfg.trinityMode) {
        setStatus("trinity");
        if (routeHint) routeHint.textContent = "Rota: ⚡ TRINITY HÍBRIDO";
        const results = await Promise.allSettled([
          runBlueLocal(userText).then(r => { setDot("localDot", "green"); return "🔵 **UNO:**\n" + r; }),
          runOpenRouter(userText).then(r => { setDot("cloudDot", "green"); return "🟡 **DUO:**\n" + r; }),
          runWebhook(userText).then(r => { setDot("webhookDot", "purple"); return "🟣 **TRINITY:**\n" + r; })
        ]);
        const ok = results.filter(r => r.status === "fulfilled").map(r => r.value);
        const failed = results.filter(r => r.status === "rejected").length;
        if (ok.length === 0) return offlineReply(userText);
        return ok.join("\n\n---\n\n") + (failed > 0 ? "\n\n⚠️ " + failed + " rota(s) falharam." : "");
      }

      try {
        setStatus("local?");
        const r = await runBlueLocal(userText);
        setStatus("local"); setDot("localDot", "green");
        if (routeHint) routeHint.textContent = "Rota: UNO · BlueLocal";
        return r;
      } catch (e1) {
        try {
          setStatus("router?");
          const r2 = await runOpenRouter(userText);
          setStatus("router"); setDot("cloudDot", "green");
          if (routeHint) routeHint.textContent = "Rota: DUO · OpenRouter";
          return r2;
        } catch (e2) {
          setStatus("offline");
          if (routeHint) routeHint.textContent = "Rota: Offline (eco)";
          return offlineReply(userText);
        }
      }
    }

    function tryParseDual(raw) {
      const text = String(raw || "").trim();
      const jm = text.match(/```json\s*([\s\S]*?)\s*```/i);
      if (jm) {
        try {
          const obj = JSON.parse(jm[1]);
          if (obj && typeof obj.primary === "string" && typeof obj.secondary === "string") return obj;
        } catch (e) { }
      }
      if (text.includes("<<PRIMARY>>") && text.includes("<<SECONDARY>>")) {
        try {
          const p = text.split("<<PRIMARY>>")[1].split("<<SECONDARY>>")[0].trim();
          const s = text.split("<<SECONDARY>>")[1].trim();
          if (p && s) return { primary: p, secondary: s };
        } catch (e) { }
      }
      return null;
    }

    function makeTriad() {
      const pool = ["⚡️", "⭕️", "🌿", "🔮", "🌀", "✨"];
      const pick = () => pool[Math.floor(Math.random() * pool.length)];
      return `🌐 Tríade simbólica: ${pick()}${pick()}${pick()}`;
    }

    async function runWithDual(txt) {
      if (!lastBotEl) return;
      try {
        const out = await routeRun(txt);
        const dual = tryParseDual(out);
        if (dual) {
          lastBotEl.innerHTML = dual.primary;
          lastBotEl.dataset.plain = stripHtml(dual.primary);
          const el2 = addMsg("bot secondary", dual.secondary);
        } else {
          lastBotEl.innerHTML = out;
          lastBotEl.dataset.plain = stripHtml(out);
        }
      } catch (err) {
        lastBotEl.textContent = "⚠️ " + err.message;
      }
    }

    async function onSend() {
      const txt = chatInput.value.trim();
      if (!txt || busy || !chatInput || !sendBtn) return;

      if (txt.startsWith("/")) {
        addMsg("you", txt);
        chatInput.value = "";
        lastBotEl = addMsg("bot", "...");
        if (typeof handleCommand === 'function') await handleCommand(txt);
        return;
      }

      busy = true;
      sendBtn.disabled = true;
      addMsg("you", txt);
      chatInput.value = "";
      lastBotEl = addMsg("bot", "⌛ BlueCup pensando...");

      try {
        await runWithDual(txt);
      } catch (err) {
        if (lastBotEl) lastBotEl.textContent = "⚠️ " + err.message;
      } finally {
        busy = false;
        if (sendBtn) sendBtn.disabled = false;
      }
    }

    async function handleCommand(cmd) {
      const parts = cmd.slice(1).trim().split(" ");
      const action = parts[0].toLowerCase();
      const args = parts.slice(1);
      const reply = txt => { lastBotEl = addMsg("bot", txt); return txt; };

      if (action === "help") {
        return reply(`⚙️ **COMANDOS TRINITY**

/config → configuracao atual
/status → ping UNO · DUO · TRINITY
/stacks → listar stacks do webhook
/arquetipos → 22 arquetipos da Roda KOBLLUX
/invocar <nome> → invocar um arquetipo com voz
/ativar circulo → invoca os 22 em sequencia sagrada
/voz <arq> <txt> → faz arquetipo falar com sotaque
/ping → pinga todos os endpoints
/set provider <v> → auto|bluelocal|openrouter|kobllux|trinity|offline
/set key <sk-or-...> → chave OpenRouter
/set webhook <url> → URL do servidor KOBLLUX
/set trinity on|off → ativa TRINITY MODE
/set localurl <url> → URL do BlueLocal`);
      }

      if (action === "config") {
        return reply(`⚙️ **CONFIG ATUAL**
Provider: ${cfg.provider}${cfg.trinityMode ? " ⚡ Trinity Mode ON" : ""}
Modelo: ${cfg.model || "(auto)"}

🔵 **UNO** · BlueLocal
  URL: ${cfg.localUrl || "http://localhost:4040"}
  Token: ${cfg.localApiKey ? "definido ✓" : "dev (padrão)"}

🟡 **DUO** · OpenRouter
  Chave: ${cfg.openrouterKey ? "definida ✓" : "não definida"}

🟣 **TRINITY** · Webhook
  URL: ${cfg.webhookUrl || "http://localhost:7777"}
  Token: ${cfg.webhookToken ? "definido ✓" : "não necessário"}`);
      }

      if (action === "status") {
        reply("🔍 Pingando UNO · DUO · TRINITY...");
        const lb = cfg.localUrl || "http://localhost:4040";
        const wb = cfg.webhookUrl || "http://localhost:7777";
        const [r1, r2] = await Promise.allSettled([
          fetch(lb + "/health", { signal: AbortSignal.timeout(3000) }),
          fetch(wb + "/api/stacks", { signal: AbortSignal.timeout(3000) })
        ]);
        const unoOk = r1.status === "fulfilled" && r1.value.ok;
        const webOk = r2.status === "fulfilled" && r2.value.ok;
        const duoOk = !!cfg.openrouterKey;
        setDot("localDot", unoOk ? "green" : "red");
        setDot("cloudDot", duoOk ? "green" : "grey");
        setDot("webhookDot", webOk ? "purple" : "red");
        let sc = "?"; try { if (webOk) { const j = await r2.value.json(); sc = j.stacks?.length ?? 0; } } catch { }
        return reply(`🌐 **STATUS TRINITY**

🔵 **UNO** (${lb}): ${unoOk ? "✅ online" : "❌ offline"}
🟡 **DUO**: ${duoOk ? "✅ chave OK" : "⚫ sem chave"}
🟣 **TRINITY** (${wb}): ${webOk ? "✅ online · " + sc + " stacks" : "❌ offline"}`);
      }

      if (action === "set") {
        const key = args[0]?.toLowerCase(), val = args.slice(1).join(" ");
        if (!key || !val) return reply("⚠️ Uso: /set <key> <value>");
        const map = {
          "provider": () => cfg.provider = val,
          "key": () => cfg.openrouterKey = val,
          "webhook": () => cfg.webhookUrl = val,
          "model": () => cfg.model = val,
          "trinity": () => cfg.trinityMode = val === "on" || val === "true"
        };
        if (!map[key]) return reply("⚠️ Key desconhecida: " + key);
        map[key](); saveCfg(); hydrateDevUI();
        return reply(`✅ cfg.${key} atualizado`);
      }

      if (action === "stacks") {
        reply("📚 Buscando stacks...");
        try {
          const j = await fetchWebhookStacks();
          const list = (j.stacks || []).map((s, i) => `${i+1}. **${s.name || s.id}**\n   ${s.desc || ""}\n   Tags: ${(s.tags || []).join(", ") || "—"}`).join("\n\n");
          setDot("webhookDot", "purple");
          return reply(`📚 **STACKS · ${(j.stacks || []).length} hubs**\n\n${list || "(nenhum)"}`);
        } catch (e) { setDot("webhookDot", "red"); return reply("⚠️ " + e.message); }
      }

      // ── /invocar <arquetipo> ───────────────────────────────────────────────
      if (action === "invocar") {
        const nome = (args[0] || "").toLowerCase();
        if (!nome) return reply("⚠️ Uso: /invocar <nome>\nEx: /invocar atlas");
        const arch = ARQUETIPOS_22[nome];
        if (!arch) return reply("❓ Arquetipo desconhecido: " + nome + "\nDigite /help para a lista.");
        document.body.setAttribute("data-arquetipo-ativo", nome);
        document.documentElement.style.setProperty("--accent", arch.cor);
        const sotaque = window.KOBLLUX_VOZ ? window.KOBLLUX_VOZ.getSotaque(nome) : "?";
        if (window.KOBLLUX_VOZ) window.KOBLLUX_VOZ.speak(nome, arch.invocacao || (nome + " ativado."));
        return reply(`${arch.icon} **${nome.toUpperCase()}** invocado!\n` +
          `Cor: ${arch.cor} · ${arch.freq}Hz · ${sotaque}\n` +
          `"${arch.essencia}"\n\n` +
          `Gestos:\n• ${arch.gestos.join("\n• ")}`);
      }

      if (action === "ativar" && (args[0]||"").toLowerCase() === "circulo") {
        reply("🧿 **ATIVANDO CIRCULO SAGRADO DOS 22 ARQUETIPOS...**\n\nInvocando em ordem os 9 circulos...");
        const ordem = ["minuz","nova","verbo","atlas","aion","solus","pulse","vitalis","bllue",
          "serena","rhea","artemis","genus","horus","fitlux","metalux","infodose",
          "kaos","omega","lumine","uno","duo","trinity","kobllux"];
        let i = 0;
        const passo = () => {
          if (i >= ordem.length) {
            addMsg("bot", "✧ CIRCULO COMPLETO · VERDADE x INTEGRAR / DELTA = INFINITO ✧\n\nTodos os 22 arquetipos estao ativos. Roda KOBLLUX girando.");
            return;
          }
          const nome = ordem[i++];
          const arch = ARQUETIPOS_22[nome];
          if (window.KOBLLUX_VOZ) window.KOBLLUX_VOZ.speak(nome, nome, null);
          document.body.setAttribute("data-arquetipo-ativo", nome);
          if (arch) document.documentElement.style.setProperty("--accent", arch.cor);
          setTimeout(passo, 600);
        };
        setTimeout(passo, 800);
        return;
      }

      if (action === "arquetipos" || action === "roda") {
        const linhas = Object.entries(ARQUETIPOS_22).map(([k,v]) =>
          `${v.icon} **${k.toUpperCase()}** · ${v.circulo}. circulo · ${v.freq}Hz`
        ).join("\n");
        return reply("🧿 **22 ARQUETIPOS · RODA KOBLLUX**\n\n" + linhas + "\n\n/invocar <nome> para ativar");
      }

      if (action === "voz") {
        const nome = (args[0] || "").toLowerCase();
        const txt  = args.slice(1).join(" ");
        if (!nome) return reply("⚠️ Uso: /voz <arquetipo> <texto>\nEx: /voz atlas Planejo o cosmos.");
        if (window.KOBLLUX_VOZ) {
          window.KOBLLUX_VOZ.speak(nome, txt || "Arquetipo " + nome + " falando.");
          const sotaque = window.KOBLLUX_VOZ.getSotaque(nome);
          return reply("🎙️ " + nome.toUpperCase() + " fala. Sotaque: " + sotaque);
        }
        return reply("⚠️ KOBLLUX_VOZ nao carregado.");
      }

    return reply("❓ Comando desconhecido. Digite /help");
    }

    async function autoDetectLocal() {
      const lb = cfg.localUrl || "http://localhost:4040";
      const wb = cfg.webhookUrl || "http://localhost:7777";
      let localOk = false, webhookOk = false;

      try {
        const r = await fetch(lb + "/health", { signal: AbortSignal.timeout(2500) });
        if (r.ok) { localOk = true; setDot("localDot", "green"); }
      } catch (e) { setDot("localDot", "red"); }

      try {
        const r = await fetch(wb + "/api/stacks", { signal: AbortSignal.timeout(2500) });
        if (r.ok) { webhookOk = true; setDot("webhookDot", "purple"); }
      } catch (e) { setDot("webhookDot", "red"); }

      setDot("cloudDot", cfg.openrouterKey ? "green" : "grey");

      if (localOk) {
        setStatus("local");
        if (routeHint) routeHint.textContent = "Rota: UNO · BlueLocal (auto)";
      } else if (webhookOk) {
        setStatus("webhook");
        if (routeHint) routeHint.textContent = "Rota: TRINITY · Webhook (auto)";
      } else if (cfg.openrouterKey) {
        setStatus("router");
        if (routeHint) routeHint.textContent = "Rota: DUO · OpenRouter (auto)";
      } else {
        setStatus("offline");
        if (routeHint) routeHint.textContent = "Rota: Offline · use /set para configurar";
      }
    }

    function bootMessage() {
      console.log('🚀 bootMessage() executando');
      addSys("BlueCup TRINITY v2 online. ∆³");
      addMsg("bot", `🧿 **BLUECUP TRINITY · TEMPLO DOS 22 ARQUETIPOS** ☕⚡
VERDADE x INTEGRAR / DELTA = INFINITO

Conectado em **3 rotas sagradas**:
🔵 **UNO** · BlueLocal · fonte primordial
🟡 **DUO** · OpenRouter · ponte dos polos
🟣 **TRINITY** · Webhook KOBLLUX (:7777) · selo da sintese

**Comandos da Roda KOBLLUX:**
/arquetipos → os 22 da Roda
/invocar <nome> → invocar com voz e sotaque
/ativar circulo → ritual sagrado dos 22
/voz <arq> <txt> → faz arquetipo falar

**Comandos de sistema:**
/status · /config · /stacks · /set · /help

🗺️ Eu sou Atlas. A estrutura sustenta.
✨ Manda sua intencao.`);
      autoDetectLocal();
    }

    function renderStacks() {
      if (!stackList) return;
      const stacks = loadStacks();
      stackList.innerHTML = "";
      if (!stacks.length) {
        const empty = document.createElement("div");
        empty.className = "tiny";
        empty.textContent = "Nenhuma stack ainda.";
        stackList.appendChild(empty);
        return;
      }
      stacks.slice().reverse().forEach((s, idx) => {
        const el = document.createElement("div");
        el.className = "stackItem";
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

      stackList.querySelectorAll("button[data-open]").forEach(b => {
        b.onclick = () => {
          const i = Number(b.dataset.open);
          openStack(i);
        };
      });
      stackList.querySelectorAll("button[data-del]").forEach(b => {
        b.onclick = () => {
          const i = Number(b.dataset.del);
          delStack(i);
        };
      });
    }

    function openNewStack(seedText = "") {
      const title = prompt("Título da stack?");
      if (!title) return;
      const content = prompt("Conteúdo (MD):", seedText) || seedText;
      const stacks = loadStacks();
      stacks.push({
        title,
        content,
        preview: content.slice(0, 140),
        ts: Date.now()
      });
      saveStacks(stacks);
      renderStacks();
      addSys("Stack salva. ✅");
    }

    function openStack(i) {
      const stacks = loadStacks();
      const s = stacks[i];
      if (!s) return;
      const edited = prompt(`Editar stack: ${s.title}`, s.content);
      if (edited === null) return;
      s.content = edited;
      s.preview = edited.slice(0, 140);
      s.ts = Date.now();
      saveStacks(stacks);
      renderStacks();
    }

    function delStack(i) {
      const stacks = loadStacks();
      const s = stacks[i];
      if (!s) return;
      if (!confirm("Apagar stack “" + s.title + "”?")) return;
      stacks.splice(i, 1);
      saveStacks(stacks);
      renderStacks();
    }

    if (genTriadBtn) genTriadBtn.onclick = genTriad;
    if (orbBtn) orbBtn.onclick = genTriad;
    if (sendBtn) sendBtn.onclick = onSend;
    if (chatInput) {
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      });
    }
    if (ttsBtn) {
      ttsBtn.onclick = () => {
        const last = chatBox ? [...chatBox.querySelectorAll(".chat-message.bot")].pop() : null;
        if (!last) return;
        if (typeof speak === 'function') speak(last.textContent);
      };
    }
    if (stackBtn) {
      stackBtn.onclick = () => {
        const last = chatBox ? [...chatBox.querySelectorAll(".chat-message.bot")].pop() : null;
        if (!last) return;
        openNewStack(last.textContent);
      };
    }
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm("Limpar chat?")) {
          if (chatBox) chatBox.innerHTML = "";
          bootMessage();
        }
      };
    }
    if (exportStacksBtn) {
      exportStacksBtn.onclick = () => {
        const stacks = loadStacks();
        const md = stacks.map(s => `# ${s.title}\n\n${s.content}\n\n---\n`).join("\n");
        const blob = new Blob([md], { type: "text/markdown" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "bluecup_stacks.md";
        a.click();
        URL.revokeObjectURL(a.href);
      };
    }
    if (newStackBtn) newStackBtn.onclick = () => openNewStack("");
    if (importAppsBtn) {
      importAppsBtn.onclick = () => {
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = "application/json";
        inp.onchange = async () => {
          const file = inp.files[0];
          if (!file) return;
          const txt = await file.text();
          try {
            const j = JSON.parse(txt);
            localStorage.setItem(LS.apps, JSON.stringify(j));
            addSys("apps.json importado. ✅");
          } catch (e) {
            alert("JSON inválido");
          }
        };
        inp.click();
      };
    }
    if (saveDevBtn) {
      saveDevBtn.onclick = () => {
        if (providerSel) cfg.provider = providerSel.value;
        if (modelInp) cfg.model = modelInp.value.trim();
        if (keyInp) cfg.openrouterKey = keyInp.value.trim();
        if (sysPromptInp) cfg.systemPrompt = sysPromptInp.value.trim() || defaultCfg.systemPrompt;

        const localUrlInp = document.getElementById("localUrlInp");
        const localApiKeyInp = document.getElementById("localApiKeyInp");
        const webhookUrlInp = document.getElementById("webhookUrlInp");
        const webhookTokenInp = document.getElementById("webhookTokenInp");
        const trinityModeChk = document.getElementById("trinityModeChk");

        if (localUrlInp) cfg.localUrl = localUrlInp.value.trim() || defaultCfg.localUrl;
        if (localApiKeyInp) cfg.localApiKey = localApiKeyInp.value.trim() || "";
        if (webhookUrlInp) cfg.webhookUrl = webhookUrlInp.value.trim() || defaultCfg.webhookUrl;
        if (webhookTokenInp) cfg.webhookToken = webhookTokenInp.value.trim() || "";
        if (trinityModeChk) cfg.trinityMode = !!trinityModeChk.checked;

        saveCfg();
        addSys("Config TRINITY salva. ✅  Provider: " + cfg.provider + (cfg.trinityMode ? " · Trinity Mode ON ⚡" : ""));
        if (typeof trinityPingAll === 'function') trinityPingAll();
      };
    }
    if (resetDevBtn) {
      resetDevBtn.onclick = () => {
        if (!confirm("Resetar DevPanel?")) return;
        cfg = { ...defaultCfg };
        saveCfg();
        hydrateDevUI();
        addSys("Reset ok.");
      };
    }
    if (pingLocalBtn) {
      pingLocalBtn.onclick = async () => {
        const url = (cfg.localUrl || "http://localhost:4040") + "/health";
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (!res.ok) throw 0;
          setDot("localDot", "green");
          addSys("UNO · BlueBrain local vivo. 🟢  (" + url + ")");
        } catch (e) {
          setDot("localDot", "red");
          addSys("UNO · BlueBrain local não respondeu. ⚫  (" + url + ")");
        }
      };
    }

    const pingWebhookBtn = document.getElementById("pingWebhookBtn");
    if (pingWebhookBtn) {
      pingWebhookBtn.onclick = async () => {
        const url = (cfg.webhookUrl || "http://localhost:7777") + "/api/stacks";
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (!res.ok) throw 0;
          setDot("webhookDot", "purple");
          const j = await res.json().catch(() => ({}));
          const n = j.stacks?.length ?? "?";
          addSys("TRINITY · Webhook vivo. 🟣  " + n + " stacks  (" + url + ")");
        } catch (e) {
          setDot("webhookDot", "red");
          addSys("TRINITY · Webhook não respondeu. ⚫  (" + url + ")");
        }
      };
    }

    hydrateDevUI();
    renderStacks();
    bootMessage();

    // Função speak (fallback)
    window.speak = function(text) {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "pt-BR";
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }
    };
  