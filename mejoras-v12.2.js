/* Gestion Alquiler Mininos V12.2
   - Fiscalidad: filas pulsables, iconos editar/eliminar
   - Nueva pestana Rentabilidad global
*/
(() => {
  'use strict';
  const money = n => typeof euro === 'function' ? euro(n) : new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(n)||0);
  const safe = s => typeof esc === 'function' ? esc(s) : String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getProp = id => typeof prop === 'function' ? prop(id) : db.properties.find(p=>p.id===id);
  const viewer = () => typeof isViewer === 'function' && isViewer();
  const currentYear = () => String(new Date().getFullYear());
  const currentMonth = () => new Date().toISOString().slice(0,7);

  db.profitExpenses = Array.isArray(db.profitExpenses) ? db.profitExpenses : [];

  const style = document.createElement('style');
  style.textContent = `
    .profit-toolbar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .profit-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .profit-positive{color:var(--ok)}.profit-negative{color:var(--bad)}
    .profit-source{font-size:11px;color:var(--mut);margin-top:4px}
    .profit-table{min-width:720px}
    .profit-card-row{cursor:pointer}
    @media(max-width:600px){.profit-toolbar,.profit-kpis{grid-template-columns:1fr}.profit-table{min-width:650px}}
  `;
  document.head.appendChild(style);

  function expenseMonthly(x){
    const amount=Number(x.amount)||0;
    return ({monthly:amount,quarterly:amount/3,semiannual:amount/6,annual:amount/12,once:0})[x.frequency] ?? amount;
  }
  function expenseAnnual(x,year){
    const amount=Number(x.amount)||0;
    if(x.frequency==='monthly') return amount*12;
    if(x.frequency==='quarterly') return amount*4;
    if(x.frequency==='semiannual') return amount*2;
    if(x.frequency==='annual') return amount;
    return (x.date||'').startsWith(year) ? amount : 0;
  }
  function activeContracts(year,month){
    const point=month==='all' ? `${year}-12` : `${year}-${month}`;
    return db.contracts.filter(c=>(!c.start||c.start.slice(0,7)<=point)&&(!c.end||c.end.slice(0,7)>=point));
  }
  function rentActual(c,year,month){
    if(month==='all') return db.payments.filter(p=>p.contractId===c.id&&(p.month||'').startsWith(year)&&p.status!=='pendiente').reduce((a,p)=>a+(Number(p.amount)||0),0);
    const p=db.payments.find(p=>p.contractId===c.id&&p.month===`${year}-${month}`&&p.status!=='pendiente');
    return Number(p?.amount)||0;
  }
  function rentForecast(c,year,month){ return month==='all' ? (Number(c.rent)||0)*12 : Number(c.rent)||0; }
  function mortgageCost(m,annual){
    const payment=typeof currentLoanRow==='function' ? Number(currentLoanRow(m).payment)||0 : (typeof loan==='function'?Number(loan(m).pay)||0:0);
    return payment*(annual?12:1);
  }
  function fixedPropertyCosts(p,annual){
    const community=(Number(p.community)||0)*(annual?12:1);
    const yearly=(Number(p.ibi)||0)+(Number(p.wasteTax)||0);
    return community+(annual?yearly:yearly/12);
  }
  function manualCostsFor(propertyId,year,annual){
    return db.profitExpenses.filter(x=>x.propertyId===propertyId&&x.active!==false&&(!x.start||x.start.slice(0,4)<=year)&&(!x.end||x.end.slice(0,4)>=year))
      .reduce((a,x)=>a+(annual?expenseAnnual(x,year):expenseMonthly(x)),0);
  }
  function profitData(){
    const year=E('profitYear')?.value||currentYear(), month=E('profitMonth')?.value||'all', mode=E('profitMode')?.value||'forecast', annual=month==='all';
    const contracts=activeContracts(year,month), rows=db.properties.map(p=>{
      const cs=contracts.filter(c=>c.propertyId===p.id);
      const income=cs.reduce((a,c)=>a+(mode==='actual'?rentActual(c,year,month):rentForecast(c,year,month)),0);
      const fixed=fixedPropertyCosts(p,annual), manual=manualCostsFor(p.id,year,annual);
      const mortgages=db.mortgages.filter(m=>m.propertyId===p.id).reduce((a,m)=>a+mortgageCost(m,annual),0);
      return {p,income,fixed,manual,mortgages,profit:income-fixed-manual-mortgages};
    });
    return {year,month,mode,annual,rows};
  }

  function openProfitExpense(id=''){
    if(viewer()) return alert('Este dispositivo esta en modo solo lectura.');
    if(!db.properties.length) return alert('Primero anade un piso.');
    const x=db.profitExpenses.find(v=>v.id===id)||{};
    const html = select('Piso','pfProperty',pOpts(),x.propertyId||db.properties[0].id)
      + field('Concepto','pfConcept','text',x.concept,'required')
      + field('Importe (EUR)','pfAmount','number',x.amount,'required min="0" step=".01"')
      + select('Periodicidad','pfFrequency',[
          ['monthly','Mensual'],['quarterly','Trimestral'],['semiannual','Semestral'],['annual','Anual'],['once','Pago unico']
        ],x.frequency||'monthly')
      + field('Fecha del pago unico','pfDate','date',x.date)
      + field('Fecha de inicio','pfStart','date',x.start)
      + field('Fecha de finalizacion','pfEnd','date',x.end)
      + select('Deducible fiscalmente','pfDeductible',[['no','No'],['yes','Si']],x.deductible?'yes':'no')
      + select('Estado','pfActive',[['yes','Activo'],['no','Inactivo']],x.active===false?'no':'yes')
      + field('Observaciones','pfNotes','text',x.notes);
    modal('Gasto de rentabilidad',html,()=>{
      const item={id:x.id||uid(),propertyId:E('pfProperty').value,concept:E('pfConcept').value,amount:+E('pfAmount').value,frequency:E('pfFrequency').value,date:E('pfDate').value,start:E('pfStart').value,end:E('pfEnd').value,deductible:E('pfDeductible').value==='yes',active:E('pfActive').value==='yes',notes:E('pfNotes').value};
      const i=db.profitExpenses.findIndex(v=>v.id===item.id); i<0?db.profitExpenses.push(item):db.profitExpenses[i]=item; persist(); renderProfit();
    });
  }
  function deleteProfitExpense(id){
    if(viewer()) return;
    if(confirm('¿Eliminar este gasto de rentabilidad?')){db.profitExpenses=db.profitExpenses.filter(x=>x.id!==id);persist();renderProfit();}
  }
  function showProfitExpense(id){
    const x=db.profitExpenses.find(v=>v.id===id);if(!x)return;
    const frequency={monthly:'Mensual',quarterly:'Trimestral',semiannual:'Semestral',annual:'Anual',once:'Pago unico'}[x.frequency]||x.frequency;
    if(typeof showDetail==='function') showDetail('📊',x.concept,getProp(x.propertyId)?.name||'',detailCell('Importe',money(x.amount))+detailCell('Periodicidad',frequency)+detailCell('Equivalente mensual',money(expenseMonthly(x)))+detailCell('Deducible',x.deductible?'Si':'No')+detailCell('Estado',x.active===false?'Inactivo':'Activo')+detailCell('Observaciones',safe(x.notes),true),viewer()?'':ownerIcon('✎','Editar',`E('detailModal').close();openProfitExpense('${id}')`));
    else openProfitExpense(id);
  }

  function renderProfit(){
    if(!E('profit')) return;
    const d=profitData(), totals=d.rows.reduce((a,r)=>({income:a.income+r.income,fixed:a.fixed+r.fixed,manual:a.manual+r.manual,mortgages:a.mortgages+r.mortgages,profit:a.profit+r.profit}),{income:0,fixed:0,manual:0,mortgages:0,profit:0});
    const factor=d.annual?1:12;
    E('profitSummary').innerHTML=`<div class="profit-kpis">
      <div class="card metric"><span class="muted">Ingresos ${d.annual?'anuales':'mensuales'}</span><b class="positive">${money(totals.income)}</b></div>
      <div class="card metric"><span class="muted">Gastos generales</span><b class="negative">${money(totals.fixed+totals.manual)}</b></div>
      <div class="card metric"><span class="muted">Cuotas hipotecarias</span><b class="negative">${money(totals.mortgages)}</b></div>
      <div class="card metric"><span class="muted">Beneficio ${d.annual?'anual':'mensual'}</span><b class="${totals.profit>=0?'positive':'negative'}">${money(totals.profit)}</b></div>
      <div class="card metric"><span class="muted">Beneficio anual estimado</span><b class="${totals.profit>=0?'positive':'negative'}">${money(totals.profit*factor)}</b></div>
    </div>`;
    E('profitProperties').innerHTML=`<div class="card"><h3>Beneficio por inmueble</h3><div class="scroll"><table class="profit-table"><thead><tr><th>Inmueble</th><th>Ingresos</th><th>Gastos</th><th>Hipoteca</th><th>Beneficio</th></tr></thead><tbody>${d.rows.map(r=>`<tr><td><b>${safe(r.p.name)}</b></td><td>${money(r.income)}</td><td>${money(r.fixed+r.manual)}</td><td>${money(r.mortgages)}</td><td class="${r.profit>=0?'positive':'negative'}"><b>${money(r.profit)}</b></td></tr>`).join('')}<tr><th>TOTAL</th><th>${money(totals.income)}</th><th>${money(totals.fixed+totals.manual)}</th><th>${money(totals.mortgages)}</th><th>${money(totals.profit)}</th></tr></tbody></table></div><div class="profit-source">Ingresos desde Contratos/Cobros; comunidad, IBI y basura desde Pisos; cuotas desde Hipotecas; otros gastos desde Rentabilidad.</div></div>`;
    E('profitExpenseList').innerHTML=db.profitExpenses.length?db.profitExpenses.map(x=>`<div class="card click-card" onclick="showProfitExpense('${x.id}')"><div class="row"><div><b>${safe(x.concept)}</b><div class="muted">${safe(getProp(x.propertyId)?.name||'')} · ${safe({monthly:'Mensual',quarterly:'Trimestral',semiannual:'Semestral',annual:'Anual',once:'Pago unico'}[x.frequency]||x.frequency)}</div></div><b>${money(x.amount)}</b></div><div class="detail-hint">Pulsa para ver la ficha</div>${viewer()?'':`<div class="icon-actions">${ownerIcon('✎','Editar',`openProfitExpense('${x.id}')`)}${ownerIcon('⌫','Eliminar',`deleteProfitExpense('${x.id}')`,'danger')}</div>`}</div>`).join(''):'<div class="card empty">No hay gastos manuales de rentabilidad</div>';
  }

  // Fiscalidad: mantener calculos existentes y cambiar solo interaccion/acciones.
  const fiscalBase=renderFiscal;
  renderFiscal=function(){
    fiscalBase();
    E('fiscalList')?.querySelectorAll('.card').forEach(card=>{
      const edit=card.querySelector('button.secondary'), remove=card.querySelector('button.danger');
      if(!edit) return;
      const m=(edit.getAttribute('onclick')||'').match(/openExpense\('([^']+)'\)/); if(!m)return;
      const id=m[1]; card.classList.add('click-card'); card.onclick=()=>showFiscalExpense(id);
      const p=card.querySelector('p'); if(p){p.className='icon-actions';p.innerHTML=`${ownerIcon('✎','Editar',`openExpense('${id}')`)}${ownerIcon('⌫','Eliminar',`del('expenses','${id}')`,'danger')}`;}
      if(!card.querySelector('.detail-hint')) card.querySelector('.row')?.insertAdjacentHTML('afterend','<div class="detail-hint">Pulsa para ver la ficha</div>');
    });
    if(typeof applyDeviceMode==='function')applyDeviceMode();
  };
  window.showFiscalExpense=function(id){
    const x=db.expenses.find(v=>v.id===id);if(!x)return;
    if(typeof showDetail==='function') showDetail('▥',x.category,getProp(x.propertyId)?.name||'',detailCell('Fecha',fmt(x.date))+detailCell('Importe',money(x.amount))+detailCell('Descripcion',safe(x.description),true)+detailCell('Vencimiento',fmt(x.expiry))+detailCell('Justificante',safe(x.receipt),true),viewer()?'':ownerIcon('✎','Editar',`E('detailModal').close();openExpense('${id}')`));
    else openExpense(id);
  };

  // Crear pestana y controles.
  const profitSection=document.createElement('section');profitSection.id='profit';profitSection.innerHTML=`<div class="row"><h2>Rentabilidad global</h2><button id="addProfitExpense">+ Anadir gasto</button></div><div class="card"><div class="profit-toolbar"><div><label>Año</label><select id="profitYear"></select></div><div><label>Periodo</label><select id="profitMonth"><option value="all">Todo el año</option>${Array.from({length:12},(_,i)=>`<option value="${String(i+1).padStart(2,'0')}">${new Date(2026,i,1).toLocaleDateString('es-ES',{month:'long'})}</option>`).join('')}</select></div><div><label>Ingresos</label><select id="profitMode"><option value="forecast">Previstos</option><option value="actual">Realmente cobrados</option></select></div></div></div><div id="profitSummary"></div><div id="profitProperties"></div><div class="row"><h3>Otros gastos</h3></div><div id="profitExpenseList"></div>`;
  E('data').before(profitSection);
  const years=[...new Set([new Date().getFullYear(),...db.payments.map(x=>+(x.month||'0000').slice(0,4)),...db.expenses.map(x=>+(x.date||'0000').slice(0,4))])].filter(Boolean).sort((a,b)=>b-a);
  E('profitYear').innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');
  E('profitYear').value=currentYear();
  const navData=document.querySelector('nav [data-tab="data"]');
  const btn=document.createElement('button');btn.dataset.tab='profit';btn.innerHTML='<span class="navicon">📈</span><span>Rentabilidad</span>';navData.before(btn);
  if(Array.isArray(window.TAB_ORDER)){const i=TAB_ORDER.indexOf('data');TAB_ORDER.splice(i<0?TAB_ORDER.length:i,0,'profit');}
  btn.onclick=()=>{activateTab('profit');renderProfit();};
  E('profitYear').onchange=renderProfit;E('profitMonth').onchange=renderProfit;E('profitMode').onchange=renderProfit;E('addProfitExpense').onclick=()=>openProfitExpense();

  const allBase=renderAll;
  renderAll=function(){allBase();renderProfit();};
  window.openProfitExpense=openProfitExpense;window.deleteProfitExpense=deleteProfitExpense;window.showProfitExpense=showProfitExpense;window.renderProfit=renderProfit;
  renderFiscal();renderProfit();
})();
