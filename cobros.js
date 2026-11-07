'use strict';
(()=>{
function render(){const p=E('paymentPropertyFilter'),m=E('paymentMonthFilter');if(!p||!m)return;[p,m].forEach(x=>{x.style.removeProperty('display');x.style.removeProperty('opacity');x.style.removeProperty('position');x.style.removeProperty('pointer-events');x.classList.remove('native184','v183-native','payments-native-filter');delete x.dataset.cobros181;delete x.dataset.cobros184;delete x.dataset.v183;let n=x.nextElementSibling;while(n&&(n.classList.contains('app-select')||n.classList.contains('filter184')||n.classList.contains('v183-filter-button')||n.classList.contains('payments-filter-btn'))){const z=n;n=n.nextElementSibling;z.remove()}});p.onchange=()=>renderPayments();m.onchange=()=>renderPayments()}
window.MininosPages=window.MininosPages||{};window.MininosPages.cobros={id:'payments',render};render();
})();
