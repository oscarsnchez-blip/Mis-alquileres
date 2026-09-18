/* Mininos: correccion de periodos de rentabilidad.
   Cargar DESPUES de app.js. */
(() => {
  'use strict';

  function ym(date) {
    return String(date || '').slice(0, 7);
  }

  function monthsInRange(start, end, year, month) {
    const periodStart = month === 'all' ? `${year}-01` : `${year}-${month}`;
    const periodEnd = month === 'all' ? `${year}-12` : `${year}-${month}`;
    const first = start && start > periodStart ? start : periodStart;
    const last = end && end < periodEnd ? end : periodEnd;
    if (first > last) return 0;
    const [fy, fm] = first.split('-').map(Number);
    const [ly, lm] = last.split('-').map(Number);
    return (ly - fy) * 12 + lm - fm + 1;
  }

  function contractForecastForPeriod(contract, year, month) {
    const months = monthsInRange(ym(contract.start), ym(contract.end), year, month);
    return (Number(contract.rent) || 0) * months;
  }

  function fixedCostsForPeriod(property, year, month) {
    const months = monthsInRange(ym(property.purchaseDate), '', year, month);
    if (!months) return 0;
    const community = (Number(property.community) || 0) * months;
    const annualShare = months / 12;
    const ibi = (Number(property.ibi) || 0) * annualShare;
    const waste = (Number(property.wasteTax) || 0) * annualShare;
    return community + ibi + waste;
  }

  const previousProfitData = window.profitData || profitData;
  const correctedProfitData = function () {
    const d = previousProfitData();
    d.rows.forEach(row => {
      const contracts = db.contracts.filter(c => c.propertyId === row.p.id);
      const correctedIncome = contracts.reduce(
        (sum, contract) => sum + contractForecastForPeriod(contract, d.year, d.month),
        0
      );
      const extraIncome = (db.profitIncomes || [])
        .filter(x => x.propertyId === row.p.id)
        .reduce((sum, x) => sum + paFreqValue(x, d.year, d.month), 0);
      const correctedFixed = fixedCostsForPeriod(row.p, d.year, d.month);

      row.income = correctedIncome + extraIncome;
      row.fixed = correctedFixed;
      row.profit = row.income - row.fixed - row.manual - row.mortgages;
    });
    return d;
  };

  try { profitData = correctedProfitData; } catch (_) {}
  window.profitData = correctedProfitData;

  if (typeof renderProfit === 'function') renderProfit();
})();
