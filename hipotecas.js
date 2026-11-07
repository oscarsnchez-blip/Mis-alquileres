'use strict';
(()=>{
  function render(){
    const box=E('mortgageList');if(!box)return;
    box.innerHTML=db.mortgages.length?db.mortgages.map(x=>{const r=currentLoanRow(x),future=futureMortgagePayment(x),balance=balanceAt(x);return `<div class="card click-card mortgage-v183-card" onclick="showMortgage('${x.id}')"><div class="mortgage-v183-icon">⌂</div><div class="mortgage-v183-copy"><b>${esc(prop(x.propertyId)?.name||'Hipoteca')}</b><span>${esc(x.bank)} · ${esc(mortgageRateLabel(x))}</span><small>${remainingText(x)}</small></div><div class="mortgage-v183-values"><strong>${euro(balance)}</strong><span>Actual <b>${euro(r.payment)}</b></span><span>Futura <b>${euro(future)}</b></span></div><div class="mortgage-v183-actions"><button type="button" class="icon-btn primary" title="Ver amortización" onclick="event.stopPropagation();showAmort('${x.id}')">▤</button>${isViewer()?'':ownerIcon('✎','Editar',`openMortgage('${x.id}')`)+ownerIcon('⌫','Eliminar',`del('mortgages','${x.id}')`,'danger')}</div></div>`}).join(''):'<div class="card empty">No hay hipotecas</div>';
    if(typeof applyDeviceMode==='function')applyDeviceMode();
  }
  window.renderHipotecas=render;window.renderMortgages=render;try{renderMortgages=render}catch(e){}
  window.MininosPages=window.MininosPages||{};window.MininosPages.hipotecas={id:'mortgages',render};
  render();
})();
