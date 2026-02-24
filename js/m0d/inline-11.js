
// ===== CORREÇÃO DO BOTÃO FAB =====
(function() {
  console.log('🔧 Aplicando correção do botão FAB...');
  
  // Garante que a função toggleDevPanel existe
  window.toggleDevPanel = window.toggleDevPanel || function(force) {
    const overlay = document.getElementById('devpanelOverlay');
    if (!overlay) {
      console.error('❌ overlay não encontrado');
      return;
    }
    const show = (force != null) ? !!force : !overlay.classList.contains('show');
    overlay.classList.toggle('show', show);
    overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
    console.log('🔘 Painel toggled:', show ? 'aberto' : 'fechado');
    return show;
  };

  // Força a conexão do botão FAB
  const fabBtn = document.getElementById('devpanelOpenBtn');
  if (fabBtn) {
    // Remove todos os listeners antigos (se houver)
    const newBtn = fabBtn.cloneNode(true);
    fabBtn.parentNode.replaceChild(newBtn, fabBtn);
    
    // Adiciona o listener novo
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('👉 FAB clicado!');
      window.toggleDevPanel(true);
    });
    
    console.log('✅ Botão FAB reconectado com sucesso!');
  } else {
    console.error('❌ Botão FAB não encontrado!');
  }

  // Também garante que o botão de fechar funciona
  const closeBtn = document.getElementById('devpanelCloseBtn');
  if (closeBtn) {
    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.addEventListener('click', function(e) {
      e.preventDefault();
      window.toggleDevPanel(false);
    });
  }

  // Fecha ao clicar no overlay (fundo)
  const overlay = document.getElementById('devpanelOverlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target.id === 'devpanelOverlay') {
        window.toggleDevPanel(false);
      }
    });
  }

  console.log('🔧 Correção do FAB aplicada!');
})();
