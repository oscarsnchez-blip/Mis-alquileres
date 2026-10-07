'use strict';
/* Gestión Alquiler Mininos v79: fotos de recibos y justificantes */
(() => {
  const VERSION='v79';
  const MAX_SIDE=1600;
  const JPEG_QUALITY=.78;
  const store=()=>{db.receiptFiles=db.receiptFiles&&typeof db.receiptFiles==='object'?db.receiptFiles:{};return db.receiptFiles};
  const taxKey=(propertyId,label,year)=>`tax:${propertyId}:${label}:${year}`;
  const expenseKey=id=>`expense:${id}`;

  function receiptInputHtml(id='receiptPhoto'){
    return `<div class="receipt-upload"><label for="${id}">Foto del justificante</label><input id="${id}" type="file" accept="image/*" capture="environment"><div class="muted">Puedes hacer una foto o elegirla de la galería. Se comprime antes de guardarla.</div></div>`;
  }
  async function fileToReceipt(file){
    if(!file)return null;
    if(!file.type.startsWith('image/'))throw new Error('Selecciona una imagen.');
    const source=await createImageBitmap(file),scale=Math.min(1,MAX_SIDE/Math.max(source.width,source.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
    canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);source.close?.();
    return {id:crypto.randomUUID(),name:file.name||`recibo-${today()}.jpg`,type:'image/jpeg',date:today(),data:canvas.toDataURL('image/jpeg',JPEG_QUALITY)};
  }
  function saveReceipt(key,item){if(!item)return;const s=store();s[key]=Array.isArray(s[key])?s[key]:[];s[key].push(item);persist()}
  function removeReceipt(key,id){if(denyViewer?.())return;if(!confirm('¿Eliminar este justificante?'))return;const s=store();s[key]=(s[key]||[]).filter(x=>x.id!==id);if(!s[key].length)delete s[key];persist()}
  function openReceipt(key,id){const item=(store()[key]||[]).find(x=>x.id===id);if(!item)return;const w=window.open('','_blank');if(!w)return alert('Permite ventanas emergentes para abrir el justificante.');w.document.write(`<!doctype html><meta name="viewport" content="width=device-width"><title>${esc(item.name)}</title><style>body{margin:0;background:#111;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style><img src="${item.data}" alt="Justificante">`);w.document.close()}
  async function pickReceipt(key){
    if(typeof isViewer==='function'&&isViewer())return;
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.setAttribute('capture','environment');
    input.onchange=async()=>{try{const item=await fileToReceipt(input.files?.[0]);if(item)saveReceipt(key,item)}catch(e){alert(e.message||'No se pudo guardar la foto.')}};input.click();
  }
  function receiptPanel(key,title){
    const items=store()[key]||[];
    const list=items.length?items.map(x=>`<div class="receipt-item"><button type="button" class="receipt-thumb" onclick="event.stopPropagation();openStoredReceipt('${esc(key)}','${esc(x.id)}')"><img src="${x.data}" alt="${esc(x.name)}"></button><div><b>${esc(x.name)}</b><div class="muted">${fmt(x.date)}</div></div>${typeof isViewer==='function'&&isViewer()?'':`<button type="button" class="icon-btn danger" title="Eliminar" onclick="event.stopPropagation();removeStoredReceipt('${esc(key)}','${esc(x.id)}')">⌫</button>`}</div>`).join(''):'<div class="muted">Sin justificante adjunto</div>';
    const add=typeof isViewer==='function'&&isViewer()?'':`<button type="button" class="secondary receipt-add" onclick="event.stopPropagation();pickStoredReceipt('${esc(key)}')">📷 Adjuntar foto</button>`;
    return `<div class="detail-cell detail-wide receipt-panel"><span>${esc(title)}</span>${list}${add}</div>`;
  }
  window.openStoredReceipt=openReceipt;window.removeStoredReceipt=removeReceipt;window.pickStoredReceipt=pickReceipt;

  const baseOpenExpense=window.openProfitExpense||openProfitExpense;
  window.openProfitExpense=function(id=''){
    const before=new Set((db.profitExpenses||[]).map(x=>x.id));
    baseOpenExpense(id);
    const fields=E('fields');if(!fields||E('receiptPhoto'))return;
    fields.insertAdjacentHTML('beforeend',receiptInputHtml());
    const original=E('form').onsubmit;
    E('form').onsubmit=async e=>{
      e.preventDefault();
      const file=E('receiptPhoto')?.files?.[0];let item=null;
      try{if(file)item=await fileToReceipt(file)}catch(err){alert(err.message||'No se pudo preparar la foto.');return}
      original.call(E('form'),e);
      const targetId=id||((db.profitExpenses||[]).find(x=>!before.has(x.id))?.id);
      if(item&&targetId)saveReceipt(expenseKey(targetId),item);
    };
  };openProfitExpense=window.openProfitExpense;

  const baseShowExpense=window.showProfitExpense||showProfitExpense;
  window.showProfitExpense=function(id){baseShowExpense(id);const grid=E('detailBody')?.querySelector('.detail-grid');if(grid)grid.insertAdjacentHTML('beforeend',receiptPanel(expenseKey(id),'Justificantes'))};showProfitExpense=window.showProfitExpense;

  const baseShowProperty=window.showProperty||showProperty;
  window.showProperty=function(id){
    baseShowProperty(id);const p=prop(id),grid=E('detailBody')?.querySelector('.detail-grid');if(!p||!grid)return;
    [['IBI','ibiPaidByYear'],['Tasa de basura','wastePaidByYear']].forEach(([label,field])=>Object.keys(p[field]||{}).sort((a,b)=>b-a).forEach(year=>grid.insertAdjacentHTML('beforeend',receiptPanel(taxKey(id,label,year),`${label} ${year} · justificante`))));
  };showProperty=window.showProperty;

  const baseSetTax=window.v12SetTaxPaid||v12SetTaxPaid;
  window.v12SetTaxPaid=function(propertyId,label,year){
    baseSetTax(propertyId,label,year);
    const p=prop(propertyId),field=label==='IBI'?'ibiPaidByYear':'wastePaidByYear';
    if(p?.[field]?.[year]&&!store()[taxKey(propertyId,label,year)]?.length&&confirm(`${label} marcado como pagado. ¿Quieres adjuntar ahora una foto del recibo?`))pickReceipt(taxKey(propertyId,label,year));
  };v12SetTaxPaid=window.v12SetTaxPaid;

  const style=document.createElement('style');style.textContent=`.receipt-upload{margin-top:12px;padding:12px;border:1px dashed #b8c8d3;border-radius:12px;background:#f7fafc}.receipt-upload input{margin-top:6px}.receipt-panel{display:grid!important;gap:8px}.receipt-item{display:grid;grid-template-columns:52px minmax(0,1fr) 34px;gap:9px;align-items:center;padding:7px;border:1px solid #e4ebef;border-radius:10px;background:#fff}.receipt-thumb{width:52px!important;height:52px!important;padding:0!important;overflow:hidden;border-radius:8px!important;box-shadow:none!important}.receipt-thumb img{width:100%;height:100%;object-fit:cover}.receipt-add{width:max-content;margin-top:2px}`;document.head.appendChild(style);
  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
})();
