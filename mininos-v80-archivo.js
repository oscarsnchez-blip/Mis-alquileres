'use strict';
/* Gestión Alquiler Mininos v80: archivo histórico de gastos y justificantes */
(() => {
  const VERSION='v80';
  const taxField=label=>label==='IBI'?'ibiPaidByYear':'wastePaidByYear';
  const historicalId=(propertyId,label,year)=>`annual-tax:${propertyId}:${label}:${year}`;
  const expenseReceiptKey=id=>`expense:${id}`;
  const receiptStore=()=>{db.receiptFiles=db.receiptFiles&&typeof db.receiptFiles==='object'?db.receiptFiles:{};return db.receiptFiles};

  function historicalExpense(propertyId,label,year){
    return (db.profitExpenses||[]).find(x=>x.id===historicalId(propertyId,label,year)||(
      x.documentationOnly&&x.sourceType==='annualTax'&&x.propertyId===propertyId&&x.taxLabel===label&&String(x.taxYear)===String(year)
    ));
  }
  function upsertHistoricalExpense(propertyId,label,year,paidDate){
    const p=prop(propertyId);if(!p)return null;
    db.profitExpenses=Array.isArray(db.profitExpenses)?db.profitExpenses:[];
    const id=historicalId(propertyId,label,year),amount=label==='IBI'?Number(p.ibi)||0:Number(p.wasteTax)||0;
    let x=historicalExpense(propertyId,label,year);
    const item={
      ...(x||{}),id,propertyId,category:label==='IBI'?'IBI':'Impuestos y tasas',concept:`${label} ${year}`,
      amount,frequency:'once',date:paidDate||today(),start:paidDate||today(),end:'',alert:false,deductible:true,active:true,
      notes:'Registro histórico generado al marcar el pago.',documentationOnly:true,countInProfit:false,sourceType:'annualTax',taxLabel:label,taxYear:String(year)
    };
    if(x)Object.assign(x,item);else db.profitExpenses.push(item);
    return item;
  }
  function removeHistoricalExpense(propertyId,label,year){
    const id=historicalId(propertyId,label,year);
    db.profitExpenses=(db.profitExpenses||[]).filter(x=>x.id!==id);
    delete receiptStore()[expenseReceiptKey(id)];
  }
  function downloadReceipt(key,id){
    const item=(receiptStore()[key]||[]).find(x=>x.id===id);if(!item)return;
    const a=document.createElement('a');a.href=item.data;a.download=item.name||`justificante-${today()}.jpg`;document.body.appendChild(a);a.click();a.remove();
  }
  window.downloadStoredReceipt=downloadReceipt;

  function addDownloadButtons(key){
    const panel=[...document.querySelectorAll('#detailBody .receipt-panel')].pop();if(!panel)return;
    const items=receiptStore()[key]||[];
    panel.querySelectorAll('.receipt-item').forEach((row,i)=>{
      const item=items[i];if(!item||row.querySelector('.receipt-download'))return;
      const b=document.createElement('button');b.type='button';b.className='icon-btn secondary receipt-download';b.title='Descargar';b.textContent='↓';
      b.onclick=e=>{e.stopPropagation();downloadReceipt(key,item.id)};row.insertBefore(b,row.lastElementChild);
    });
  }

  function showHistoricalExpense(id){
    const x=(db.profitExpenses||[]).find(v=>v.id===id);if(!x)return;
    showDetail('▥',x.concept,prop(x.propertyId)?.name||'',
      detailCell('Fecha de pago',fmt(x.date))+detailCell('Importe',euro(x.amount))+detailCell('Categoría',esc(x.category))+
      detailCell('Contabilización','Ya incluido desde la ficha del piso',true)+detailCell('Observaciones',esc(x.notes),true)
    );
    const grid=E('detailBody')?.querySelector('.detail-grid');
    if(grid&&typeof pickStoredReceipt==='function'){
      const key=expenseReceiptKey(id),items=receiptStore()[key]||[];
      const rows=items.length?items.map(item=>`<div class="receipt-item"><button type="button" class="receipt-thumb" onclick="event.stopPropagation();openStoredReceipt('${esc(key)}','${esc(item.id)}')"><img src="${item.data}" alt="${esc(item.name)}"></button><div><b>${esc(item.name)}</b><div class="muted">${fmt(item.date)}</div></div><button type="button" class="icon-btn secondary" title="Descargar" onclick="event.stopPropagation();downloadStoredReceipt('${esc(key)}','${esc(item.id)}')">↓</button>${typeof isViewer==='function'&&isViewer()?'':`<button type="button" class="icon-btn danger" title="Eliminar" onclick="event.stopPropagation();removeStoredReceipt('${esc(key)}','${esc(item.id)}')">⌫</button>`}</div>`).join(''):'<div class="muted">Sin justificante adjunto</div>';
      const add=typeof isViewer==='function'&&isViewer()?'':`<button type="button" class="secondary receipt-add" onclick="event.stopPropagation();pickStoredReceipt('${esc(key)}')">📷 Adjuntar foto</button>`;
      grid.insertAdjacentHTML('beforeend',`<div class="detail-cell detail-wide receipt-panel"><span>Justificantes</span>${rows}${add}</div>`);
    }
  }
  window.showHistoricalExpense=showHistoricalExpense;

  function renderHistoricalExpenses(){
    const box=E('profitExpenseList');if(!box)return;
    box.querySelectorAll('[data-history-tax]').forEach(x=>x.remove());
    const year=E('profitYear')?.value||String(new Date().getFullYear()),property=E('profitProperty')?.value||'all';
    const xs=(db.profitExpenses||[]).filter(x=>x.documentationOnly&&x.sourceType==='annualTax'&&String(x.taxYear)===String(year)&&(property==='all'||x.propertyId===property));
    xs.forEach(x=>{
      const card=document.createElement('div');card.className='card click-card history-tax-card';card.dataset.historyTax=x.id;card.onclick=()=>showHistoricalExpense(x.id);
      const count=(receiptStore()[expenseReceiptKey(x.id)]||[]).length;
      card.innerHTML=`<div class="modern-line"><div class="modern-icon">▥</div><div class="modern-copy"><div class="modern-title">${esc(x.category)} · ${esc(x.concept)}</div><div class="modern-meta">${esc(prop(x.propertyId)?.name||'')} · ${fmt(x.date)} · Histórico, no suma de nuevo</div><div class="modern-tags"><span class="modern-tag ok">Pagado</span>${count?`<span class="modern-tag">${count} justificante${count===1?'':'s'}</span>`:''}</div></div><div class="modern-value">${euro(x.amount)}<small>documental</small></div></div>`;
      box.appendChild(card);
    });
    if(xs.length&&box.querySelector('.empty'))box.querySelector('.empty').remove();
  }

  const profitDataBase=window.profitData||profitData;
  window.profitData=function(){
    const changed=[];(db.profitExpenses||[]).forEach(x=>{if(x.documentationOnly||x.countInProfit===false){changed.push([x,x.amount]);x.amount=0}});
    try{return profitDataBase.apply(this,arguments)}finally{changed.forEach(([x,amount])=>x.amount=amount)}
  };profitData=window.profitData;

  window.v12SetTaxPaid=function(propertyId,label,year){
    if(typeof denyViewer==='function'&&denyViewer())return;
    const p=prop(propertyId),field=taxField(label);if(!p||!field)return;
    if(!confirm(`¿Marcar ${label} de ${p.name} como pagado en ${year}?`))return;
    p[field]=p[field]||{};p[field][year]=today();
    const item=upsertHistoricalExpense(propertyId,label,year,p[field][year]);
    localStorage.setItem(KEY,JSON.stringify(db));localStorage.setItem('mininos-local-updated',new Date().toISOString());scheduleAutoUpload?.();
    E('detailModal')?.close();renderAll();
    if(item&&confirm(`${label} registrado en Gastos sin duplicar su contabilización. ¿Adjuntar una foto del recibo?`))pickStoredReceipt(expenseReceiptKey(item.id));
  };v12SetTaxPaid=window.v12SetTaxPaid;

  window.v12UndoTaxPaid=function(propertyId,label,year){
    if(typeof denyViewer==='function'&&denyViewer())return;
    const p=prop(propertyId),field=taxField(label);if(!p?.[field]?.[year])return;
    if(!confirm(`¿Volver a dejar pendiente ${label} de ${p.name} en ${year}? También se eliminará su registro histórico.`))return;
    delete p[field][year];removeHistoricalExpense(propertyId,label,year);persist();E('detailModal')?.close();
  };v12UndoTaxPaid=window.v12UndoTaxPaid;

  const showPropertyBase=window.showProperty||showProperty;
  window.showProperty=function(id){
    showPropertyBase(id);
    document.querySelectorAll('#detailBody .receipt-panel').forEach(panel=>{
      const title=panel.querySelector('span')?.textContent||'';
      if(/^(IBI|Tasa de basura) \d{4}/.test(title))panel.remove();
    });
  };showProperty=window.showProperty;

  const showExpenseBase=window.showProfitExpense||showProfitExpense;
  window.showProfitExpense=function(id){
    const x=(db.profitExpenses||[]).find(v=>v.id===id);if(x?.documentationOnly)return showHistoricalExpense(id);
    showExpenseBase(id);requestAnimationFrame(()=>addDownloadButtons(expenseReceiptKey(id)));
  };showProfitExpense=window.showProfitExpense;

  const renderProfitBase=window.renderProfit||renderProfit;
  window.renderProfit=function(){const r=renderProfitBase.apply(this,arguments);renderHistoricalExpenses();return r};renderProfit=window.renderProfit;
  ['profitYear','profitMonth','profitProperty','profitDeductible'].forEach(id=>{const el=E(id);if(el)el.addEventListener('change',()=>requestAnimationFrame(renderHistoricalExpenses))});

  const style=document.createElement('style');style.textContent='.history-tax-card{border-left:4px solid var(--ok)!important}.receipt-item{grid-template-columns:52px minmax(0,1fr) 34px 34px!important}.receipt-download{width:30px!important;height:30px!important;padding:0!important}';document.head.appendChild(style);
  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
  renderProfit();
})();
