'use strict';
(()=>{
function oneSection(id){const all=[...document.querySelectorAll(`#${id}`)];if(all.length<2)return all[0]||null;const keep=all[0];all.slice(1).forEach(x=>x.remove());return keep}
function canonical(){oneSection('profit');oneSection('payments');oneSection('mortgages');window.MininosPages?.rentabilidad?.render?.();window.MininosPages?.cobros?.render?.();window.MininosPages?.hipotecas?.render?.();document.querySelectorAll('.app-select-menu,.filter-menu184,.v183-filter-menu,.payments-filter-menu').forEach(x=>x.remove())}
const base=window.renderAll;if(typeof base==='function')window.renderAll=function(){const r=base.apply(this,arguments);queueMicrotask(canonical);return r};
document.querySelectorAll('nav [data-tab]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(canonical)));
document.querySelector('nav [data-tab="fiscal"]')?.remove();document.getElementById('fiscal')?.setAttribute('hidden','');document.querySelectorAll('.mininos-header-version').forEach(x=>x.textContent='v186');document.title='Gestión Alquiler Mininos v186';canonical();setTimeout(canonical,0);setTimeout(canonical,250);if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=186',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
})();
