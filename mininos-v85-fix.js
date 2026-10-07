'use strict';
/* Gestión Alquiler Mininos v85: estado anual coherente y diálogos propios */
(() => {
  const VERSION='v85';
  const yearNow=()=>String(new Date().getFullYear());
  const taxField=label=>label==='IBI'?'ibiPaidByYear':'wastePaidByYear';
  let dialogResolve=null;
  let patching=false;

  function ask85(title,message,okText='Confirmar',danger=false){
    let d=E('mininosConfirm85');
    if(!d){
      d=document.createElement('dialog');d.id='mininosConfirm85';
      d.innerHTML='<form method="dialog" class="confirm85"><h3 id="confirm85Title"></h3><p id="confirm85Message"></p><div><button value="cancel" class="secondary">Cancelar</button><button value="ok" id="confirm85Ok"></button></div></form>';
      document.body.appendChild(d);
      d.addEventListener('close',()=>{const done=dialogResolve;dialogResolve=null;done?.(d.returnValue==='ok')});
    }
    E('confirm85Title').textContent=title;E('confirm85Message').textContent=message;E('confirm85Ok').textContent=okText;E('confirm85Ok').className=danger?'danger':'';d.returnValue='';d.showModal();
    return new Promise(resolve=>dialogResolve=resolve);
  }
  window.mininosAsk=ask85;

  function currentProperty(){
    const name=(E('detailTitle')?.textContent||'').trim();
    return db.properties.find(p=>String(p.name||'').trim()===name);
  }
  function updateTaxCards(){
    if(patching)return;
    const modal=E('detailModal'),p=currentProperty();if(!modal?.open||!p)return;
    patching=true;
    try{
      const year=yearNow();
      document.querySelectorAll('#detailBody .tax83').forEach(block=>{
        const card=block.closest('.detail-cell'),label=(card?.querySelector(':scope > span')?.textContent||'').trim()==='IBI anual'?'IBI':'Tasa de basura';
        const paid=p?.[taxField(label)]?.[year],status=block.querySelector('.tax83-status'),pay=block.querySelector('.tax83-actions button:first-child');
        if(status){status.className='tax83-status '+(paid?'paid':'pending');status.textContent=paid?`✓ Pagado el ${fmt(paid)}`:`Pendiente ${year}`}
        if(pay){pay.className=paid?'secondary':'';pay.textContent=paid?'Deshacer':'Marcar pagado';pay.onclick=e=>{e.stopPropagation();paid?v12UndoTaxPaid(p.id,label,year):v12SetTaxPaid(p.id,label,year)}}
        const photo=block.querySelector('.tax83-actions button:nth-child(2)');
        if(!paid&&photo)photo.remove();
      });
    }finally{patching=false}
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(updateTaxCards));if(E('detailBody'))observer.observe(E('detailBody'),{childList:true,subtree:true});
  const showBase=window.showProperty||showProperty;window.showProperty=function(id){const r=showBase(id);requestAnimationFrame(updateTaxCards);setTimeout(updateTaxCards,100);return r};showProperty=window.showProperty;

  window.deleteProfitExpense=async function(id){
    if(typeof viewer==='function'&&viewer())return;
    const x=(db.profitExpenses||[]).find(v=>v.id===id);if(!x)return;
    if(!await ask85('Eliminar gasto',`¿Eliminar “${x.concept||x.category||'este gasto'}”? Esta acción no se puede deshacer.`,'Eliminar',true))return;
    db.profitExpenses=db.profitExpenses.filter(v=>v.id!==id);if(db.receiptFiles)delete db.receiptFiles[`expense:${id}`];persist();renderProfit();
  };deleteProfitExpense=window.deleteProfitExpense;

  if(typeof window.deleteProfitIncome==='function'||typeof deleteProfitIncome==='function'){
    window.deleteProfitIncome=async function(id){
      if(typeof viewer==='function'&&viewer())return;
      const x=(db.profitIncomes||[]).find(v=>v.id===id);if(!x)return;
      if(!await ask85('Eliminar ingreso',`¿Eliminar “${x.concept||'este ingreso'}”? Esta acción no se puede deshacer.`,'Eliminar',true))return;
      db.profitIncomes=db.profitIncomes.filter(v=>v.id!==id);persist();renderProfit();
    };deleteProfitIncome=window.deleteProfitIncome;
  }

  if(typeof window.removeStoredReceipt==='function'){
    window.removeStoredReceipt=async function(key,id){
      if(typeof isViewer==='function'&&isViewer())return;
      if(!await ask85('Eliminar justificante','¿Eliminar definitivamente esta foto?','Eliminar',true))return;
      db.receiptFiles=db.receiptFiles||{};db.receiptFiles[key]=(db.receiptFiles[key]||[]).filter(x=>x.id!==id);if(!db.receiptFiles[key].length)delete db.receiptFiles[key];persist();
      const p=currentProperty();if(p)requestAnimationFrame(()=>showProperty(p.id));
    };
  }

  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
  const style=document.createElement('style');style.textContent='#mininosConfirm85{border:0;border-radius:18px;padding:0;max-width:min(90vw,420px);box-shadow:0 24px 70px #102a4355}#mininosConfirm85::backdrop{background:#102a4370}.confirm85{padding:20px}.confirm85 h3{margin:0 0 8px}.confirm85 p{color:var(--mut);line-height:1.45}.confirm85>div{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}';document.head.appendChild(style);
  updateTaxCards();
})();
