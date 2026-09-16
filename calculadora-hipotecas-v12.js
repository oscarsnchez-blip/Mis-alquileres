/* Gestion Alquiler Mininos V12 - Calculadora de amortizacion extraordinaria */
(() => {
  'use strict';

  function calcPayment(principal, rateMonthly, months) {
    if (principal <= 0 || months <= 0) return 0;
    return rateMonthly ? principal * rateMonthly * Math.pow(1 + rateMonthly, months) / (Math.pow(1 + rateMonthly, months) - 1) : principal / months;
  }

  function schedule(principal, annualRate, months, payment) {
    const r = annualRate / 1200;
    let balance = Math.max(0, principal), interest = 0, count = 0;
    while (balance > 0.005 && count < Math.max(months + 120, 1200)) {
      const i = balance * r;
      let capital = Math.max(0, payment - i);
      if (capital <= 0) return { interest: Infinity, months: Infinity, payment };
      capital = Math.min(balance, capital);
      balance -= capital;
      interest += i;
      count++;
    }
    return { interest, months: count, payment };
  }

  function mortgageScenario(m, extra, mode) {
    const principal = balanceAt(m), months = Math.max(1, remainingMonths(m));
    const r = (+m.rate || 0) / 1200;
    const normalPayment = calcPayment(principal, r, months);
    const normal = schedule(principal, +m.rate || 0, months, normalPayment);
    const applied = Math.min(Math.max(0, extra), principal);
    const after = Math.max(0, principal - applied);
    if (!after) return { principal, applied, after, oldPayment: normalPayment, newPayment: 0, oldMonths: normal.months, newMonths: 0, savedMonths: normal.months, savedInterest: normal.interest };
    if (mode === 'payment') {
      const newPayment = calcPayment(after, r, months);
      const reduced = schedule(after, +m.rate || 0, months, newPayment);
      return { principal, applied, after, oldPayment: normalPayment, newPayment, oldMonths: normal.months, newMonths: reduced.months, savedMonths: 0, savedInterest: Math.max(0, normal.interest - reduced.interest) };
    }
    const reduced = schedule(after, +m.rate || 0, months, normalPayment);
    return { principal, applied, after, oldPayment: normalPayment, newPayment: normalPayment, oldMonths: normal.months, newMonths: reduced.months, savedMonths: Math.max(0, normal.months - reduced.months), savedInterest: Math.max(0, normal.interest - reduced.interest) };
  }

  function timeLabel(months) {
    if (!Number.isFinite(months)) return 'No calculable';
    const y = Math.floor(months / 12), m = months % 12;
    return [y ? y + ' años' : '', m ? m + ' meses' : ''].filter(Boolean).join(' y ') || '0 meses';
  }

  function ensureCalculator() {
    const section = E('future');
    if (!section || E('mortgageCalculator')) return;
    const card = document.createElement('div');
    card.id = 'mortgageCalculator';
    card.className = 'card';
    card.innerHTML = `
      <h3>Calculadora de amortización de hipoteca</h3>
      <p class="muted">Simula una aportación extraordinaria y compara el ahorro en intereses y tiempo.</p>
      <div class="plan-controls">
        <div><label>Importe a amortizar (€)</label><input id="calcExtra" type="number" min="0" step="100" value="10000"></div>
        <div><label>Resultado deseado</label><select id="calcMode"><option value="term">Reducir plazo manteniendo cuota</option><option value="payment">Reducir cuota manteniendo plazo</option></select></div>
        <div><label>Hipoteca</label><select id="calcMortgage"></select></div>
      </div>
      <div class="actions" style="justify-content:flex-start;flex-wrap:wrap"><button id="runMortgageCalc">Calcular</button><button id="compareMortgages" class="secondary">Comparar todas</button></div>
      <div id="mortgageCalcResult" style="margin-top:12px"></div>`;
    const planIntro = section.querySelector('.card');
    if (planIntro) planIntro.insertAdjacentElement('afterend', card); else section.appendChild(card);
    E('runMortgageCalc').onclick = renderMortgageCalculation;
    E('compareMortgages').onclick = renderMortgageComparison;
    E('calcExtra').oninput = () => { if (E('mortgageCalcResult').dataset.mode === 'single') renderMortgageCalculation(); };
    E('calcMode').onchange = renderMortgageCalculation;
  }

  function refreshCalculatorOptions() {
    ensureCalculator();
    const sel = E('calcMortgage');
    if (!sel) return;
    const old = sel.value;
    sel.innerHTML = db.mortgages.map(m => `<option value="${esc(m.id)}">${esc(prop(m.propertyId)?.name || 'Vivienda')} · ${esc(m.bank)}</option>`).join('');
    if (db.mortgages.some(m => m.id === old)) sel.value = old;
    E('runMortgageCalc').disabled = !db.mortgages.length;
    E('compareMortgages').disabled = !db.mortgages.length;
    if (!db.mortgages.length) E('mortgageCalcResult').innerHTML = '<div class="empty">Añade una hipoteca para utilizar la calculadora.</div>';
  }

  function renderMortgageCalculation() {
    const m = db.mortgages.find(x => x.id === E('calcMortgage').value);
    if (!m) return;
    const extra = +E('calcExtra').value || 0, mode = E('calcMode').value, s = mortgageScenario(m, extra, mode);
    const specific = mode === 'payment'
      ? `${detailCell('Cuota actual estimada', euro(s.oldPayment))}${detailCell('Nueva cuota estimada', euro(s.newPayment))}${detailCell('Reducción mensual', euro(Math.max(0, s.oldPayment - s.newPayment)))}`
      : `${detailCell('Plazo actual restante', timeLabel(s.oldMonths))}${detailCell('Nuevo plazo estimado', timeLabel(s.newMonths))}${detailCell('Tiempo ahorrado', timeLabel(s.savedMonths))}`;
    E('mortgageCalcResult').dataset.mode = 'single';
    E('mortgageCalcResult').innerHTML = `<div class="detail-grid">${detailCell('Capital pendiente', euro(s.principal))}${detailCell('Amortización aplicada', euro(s.applied))}${detailCell('Capital tras amortizar', euro(s.after))}${detailCell('Intereses estimados ahorrados', euro(s.savedInterest))}${specific}</div><p class="muted">Estimación orientativa con el tipo actual registrado, sin comisiones, seguros, revisiones futuras del tipo ni otros costes bancarios.</p>`;
  }

  function renderMortgageComparison() {
    const extra = +E('calcExtra').value || 0;
    const rows = db.mortgages.map(m => ({ m, s: mortgageScenario(m, extra, 'term') })).sort((a, b) => b.s.savedInterest - a.s.savedInterest);
    E('mortgageCalcResult').dataset.mode = 'compare';
    E('mortgageCalcResult').innerHTML = rows.length ? `<div class="scroll"><table><thead><tr><th>Hipoteca</th><th>Capital pendiente</th><th>Amortización</th><th>Intereses ahorrados</th><th>Tiempo ahorrado</th></tr></thead><tbody>${rows.map((x, i) => `<tr><td>${i === 0 ? '★ ' : ''}${esc(prop(x.m.propertyId)?.name || 'Vivienda')} · ${esc(x.m.bank)}</td><td>${euro(x.s.principal)}</td><td>${euro(x.s.applied)}</td><td class="positive"><b>${euro(x.s.savedInterest)}</b></td><td>${timeLabel(x.s.savedMonths)}</td></tr>`).join('')}</tbody></table></div><p class="muted">La primera fila es la que produce el mayor ahorro estimado en intereses para el importe indicado, reduciendo plazo y manteniendo cuota.</p>` : '<div class="empty">No hay hipotecas.</div>';
  }

  const baseRenderFuture = renderFuture;
  renderFuture = function () {
    baseRenderFuture();
    refreshCalculatorOptions();
  };

  ensureCalculator();
  refreshCalculatorOptions();
  if (db.mortgages.length) renderMortgageCalculation();
})();
