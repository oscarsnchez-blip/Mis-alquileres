'use strict';
/* Gestión Alquiler Mininos v87: estado visual definitivo de IBI y basura */
(() => {
  const VERSION='v87';
  const YEAR=String(new Date().getFullYear());
  const fieldFor=label=>label==='IBI'?'ibiPaidByYear':'wastePaidByYear';

  function paintTaxState(propertyId){
    const p=prop(propertyId);if(!p)return;
    document.querySelectorAll('#detailBody .tax83').forEach(block=>{
      const card=block.closest('.detail-cell');
      const heading=(card?.querySelector(':scope > span')?.textContent||'').trim();
      if(heading!=='IBI anual'&&heading!=='Tasa de basura')return;
      const label=heading==='IBI anual'?'IBI':'Tasa de basura';
      const paid=p?.[fieldFor(label)]?.[YEAR]||'';
      const status=block.querySelector('.tax83-status');
      if(status){status.className='tax83-status '+(paid?'paid':'pending');status.textContent=paid?`✓ Pagado el ${fmt(paid)}`:`Pendiente ${YEAR}`}
      const actions=block.querySelector('.tax83-actions');if(!actions)return;
      const pay=actions.querySelector('button:first-child');
      if(pay){pay.className=paid?'secondary':'';pay.textContent=paid?'Deshacer':'Marcar pagado';pay.onclick=e=>{e.preventDefault();e.stopPropagation();paid?v12UndoTaxPaid(propertyId,label,YEAR):v12SetTaxPaid(propertyId,label,YEAR)}}
      let photo=actions.querySelector('.tax87-photo');
      if(paid&&!photo&&typeof pickStoredReceipt==='function'){
        photo=document.createElement('button');photo.type='button';photo.className='secondary tax87-photo';photo.textContent='📷 Foto';
        photo.onclick=e=>{e.preventDefault();e.stopPropagation();pickStoredReceipt(`expense:annual-tax:${propertyId}:${label}:${YEAR}`)};actions.appendChild(photo);
      }
      if(!paid&&photo)photo.remove();
    });
  }

  const baseShow=window.showProperty||showProperty;
  window.showProperty=function(id){
    const result=baseShow(id);
    /* v83 termina su composición visual con un temporizador. Pintamos después, una sola vez y sin observadores. */
    requestAnimationFrame(()=>paintTaxState(id));
    setTimeout(()=>paintTaxState(id),140);
    return result;
  };
  showProperty=window.showProperty;

  /* Después de guardar o deshacer, la v86 vuelve a abrir el piso. Este repintado tardío garantiza que se lea el dato ya persistido. */
  const baseSet=window.v12SetTaxPaid;
  window.v12SetTaxPaid=async function(propertyId,label,year){const result=await baseSet(propertyId,label,year);setTimeout(()=>paintTaxState(propertyId),220);return result};
  v12SetTaxPaid=window.v12SetTaxPaid;
  const baseUndo=window.v12UndoTaxPaid;
  window.v12UndoTaxPaid=async function(propertyId,label,year){const result=await baseUndo(propertyId,label,year);setTimeout(()=>paintTaxState(propertyId),220);return result};
  v12UndoTaxPaid=window.v12UndoTaxPaid;

  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
})();
