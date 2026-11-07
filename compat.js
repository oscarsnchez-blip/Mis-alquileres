'use strict';
/* Compatibility DOM required by the stable v179 core. It is never exposed in navigation. */
(()=>{const main=document.querySelector('main.wrap');if(!main||document.getElementById('fiscal'))return;const s=document.createElement('section');s.id='fiscal';s.hidden=true;s.setAttribute('aria-hidden','true');s.innerHTML='<select id="fiscalYearFilter"></select><select id="fiscalPropertyFilter"></select><button id="addFiscal" type="button"></button><div id="fiscalSummary"></div><div id="fiscalList"></div>';main.appendChild(s)})();
