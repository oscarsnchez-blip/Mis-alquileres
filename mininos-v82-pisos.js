'use strict';
/* Gestión Alquiler Mininos v82: integración visual robusta en Pisos */
(() => {
  const VERSION='v82';
  let arranging=false;

  function directTitle(cell){
    const span=[...cell.children].find(x=>x.tagName==='SPAN');
    return (span?.textContent||'').trim();
  }
  function findBaseCell(grid,label){
    return [...grid.children].find(cell=>cell.classList?.contains('detail-cell')&&directTitle(cell)===label);
  }
  function propertyFromModal(){
    const title=(E('detailTitle')?.textContent||'').trim();
    return db.properties.find(p=>String(p.name||'').trim()===title);
  }
  function yearFor(date){
    const due=typeof annualDue==='function'?annualDue(date):date;
    return String(due||today()).slice(0,4);
  }
  function receiptKey(propertyId,label,year){return `expense:annual-tax:${propertyId}:${label}:${year}`}
  function receiptItems(key){return db.receiptFiles?.[key]||[]}

  function buildIntegratedBlock(p,label,date,sourceCell){
    const year=yearFor(date),field=label==='IBI'?'ibiPaidByYear':'wastePaidByYear',paid=p?.[field]?.[year],key=receiptKey(p.id,label,year),items=receiptItems(key);
    const wrap=document.createElement('div');wrap.className='tax-v82';wrap.dataset.taxV82=label;

    const status=document.createElement('div');status.className='tax-v82-status '+(paid?'paid':'pending');status.textContent=paid?`Pagado el ${fmt(paid)}`:'Pendiente';wrap.appendChild(status);

    const actions=document.createElement('div');actions.className='tax-v82-actions';
    const oldButton=sourceCell?.querySelector('button');
    if(oldButton){
      oldButton.classList.add('tax-v82-pay');
      actions.appendChild(oldButton);
    }else if(!(typeof isViewer==='function'&&isViewer())){
      const pay=document.createElement('button');pay.type='button';pay.className=paid?'secondary tax-v82-pay':'tax-v82-pay';pay.textContent=paid?'Deshacer pago':'Marcar como pagado';
      pay.onclick=e=>{e.stopPropagation();paid?v12UndoTaxPaid(p.id,label,year):v12SetTaxPaid(p.id,label,year)};actions.appendChild(pay);
    }
    if(paid&&!(typeof isViewer==='function'&&isViewer())){
      const photo=document.createElement('button');photo.type='button';photo.className='secondary tax-v82-photo';photo.textContent=items.length?'📷 Añadir otra foto':'📷 Añadir foto';
      photo.onclick=e=>{e.stopPropagation();pickStoredReceipt(key)};actions.appendChild(photo);
    }
    if(actions.children.length)wrap.appendChild(actions);

    if(items.length){
      const gallery=document.createElement('div');gallery.className='tax-v82-gallery';
      items.forEach(item=>{
        const row=document.createElement('div');row.className='tax-v82-receipt';
        row.innerHTML=`<button type="button" class="tax-v82-thumb" title="Ver foto"><img src="${item.data}" alt="Justificante"></button><button type="button" class="icon-btn secondary" title="Descargar">↓</button>${typeof isViewer==='function'&&isViewer()?'':'<button type="button" class="icon-btn danger" title="Eliminar">⌫</button>'}`;
        const buttons=row.querySelectorAll('button');buttons[0].onclick=e=>{e.stopPropagation();openStoredReceipt(key,item.id)};buttons[1].onclick=e=>{e.stopPropagation();downloadStoredReceipt(key,item.id)};
        if(buttons[2])buttons[2].onclick=e=>{e.stopPropagation();removeStoredReceipt(key,item.id)};
        gallery.appendChild(row);
      });
      wrap.appendChild(gallery);
    }
    return wrap;
  }

  function arrangePropertyModal(){
    if(arranging)return;
    const modal=E('detailModal'),grid=E('detailBody')?.querySelector('.detail-grid'),p=propertyFromModal();
    if(!modal?.open||!grid||!p)return;
    arranging=true;
    try{
      grid.querySelectorAll('.tax-v82').forEach(x=>x.remove());
      const configs=[['IBI','IBI anual',p.ibiDate],['Tasa de basura','Tasa de basura',p.wasteDate]];
      configs.forEach(([label,baseLabel,date])=>{
        const year=yearFor(date),base=findBaseCell(grid,baseLabel);
        const source=[...grid.children].find(cell=>directTitle(cell)===`${label} ${year}`);
        if(base)base.appendChild(buildIntegratedBlock(p,label,date,source));
      });
      [...grid.children].forEach(cell=>{
        const title=directTitle(cell);
        if(/^(IBI|Tasa de basura) \d{4}$/.test(title)||/^(IBI|Tasa de basura) \d{4} · justificante$/.test(title))cell.remove();
      });
    }finally{arranging=false}
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(arrangePropertyModal));
  const detail=E('detailBody');if(detail)observer.observe(detail,{childList:true,subtree:true});
  const showBase=window.showProperty||showProperty;
  window.showProperty=function(id){const r=showBase(id);requestAnimationFrame(arrangePropertyModal);setTimeout(arrangePropertyModal,60);return r};showProperty=window.showProperty;

  const style=document.createElement('style');style.textContent=`
    .tax-v82{margin-top:9px;padding-top:8px;border-top:1px solid #dfe8ed;display:grid;gap:7px}
    .tax-v82-status{font-size:12px;font-weight:800}.tax-v82-status.paid{color:var(--ok)}.tax-v82-status.pending{color:var(--bad)}
    .tax-v82-actions{display:flex;flex-wrap:wrap;gap:5px}.tax-v82-actions button{padding:6px 8px!important;font-size:10px!important;border-radius:8px!important;box-shadow:none!important}
    .tax-v82-gallery{display:flex;flex-wrap:wrap;gap:5px}.tax-v82-receipt{display:flex;align-items:center;gap:3px;padding:3px;border:1px solid #dfe8ed;border-radius:8px;background:#fff}
    .tax-v82-thumb{width:40px!important;height:40px!important;padding:0!important;overflow:hidden;border-radius:6px!important;box-shadow:none!important}.tax-v82-thumb img{width:100%;height:100%;object-fit:cover}
    .tax-v82-receipt .icon-btn{width:25px!important;height:25px!important;padding:0!important;font-size:12px!important}
  `;document.head.appendChild(style);
  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
})();
