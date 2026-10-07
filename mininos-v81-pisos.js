'use strict';
/* Gestión Alquiler Mininos v81: pago y foto integrados en IBI y basura */
(() => {
  const VERSION='v81';
  const fieldFor=label=>label==='IBI'?'ibiPaidByYear':'wastePaidByYear';
  const historyId=(propertyId,label,year)=>`annual-tax:${propertyId}:${label}:${year}`;
  const receiptKey=(propertyId,label,year)=>`expense:${historyId(propertyId,label,year)}`;
  const currentYearFor=date=>{const due=annualDue(date)||date||today();return String(due).slice(0,4)};
  const receipts=key=>db.receiptFiles?.[key]||[];

  function findCell(grid,label){
    return [...grid.querySelectorAll(':scope > .detail-cell')].find(cell=>(cell.querySelector(':scope > span')?.textContent||'').trim()===label);
  }
  function taxControls(propertyId,label,date){
    const p=prop(propertyId),year=currentYearFor(date),paid=p?.[fieldFor(label)]?.[year],key=receiptKey(propertyId,label,year),items=receipts(key);
    const status=`<div class="tax-inline-status ${paid?'paid':'pending'}">${paid?`Pagado el ${fmt(paid)}`:'Pendiente'}</div>`;
    const paymentButton=typeof isViewer==='function'&&isViewer()?'':`<button type="button" class="${paid?'secondary':''} tax-inline-button" onclick="event.stopPropagation();${paid?`v12UndoTaxPaid('${propertyId}','${label}','${year}')`:`v12SetTaxPaid('${propertyId}','${label}','${year}')`}">${paid?'Deshacer pago':'Marcar como pagado'}</button>`;
    const thumbs=items.map(item=>`<div class="tax-receipt-row"><button type="button" class="tax-receipt-thumb" title="Ver foto" onclick="event.stopPropagation();openStoredReceipt('${key}','${item.id}')"><img src="${item.data}" alt="Justificante"></button><button type="button" class="icon-btn secondary" title="Descargar" onclick="event.stopPropagation();downloadStoredReceipt('${key}','${item.id}')">↓</button>${typeof isViewer==='function'&&isViewer()?'':`<button type="button" class="icon-btn danger" title="Eliminar" onclick="event.stopPropagation();removeStoredReceipt('${key}','${item.id}')">⌫</button>`}</div>`).join('');
    const photoButton=paid&&!(typeof isViewer==='function'&&isViewer())?`<button type="button" class="secondary tax-photo-button" onclick="event.stopPropagation();pickStoredReceipt('${key}')">📷 ${items.length?'Añadir otra foto':'Añadir foto'}</button>`:'';
    return `<div class="tax-inline" data-tax-inline="${label}">${status}<div class="tax-inline-actions">${paymentButton}${photoButton}</div>${thumbs?`<div class="tax-receipts">${thumbs}</div>`:''}</div>`;
  }
  function integrateTaxes(propertyId){
    const grid=E('detailBody')?.querySelector('.detail-grid'),p=prop(propertyId);if(!grid||!p)return;
    grid.querySelectorAll('[data-tax-inline]').forEach(x=>x.remove());
    const configs=[['IBI','IBI anual',p.ibiDate],['Tasa de basura','Tasa de basura',p.wasteDate]];
    configs.forEach(([label,cellLabel,date])=>{
      const cell=findCell(grid,cellLabel);if(cell)cell.insertAdjacentHTML('beforeend',taxControls(propertyId,label,date));
    });
    [...grid.querySelectorAll(':scope > .detail-cell')].forEach(cell=>{
      const title=(cell.querySelector(':scope > span')?.textContent||'').trim();
      if(/^(IBI|Tasa de basura) \d{4}$/.test(title)||/^(IBI|Tasa de basura) \d{4} · justificante$/.test(title))cell.remove();
    });
  }

  const showPropertyBase=window.showProperty||showProperty;
  window.showProperty=function(id){showPropertyBase(id);integrateTaxes(id)};
  showProperty=window.showProperty;

  const persistBase=window.persist||persist;
  window.persist=function(){const result=persistBase.apply(this,arguments);const modal=E('detailModal');if(modal?.open){const title=E('detailTitle')?.textContent||'',p=db.properties.find(x=>x.name===title);if(p)requestAnimationFrame(()=>integrateTaxes(p.id))}return result};
  persist=window.persist;

  const style=document.createElement('style');
  style.textContent=`
    .tax-inline{margin-top:10px;padding-top:9px;border-top:1px solid #dfe8ed;display:grid;gap:8px}
    .tax-inline-status{font-size:12px;font-weight:800}.tax-inline-status.paid{color:var(--ok)}.tax-inline-status.pending{color:var(--bad)}
    .tax-inline-actions{display:flex;gap:6px;flex-wrap:wrap}.tax-inline-actions button{padding:7px 9px!important;font-size:11px!important;border-radius:9px!important;box-shadow:none!important}
    .tax-receipts{display:flex;gap:6px;flex-wrap:wrap}.tax-receipt-row{display:flex;align-items:center;gap:3px;padding:3px;border:1px solid #dfe8ed;border-radius:9px;background:#fff}
    .tax-receipt-thumb{width:42px!important;height:42px!important;padding:0!important;overflow:hidden;border-radius:7px!important;box-shadow:none!important}.tax-receipt-thumb img{width:100%;height:100%;object-fit:cover}
    .tax-receipt-row .icon-btn{width:27px!important;height:27px!important;padding:0!important;font-size:13px!important}
  `;
  document.head.appendChild(style);
  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
})();
