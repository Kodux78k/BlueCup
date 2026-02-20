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
