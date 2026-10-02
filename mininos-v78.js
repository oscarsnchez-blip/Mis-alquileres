'use strict';
/* Gestión Alquiler Mininos v77: interfaz y avisos configurables */
(() => {
  const VERSION='v78';
  const ALERT_MONTHS_KEY='mininos-alert-months';
  const MENU_ORDER=['home','profit','payments','properties','mortgages','contracts','future','simulator','data'];

  function getAlertMonths(){
    const saved=Number(localStorage.getItem(ALERT_MONTHS_KEY));
    return Number.isFinite(saved) ? Math.max(0,Math.min(60,Math.round(saved))) : 3;
  }
  function dueInWindow(date){
    if(!date)return false;
    const due=new Date(date+'T12:00:00'),start=new Date(today()+'T12:00:00'),end=new Date(start);
    end.setMonth(end.getMonth()+getAlertMonths());
    return Number.isFinite(due.getTime())&&due>=start&&due<=end;
  }
  function nextAnnualDue(value){
    if(!value)return '';
    const match=String(value).match(/(?:\d{4}-)?(\d{2})-(\d{2})$/);
    if(!match)return '';
    const now=new Date(today()+'T12:00:00');
    let year=now.getFullYear();
    let due=`${year}-${match[1]}-${match[2]}`;
    if(new Date(due+'T12:00:00')<now)due=`${year+1}-${match[1]}-${match[2]}`;
    return due;
  }
  function reorderMenu(){
    const nav=document.querySelector('nav');
    if(nav)MENU_ORDER.forEach(id=>{const button=nav.querySelector(`[data-tab="${id}"]`);if(button)nav.appendChild(button)});
    if(typeof TAB_ORDER!=='undefined')TAB_ORDER.splice(0,TAB_ORDER.length,...MENU_ORDER);
  }
  function fixProfitTable(){
    const table=document.querySelector('#profitProperties table.v14-table');
    const row=table?.tHead?.rows?.[0];
    if(!row)return;
    [...row.cells].forEach(th=>{
      const text=th.textContent.trim();
      if(text==='Gastos reales')th.textContent='Gasto R.';
      if(text==='Beneficio neto')th.textContent='Beneficio R.';
      th.style.setProperty('text-align','center','important');
    });
  }
  function installAlertSetting(){
    const section=E('data');
    if(!section||E('alertMonths'))return;
    const card=document.createElement('div');
    card.className='card mininos-alert-settings';
    card.innerHTML=`<h3>Avisos</h3><div class="row"><div><label for="alertMonths">Antelación de avisos</label><div class="muted">IBI, tasas, seguros y otros gastos. Los cobros no cambian.</div></div><div class="mininos-month-input"><input id="alertMonths" type="number" min="0" max="60" step="1" value="${getAlertMonths()}"><span>meses</span></div></div>`;
    const first=section.querySelector('.card');
    first?first.before(card):section.appendChild(card);
    E('alertMonths').addEventListener('change',()=>{
      const value=Math.max(0,Math.min(60,Math.round(Number(E('alertMonths').value)||0)));
      E('alertMonths').value=value;
      localStorage.setItem(ALERT_MONTHS_KEY,String(value));
      renderHome();
    });
  }
  function addAlert(box,{key,text,onClick,reviewed=false}){
    const card=document.createElement('div');
    card.className='item alert'+(reviewed?' reviewed':'');
    card.dataset.mininosTimedAlert=key;
    card.innerHTML=`${text}<div class="muted">Pulsa para ver el detalle y marcar como revisado</div>`;
    card.onclick=onClick;
    box.appendChild(card);
  }
  function rebuildTimedAlerts(){
    const box=E('alerts');if(!box)return;
    [...box.querySelectorAll('.alert')].forEach(card=>{
      const code=card.getAttribute('onclick')||'';
      if(!/openAlert\('payment'/.test(code))card.remove();
    });
    db.properties.forEach(p=>[
      ['IBI',p.ibi,p.ibiDate],['Tasa de basura',p.wasteTax,p.wasteDate]
    ].forEach(([label,amount,annualDate])=>{
      const due=nextAnnualDue(annualDate);if(!due||!dueInWindow(due))return;
      const year=due.slice(0,4);const paid=typeof v12TaxPaidDate==='function'?v12TaxPaidDate(p,label,year):'';if(paid)return;
      const key=`property:${label}:${p.id}:${due}`,reviewed=!!db.reviewedAlerts[key];
      addAlert(box,{key,reviewed,text:`${esc(label)} de ${esc(p.name)} · ${euro(amount)} · vence el ${fmt(due)}`,onClick:()=>{db.reviewedAlerts[key]=true;localStorage.setItem(KEY,JSON.stringify(db));showProperty(p.id);renderHome()}});
    }));
    const legacyIds=new Set((db.profitExpenses||[]).map(x=>x.legacyFiscalId).filter(Boolean));
    (db.expenses||[]).filter(x=>x.expiry&&!legacyIds.has(x.id)&&dueInWindow(x.expiry)).forEach(x=>{
      const key=`expense:${x.id}:${x.expiry}`,reviewed=!!db.reviewedAlerts[key];
      addAlert(box,{key,reviewed,text:`${esc(x.category||'Gasto')} de ${esc(prop(x.propertyId)?.name||'Piso')} · ${euro(x.amount)} · vence el ${fmt(x.expiry)}`,onClick:()=>{db.reviewedAlerts[key]=true;localStorage.setItem(KEY,JSON.stringify(db));showFiscalExpense?showFiscalExpense(x.id):openExpense(x.id);renderHome()}});
    });
    (db.profitExpenses||[]).filter(x=>x.alert&&x.active!==false&&x.end&&dueInWindow(x.end)).forEach(x=>{
      const key=`profitExpense:${x.id}:${x.end}`,reviewed=!!db.reviewedAlerts[key];
      addAlert(box,{key,reviewed,text:`${esc(x.category||'Gasto')} · ${esc(x.concept)} · ${esc(prop(x.propertyId)?.name||'Piso')} · ${euro(x.amount)} · vence el ${fmt(x.end)}`,onClick:()=>{db.reviewedAlerts[key]=true;localStorage.setItem(KEY,JSON.stringify(db));showProfitExpense(x.id);renderHome()}});
    });
    if(!box.querySelector('.alert'))box.innerHTML='<div class="empty">Sin avisos</div>';
  }

  const profitBase=window.renderProfit;
  window.renderProfit=function(){const result=profitBase.apply(this,arguments);fixProfitTable();requestAnimationFrame(fixProfitTable);return result};
  renderProfit=window.renderProfit;
  const homeBase=window.renderHome;
  window.renderHome=function(){const result=homeBase.apply(this,arguments);rebuildTimedAlerts();return result};
  renderHome=window.renderHome;
  const allBase=window.renderAll||renderAll;
  window.renderAll=function(){const result=allBase.apply(this,arguments);installAlertSetting();reorderMenu();fixProfitTable();return result};
  renderAll=window.renderAll;

  const style=document.createElement('style');
  style.textContent=`#profitProperties .v14-table thead th{text-align:center!important}.mininos-month-input{display:flex;align-items:center;gap:7px}.mininos-month-input input{width:82px!important;margin:0!important}.mininos-month-input span{font-size:12px;color:var(--mut)}`;
  document.head.appendChild(style);
  const host=E('profitProperties');if(host)new MutationObserver(fixProfitTable).observe(host,{childList:true,subtree:true});
  document.querySelectorAll('.mininos-header-version').forEach(b=>b.textContent=VERSION);
  installAlertSetting();reorderMenu();fixProfitTable();renderHome();
})();
