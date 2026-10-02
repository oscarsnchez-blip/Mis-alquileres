'use strict';
/* Cargador limpio de Gestión Alquiler Mininos v77 */
(() => {
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('./app-v77-core.js?v=77').then(()=>load('./mininos-v77.js?v=77')).catch(error=>{console.error('No se pudo cargar Gestión Alquiler Mininos v77',error);alert('No se pudo cargar la aplicación. Revisa que los tres archivos JavaScript estén subidos.')});
})();
