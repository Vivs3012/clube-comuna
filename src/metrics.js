export const metricDefinitions = {
  orders: 'Pedidos válidos no escopo e período, segundo a definição da fonte corporativa.',
  cancellationRate: 'Pedidos cancelados / denominador definido pela fonte corporativa.',
  deliveryMean: 'Média dos tempos de entrega válidos.',
  deliveryP90: 'Percentil 90 dos tempos de entrega válidos.',
  lateRate: 'Entregas após o SLA aplicável / denominador definido pela fonte corporativa.'
};

export function summarize(rows) {
  const orders = rows.reduce((sum, r) => sum + r.orders, 0);
  const cancels = rows.reduce((sum, r) => sum + r.cancelled, 0);
  const delivered = rows.reduce((sum, r) => sum + r.delivered, 0);
  const late = rows.reduce((sum, r) => sum + r.late, 0);
  const weighted = key => delivered ? rows.reduce((sum, r) => sum + r[key] * r.delivered, 0) / delivered : 0;
  // Regional percentiles cannot be averaged to produce a valid city-level percentile.
  const deliveryP90 = rows.length === 1 ? rows[0].p90 : null;
  const cancelDenominator = rows.reduce((sum,r)=>sum+(r.cancellationDenominator ?? r.orders),0);
  const lateDenominator = rows.reduce((sum,r)=>sum+(r.lateDenominator ?? r.delivered),0);
  return { orders, cancels, delivered, late, cancelDenominator, lateDenominator, cancellationRate: cancelDenominator ? cancels / cancelDenominator : 0, deliveryMean: weighted('mean'), deliveryP90, lateRate: lateDenominator ? late / lateDenominator : 0 };
}

export function buildOpportunities(rows) {
  return rows.flatMap(r => {
    const out = [];
    if (r.cancelled / r.orders >= .12) out.push({ region:r.name, type:'Operacional', metric:'Cancelamentos', value:`${(100*r.cancelled/r.orders).toFixed(1)}%`, reference:'meta < 8%', priority:r.cancelled/r.orders >= .17?'Alta':'Média', reason:`${r.cancelled} cancelamentos em ${r.orders} pedidos analisados.`, action:'Investigar disponibilidade e motivos de cancelamento.' });
    if (r.late / r.delivered >= .2) out.push({ region:r.name, type:'Operacional', metric:'Atrasos', value:`${(100*r.late/r.delivered).toFixed(1)}%`, reference:'referência < 15%', priority:r.late/r.delivered >= .28?'Alta':'Média', reason:`${r.late} atrasos em ${r.delivered} entregas concluídas.`, action:'Revisar capacidade de entrega e SLA local.' });
    if (r.coverage < 65 && r.orders > 250) out.push({ region:r.name, type:'Cobertura', metric:'Cobertura estimada', value:`${r.coverage}%`, reference:'área atendida', priority:r.orders > 500?'Alta':'Média', reason:`Volume relevante (${r.orders} pedidos) e cobertura demonstrativa abaixo de 65%.`, action:'Validar disponibilidade e limites de cobertura com a operação.' });
    return out;
  });
}

// Relative outliers are clearly labelled because this export provides no
// corporate intervention thresholds. Suppress locations with small samples.
export function buildColombiaOpportunities(rows, referenceRows = rows) {
  const totals = summarize(referenceRows);
  const result = [];
  for (const row of rows) {
    if (row.orders < 100) continue;
    const cancelRate = (row.cancellationDenominator ? row.cancelled / row.cancellationDenominator : 0);
    const peerCancel = totals.cancellationRate;
    if (cancelRate > Math.max(peerCancel * 1.5, peerCancel + .02)) result.push({
      region:row.name,type:'Operacional',metric:'Cancelamentos',value:`${(cancelRate*100).toFixed(1)}%`,reference:`cidade ${(peerCancel*100).toFixed(1)}%`,priority:cancelRate>=peerCancel*2?'Alta':'Média',
      reason:`${row.cancelled} cancelamentos/expirações em ${row.cancellationDenominator} pedidos; acima da referência da cidade.`,action:'Investigar motivo, disponibilidade e fluxo da loja.'
    });
    const lateRate = row.lateDenominator ? row.late / row.lateDenominator : 0;
    const peerLate = totals.lateRate;
    if (lateRate > Math.max(peerLate * 1.5, peerLate + .02)) result.push({
      region:row.name,type:'Operacional',metric:'Atrasos (SLA 35 min)',value:`${(lateRate*100).toFixed(1)}%`,reference:`cidade ${(peerLate*100).toFixed(1)}%`,priority:lateRate>=peerLate*2?'Alta':'Média',
      reason:`${row.late} atrasos em ${row.lateDenominator} pedidos válidos; acima da referência da cidade.`,action:'Revisar capacidade e cumprimento do SLA de 35 minutos.'
    });
  }
  return result;
}
