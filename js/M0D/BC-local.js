
    /* -------------------------------------------------------
       CHAT LOCAL SIMPLES (mock para manter o fluxo)
    --------------------------------------------------------*/
    (function(){
      const log = document.getElementById('chatLog');
      const input = document.getElementById('chatInput');
      const btnSend = document.getElementById('btnSend');
      const btnClear = document.getElementById('btnClear');
      const btnDemo = document.getElementById('btnDemo');

      function addMsg(text, who){
        const div = document.createElement('div');
        div.className = 'msg ' + (who || 'bot');
        div.textContent = text;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
      }

      btnSend.addEventListener('click', () => {
        const value = (input.value || '').trim();
        if(!value) return;
        addMsg(value, 'you');
        // Mock de resposta local
        setTimeout(() => {
          addMsg('Eco local do BlueCup (mock). Aqui você conecta na IA real depois.', 'bot');
        }, 220);
        input.value = '';
        input.focus();
      });

      btnClear.addEventListener('click', () => {
        log.innerHTML = '';
        const sys = document.createElement('div');
        sys.className = 'msg sys';
        sys.textContent = 'Chat limpo. Pronto para novo fluxo.';
        log.appendChild(sys);
      });

      btnDemo.addEventListener('click', () => {
        addMsg('Exemplo de resposta longa do agente local. Use isso para testar o scroll, o layout e a leitura.', 'bot');
      });

      input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' && !e.shiftKey){
          e.preventDefault();
          btnSend.click();
        }
      });
    })();

    /* -------------------------------------------------------
       DADOS DE STacks / Apps (pode editar à vontade)
    --------------------------------------------------------*/
    const APP_STACKS = [
      {
        id:'bluecup-core',
        name:'BlueCup • Core Local Agent',
        desc:'Hub principal 78KQWAN · HTML monólito · Nebula Pro · Base Madeira',
        url:'http://localhost/bluecup',
        tags:['hub','local','nebula','madeira'],
        stacks:[
          {
            id:'core-index',
            title:'index.html · Monólito Principal',
            url:'http://localhost/bluecup/index.html',
            mode:'html'
          },
          {
            id:'core-apps',
            title:'apps.json · Registro de Apps',
            url:'http://localhost/bluecup/apps.json',
            mode:'json'
          },
          {
            id:'core-sw',
            title:'service-worker.js · PWA offline',
            url:'http://localhost/bluecup/service-worker.js',
            mode:'js'
          }
        ]
      },
      {
        id:'metaux-hub',
        name:'MetaLux · Oráculo Trindade',
        desc:'Interface ritualística para triades · UNO / DUAL / TRINITY',
        url:'http://localhost/metalux',
        tags:['oraculo','trindade','ritual'],
        stacks:[
          {
            id:'mlux-index',
            title:'MetaLux_Trindade.html · Ritual',
            url:'http://localhost/metalux/index.html',
            mode:'html'
          },
          {
            id:'mlux-style',
            title:'metalux.css · Skin Nebula Nightfall',
            url:'http://localhost/metalux/metalux.css',
            mode:'css'
          }
        ]
      },
      {
        id:'nos-solar',
        name:'Nos.S°lar · Dual.Infodose',
        desc:'Nó Solar local · micro-servidor · PWA',
        url:'http://localhost/nos-solar',
        tags:['solar','pwa','node'],
        stacks:[
          {
            id:'solar-dashboard',
            title:'dashboard.html · Painel Solar',
            url:'http://localhost/nos-solar/dashboard.html',
            mode:'html'
          },
          {
            id:'solar-calc',
            title:'calc.js · Cálculos de geração',
            url:'http://localhost/nos-solar/calc.js',
            mode:'js'
          },
          {
            id:'solar-md',
            title:'pitch-afrikafuturo.md · Livro Vivo',
            url:'http://localhost/nos-solar/pitch-afrikafuturo.md',
            mode:'md'
          }
        ]
      },
      {
        id:'cr-ateliê',
        name:'Costa & Ribeiro · Ateliê',
        desc:'Calculadora de custo · Catálogo · Ícones CR',
        url:'http://localhost/cr-atelie',
        tags:['moda','custo','cr'],
        stacks:[
          {
            id:'cr-calc',
            title:'calc_atelie.html · Calculadora de Peças',
            url:'http://localhost/cr-atelie/calc_atelie.html',
            mode:'html'
          },
          {
            id:'cr-assets',
            title:'assets/ · Sprites, logos, mockups',
            url:'http://localhost/cr-atelie/assets/',
            mode:'dir'
          }
        ]
      }
    ];

    /* -------------------------------------------------------
       RENDER DO PAINEL DE STACKS
    --------------------------------------------------------*/
    (function(){
      const grid = document.getElementById('appsGrid');
      const searchInput = document.getElementById('appsSearch');
      const reloadBtn = document.getElementById('appsReload');

      function matchesFilter(app, term){
        if(!term) return true;
        term = term.toLowerCase();
        if(app.name.toLowerCase().includes(term)) return true;
        if(app.desc.toLowerCase().includes(term)) return true;
        if(Array.isArray(app.tags) && app.tags.some(t => t.toLowerCase().includes(term))) return true;
        return false;
      }

      function renderApps(){
        const term = (searchInput.value || '').trim().toLowerCase();
        grid.innerHTML = '';

        const list = APP_STACKS.filter(app => matchesFilter(app, term));

        if(list.length === 0){
          const empty = document.createElement('div');
          empty.textContent = 'Nenhum app/stack encontrado para esse filtro.';
          empty.style.fontSize = '.85rem';
          empty.style.opacity = '0.8';
          grid.appendChild(empty);
          return;
        }

        list.forEach(app => {
          const card = document.createElement('article');
          card.className = 'appCard';
          card.dataset.appId = app.id;

          // tags
          const tagsHtml = (app.tags || [])
            .map(t => `<span class="appTag">#${t}</span>`)
            .join('');

          // stacks internos
          const stacksHtml = (app.stacks || [])
            .map(st => `
              <div class="stackItem" data-stack-id="${st.id}">
                <div class="bullet"></div>
                <div class="meta">
                  <div class="title">${st.title}</div>
                  <div class="url">${st.url}</div>
                </div>
                <button class="cta" data-open-stack="${st.url}">Abrir</button>
              </div>
            `).join('');

          card.innerHTML = `
            <div class="appIcon">◎</div>
            <div class="appBody">
              <div class="appTitle">${app.name}</div>
              <div class="appMeta">${app.desc}</div>
              <div class="appTags">${tagsHtml}</div>

              <div class="appActions">
                <button class="appBtn primary" data-open-app="${app.url}">Abrir App</button>
                <button class="appBtn" data-toggle-stacks>Ver stacks</button>
                <button class="appBtn" data-log-app>Log no DevPanel</button>
              </div>

              <div class="appStackPanel" data-stack-panel>
                <div class="stackList">
                  ${stacksHtml || '<div style="font-size:.8rem;opacity:.75;">Nenhum stack cadastrado ainda.</div>'}
                </div>
              </div>
            </div>
          `;

          // Listeners de ação
          card.querySelector('[data-open-app]').addEventListener('click', e => {
            e.stopPropagation();
            const url = e.currentTarget.getAttribute('data-open-app');
            if(url && url !== '#') window.open(url, '_blank');
          });

          const toggleBtn = card.querySelector('[data-toggle-stacks]');
          const panel = card.querySelector('[data-stack-panel]');
          toggleBtn.addEventListener('click', e => {
            e.stopPropagation();
            const visible = panel.style.display === 'block';
            panel.style.display = visible ? 'none' : 'block';
            toggleBtn.textContent = visible ? 'Ver stacks' : 'Fechar stacks';
          });

          card.querySelectorAll('[data-open-stack]').forEach(btn => {
            btn.addEventListener('click', e => {
              e.stopPropagation();
              const url = e.currentTarget.getAttribute('data-open-stack');
              if(url && url !== '#') window.open(url, '_blank');
              const stackId = e.currentTarget.closest('.stackItem').dataset.stackId;
              logToDevPanel(app.id, stackId);
            });
          });

          const logBtn = card.querySelector('[data-log-app]');
          logBtn.addEventListener('click', e => {
            e.stopPropagation();
            logToDevPanel(app.id, null);
          });

          grid.appendChild(card);
        });
      }

      searchInput.addEventListener('input', () => renderApps());
      reloadBtn.addEventListener('click', () => {
        searchInput.value = '';
        renderApps();
      });

      // primeira render
      renderApps();
    })();

    /* -------------------------------------------------------
       DEV PANEL · INSPEÇÃO DE STACK
    --------------------------------------------------------*/
    (function(){
      const overlay = document.getElementById('devOverlay');
      const fab = document.getElementById('fabDev');
      const btnClose = document.getElementById('btnCloseDev');
      const pre = document.getElementById('devStackJson');
      const btnCopy = document.getElementById('btnCopyDev');
      const btnClear = document.getElementById('btnClearDev');

      let lastPayload = null;

      window.logToDevPanel = function(appId, stackId){
        const app = APP_STACKS.find(a => a.id === appId);
        if(!app) return;
        let stack = null;
        if(stackId){
          stack = (app.stacks || []).find(s => s.id === stackId) || null;
        }
        const payload = { appId, stackId: stackId || null, app, stack };
        lastPayload = payload;
        pre.textContent = JSON.stringify(payload, null, 2);
        overlay.classList.add('show');
      };

      fab.addEventListener('click', () => {
        overlay.classList.add('show');
      });
      btnClose.addEventListener('click', () => {
        overlay.classList.remove('show');
      });

      btnCopy.addEventListener('click', () => {
        if(!lastPayload){
          alert('Nada para copiar ainda. Clique em "Log no DevPanel" ou abra um stack.');
          return;
        }
        navigator.clipboard?.writeText(JSON.stringify(lastPayload, null, 2))
          .then(() => alert('JSON copiado para a área de transferência.'))
          .catch(() => alert('Não consegui copiar automaticamente. Copie manualmente do painel.'));
      });

      btnClear.addEventListener('click', () => {
        lastPayload = null;
        pre.textContent = 'Nenhum stack selecionado ainda.';
      });

      // fechar tocando fora (opcional)
      overlay.addEventListener('click', e => {
        if(e.target === overlay){
          overlay.classList.remove('show');
        }
      });
    })();
  
