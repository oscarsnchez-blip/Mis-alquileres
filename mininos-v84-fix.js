'use strict';
/* Gestión Alquiler Mininos v84: corrección integral de impuestos */
(() => {
  const VERSION='v84';
  let selectedPropertyId='';
  let dialogResolve=null;
  const currentYear=()=>String(new Date().getFullYear());
  const fieldFor=label=>label==='IBI'?'ibiPaidByYear':'wastePaidByYear';
  const historyId=(propertyId,label,year)=>`annual-tax:${propertyId}:${label}:${year}`;
  const receiptKey=id=>`expense:${id}`;

  function persistQuiet(){
    localStorage.setItem(KEY,JSON.stringify(db));
    localStorage.setItem('mininos-local-updated',new Date().toISOString());
    if(typeof scheduleAutoUpload==='function')scheduleAutoUpload();
  }
  function ensureHistorical(p,label,year,paidDate){
    db.profitExpenses=Array.isArray(db.profitExpenses)?db.profitExpenses:[];
    const id=historyId(p.id,label,year),amount=label==='IBI'?Number(p.ibi)||0:Number(p.wasteTax)||0;
    let x=db.profitExpenses.find(v=>v.id===id||v.documentationOnly&&v.sourceType==='annualTax'&&v.propertyId===p.id&&v.taxLabel===label&&String(v.taxYear)===String(year));
    const item={...(x||{}),id,propertyId:p.id,category:label==='IBI'?'IBI':'Impuestos y tasas',concept:`${label} ${year}`,amount,frequency:'once',date:paidDate||today(),start:paidDate||today(),end:'',alert:false,deductible:true,active:true,notes:'Registro histórico generado al marcar el pago.',documentationOnly:true,countInProfit:false,sourceType:'annualTax',taxLabel:label,taxYear:String(year)};
    if(x)Object.assign(x,item);else db.profitExpenses.push(item);
    return item;
  }
  function removeHistorical(propertyId,label,year){
    const id=historyId(propertyId,label,year);db.profitExpenses=(db.profitExpenses||[]).filter(x=>x.id!==id);if(db.receiptFiles)delete db.receiptFiles[receiptKey(id)];
  }
  function ask(title,message,confirmText='Confirmar'){
    let d=E('mininosConfirm84');
    if(!d){d=document.createElement('dialog');d.id='mininosConfirm84';d.innerHTML='<form method="dialog" class="confirm84"><h3 id="confirm84Title"></h3><p id="confirm84Message"></p><div><button value="cancel" class="secondary">Cancelar</button><button value="ok" id="confirm84Ok"></button></div></form>';document.body.appendChild(d);d.addEventListener('close',()=>{const resolve=dialogResolve;dialogResolve=null;resolve?.(d.returnValue==='ok')})}
    E('confirm84Title').textContent=title;E('confirm84Message').textContent=message;E('confirm84Ok').textContent=confirmText;d.returnValue='';d.showModal();return new Promise(resolve=>dialogResolve=resolve);
  }
  function reopenProperty(id){selectedPropertyId=id;requestAnimationFrame(()=>showProperty(id))}

  window.v12SetTaxPaid=async function(propertyId,label,year){
    if(typeof denyViewer==='function'&&denyViewer())return;
    year=currentYear();const p=prop(propertyId),field=fieldFor(label);if(!p||!field)return;
    if(!await ask(`Marcar ${label} ${year} como pagado`,`Se registrará el pago en Gastos sin volver a sumarlo en Rentabilidad.`,'Marcar pagado'))return;
    p[field]=p[field]||{};p[field][year]=today();const item=ensureHistorical(p,label,year,p[field][year]);persistQuiet();
    if(typeof renderAll==='function')renderAll();reopenProperty(propertyId);
    if(await ask('Adjuntar justificante',`¿Quieres añadir ahora una foto del recibo de ${label} ${year}?`,'Añadir foto')){pickStoredReceipt(receiptKey(item.id));setTimeout(()=>reopenProperty(propertyId),120)}
  };v12SetTaxPaid=window.v12SetTaxPaid;

  window.v12UndoTaxPaid=async function(propertyId,label,year){
    if(typeof denyViewer==='function'&&denyViewer())return;
    year=currentYear();const p=prop(propertyId),field=fieldFor(label);if(!p?.[field]?.[year])return;
    if(!await ask(`Deshacer pago de ${label} ${year}`,'Se eliminará también el registro histórico y sus justificantes.','Deshacer pago'))return;
    delete p[field][year];removeHistorical(propertyId,label,year);persistQuiet();if(typeof renderAll==='function')renderAll();reopenProperty(propertyId);
  };v12UndoTaxPaid=window.v12UndoTaxPaid;

  function migrateCurrentPayments(){
    const year=currentYear();let changed=false;
    db.properties.forEach(p=>[['IBI','ibiPaidByYear'],['Tasa de basura','wastePaidByYear']].forEach(([label,field])=>{const paid=p[field]?.[year];if(paid&&!db.profitExpenses?.some(x=>x.id===historyId(p.id,label,year))){ensureHistorical(p,label,year,paid);changed=true}}));
    if(changed)persistQuiet();
  }
  function historicalVisible(x){
    const year=E('profitYear')?.value||currentYear(),property=E('profitProperty')?.value||'all',month=E('profitMonth')?.value||'all',ded=E('profitDeductible')?.value||'all';
    return x.documentationOnly&&x.sourceType==='annualTax'&&String(x.taxYear)===String(year)&&(property==='all'||x.propertyId===property)&&(month==='all'||String(x.date||'').slice(5,7)===month)&&(ded==='all'||ded==='yes');
  }
  function historyCard(x){
    const count=db.receiptFiles?.[receiptKey(x.id)]?.length||0,card=document.createElement('div');card.className='card click-card history84';card.dataset.history84=x.id;card.onclick=()=>showHistoricalExpense(x.id);
    card.innerHTML=`<div class="modern-line"><div class="modern-icon">▥</div><div class="modern-copy"><div class="modern-title">${esc(x.category)} · ${esc(x.concept)}</div><div class="modern-meta">${esc(prop(x.propertyId)?.name||'')} · ${fmt(x.date)} · No duplica el gasto</div><div class="modern-tags"><span class="modern-tag ok">Pagado</span>${count?`<span class="modern-tag">${count} foto${count===1?'':'s'}</span>`:''}</div></div><div class="modern-value">${euro(x.amount)}<small>histórico</small></div></div>`;return card;
  }
  function renderHistory(){
    const box=E('profitExpenseList');if(!box)return;box.querySelectorAll('[data-history84]').forEach(x=>x.remove());
    const xs=(db.profitExpenses||[]).filter(historicalVisible);xs.forEach(x=>box.appendChild(historyCard(x)));if(xs.length)box.querySelector('.empty')?.remove();
  }
  const profitBase=window.renderProfit||renderProfit;window.renderProfit=function(){const r=profitBase.apply(this,arguments);renderHistory();return r};renderProfit=window.renderProfit;
  ['profitYear','profitMonth','profitProperty','profitDeductible'].forEach(id=>E(id)?.addEventListener('change',()=>requestAnimationFrame(renderHistory)));

  const showPropertyBase=window.showProperty||showProperty;window.showProperty=function(id){selectedPropertyId=id;const r=showPropertyBase(id);return r};showProperty=window.showProperty;
  migrateCurrentPayments();document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);renderProfit();
  const style=document.createElement('style');style.textContent='#mininosConfirm84{border:0;border-radius:18px;padding:0;max-width:min(90vw,420px);box-shadow:0 24px 70px #102a4355}#mininosConfirm84::backdrop{background:#102a4370}.confirm84{padding:20px}.confirm84 h3{margin:0 0 8px}.confirm84 p{color:var(--mut);line-height:1.45}.confirm84>div{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.history84{border-left:4px solid var(--ok)!important}';document.head.appendChild(style);
})();
