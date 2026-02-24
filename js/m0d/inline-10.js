
    (() => {
      function bcHashStr(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return h >>> 0;
      }

      function bcMulberry32(a) {
        return function() {
          let t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
      }

      function bcGenBackgroundSVG(seed, arc, mode) {
        const r = bcMulberry32(seed >>> 0);
        const W = 1200, H = 1200;
        const nebB = 'var(--neb-b)', nebA = 'var(--neb-a)', nebC = 'var(--neb-c)';
        const woodA = 'var(--wood-a)', woodB = 'var(--wood-b)';
        const cx = W / 2, cy = H / 2;

        let circles = '';
        for (let i = 0; i < 20; i++) {
          const cx = r() * W, cy = r() * H, rad = 100 + r() * 200;
          const col = i % 3 === 0 ? nebA : (i % 3 === 1 ? nebB : nebC);
          circles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="${col}" opacity="0.1"/>`;
        }

        return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${nebB}"/>
      <stop offset="55%" stop-color="${nebC}"/>
      <stop offset="100%" stop-color="${nebA}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${circles}
  <circle cx="${cx}" cy="${cy}" r="200" fill="none" stroke="${woodA}" stroke-opacity="0.2" stroke-width="4"/>
  <circle cx="${cx}" cy="${cy}" r="300" fill="none" stroke="${woodB}" stroke-opacity="0.1" stroke-width="2"/>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>`;
      }

      const baseId = "bgLayer";
      let layerA = document.getElementById(baseId);
      if (!layerA) return;

      const cssId = "BC_BGARCH_CSS";
      if (!document.getElementById(cssId)) {
        const st = document.createElement("style");
        st.id = cssId;
        st.textContent = `
          #${baseId}, #${baseId}-b{
            position:fixed; inset:0; z-index:-1; overflow:hidden; background:#000;
            transition: opacity 1200ms ease;
            will-change: opacity, filter;
          }
          #${baseId} svg, #${baseId}-b svg{
            width:100%; height:100%; display:block; transform:scale(1.05);
          }
        `;
        document.head.appendChild(st);
      }

      let layerB = document.getElementById(baseId + "-b");
      if (!layerB) {
        layerB = document.createElement("div");
        layerB.id = baseId + "-b";
        layerB.setAttribute("aria-hidden", "true");
        layerA.after(layerB);
      }
      layerA.style.opacity = "1";
      layerB.style.opacity = "0";

      let front = layerA, back = layerB;

      function crossfadeTo(svg) {
        back.innerHTML = svg;
        requestAnimationFrame(() => {
          back.style.opacity = "1";
          front.style.opacity = "0";
          const tmp = front; front = back; back = tmp;
        });
      }

      function bcApplyBackground(seed, arc, mode) {
        const svg = bcGenBackgroundSVG(seed, arc, mode);
        crossfadeTo(svg);
      }

      function bcSetArchetypeTheme(arc) {
        document.body.dataset.arc = arc;
        return { intensity: 1 };
      }

      function bcRedraw() {
        const seedText = `${state.arc}|${state.mode}|${state.seed}`;
        bcSetArchetypeTheme(state.arc);
        bcApplyBackground(bcHashStr(seedText), state.arc, state.mode);
      }

      const state = {
        arc: localStorage.getItem('bc.vk.arc') || 'madeira',
        mode: localStorage.getItem('bc.vk.mode') || 'nebula',
        seed: localStorage.getItem('bc.vk.seed') || (Date.now().toString()),
      };

      window.BlueVisual = {
        setArc(arc, seed) {
          if (!arc) return;
          const a = arc.toLowerCase();
          if (state.arc === a && !seed) return;
          state.arc = a;
          if (seed) state.seed = seed.toString();
          localStorage.setItem('bc.vk.arc', state.arc);
          localStorage.setItem('bc.vk.seed', state.seed);
          bcRedraw();
        },
        redraw() { bcRedraw(); },
      };

      bcRedraw();
    })();
  