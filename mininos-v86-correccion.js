'use strict';
/* Gestión Alquiler Mininos v86: corrección estable sin observadores */
(() => {
  const VERSION='v86';
  const YEAR=String(new Date().getFullYear());
  const fieldFor=label=>label==='IBI'?'ibiPaidByYear':'wastePaidByYear';
  const historyId=(propertyId,label)=>`annual-tax:${propertyId}:${label}:${YEAR}`;
  const receiptKey=id=>`expense:${id}`;
  let resolver=null;

  function saveQuiet(){
    localStorage.setItem(KEY,JSON.stringify(db));
    localStorage.setItem('mininos-local-updated',new Date().toISOString());
    if(typeof scheduleAutoUpload==='function')scheduleAutoUpload();
  }
  function ask(title,text,ok='Confirmar',danger=false){
    let d=E('confirm86');
    if(!d){
      d=document.createElement('dialog');d.id='confirm86';
      d.innerHTML='<form method="dialog" class="confirm86-box"><h3 id="confirm86Title"></h3><p id="confirm86Text"></p><div><button value="cancel" class="secondary">Cancelar</button><button value="ok" id="confirm86Ok"></button></div></form>';
      document.body.appendChild(d);
      d.addEventListener('close',()=>{const done=resolver;resolver=null;done?.(d.returnValue==='ok')});
    }
    E('confirm86Title').textContent=title;E('confirm86Text').textContent=text;E('confirm86Ok').textContent=ok;E('confirm86Ok').className=danger?'danger':'';d.returnValue='';d.showModal();
    return new Promise(resolve=>resolver=resolve);
  }
  function ensureHistory(p,label,paidDate){
    db.profitExpenses=Array.isArray(db.profitExpenses)?db.profitExpenses:[];
    const id=historyId(p.id,label),amount=label==='IBI'?Number(p.ibi)||0:Number(p.wasteTax)||0;
    let x=db.profitExpenses.find(v=>v.id===id);
    const data={id,propertyId:p.id,category:label==='IBI'?'IBI':'Impuestos y tasas',concept:`${label} ${YEAR}`,amount,frequency:'once',date:paidDate,start:paidDate,end:'',alert:false,deductible:true,active:true,notes:'Registro histórico generado al marcar el pago.',documentationOnly:true,countInProfit:false,sourceType:'annualTax',taxLabel:label,taxYear:YEAR};
    if(x)Object.assign(x,data);else{db.profitExpenses.push(data);x=data}return x;
  }
  function reopen(id){requestAnimationFrame(()=>window.showProperty(id))}

  window.v12SetTaxPaid=async function(propertyId,label){
    if(typeof denyViewer==='function'&&denyViewer())return;
    const p=prop(propertyId),field=fieldFor(label);if(!p)return;
    if(!await ask(`Marcar ${label} ${YEAR} como pagado`,'Se guardará en Gastos como histórico documental, sin duplicar su contabilización.','Marcar pagado'))return;
    p[field]=p[field]||{};p[field][YEAR]=today();
    const item=ensureHistory(p,label,p[field][YEAR]);saveQuiet();renderAll();reopen(propertyId);
    if(await ask('Adjuntar justificante',`¿Quieres añadir una foto del recibo de ${label} ${YEAR}?`,'Añadir foto')){
      pickStoredReceipt(receiptKey(item.id));setTimeout(()=>reopen(propertyId),150);
    }
  };v12SetTaxPaid=window.v12SetTaxPaid;

  window.v12UndoTaxPaid=async function(propertyId,label){
    if(typeof denyViewer==='function'&&denyViewer())return;
    const p=prop(propertyId),field=fieldFor(label);if(!p?.[field]?.[YEAR])return;
    if(!await ask(`Deshacer ${label} ${YEAR}`,'Se eliminará el registro histórico y sus justificantes.','Deshacer pago',true))return;
    delete p[field][YEAR];const id=historyId(propertyId,label);db.profitExpenses=(db.profitExpenses||[]).filter(x=>x.id!==id);if(db.receiptFiles)delete db.receiptFiles[receiptKey(id)];saveQuiet();renderAll();reopen(propertyId);
  };v12UndoTaxPaid=window.v12UndoTaxPaid;

  const showBase=window.showProperty||showProperty;
  window.showProperty=function(id){
    const result=showBase(id),p=prop(id);if(!p)return result;
    requestAnimationFrame(()=>{
      document.querySelectorAll('#detailBody .tax83').forEach(block=>{
        const title=(block.closest('.detail-cell')?.querySelector(':scope > span')?.textContent||'').trim();
        const label=title==='IBI anual'?'IBI':'Tasa de basura',paid=p?.[fieldFor(label)]?.[YEAR];
        const status=block.querySelector('.tax83-status');if(status){status.className='tax83-status '+(paid?'paid':'pending');status.textContent=paid?`✓ Pagado el ${fmt(paid)}`:`Pendiente ${YEAR}`}
        const actions=block.querySelector('.tax83-actions');if(!actions)return;
        const pay=actions.querySelector('button:first-child');if(pay){pay.className=paid?'secondary':'';pay.textContent=paid?'Deshacer':'Marcar pagado';pay.onclick=e=>{e.stopPropagation();paid?v12UndoTaxPaid(id,label):v12SetTaxPaid(id,label)}}
        const photo=actions.querySelector('button:nth-child(2)');if(!paid&&photo)photo.remove();
      });
    });return result;
  };showProperty=window.showProperty;

  window.deleteProfitExpense=async function(id){
    const x=(db.profitExpenses||[]).find(v=>v.id===id);if(!x)return;
    if(!await ask('Eliminar gasto',`¿Eliminar “${x.concept||x.category||'este gasto'}”?`,'Eliminar',true))return;
    db.profitExpenses=db.profitExpenses.filter(v=>v.id!==id);if(db.receiptFiles)delete db.receiptFiles[receiptKey(id)];persist();renderProfit();
  };deleteProfitExpense=window.deleteProfitExpense;

  window.deleteProfitIncome=async function(id){
    const x=(db.profitIncomes||[]).find(v=>v.id===id);if(!x)return;
    if(!await ask('Eliminar ingreso',`¿Eliminar “${x.concept||'este ingreso'}”?`,'Eliminar',true))return;
    db.profitIncomes=db.profitIncomes.filter(v=>v.id!==id);persist();renderProfit();
  };deleteProfitIncome=window.deleteProfitIncome;

  window.removeStoredReceipt=async function(key,id){
    if(!await ask('Eliminar justificante','¿Eliminar definitivamente esta fotografía?','Eliminar',true))return;
    db.receiptFiles=db.receiptFiles||{};db.receiptFiles[key]=(db.receiptFiles[key]||[]).filter(x=>x.id!==id);if(!db.receiptFiles[key].length)delete db.receiptFiles[key];persist();
  };

  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
  const style=document.createElement('style');style.textContent='#confirm86{border:0;border-radius:18px;padding:0;max-width:min(90vw,420px);box-shadow:0 24px 70px #102a4355}#confirm86::backdrop{background:#102a4370}.confirm86-box{padding:20px}.confirm86-box h3{margin:0 0 8px}.confirm86-box p{color:var(--mut);line-height:1.45}.confirm86-box>div{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}';document.head.appendChild(style);
})();
