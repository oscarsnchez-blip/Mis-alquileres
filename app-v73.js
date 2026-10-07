'use strict';
/* Cargador limpio de Gestión Alquiler Mininos v81 */
(() => {
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('./app-v77-core.js?v=81')
    .then(()=>load('./mininos-v78.js?v=81'))
    .then(()=>load('./mininos-v79-recibos.js?v=81'))
    .then(()=>load('./mininos-v80-archivo.js?v=81'))
    .then(()=>load('./mininos-v81-pisos.js?v=81'))
    .catch(error=>{console.error('No se pudo cargar Gestión Alquiler Mininos v81',error);alert('No se pudo cargar la aplicación. Comprueba que están subidos los seis archivos JavaScript.')});
})();
