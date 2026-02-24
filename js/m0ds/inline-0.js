
    // Ativa speechSynthesis no Android
    document.addEventListener('touchstart', function() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        console.log('🎤 speechSynthesis ativado por toque');
      }
    }, { once: true });

    window.addEventListener('error', function(e) {
      console.error('🚨 ERRO CAPTURADO:', e.message, 'em', e.filename, 'linha', e.lineno);
      alert('ERRO: ' + e.message + '\nVerifique o console (F12)');
    });

    console.log('✅ Script de diagnóstico carregado');
  