
(()=>{

// ===== util hash + prng
function bcHashStr(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h>>>0;
}
function bcMulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// ===== motif: archetype geometry
function motifForArc(arc, r, W, H){
  const rand=(a,b)=>a+(b-a)*r();
  const cx=W/2, cy=H/2;
  const nebB='var(--neb-b)', nebA='var(--neb-a)', nebC='var(--neb-c)';
  const woodA='var(--wood-a)', woodB='var(--wood-b)';
  let g='';

  switch(arc){
    case 'atlas': {
      const rings = 5;
      for(let i=1;i<=rings;i++){
        const rad = (Math.min(W,H)*0.12*i) + rand(-10,10);
        g += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${nebB}"
               stroke-opacity="${0.05 + i*0.02}" stroke-width="${8-i}" />`;
      }
      for(let i=0;i<6;i++){
        const x = W*(0.15+i*0.14);
        g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${woodB}"
               stroke-opacity="0.06" stroke-width="3"/>`;
        const y = H*(0.12+i*0.14);
        g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${woodB}"
               stroke-opacity="0.06" stroke-width="3"/>`;
      }
      break;
    }
    case 'nova': {
      const rays = 16;
      for(let i=0;i<rays;i++){
        const ang = (Math.PI*2/rays)*i;
        const x2 = cx + Math.cos(ang)*W*0.6;
        const y2 = cy + Math.sin(ang)*H*0.6;
        g += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
               stroke="${nebA}" stroke-opacity="0.08" stroke-width="10" />`;
      }
      g += `<circle cx="${cx}" cy="${cy}" r="${W*0.18}" fill="none"
             stroke="${woodA}" stroke-opacity="0.18" stroke-width="12"/>`;
      break;
    }
    case 'kaos': {
      const shards=7;
      for(let i=0;i<shards;i++){
        const pts=[];
        const n=3+Math.floor(rand(0,4));
        for(let j=0;j<n;j++) pts.push(`${rand(0,W).toFixed(1)},${rand(0,H).toFixed(1)}`);
        g += `<polygon points="${pts.join(' ')}" fill="${nebC}"
               opacity="${rand(0.03,0.08).toFixed(3)}"/>`;
      }
      break;
    }
    case 'pulse': {
      const waves=4;
      for(let i=0;i<waves;i++){
        const rad = W*(0.18+i*0.12);
        g += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none"
               stroke="${nebB}" stroke-opacity="0.10" stroke-width="6" />`;
      }
      break;
    }
    case 'artemis': {
      g += `<circle cx="${cx}" cy="${cy}" r="${W*0.28}" fill="none"
             stroke="${nebC}" stroke-opacity="0.12" stroke-width="18"/>`;
      g += `<circle cx="${cx+W*0.06}" cy="${cy-W*0.02}" r="${W*0.24}" fill="none"
             stroke="${woodA}" stroke-opacity="0.16" stroke-width="18"/>`;
      break;
    }
    case 'serena': {
      const petals=6;
      for(let i=0;i<petals;i++){
        const ang=(Math.PI*2/petals)*i;
        const px=cx+Math.cos(ang)*W*0.18;
        const py=cy+Math.sin(ang)*H*0.18;
        g += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}"
               rx="${W*0.26}" ry="${H*0.10}" fill="${nebA}" opacity="0.06"
               transform="rotate(${ang*180/Math.PI} ${px.toFixed(1)} ${py.toFixed(1)})"/>`;
      }
      break;
    }
    case 'genus': {
      const steps=8;
      let p1=`M ${W*0.1} ${cy}`, p2=`M ${W*0.1} ${cy}`;
      for(let i=1;i<=steps;i++){
        const x=W*(0.1+i*0.1);
        const y1=cy+Math.sin(i*0.9)*H*0.18;
        const y2=cy-Math.sin(i*0.9)*H*0.18;
        p1+=` L ${x.toFixed(1)} ${y1.toFixed(1)}`;
        p2+=` L ${x.toFixed(1)} ${y2.toFixed(1)}`;
      }
      g += `<path d="${p1}" fill="none" stroke="${nebB}" stroke-opacity="0.12" stroke-width="8"/>`;
      g += `<path d="${p2}" fill="none" stroke="${woodB}" stroke-opacity="0.12" stroke-width="8"/>`;
      break;
    }
    case 'lumine': {
      const beams=5;
      for(let i=0;i<beams;i++){
        const x=W*(0.2+i*0.15);
        g += `<rect x="${x.toFixed(1)}" y="0" width="${W*0.06}" height="${H}"
               fill="${nebB}" opacity="0.05"/>`;
      }
      break;
    }
    case 'rhea': {
      const bands=6;
      for(let i=0;i<bands;i++){
        const y=H*(i/bands);
        g += `<rect x="0" y="${y.toFixed(1)}" width="${W}" height="${H/bands+1}"
               fill="${woodB}" opacity="${(0.03+i*0.01).toFixed(3)}"/>`;
      }
      break;
    }
    case 'solus': {
      g += `<circle cx="${cx}" cy="${cy}" r="${W*0.36}" fill="none"
             stroke="${nebA}" stroke-opacity="0.10" stroke-width="20"/>`;
      break;
    }
    case 'aion': {
      const turns=3;
      let d=`M ${cx} ${cy}`;
      let ang=0, rad=0; const step=14;
      for(let i=0;i<turns*60;i++){
        ang += Math.PI/30; rad += step/60;
        const x=cx+Math.cos(ang)*rad*10;
        const y=cy+Math.sin(ang)*rad*10;
        d+=` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      g += `<path d="${d}" fill="none" stroke="${nebC}" stroke-opacity="0.12" stroke-width="10" />`;
      break;
    }
    case 'vitalis': {
      const flames=3;
      for(let i=0;i<flames;i++){
        const x0=cx-W*0.18+i*W*0.12;
        const d=`M ${x0.toFixed(1)} ${H*0.9}
                 C ${x0+W*0.05} ${H*0.55}, ${x0+W*0.12} ${H*0.35}, ${x0+W*0.08} ${H*0.1}
                 C ${x0+W*0.02} ${H*0.25}, ${x0-W*0.02} ${H*0.45}, ${x0.toFixed(1)} ${H*0.9} Z`;
        g += `<path d="${d}" fill="${nebA}" opacity="0.06"/>`;
      }
      break;
    }
    default: { // madeira signature leaf fractal
      const veins=5;
      for(let i=0;i<veins;i++){
        const x=W*(0.15+i*0.17);
        const sway = rand(-W*0.04, W*0.04);
        const d=`M ${x.toFixed(1)} ${H*0.98}
                 Q ${(x+sway).toFixed(1)} ${H*0.58}, ${x.toFixed(1)} ${H*0.05}`;
        g += `<path d="${d}" fill="none" stroke="${woodA}" stroke-opacity="0.12" stroke-width="7"/>`;
        for(let k=0;k<4;k++){
          const yy = H*(0.2+k*0.18);
          g += `<circle cx="${(x + rand(-8,8)).toFixed(1)}" cy="${yy.toFixed(1)}"
                 r="${rand(6,14).toFixed(1)}" fill="${woodB}" opacity="0.10"/>`;
        }
      }
    }
  }
  return `<g class="motif arc-${arc}">${g}</g>`;
}

// ===== motif: mode layer (UNO/DUAL/TRINITY/SOLAR/NEBULA default)
function motifForMode(mode, r, W, H){
  const cx=W/2, cy=H/2;
  const nebB='var(--neb-b)', nebC='var(--neb-c)', woodA='var(--wood-a)';
  let g='';

  switch((mode||'').toLowerCase()){
    case 'uno': {
      g += `<circle cx="${cx}" cy="${cy}" r="${W*0.08}" fill="none" stroke="${nebB}"
             stroke-opacity="0.20" stroke-width="10"/>`;
      g += `<circle cx="${cx}" cy="${cy}" r="${W*0.015}" fill="${woodA}" opacity="0.85"/>`;
      break;
    }
    case 'dual': {
      const off=W*0.06;
      g += `<circle cx="${cx-off}" cy="${cy}" r="${W*0.10}" fill="none" stroke="${nebB}"
             stroke-opacity="0.18" stroke-width="10"/>`;
      g += `<circle cx="${cx+off}" cy="${cy}" r="${W*0.10}" fill="none" stroke="${nebC}"
             stroke-opacity="0.18" stroke-width="10"/>`;
      break;
    }
    case 'trinity': {
      const rad = W*0.09;
      const R = W*0.14;
      for(let i=0;i<3;i++){
        const ang = -Math.PI/2 + i*(Math.PI*2/3);
        const x=cx+Math.cos(ang)*R;
        const y=cy+Math.sin(ang)*R;
        g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad}" fill="none"
               stroke="${nebB}" stroke-opacity="0.16" stroke-width="9"/>`;
      }
      g += `<path d="M ${cx} ${cy-R} L ${cx} ${cy+R}" stroke="${woodA}"
             stroke-opacity="0.10" stroke-width="6"/>`;
      break;
    }
    case 'solar': {
      const rays=12, inner=W*0.10, outer=W*0.22;
      for(let i=0;i<rays;i++){
        const ang=i*(Math.PI*2/rays);
        const x1=cx+Math.cos(ang)*inner, y1=cy+Math.sin(ang)*inner;
        const x2=cx+Math.cos(ang)*outer, y2=cy+Math.sin(ang)*outer;
        g += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}"
               y2="${y2.toFixed(1)}" stroke="${nebB}" stroke-opacity="0.12" stroke-width="8"/>`;
      }
      g += `<circle cx="${cx}" cy="${cy}" r="${inner}" fill="none" stroke="${nebC}"
             stroke-opacity="0.18" stroke-width="10"/>`;
      break;
    }
    default: {
      // NEBULA default: heptagrama sutil (Coroa 7 Seres)
      const pts=[], R=W*0.22;
      for(let i=0;i<7;i++){
        const ang=-Math.PI/2 + i*(Math.PI*2/7);
        pts.push([cx+Math.cos(ang)*R, cy+Math.sin(ang)*R]);
      }
      for(let i=0;i<7;i++){
        const a=pts[i], b=pts[(i+2)%7];
        g += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}"
               x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"
               stroke="${nebB}" stroke-opacity="0.06" stroke-width="6"/>`;
      }
      g += `<circle cx="${cx}" cy="${cy}" r="${W*0.04}" fill="${woodA}" opacity="0.18"/>`;
    }
  }
  return `<g class="motif mode-${mode}">${g}</g>`;
}

// ===== background SVG build
function bcGenBackgroundSVG(seed, arc, mode, intensity=1, quality=1){
  const r = bcMulberry32(seed>>>0);
  const W=1200, H=1200;
  const blobs = Math.max(4, Math.round((6 + r()*8*intensity) * quality));
  const stars = Math.max(24, Math.round((40 + r()*120*intensity) * quality));

  const neb = [
    'var(--neb-a)','var(--neb-b)','var(--neb-c)',
    'var(--wood-a)','var(--wood-b)'
  ];
  const rand=(a,b)=>a+(b-a)*r();

  let circles='';
  for(let i=0;i<blobs;i++){
    const cx=rand(0,W), cy=rand(0,H);
    const rad=rand(120,360)*intensity;
    const col=neb[Math.floor(rand(0,neb.length))];
    const op=rand(0.07,0.20);
    circles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}"
                fill="${col}" opacity="${op.toFixed(3)}"/>`;
  }

  let starDots='';
  for(let i=0;i<stars;i++){
    const x=rand(0,W), y=rand(0,H), s=rand(0.6,2.0);
    const op=rand(0.18,0.7);
    starDots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(2)}"
                fill="#fff" opacity="${op.toFixed(2)}"/>`;
  }

  const blurStd = (12 + 7*intensity) * (0.6 + 0.4*quality);
  const motifArc  = motifForArc(arc, r, W, H);
  const motifMode = motifForMode(mode, r, W, H);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="var(--neb-b)"/>
      <stop offset="55%" stop-color="var(--neb-c)"/>
      <stop offset="100%" stop-color="var(--neb-a)"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="${blurStd}"/></filter>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${circles}
  ${motifMode}
  ${motifArc}
  ${starDots}
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>`;
}

// ===== icon generator
function bcGenIconSVG(seed, size=512){
  const r = bcMulberry32(seed>>>0);
  const W=size, H=size;
  const rand=(a,b)=>a+(b-a)*r();
  const halo1 = rand(size*0.70, size*0.90);
  const halo2 = rand(size*0.55, size*0.75);
  const core  = rand(size*0.28, size*0.38);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="var(--neb-b)"/>
      <stop offset="60%" stop-color="var(--neb-c)"/>
      <stop offset="100%" stop-color="var(--neb-a)"/>
    </linearGradient>
    <radialGradient id="core" cx="35%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#fff" stop-opacity=".95"/>
      <stop offset="60%" stop-color="var(--wood-a)" stop-opacity=".9"/>
      <stop offset="100%" stop-color="var(--wood-c)" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" rx="${size*0.22}" fill="#050510"/>
  <circle cx="${W/2}" cy="${H/2}" r="${halo1/2}" fill="url(#g)" opacity=".26"/>
  <circle cx="${W/2}" cy="${H/2}" r="${halo2/2}" fill="url(#g)" opacity=".40"/>
  <circle cx="${W/2}" cy="${H/2}" r="${core/2}" fill="url(#core)"/>
</svg>`;
}

