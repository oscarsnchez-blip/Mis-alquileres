'use strict';
/* Gestión Alquiler Mininos v89: IBI pagado leído antes de construir la ficha */
(() => {
  const VERSION='v89';
  const YEAR=String(new Date().getFullYear());

  function findHistorical(propertyId,label){
    const normalized=String(label).toLowerCase();
    return (db.profitExpenses||[]).find(x=>{
      if(String(x.propertyId)!==String(propertyId))return false;
      const id=String(x.id||'').toLowerCase();
      const concept=String(x.concept||'').toLowerCase();
      const tax=String(x.taxLabel||'').toLowerCase();
      const year=String(x.taxYear||x.date?.slice(0,4)||'');
      const labelMatch=tax===normalized||concept.includes(normalized)||id.includes(normalized);
      return labelMatch&&year===YEAR&&(x.documentationOnly||x.sourceType==='annualTax'||id.startsWith('annual-tax:'));
    });
  }
  function syncBeforeDraw(propertyId){
    const p=prop(propertyId);if(!p)return;
    [['IBI','ibiPaidByYear'],['Tasa de basura','wastePaidByYear']].forEach(([label,field])=>{
      const historical=findHistorical(propertyId,label);
      if(!historical)return;
      p[field]=p[field]||{};
      p[field][YEAR]=p[field][YEAR]||historical.date||historical.start||today();
    });
    localStorage.setItem(KEY,JSON.stringify(db));
  }

  /* Punto clave: sincronizar ANTES de que v83 construya los cuadros. */
  const previousShow=window.showProperty||showProperty;
  window.showProperty=function(id){syncBeforeDraw(id);return previousShow(id)};
  showProperty=window.showProperty;

  /* También sincroniza todos los pisos existentes al arrancar. */
  (db.properties||[]).forEach(p=>syncBeforeDraw(p.id));
  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
})();
