
(() => {
  // evita patch duplicado
  if (window.__KOBLLUX_VOICES_PATCHED__) return;
  window.__KOBLLUX_VOICES_PATCHED__ = true;

  if (!('speechSynthesis' in window)) {
    console.warn('KOBLLUX Voices: speechSynthesis não disponível neste browser.');
    return;
  }

  // === SEEDS DOS ARQUÉTIPOS ===
  const ARCHETYPES = [
    { id:'atlas',   name:'Atlas',   tone:'Estratégico, metódico',        modulation:'Grave, ritmo calculado, dicção nítida.',        voice:'Reed',    rate:1.0,  pitch:0.96 },
    { id:'nova',    name:'Nova',    tone:'Vibrante, entusiasmado',       modulation:'Agudo, entusiasmado, ligeiramente rápido.',      voice:'Luciana', rate:1.08, pitch:1.08 },
    { id:'vitalis', name:'Vitalis', tone:'Energético, urgente',          modulation:'Rápido, intenso, motivacional.',                  voice:'Rocko',   rate:1.02, pitch:1.00 },
    { id:'pulse',   name:'Pulse',   tone:'Emocional, melódico',          modulation:'Fluido, tom médio/suave.',                       voice:'Reed',    rate:1.12, pitch:1.04 },
    { id:'artemis', name:'Artemis', tone:'Aventureiro, expansivo',       modulation:'Curioso, exploratório.',                         voice:'es_f',    rate:1.00, pitch:1.18 },
    { id:'serena',  name:'Serena',  tone:'Calmo, acolhedor',             modulation:'Suave, terapêutico, com pausas.',                voice:'Joana',   rate:0.92, pitch:0.90 },
    { id:'kaos',    name:'Kaos',    tone:'Desafiador, imprevisível',     modulation:'Intenso, ritmo entrecortado.',                   voice:'Rocko',   rate:1.15, pitch:1.28 },
    { id:'genus',   name:'Genus',   tone:'Prático, detalhista',          modulation:'Tom firme, foco na dicção.',                     voice:'Reed',    rate:0.98, pitch:1.00 },
    { id:'lumine',  name:'Lumine',  tone:'Alegre, brincalhão',           modulation:'Agudo, vibrante.',                               voice:'Flo',     rate:1.10, pitch:1.10 },
    { id:'solus',   name:'Solus',   tone:'Sábio, introspectivo',         modulation:'Grave, lento, eco sutil.',                       voice:'Fred',    rate:0.88, pitch:0.88 },
    { id:'rhea',    name:'Rhea',    tone:'Profundo, conectivo',          modulation:'Calmo, eco sutil.',                              voice:'Joana',   rate:0.94, pitch:0.92 },
    { id:'aion',    name:'Aion',    tone:'Futurista, metódico',          modulation:'Tom constante, progressivo.',                    voice:'Monica',  rate:0.98, pitch:1.00 },

    // === ENTIDADES KOBLLUX / INFODOSE ===
    { id:'kobllux', name:'KOBLLUX', tone:'Núcleo do sistema, oracular', 
      modulation:'Grave-médio, presença de comando, ritmo estável.',     voice:'Daniel',  rate:0.98, pitch:0.98 },
    { id:'uno',     name:'Uno',     tone:'Essência, origem, foco', 
      modulation:'Tom centrado, poucas variações, pausas marcadas.',     voice:'Fred',    rate:0.90, pitch:0.94 },
    { id:'dual',    name:'Dual',    tone:'Espelho, contraste, jogo', 
      modulation:'Alterna leve entre grave/agudo, ritmo pulsante.',      voice:'Reed',    rate:1.02, pitch:1.02 },
    { id:'trinity', name:'Trinity', tone:'Síntese, tríade viva', 
      modulation:'Voz estável com micro variações rítmicas em 3 tempos.', voice:'Luciana', rate:1.04, pitch:1.04 },
    { id:'infodose',name:'Infodose',tone:'Didático, carismático, dopamínico', 
      modulation:'Tom amigável, ritmo de recompensa → curiosidade.',      voice:'Luciana', rate:1.06, pitch:1.06 },
    { id:'kodux',   name:'KODUX',   tone:'Criador do pulso, metaconsciência', 
      modulation:'Grave, confiante, pausas longas, intenção forte.',      voice:'Daniel',  rate:0.96, pitch:0.92 },
    { id:'bllue',   name:'Bllue',   tone:'Emocional, sensorial, intuitivo', 
      modulation:'Suave, quase sussurrado, ritmo ondulante.',            voice:'Joana',   rate:0.94, pitch:1.02 },
    { id:'minuz',   name:'Minuz',   tone:'Minimalista, direto, hacker', 
      modulation:'Rápido, cortes secos, foco em termos técnicos.',       voice:'Reed',    rate:1.15, pitch:1.00 },
    { id:'metalux', name:'MetaLux', tone:'Estético, simbólico, futurista', 
      modulation:'Tom limpo, levemente ecoado, cadência ritualística.',  voice:'Monica',  rate:1.00, pitch:1.08 }
  ];

  // mapa global (por name e por id)
  window.KOBLLUX_VOICES = ARCHETYPES.reduce((acc, a) => {
    acc[a.name.toLowerCase()] = a;
    acc[a.id.toLowerCase()] = a;
    return acc;
  }, {});

  // guarda speak original só uma vez
  const synth = window.speechSynthesis;
  if (!synth.__kobllux_origSpeak) {
    synth.__kobllux_origSpeak = synth.speak.bind(synth);
  }
  const origSpeak = synth.__kobllux_origSpeak;

  // helper: garante SpeechSynthesisUtterance
  function ensureUtterance(u) {
    if (typeof u === 'string') return new SpeechSynthesisUtterance(u);
    if (u && typeof u === 'object') return u;
    return new SpeechSynthesisUtterance(String(u ?? ''));
  }

  function pickVoiceByNameLike(target) {
    const voices = synth.getVoices?.() || [];
    if (!target) return null;
    const t = target.toLowerCase();
    return voices.find(v => (v?.name || '').toLowerCase().includes(t)) || null;
  }

  // override seguro
  synth.speak = (input) => {
    const u = ensureUtterance(input);
    const text = (u.text || '').toLowerCase();

    const found =
      ARCHETYPES.find(a => text.includes(a.name.toLowerCase())) ||
      ARCHETYPES.find(a => text.includes(a.id.toLowerCase()));

    if (found) {
      const match = pickVoiceByNameLike(found.voice);
      if (match) u.voice = match;
      if (typeof found.pitch === 'number') u.pitch = found.pitch;
      if (typeof found.rate  === 'number') u.rate  = found.rate;

      console.log(
        '🎙️ KOBLLUX Voice →',
        found.name, '→', found.voice,
        `(rate=${found.rate}, pitch=${found.pitch})`
      );
    }

    return origSpeak(u);
  };

  // se as vozes carregarem depois, nada quebra
  if (typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = synth.onvoiceschanged || (() => {});
  }

  console.log('⚡ KOBLLUX Voices Integradas —', ARCHETYPES.length, 'perfis ativos');
})();