// ===== layers + smooth crossfade
const baseId = "bgLayer";
let layerA = document.getElementById(baseId);
if(!layerA) return;

// CSS injection (safe, isolated)
const cssId = "BC_BGARCH_CSS";
if(!document.getElementById(cssId)){
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
      filter:saturate(1.05) contrast(1.05);
    }
    body.ai-active #${baseId}, body.ai-active #${baseId}-b{
      animation: bcPulseBG 1.6s ease-in-out infinite;
    }
    @keyframes bcPulseBG{
      0%{ filter: blur(0px) saturate(1.05); }
      50%{ filter: blur(3px) saturate(1.18); }
      100%{ filter: blur(0px) saturate(1.05); }
    }
  `;
  document.head.appendChild(st);
}

// Second layer
let layerB = document.getElementById(baseId+"-b");
if(!layerB){
  layerB = document.createElement("div");
  layerB.id = baseId+"-b";
  layerB.setAttribute("aria-hidden","true");
  layerA.after(layerB);
}
layerA.style.opacity = "1";
layerB.style.opacity = "0";

let front = layerA, back = layerB;
function crossfadeTo(svg){
  back.innerHTML = svg;
  requestAnimationFrame(()=>{
    back.style.opacity = "1";
    front.style.opacity = "0";
    const tmp = front; front = back; back = tmp;
  });
}

function bcApplyBackground(seed, arc, mode, intensity=1, quality=1){
  const svg = bcGenBackgroundSVG(seed, arc, mode, intensity, quality);
  crossfadeTo(svg);
}

/* ---- Archetype palettes ---- */
const BC_ARCH_BG = {
  atlas:   { neb:['#00F5FF','#6A00FF','#0B1025'], wood:['#9BFF8A','#34F28A','#0C6B3E'], intensity:1.15 },
  nova:    { neb:['#FF7AF3','#00F5FF','#6A00FF'], wood:['#C9FF6A','#7CFFB8','#34F28A'], intensity:1.30 },
  vitalis: { neb:['#FF3B3B','#FF8A00','#FF00E6'], wood:['#FFD36A','#FF7A1A','#C94900'], intensity:1.45 },
  pulse:   { neb:['#00F5FF','#00E1FF','#0B1025'], wood:['#34F28A','#00FFA3','#0C6B3E'], intensity:1.20 },
  artemis: { neb:['#B37CFF','#00F5FF','#050510'], wood:['#C9FF6A','#8CFFDA','#34F28A'], intensity:1.22 },
  serena:  { neb:['#FFB6E9','#8A7CFF','#00F5FF'], wood:['#C9FF6A','#A6FFD6','#34F28A'], intensity:1.05 },
  kaos:    { neb:['#FF00E6','#FF3B3B','#6A00FF'], wood:['#9BFF8A','#34F28A','#00FFEA'], intensity:1.55 },
  genus:   { neb:['#00F5FF','#2DFF9B','#6A00FF'], wood:['#C9FF6A','#34F28A','#0C6B3E'], intensity:1.18 },
  lumine:  { neb:['#FFFFFF','#B7F7FF','#6A00FF'], wood:['#E6FFB0','#9BFF8A','#34F28A'], intensity:1.10 },
  rhea:    { neb:['#FFC66A','#FF7AF3','#6A00FF'], wood:['#C9FF6A','#34F28A','#0C6B3E'], intensity:1.12 },
  solus:   { neb:['#FFD36A','#FF8A00','#FF3B3B'], wood:['#FFE89A','#C9FF6A','#34F28A'], intensity:1.28 },
  aion:    { neb:['#00F5FF','#FF00E6','#0B1025'], wood:['#C9FF6A','#34F28A','#00FFA3'], intensity:1.35 },
  madeira: { neb:['#00F5FF','#6A00FF','#FF00E6'], wood:['#C9FF6A','#34F28A','#0C6B3E'], intensity:1.20 }
};

function bcSetArchetypeTheme(arc){
  const cfg = BC_ARCH_BG[arc] || BC_ARCH_BG.madeira;
  const [na, nb, nc] = cfg.neb;
  const [wa, wb, wc] = cfg.wood;

  document.documentElement.style.setProperty('--neb-a', na);
  document.documentElement.style.setProperty('--neb-b', nb);
  document.documentElement.style.setProperty('--neb-c', nc);
  document.documentElement.style.setProperty('--wood-a', wa);
  document.documentElement.style.setProperty('--wood-b', wb);
  document.documentElement.style.setProperty('--wood-c', wc);

  document.body.dataset.arc = arc;
  return cfg;
}

function bcDetectArchetype(text=""){
  const t = (text||"").toLowerCase();
  const tag = t.match(/\[arc:(atlas|nova|vitalis|pulse|artemis|serena|kaos|genus|lumine|rhea|solus|aion)\]/);
  if(tag) return tag[1];
  if(/estrat|planej|métod|sistem|organiza|mapa|arquitet/.test(t)) return 'atlas';
  if(/novo|luz|brilha|ideia|futuro|expan|cria|wow/.test(t)) return 'nova';
  if(/cans|força|vai|agora|fogo|urg|energia|bora/.test(t)) return 'vitalis';
  if(/pulso|centro|respira|ritmo|calma ativa|fluxo/.test(t)) return 'pulse';
  if(/lua|caça|mira|precis|silênc|noturno/.test(t)) return 'artemis';
  if(/suave|amor|acolhe|paz|seren|delicad/.test(t)) return 'serena';
  if(/caos|quebra|rebel|insano|explod|glitch/.test(t)) return 'kaos';
  if(/dna|mistura|híbrido|combina|soma|gene/.test(t)) return 'genus';
  if(/clareia|livro|ensina|sábio|lúmen|revela/.test(t)) return 'lumine';
  if(/terra|mãe|nutre|base|raiz|casa/.test(t)) return 'rhea';
  if(/só|sol|retiro|essência|único|quieto/.test(t)) return 'solus';
  if(/tempo|eterno|ciclo|aion|infin/.test(t)) return 'aion';
  return 'madeira';
}

function bcRedraw(){
  const seedText = `${state.arc}|${state.mode}|${state.seed}`;
  const cfg = bcSetArchetypeTheme(state.arc);
  bcApplyBackground(bcHashStr(seedText), state.arc, state.mode, cfg.intensity, 1);
}

// ===== state
const state = {
  arc: localStorage.getItem('bc.vk.arc') || 'madeira',
  mode: localStorage.getItem('bc.vk.mode') || 'nebula',
  seed: localStorage.getItem('bc.vk.seed') || (Date.now().toString()),
  autoFromAssistant: true
};

// ===== public API
window.BlueVisual = {
  setArc(arc, seed){
    if(!arc) return;
    const a = arc.toLowerCase();
    if(state.arc === a && !seed) return;
    state.arc = a;
    if(seed) state.seed = seed.toString();
    localStorage.setItem('bc.vk.arc', state.arc);
    localStorage.setItem('bc.vk.seed', state.seed);
    bcRedraw();
  },
  setMode(mode, seed){
    if(!mode) return;
    state.mode = mode.toLowerCase();
    if(seed) state.seed = seed.toString();
    localStorage.setItem('bc.vk.mode', state.mode);
    localStorage.setItem('bc.vk.seed', state.seed);
    bcRedraw();
  },
  redraw(){ bcRedraw(); },
  detect(text){ return bcDetectArchetype(text); },
  genIconSVG(size=512, seedText){
    bcSetArchetypeTheme(state.arc);
    const seed = bcHashStr(seedText || `${state.arc}|${state.mode}|icon|${state.seed}`);
    return bcGenIconSVG(seed, size);
  },
  exportIconPNG(size=512){
    const svg = this.genIconSVG(size);
    exportSVGtoPNG(svg, size, `bluecup-${state.arc}-${size}.png`);
  }
};

// ===== export helper
function exportSVGtoPNG(svgString, size, filename){
  const svgBlob = new Blob([svgString], {type:"image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = ()=>{
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0,size,size);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob)=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pngBlob);
      a.download = filename;
      a.click();
    }, "image/png");
  };
  img.src = url;
}

// ===== bind clicks for any element with data-arc or data-mode
function autoBind(){
  document.querySelectorAll('[data-arc]').forEach(el=>{
    if(el.__vkBound) return;
    el.__vkBound = true;
    el.addEventListener('click', ()=> window.BlueVisual.setArc(el.dataset.arc));
  });
  document.querySelectorAll('[data-mode]').forEach(el=>{
    if(el.__vkBound) return;
    el.__vkBound = true;
    el.addEventListener('click', ()=> window.BlueVisual.setMode(el.dataset.mode));
  });
}
autoBind();
new MutationObserver(autoBind).observe(document.body,{subtree:true,childList:true});

// ===== stream pulse hooks (cheap)
window.BlueCupBG = {
  onDelta(isOn=true){
    document.body.classList.toggle('ai-active', !!isOn);
  },
  onFinal(text){
    document.body.classList.remove('ai-active');
    if(!state.autoFromAssistant) return;
    const arc = bcDetectArchetype(text||"");
    if(arc && arc !== state.arc) window.BlueVisual.setArc(arc, Date.now().toString());
  }
};

// boot
window.BlueVisual.redraw();

})();
