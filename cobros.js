/* Cobros v181: filtros compactos propios */
'use strict';
(()=>{
  function closeMenus(except){document.querySelectorAll('.app-select-menu').forEach(m=>{if(m!==except)m.hidden=true})}
  function selectControl(select){
    if(!select||select.dataset.cobros181==='1')return;
    select.dataset.cobros181='1';select.style.setProperty('display','none','important');
    const box=document.createElement('div'),button=document.createElement('button'),menu=document.createElement('div');
    box.className='app-select cobros181-select';button.type='button';button.className='app-select-btn';menu.className='app-select-menu';menu.hidden=true;
    select.after(box);box.append(button,menu);
    const paint=()=>{button.innerHTML=`<span>${esc(select.selectedOptions[0]?.textContent||'')}</span><i>⌄</i>`;menu.innerHTML=[...select.options].map((o,i)=>`<button type="button" data-i="${i}" class="${i===select.selectedIndex?'on':''}"><span>${esc(o.textContent)}</span>${i===select.selectedIndex?'<b>✓</b>':''}</button>`).join('');menu.querySelectorAll('[data-i]').forEach(item=>item.onclick=e=>{e.preventDefault();select.selectedIndex=+item.dataset.i;menu.hidden=true;paint();select.dispatchEvent(new Event('change',{bubbles:true}))})};
    button.onclick=e=>{e.preventDefault();e.stopPropagation();const open=menu.hidden;closeMenus(menu);menu.hidden=!open};select.addEventListener('change',paint);paint();
  }
  function monthControl(input){
    if(!input||input.dataset.cobros181==='1')return;input.dataset.cobros181='1';input.style.setProperty('display','none','important');
    const box=document.createElement('div'),button=document.createElement('button'),menu=document.createElement('div');box.className='app-select cobros181-month';button.type='button';button.className='app-select-btn';menu.className='app-select-menu cobros181-month-menu';menu.hidden=true;input.after(box);box.append(button,menu);
    const label=v=>v?new Date(v+'-01T12:00:00').toLocaleDateString('es-ES',{month:'long',year:'numeric'}):'Seleccionar mes';
    const paint=()=>{const now=new Date(),center=input.value?new Date(input.value+'-01T12:00:00'):now,items=[];for(let i=-18;i<=18;i++){const d=new Date(center.getFullYear(),center.getMonth()+i,1),v=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;items.push([v,label(v)])}button.innerHTML=`<span>${label(input.value)}</span><i>⌄</i>`;menu.innerHTML=items.map(([v,t])=>`<button type="button" data-v="${v}" class="${v===input.value?'on':''}"><span>${t}</span>${v===input.value?'<b>✓</b>':''}</button>`).join('');menu.querySelectorAll('[data-v]').forEach(item=>item.onclick=e=>{e.preventDefault();input.value=item.dataset.v;menu.hidden=true;paint();input.dispatchEvent(new Event('change',{bubbles:true}))})};
    button.onclick=e=>{e.preventDefault();e.stopPropagation();const open=menu.hidden;closeMenus(menu);menu.hidden=!open};input.addEventListener('change',paint);paint();
  }
  function upgrade(){selectControl(E('paymentPropertyFilter'));monthControl(E('paymentMonthFilter'))}
  document.addEventListener('click',()=>closeMenus());window.addEventListener('resize',()=>closeMenus());
  window.MininosPages=window.MininosPages||{};window.MininosPages.cobros={id:'payments',render:upgrade};
  addEventListener('load',()=>{upgrade();new MutationObserver(upgrade).observe(E('payments'),{childList:true,subtree:true})},{once:true});
})();
