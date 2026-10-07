'use strict';
/* Cargador estable de Gestión Alquiler Mininos v89 */
(() => {
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('./app-v77-core.js?v=89').then(()=>load('./mininos-v78.js?v=89')).then(()=>load('./mininos-v79-recibos.js?v=89')).then(()=>load('./mininos-v80-archivo.js?v=89')).then(()=>load('./mininos-v83-pisos.js?v=89')).then(()=>load('./mininos-v84-fix.js?v=89')).then(()=>load('./mininos-v86-correccion.js?v=89')).then(()=>load('./mininos-v89-ibi.js?v=89')).catch(error=>{console.error('No se pudo cargar Gestión Alquiler Mininos v89',error);alert('No se pudo cargar la aplicación. Comprueba que están subidos los nueve archivos JavaScript.')});
})();
