
    (() => {
      if (window.__KOBLLUX_ARCH_PATCHED__) return;
      window.__KOBLLUX_ARCH_PATCHED__ = true;

      const ALL = {
        KOBLLUX: { label: 'KOBLLUX', color: '#00ffb3', tone: 'ORACULO', freq: 210, hidden: true },
        Atlas: { label: 'Atlas', color: '#0B4F9C', tone: 'ORACULO', freq: 261 },
        Nova: { label: 'Nova', color: '#FF6EC7', tone: 'NARRADOR', freq: 329 },
        Vitalis: { label: 'Vitalis', color: '#FF4D00', tone: 'COACH', freq: 392 },
        Pulse: { label: 'Pulse', color: '#7A2CF3', tone: 'CALMO', freq: 523 },
        Artemis: { label: 'Artemis', color: '#10B6FF', tone: 'SCOUT', freq: 587 },
        Kaos: { label: 'Kaos', color: '#FF1A1A', tone: 'FIRE', freq: 440 },
        Genus: { label: 'Genus', color: '#FFD400', tone: 'MAKER', freq: 493 },
        Serena: { label: 'Serena', color: '#FFC6D0', tone: 'CARE', freq: 698 },
        Lumine: { label: 'Lumine', color: '#FFF36E', tone: 'LIGHT', freq: 784 },
        Rhea: { label: 'Rhea', color: '#8E44FF', tone: 'HEAL', freq: 349 },
        Solus: { label: 'Solus', color: '#6A737B', tone: 'MONK', freq: 311 },
        Aion: { label: 'Aion', color: '#20F2B3', tone: 'TIME', freq: 659 }
      };

      const ORDER = Object.keys(ALL).filter(k => !ALL[k].hidden);

      function setAccent(color) {
        document.documentElement.style.setProperty('--accent', color);
      }

      function normalizeId(id) {
        if (!id) return null;
        const k = String(id).trim();
        if (ALL[k]) return k;
        const found = Object.keys(ALL).find(x => x.toLowerCase() === k.toLowerCase());
        return found || null;
      }

      function getActive() {
        return localStorage.getItem('ARCHETYPE_ACTIVE') || 'KOBLLUX';
      }

      function applyArchetype(id) {
        const key = normalizeId(id);
        const a = key && ALL[key];
        if (!a) return false;
        localStorage.setItem('ARCHETYPE_ACTIVE', key);
        localStorage.setItem('VOICE_TONE', a.tone);
        setAccent(a.color);
        document.body.setAttribute('data-archetype', key);
        return true;
      }

      function injectCSS() {
        if (document.getElementById('kob-arch-css')) return;
        const s = document.createElement('style'); s.id = 'kob-arch-css';
        s.textContent = `
          .kob-arch-panel{ display:flex; flex-wrap:wrap; gap:.5rem; align-items:center }
          .kob-arch-panel.layout-grid{ gap:.6rem }
          .kob-arch-panel .arch-btn{
            border:1px solid rgba(255,255,255,.18);
            background:linear-gradient(42deg,#0c1422,#0f1a2a);
            color:var(--ink,#e8ecf6);
            border-radius:999px; padding:.5rem .8rem; font-size:.85rem;
            cursor:pointer; transition:.25s;
          }
          .kob-arch-panel .arch-btn:hover{
            background:linear-gradient(42deg,var(--c),#00ccff);
            color:#000;
          }
          .kob-arch-panel .arch-btn .dot{
            display:inline-block; width:.8em; height:.8em; border-radius:50%;
            background:var(--c); margin-right:.5em; vertical-align:-.12em;
          }
          :root{ --accent:#00ffb3 }
        `;
        document.head.appendChild(s);
      }

      function boot() {
        injectCSS();
        const cur = normalizeId(getActive());
        if (cur && ALL[cur]) setAccent(ALL[cur].color);
        if (cur) document.body.setAttribute('data-archetype', cur);
      }

      window.KOBLLUX_ARCH = { ALL, ORDER, getActive, applyArchetype };
      try { boot(); } catch (e) { console.warn('KOBLLUX_ARCH boot fail', e); }
    })();
  