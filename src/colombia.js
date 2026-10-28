import sourceUrl from './colombiaData.json?url';

export async function loadColombiaSource() {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Não foi possível carregar o export local (${response.status}).`);
  return response.json();
}

function windowStart(source, period) {
  const end = new Date(`${source.endDate}T00:00:00Z`);
  const days = period === 'Hoje' ? 1 : period === 'Últimos 30 dias' ? 30 : 7;
  end.setUTCDate(end.getUTCDate() - days + 1);
  return end.toISOString().slice(0, 10);
}

export function getColombiaView(source, {city, period, search = '', customStart = '', customEnd = ''}) {
  const start = period==='Personalizado'&&customStart?customStart:windowStart(source,period);
  const end = period==='Personalizado'&&customEnd?customEnd:source.endDate;
  const cityRows = source.daily.filter(r => r.city === city && r.date >= start && r.date <= end);
  const groups = new Map();
  for (const item of cityRows) {
    if (!groups.has(item.locationId)) groups.set(item.locationId, []);
    groups.get(item.locationId).push(item);
  }
  const rows = [...groups].map(([id, records]) => {
    const location = records.find(r => r.location)?.location || source.locations.find(l => l.locationId === id);
    const sum = key => records.reduce((n, r) => n + (r[key] || 0), 0);
    const deliveredForMean = sum('deliveryCount');
    const trend = records.filter(r => r.meanDelivery != null).sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({day:r.date.slice(5),value:r.meanDelivery}));
    const oneDay = records.length === 1;
    return {
      id, name: location?.label || `${city} · ${id.split(';').at(-2)}`,
      lat: location?.lat, lon: location?.lon, city,
      orders: sum('validOrders'), cancelled: sum('cancelledOrders'), cancellationDenominator: sum('totalOrders'),
      delivered: sum('deliveredOrders'), late: sum('lateOrders'), lateDenominator: sum('validOrders'),
      mean: deliveredForMean ? records.reduce((n,r)=>n+(r.meanDelivery||0)*(r.deliveryCount||0),0)/deliveredForMean : 0,
      p90: oneDay ? records[0].p90 : null, coverage: 0,
      activeStores: location?.activeStores || 0,
      coverageAreaCount: source.coverage.filter(f=>f.properties.locationId===id && f.properties.city===city).length,
      trend,
      cancellationReasons: source.cancellationReasons.filter(x=>x.city===city && x.locationId===id && x.date>=start && x.date<=end),
      dates: records.length,
    };
  }).filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lon))
    .filter(r => `${r.name} ${r.id}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  const daily = cityRows.reduce((m,r)=>{if(!m.has(r.date))m.set(r.date,[]);m.get(r.date).push(r);return m;},new Map());
  const history = [...daily].sort(([a],[b])=>a.localeCompare(b)).map(([day,records])=>{
    const total=(key)=>records.reduce((n,r)=>n+(r[key]||0),0);
    const deliveries=total('deliveryCount');
    return {day:day.slice(5),orders:total('validOrders'),cancel:total('totalOrders')?100*total('cancelledOrders')/total('totalOrders'):0,delivery:deliveries?records.reduce((n,r)=>n+(r.meanDelivery||0)*(r.deliveryCount||0),0)/deliveries:0};
  });
  const cityRowsAll = [...groups].map(([id,records])=>{
    const sum=key=>records.reduce((n,r)=>n+(r[key]||0),0); const deliveryCount=sum('deliveryCount');
    return {id,name:id,orders:sum('validOrders'),cancelled:sum('cancelledOrders'),cancellationDenominator:sum('totalOrders'),delivered:sum('deliveredOrders'),late:sum('lateOrders'),lateDenominator:sum('validOrders'),mean:deliveryCount?records.reduce((n,r)=>n+(r.meanDelivery||0)*(r.deliveryCount||0),0)/deliveryCount:0,p90:null};
  });
  return {
    rows, cityRows:cityRowsAll, daily:cityRows, history, startDate:start, endDate:end,
    coverage:source.coverage.filter(f=>f.properties.city===city),
  };
}

export function historyForLocations(daily, locationIds) {
  const included = new Set(locationIds);
  const byDate = new Map();
  for (const row of daily) {
    if (!included.has(row.locationId)) continue;
    if (!byDate.has(row.date)) byDate.set(row.date,[]);
    byDate.get(row.date).push(row);
  }
  return [...byDate].sort(([a],[b])=>a.localeCompare(b)).map(([day,records])=>{
    const total=key=>records.reduce((n,r)=>n+(r[key]||0),0);
    const deliveryCount=total('deliveryCount');
    return {day:day.slice(5),orders:total('validOrders'),cancel:total('totalOrders')?100*total('cancelledOrders')/total('totalOrders'):0,delivery:deliveryCount?records.reduce((n,r)=>n+(r.meanDelivery||0)*(r.deliveryCount||0),0)/deliveryCount:0};
  });
}

export function topReasons(rows, limit = 5) {
  const grouped = new Map();
  for (const row of rows) grouped.set(row.reason,(grouped.get(row.reason)||0)+row.count);
  return [...grouped].map(([reason,count])=>({reason,count})).sort((a,b)=>b.count-a.count).slice(0,limit);
}
