
// ==================== SISTEMA DE VOZ COMPLETO COM SOTAQUE (DO INDEX_KOBLLUX_V3-2.HTML) ====================
(function() {
  'use strict';
  
  // Verificação inicial
  if (!window.speechSynthesis) {
    console.warn("KOBLLUX VOZ: SpeechSynthesis não disponível");
    return;
  }
  
  console.log('⚡ KOBLLUX · ATIVANDO SISTEMA DE VOZ COM SOTAQUE');
  
  const synth = window.speechSynthesis;
  
  // Utilitário de normalização
  const NORM = s => String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  
  // ===== MAPA DE VOZES POR ARQUÉTIPO (COM SOTAQUE) =====
  const VOICE_MAP = {
    // 🇧🇷 PORTUGUÊS BRASIL - NATIVAS (femininas)
    'Nova':     { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Serena':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Lumine':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Rhea':     { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Luxara':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Elysha':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    
    // 🇩🇪 SOTAQUE ALEMÃO - masculinas
    'Atlas':    { nome: 'Hans', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Hans', 'Klaus', 'de'] },
    'Vitalis':  { nome: 'Klaus', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Klaus', 'Hans', 'de'] },
    'Genus':    { nome: 'Friedrich', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Friedrich', 'Klaus', 'de'] },
    'Kaion':    { nome: 'Markus', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Markus', 'Klaus', 'de'] },
    
    // 🇪🇸 SOTAQUE ESPANHOL - masculinas
    'Pulse':    { nome: 'Carlos', lang: 'pt-BR', sotaque: 'espanhol', genero: 'm', fallback: ['Carlos', 'José', 'Miguel', 'es'] },
    'Solus':    { nome: 'José', lang: 'pt-BR', sotaque: 'espanhol', genero: 'm', fallback: ['José', 'Carlos', 'Miguel', 'es'] },
    
    // 🇫🇷 SOTAQUE FRANCÊS - masculinas
    'Artemis':  { nome: 'Pierre', lang: 'pt-BR', sotaque: 'francês', genero: 'm', fallback: ['Pierre', 'Jean', 'Claude', 'fr'] },
    
    // 🇬🇧 SOTAQUE INGLÊS - masculinas
    'Aion':     { nome: 'William', lang: 'pt-BR', sotaque: 'inglês', genero: 'm', fallback: ['William', 'James', 'John', 'en'] },
    
    // 🇵🇹 PORTUGAL (sotaque lusitano) - masculinas
    'Kaos':     { nome: 'João', lang: 'pt-PT', sotaque: 'lusitano', genero: 'm', fallback: ['João', 'António', 'José', 'pt-PT'] },
    'Horus':    { nome: 'João', lang: 'pt-PT', sotaque: 'lusitano', genero: 'm', fallback: ['João', 'António', 'pt-PT'] },
    
    // 🇮🇹 SOTAQUE ITALIANO - femininas
    'Ignyra':   { nome: 'Giulia', lang: 'pt-BR', sotaque: 'italiano', genero: 'f', fallback: ['Giulia', 'Sofia', 'Francesca', 'it'] },
    
    // Fallback genérico
    'default':  { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] }
  };
  
  // ===== MAPA DE ESPECIFICAÇÕES =====
  const VOICE_SPEC = {
    'Nova': 'pt_f', 'Serena': 'pt_f', 'Lumine': 'pt_f', 'Rhea': 'pt_f', 'Luxara': 'pt_f', 'Elysha': 'pt_f',
    'Atlas': 'pt_m', 'Vitalis': 'pt_m', 'Genus': 'pt_m', 'Kaion': 'pt_m',
    'Pulse': 'pt_m', 'Solus': 'pt_m', 'Artemis': 'pt_m', 'Aion': 'pt_m',
    'Kaos': 'pt_PT_m', 'Horus': 'pt_PT_m', 'Ignyra': 'pt_f',
    'Aion': 'pt_m', 'Genus': 'pt_m', 'Fitlux': 'pt_m',
    'Omega': 'pt_PT_m', 'Minuz': 'pt_PT_m',
    'Bllue': 'pt_f', 'Verbo': 'pt_f',
    'Metalux': 'pt_f', 'Infodose': 'pt_f'
  };
  
  // ===== FUNÇÃO PARA ENCONTRAR VOZ POR PREFERÊNCIA =====
  function findVoiceByPrefs(archName, voices) {
    const prefs = VOICE_MAP[archName] || VOICE_MAP.default;
    if (!prefs || !voices || !voices.length) return null;
    const vlist = Array.from(voices);
    
    // 1️⃣ TENTATIVA 1: Match exato por nome
    const exactMatch = vlist.find(v =>
      NORM(v.name) === NORM(prefs.nome) &&
      NORM(v.lang).startsWith('pt')
    );
    if (exactMatch) {
      console.log(`  ✅ Match exato: ${v.name}`);
      return exactMatch;
    }
    
    // 2️⃣ TENTATIVA 2: Nome contém o nome preferido
    const nameMatch = vlist.find(v =>
      NORM(v.name).includes(NORM(prefs.nome)) &&
      NORM(v.lang).startsWith('pt')
    );
    if (nameMatch) {
      console.log(`  ✅ Match parcial: ${nameMatch.name}`);
      return nameMatch;
    }
    
    // 3️⃣ TENTATIVA 3: Fallbacks específicos
    if (prefs.fallback) {
      for (const fb of prefs.fallback) {
        // Se for código de idioma
        if (fb === 'es' || fb === 'de' || fb === 'fr' || fb === 'en' || fb === 'it' || fb === 'pt-PT') {
          const langMatch = vlist.find(v => NORM(v.lang).startsWith(fb === 'pt-PT' ? 'pt-pt' : fb));
          if (langMatch) {
            console.log(`  ✅ Match idioma ${fb}: ${langMatch.name}`);
            return langMatch;
          }
        } else {
          // É nome
          const fbMatch = vlist.find(v => NORM(v.name).includes(NORM(fb)) && NORM(v.lang).startsWith('pt'));
          if (fbMatch) {
            console.log(`  ✅ Match fallback ${fb}: ${fbMatch.name}`);
            return fbMatch;
          }
        }
      }
    }
    
    // 4️⃣ TENTATIVA 4: Qualquer voz PT
    const ptVoice = vlist.find(v => NORM(v.lang).startsWith('pt'));
    if (ptVoice) {
      console.log(`  ✅ Qualquer voz PT: ${ptVoice.name}`);
      return ptVoice;
    }
    
    // 5️⃣ TENTATIVA 5: Qualquer voz disponível
    console.log(`  ⚠️ Usando primeira voz disponível: ${vlist[0]?.name}`);
    return vlist[0] || null;
  }
  
  // ===== FUNÇÃO PARA ENCONTRAR VOZ POR ESPECIFICAÇÃO =====
  function findVoiceBySpec(spec, voices) {
    if (!spec || !voices || !voices.length) return null;
    const s = String(spec).toLowerCase();
    const vlist = Array.from(voices);
    
    const NAME_F_PT = /(luciana|camila|maria|sofia|joana|giulia)/i;
    const NAME_M_PT = /(hans|klaus|friedrich|carlos|josé|pierre|william|joão)/i;
    const NAME_M_PT_PT = /(joão|antónio|josé)/i;
    
    if (s === 'pt_f') return vlist.find(v => v.lang && v.lang.startsWith('pt') && NAME_F_PT.test(v.name)) || vlist.find(v => v.lang && v.lang.startsWith('pt')) || null;
    if (s === 'pt_m') return vlist.find(v => v.lang && v.lang.startsWith('pt') && NAME_M_PT.test(v.name)) || vlist.find(v => v.lang && v.lang.startsWith('pt')) || null;
    if (s === 'pt_PT_m') return vlist.find(v => v.lang && v.lang.startsWith('pt-PT') && NAME_M_PT_PT.test(v.name)) || vlist.find(v => v.lang && v.lang.startsWith('pt-PT')) || null;
    if (s === 'pt') return vlist.find(v => v.lang && v.lang.startsWith('pt')) || null;
    
    return null;
  }
  
  // ===== FUNÇÃO PRINCIPAL DE FALA =====
  function speakWithSotaque(archName, text, onEnd) {
    try {
      const name = archName.charAt(0).toUpperCase() + archName.slice(1).toLowerCase();
      const voices = synth.getVoices();
      
      if (!voices.length) {
        console.log('⏳ Aguardando carregamento das vozes...');
        setTimeout(() => speakWithSotaque(archName, text, onEnd), 250);
        return;
      }
      
      // Tenta encontrar a voz pelas preferências
      let voice = findVoiceByPrefs(name, voices);
      
      // Se não achou, tenta pela especificação
      if (!voice) {
        const spec = VOICE_SPEC[name];
        voice = findVoiceBySpec(spec, voices);
      }
      
      const prefs = VOICE_MAP[name] || VOICE_MAP.default;
      
      // Cancela qualquer fala anterior
      synth.cancel();
      
      // Cria o utterance
      const utter = new SpeechSynthesisUtterance(text);
      utter.voice = voice;
      utter.lang = voice ? voice.lang : (prefs.lang || 'pt-BR');
      utter.rate = 0.95;
      utter.pitch = prefs.genero === 'f' ? 1.1 : 0.9;
      utter.volume = 1;
      
      if (onEnd) utter.onend = onEnd;
      
      // Log para debug
      const voiceName = voice ? voice.name : 'FALLBACK';
      const sotaque = prefs.sotaque || 'desconhecido';
      console.log(`🎙️ KOBLLUX: ${name} → ${voiceName} (${sotaque})`);
      
      // Mostra no debug panel
      const debug = document.getElementById('debug-panel');
      if (debug) {
        debug.innerHTML = `🎙️ ${name}<br>${voiceName}<br>${sotaque}`;
        debug.classList.add('visible');
        setTimeout(() => debug.classList.remove('visible'), 3000);
      }
      
      // Fala
      synth.speak(utter);
      
    } catch(e) {
      console.warn('Erro no KOBLLUX_VOZ.speak:', e);
      if (onEnd) onEnd();
    }
  }
  
  // ===== EXPOR API GLOBAL =====
  window.KOBLLUX_VOZ = {
    map: VOICE_MAP,
    specs: VOICE_SPEC,
    
    speak: function(archName, text, onEnd) {
      speakWithSotaque(archName, text, onEnd);
    },
    
    stop: function() {
      synth.cancel();
    },
    
    getSotaque: function(archName) {
      const name = archName.charAt(0).toUpperCase() + archName.slice(1).toLowerCase();
      const prefs = VOICE_MAP[name] || VOICE_MAP.default;
      return prefs.sotaque;
    },
    
    getVoicesList: function() {
      return synth.getVoices().filter(v => v.lang && v.lang.startsWith('pt'))
        .map(v => ({ name: v.name, lang: v.lang }));
    },
    
    testAll: function() {
      console.log('🔊 TESTANDO TODAS AS VOZES DISPONÍVEIS:');
      const voices = synth.getVoices();
      voices.forEach(v => {
        if (v.lang && v.lang.startsWith('pt')) {
          console.log(`  • ${v.name} (${v.lang})`);
        }
      });
    }
  };
  
  // ===== PRÉ-CARREGAMENTO DE VOZES =====
  function loadVoices() {
    const voices = synth.getVoices();
    if (voices.length) {
      console.log(`🔊 KOBLLUX: ${voices.length} vozes carregadas`);
      const ptVoices = voices.filter(v => v.lang && v.lang.startsWith('pt'));
      console.log('🇧🇷 Vozes PT disponíveis:', ptVoices.map(v => `${v.name} (${v.lang})`).join(', '));
      
      // Verifica disponibilidade para cada arquétipo
      console.log('\n🎭 Verificação de sotaques:');
      Object.keys(VOICE_MAP).forEach(arch => {
        if (arch === 'default') return;
        const voice = findVoiceByPrefs(arch, voices);
        const prefs = VOICE_MAP[arch];
        if (voice) {
          console.log(`  ✅ ${arch}: ${voice.name} (${prefs.sotaque})`);
        } else {
          console.log(`  ⚠️ ${arch}: usando fallback (${prefs.sotaque})`);
        }
      });
    }
  }
  
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  setTimeout(loadVoices, 500);
  
  console.log('⚡ KOBLLUX · SISTEMA DE VOZ COM SOTAQUE ATIVADO');
  console.log('🎭 Sotaques: alemão, espanhol, francês, inglês, italiano, lusitano, nativo');
  
})();

  // ── KOBLLUX_VOZ: atualiza window.speak() para usar sotaques ──────────────
  window.speak = function(text, archName) {
    if (window.KOBLLUX_VOZ && archName) {
      window.KOBLLUX_VOZ.speak(archName, text);
      return;
    }
    if (window.KOBLLUX_VOZ) {
      // Detecta arquetipo no texto automaticamente
      const keys = Object.keys(window.KOBLLUX_VOZ.map||{}).filter(k=>k!=="default");
      const low  = text.toLowerCase();
      const hit  = keys.find(k=>low.includes(k.toLowerCase()));
      if (hit) { window.KOBLLUX_VOZ.speak(hit, text); return; }
    }
    // Fallback simples
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  };
  window.speakText = window.speak;

  // ── Comando /voz no chat ─────────────────────────────────────────────────
  window.__bc_voz_cmd = function(arch, text) {
    if (!window.KOBLLUX_VOZ) { alert("KOBLLUX_VOZ nao inicializado"); return; }
    const sotaque = window.KOBLLUX_VOZ.getSotaque(arch);
    window.KOBLLUX_VOZ.speak(arch, text || "Arquetipo " + arch + " ativado. Sotaque " + sotaque);
    if (typeof addSys === "function") addSys("VOZ: " + arch + " [" + sotaque + "]");
  };

  