'use strict';
/* Gestión Alquiler Mininos v83: una única ficha por impuesto */
(() => {
  const VERSION='v83';
  let busy=false;
  const titleOf=cell=>([...cell.children].find(x=>x.tagName==='SPAN')?.textContent||'').trim();
  const getProperty=()=>{const name=(E('detailTitle')?.textContent||'').trim();return db.properties.find(p=>String(p.name||'').trim()===name)};
  const taxYear=date=>String((typeof annualDue==='function'?annualDue(date):date)||today()).slice(0,4);
  const keyFor=(id,label,year)=>`expense:annual-tax:${id}:${label}:${year}`;
  const stored=key=>db.receiptFiles?.[key]||[];

  function actionPanel(p,label,date){
    const year=taxYear(date),field=label==='IBI'?'ibiPaidByYear':'wastePaidByYear',paid=p?.[field]?.[year],key=keyFor(p.id,label,year),items=stored(key);
    const wrap=document.createElement('div');wrap.className='tax83';
    wrap.innerHTML=`<div class="tax83-date">Fecha: <b>${fmt(date)}</b></div><div class="tax83-status ${paid?'paid':'pending'}">${paid?`✓ Pagado el ${fmt(paid)}`:'Pendiente'}</div>`;
    if(!(typeof isViewer==='function'&&isViewer())){
      const actions=document.createElement('div');actions.className='tax83-actions';
      const pay=document.createElement('button');pay.type='button';pay.className=paid?'secondary':'';pay.textContent=paid?'Deshacer':'Marcar pagado';pay.onclick=e=>{e.stopPropagation();paid?v12UndoTaxPaid(p.id,label,year):v12SetTaxPaid(p.id,label,year)};actions.appendChild(pay);
      if(paid){const photo=document.createElement('button');photo.type='button';photo.className='secondary';photo.textContent='📷 Foto';photo.onclick=e=>{e.stopPropagation();pickStoredReceipt(key)};actions.appendChild(photo)}
      wrap.appendChild(actions);
    }
    if(items.length){
      const gallery=document.createElement('div');gallery.className='tax83-gallery';
      items.forEach(item=>{
        const row=document.createElement('div');row.className='tax83-item';row.innerHTML=`<button type="button" class="tax83-thumb"><img src="${item.data}" alt="Justificante"></button><button type="button" class="icon-btn secondary" title="Descargar">↓</button>${typeof isViewer==='function'&&isViewer()?'':'<button type="button" class="icon-btn danger" title="Eliminar">⌫</button>'}`;
        const b=row.querySelectorAll('button');b[0].onclick=e=>{e.stopPropagation();openStoredReceipt(key,item.id)};b[1].onclick=e=>{e.stopPropagation();downloadStoredReceipt(key,item.id)};if(b[2])b[2].onclick=e=>{e.stopPropagation();removeStoredReceipt(key,item.id)};gallery.appendChild(row);
      });wrap.appendChild(gallery);
    }
    return wrap;
  }

  function arrange(){
    if(busy)return;const modal=E('detailModal'),grid=E('detailBody')?.querySelector('.detail-grid'),p=getProperty();if(!modal?.open||!grid||!p)return;
    busy=true;
    try{
      grid.querySelectorAll('.tax83').forEach(x=>x.remove());
      const cells=[...grid.children].filter(x=>x.classList?.contains('detail-cell'));
      const ibi=cells.find(x=>titleOf(x)==='IBI anual'),ibiDate=cells.find(x=>titleOf(x)==='Fecha IBI');
      const waste=cells.find(x=>titleOf(x)==='Tasa de basura'),wasteDate=cells.find(x=>titleOf(x)==='Fecha basura');
      if(ibi){ibi.classList.add('tax83-card');ibi.appendChild(actionPanel(p,'IBI',p.ibiDate))}
      if(waste){waste.classList.add('tax83-card');waste.appendChild(actionPanel(p,'Tasa de basura',p.wasteDate))}
      ibiDate?.remove();wasteDate?.remove();
      [...grid.children].forEach(cell=>{const t=titleOf(cell);if(/^(IBI|Tasa de basura) \d{4}( · justificante)?$/.test(t))cell.remove()});
    }finally{busy=false}
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(arrange));const body=E('detailBody');if(body)observer.observe(body,{childList:true,subtree:true});
  const base=window.showProperty||showProperty;window.showProperty=function(id){const r=base(id);requestAnimationFrame(arrange);setTimeout(arrange,80);return r};showProperty=window.showProperty;
  const style=document.createElement('style');style.textContent=`
    #detailModal .detail-grid>.tax83-card{grid-column:1/-1!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);column-gap:14px!important;align-items:center!important}
    #detailModal .tax83-card>span,#detailModal .tax83-card>b{grid-column:1}
    .tax83{grid-column:2;grid-row:1/3;align-self:stretch;border-left:1px solid #dfe8ed;padding-left:14px;display:flex;flex-direction:column;justify-content:center;gap:6px;min-width:0}
    .tax83-date{font-size:10px;color:var(--mut)}.tax83-date b{font-size:11px;color:var(--ui-ink,#13283a)}.tax83-status{font-size:11px;font-weight:800}.tax83-status.paid{color:var(--ok)}.tax83-status.pending{color:var(--bad)}
    .tax83-actions{display:flex;gap:5px;flex-wrap:wrap}.tax83-actions button{padding:5px 8px!important;font-size:10px!important;border-radius:8px!important;box-shadow:none!important}
    .tax83-gallery{display:flex;gap:4px;flex-wrap:wrap}.tax83-item{display:flex;gap:2px;align-items:center}.tax83-thumb{width:34px!important;height:34px!important;padding:0!important;overflow:hidden;border-radius:6px!important;box-shadow:none!important}.tax83-thumb img{width:100%;height:100%;object-fit:cover}.tax83-item .icon-btn{width:23px!important;height:23px!important;padding:0!important;font-size:11px!important}
    @media(max-width:430px){#detailModal .detail-grid>.tax83-card{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}.tax83{padding-left:9px;column-gap:8px}.tax83-actions button{padding:5px 6px!important;font-size:9px!important}}
  `;document.head.appendChild(style);document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
})();
