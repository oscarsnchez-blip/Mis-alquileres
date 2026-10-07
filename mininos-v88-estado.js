'use strict';
/* Gestión Alquiler Mininos v88: histórico como fuente de verdad del estado */
(() => {
  const VERSION='v88';
  const YEAR=String(new Date().getFullYear());
  const historyId=(propertyId,label)=>`annual-tax:${propertyId}:${label}:${YEAR}`;
  const fieldFor=label=>label==='IBI'?'ibiPaidByYear':'wastePaidByYear';

  function history(propertyId,label){
    return (db.profitExpenses||[]).find(x=>x.id===historyId(propertyId,label)||(
      x.documentationOnly&&x.sourceType==='annualTax'&&x.propertyId===propertyId&&x.taxLabel===label&&String(x.taxYear)===YEAR
    ));
  }
  function paidDate(p,label){
    const saved=p?.[fieldFor(label)]?.[YEAR];
    const item=history(p?.id,label);
    return saved||item?.date||item?.start||'';
  }
  function synchronise(p,label){
    const date=paidDate(p,label);if(!date)return '';
    const field=fieldFor(label);p[field]=p[field]||{};
    if(p[field][YEAR]!==date){p[field][YEAR]=date;localStorage.setItem(KEY,JSON.stringify(db));}
    return date;
  }
  function paint(propertyId){
    const p=prop(propertyId);if(!p)return;
    document.querySelectorAll('#detailBody .tax83').forEach(block=>{
      const heading=(block.closest('.detail-cell')?.querySelector(':scope > span')?.textContent||'').trim();
      if(heading!=='IBI anual'&&heading!=='Tasa de basura')return;
      const label=heading==='IBI anual'?'IBI':'Tasa de basura',paid=synchronise(p,label);
      const status=block.querySelector('.tax83-status');
      if(status){status.className='tax83-status '+(paid?'paid':'pending');status.textContent=paid?`✓ Pagado el ${fmt(paid)}`:`Pendiente ${YEAR}`;}
      const actions=block.querySelector('.tax83-actions');if(!actions)return;
      const pay=actions.querySelector('button:first-child');
      if(pay){pay.className=paid?'secondary':'';pay.textContent=paid?'Deshacer':'Marcar pagado';pay.onclick=e=>{e.preventDefault();e.stopPropagation();paid?window.v12UndoTaxPaid(propertyId,label,YEAR):window.v12SetTaxPaid(propertyId,label,YEAR);};}
      let photo=actions.querySelector('.tax88-photo');
      if(paid&&!photo&&typeof pickStoredReceipt==='function'){
        photo=document.createElement('button');photo.type='button';photo.className='secondary tax88-photo';photo.textContent='📷 Foto';
        photo.onclick=e=>{e.preventDefault();e.stopPropagation();pickStoredReceipt(`expense:${historyId(propertyId,label)}`);};actions.appendChild(photo);
      }
      if(!paid&&photo)photo.remove();
    });
  }

  /* Migra al estado del piso los históricos que ya aparecen correctamente en Gastos. */
  (db.profitExpenses||[]).filter(x=>x.documentationOnly&&x.sourceType==='annualTax'&&String(x.taxYear)===YEAR).forEach(x=>{
    const p=prop(x.propertyId),field=fieldFor(x.taxLabel);if(!p||!field)return;p[field]=p[field]||{};p[field][YEAR]=p[field][YEAR]||x.date||x.start||today();
  });
  localStorage.setItem(KEY,JSON.stringify(db));

  const baseShow=window.showProperty||showProperty;
  window.showProperty=function(id){const result=baseShow(id);requestAnimationFrame(()=>paint(id));setTimeout(()=>paint(id),90);setTimeout(()=>paint(id),260);return result;};
  showProperty=window.showProperty;

  const baseSet=window.v12SetTaxPaid;
  window.v12SetTaxPaid=async function(propertyId,label,year){const result=await baseSet(propertyId,label,year);setTimeout(()=>paint(propertyId),240);return result;};v12SetTaxPaid=window.v12SetTaxPaid;
  const baseUndo=window.v12UndoTaxPaid;
  window.v12UndoTaxPaid=async function(propertyId,label,year){const result=await baseUndo(propertyId,label,year);setTimeout(()=>paint(propertyId),240);return result;};v12UndoTaxPaid=window.v12UndoTaxPaid;

  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
})();
