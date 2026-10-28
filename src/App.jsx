import React, {useMemo, useState} from 'react';
import {MapContainer, TileLayer, CircleMarker, GeoJSON, Tooltip, useMap} from 'react-leaflet';
import {Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Layers3, MapPin, Maximize2, RefreshCw, Search, SlidersHorizontal, Store, TrendingUp, Truck, X} from 'lucide-react';
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis} from 'recharts';
import {getColombiaView, historyForLocations, loadColombiaSource, topReasons} from './colombia.js';
import {buildColombiaOpportunities, summarize} from './metrics.js';

const layers = [
  {id:'orders',label:'Demanda',unit:'pedidos',color:'#50c8a0'},
  {id:'cancel',label:'Cancelamentos',unit:'taxa',color:'#f07864'},
  {id:'delivery',label:'Tempo de entrega',unit:'min',color:'#eab96d'},
  {id:'late',label:'Atrasos',unit:'taxa',color:'#bb88ff'},
  {id:'coverage',label:'Cobertura',unit:'%',color:'#61a9e9'},
  {id:'expansion',label:'Expansão',unit:'potencial',color:'#93cf69'}
];
const fmt = n => new Intl.NumberFormat('pt-BR').format(n);
const pct = n => `${(n*100).toFixed(1).replace('.',',')}%`;
const emptyColombiaView={rows:[],cityRows:[],daily:[],history:[],coverage:[],startDate:'',endDate:''};
function valueFor(r, layer){return layer==='orders'?r.orders:layer==='cancel'?r.cancelled/(r.cancellationDenominator||r.orders):layer==='delivery'?r.mean:layer==='late'?r.late/(r.lateDenominator||r.delivered):layer==='coverage'?r.coverageAreaCount??r.coverage:r.expansionAvailable? r.expansionPotential:0;}
function layerValue(r, layer, isColombia=false){const v=valueFor(r,layer);return layer==='orders'?fmt(v):layer==='delivery'?`${v.toFixed?.(0)??v} min`:layer==='coverage'?isColombia?`${v} áreas`:`${v}%`:layer==='expansion'?isColombia?'Sem evidência disponível':`${Math.round(v)} potencial`:pct(v);}
function MapZoom({center,zoom}){const map=useMap();React.useEffect(()=>{map.setView(center,zoom);setTimeout(()=>map.invalidateSize(),100)},[map,center[0],center[1],zoom]);return null;}

function App(){
  const [layer,setLayer]=useState('orders'); const [region,setRegion]=useState(null); const [period,setPeriod]=useState('Últimos 7 dias');
  const country='Colombia'; const [city,setCity]=useState(''); const [search,setSearch]=useState(''); const [status,setStatus]=useState('Todos os status'); const [customStart,setCustomStart]=useState(''); const [customEnd,setCustomEnd]=useState('');
  const [colombiaSource,setColombiaSource]=useState(null); const [sourceError,setSourceError]=useState('');
  const [showFilters,setShowFilters]=useState(true);
  const isColombia=true;
  const cities=colombiaSource?.cities||[];
  React.useEffect(()=>{loadColombiaSource().then(setColombiaSource).catch(e=>setSourceError(e.message));},[]);
  React.useEffect(()=>{if(colombiaSource?.cities?.length&&!colombiaSource.cities.includes(city))setCity(colombiaSource.cities[0]);},[colombiaSource,city]);
  const activeLayer=layers.find(x=>x.id===layer);
  const dataView=useMemo(()=>isColombia&&colombiaSource&&city?getColombiaView(colombiaSource,{city,period,search,customStart,customEnd}):emptyColombiaView,[isColombia,colombiaSource,city,period,search,customStart,customEnd]);
  const sourceRows=dataView?.rows||[];
  const referenceRows=dataView?.cityRows||[];
  const allOpportunities=useMemo(()=>buildColombiaOpportunities(sourceRows,referenceRows),[sourceRows,referenceRows]);
  const alertNames=new Set(allOpportunities.map(o=>o.region));
  const rows=sourceRows.filter(r=>status==='Todos os status'||(status==='Com alertas'?alertNames.has(r.name):!alertNames.has(r.name)));
  const totals=useMemo(()=>summarize(rows),[rows]); const opportunities=useMemo(()=>buildColombiaOpportunities(rows,referenceRows),[rows,referenceRows]);
  const selected=rows.find(r=>r.id===region) || null;
  const baselines=summarize(referenceRows);
  const colorFor=r=> {const v=valueFor(r,layer); if(layer==='orders') return v>(isColombia?1500:1300)?'#f07864':v>(isColombia?800:900)?'#eab96d':'#50c8a0'; if(layer==='cancel'){const baseline=isColombia?baselines.cancellationRate:.09;return v>Math.max(isColombia?baseline+.02:.14,baseline*1.5)?'#f07864':v>baseline?'#eab96d':'#50c8a0';} if(layer==='delivery'){const baseline=baselines.deliveryMean||0;return isColombia?(v>baseline*1.5?'#f07864':v>baseline?'#eab96d':'#50c8a0'):v>42?'#f07864':v>35?'#eab96d':'#50c8a0';} if(layer==='late'){const baseline=isColombia?baselines.lateRate:.17;return v>Math.max(isColombia?baseline+.02:.25,baseline*1.5)?'#f07864':v>baseline?'#eab96d':'#50c8a0';} if(layer==='coverage') return isColombia?(v?'#61a9e9':'#72818b'):v<65?'#f07864':v<80?'#eab96d':'#50c8a0'; return isColombia?'#72818b':r.orders>700&&r.coverage<70?'#50c8a0':r.orders>500?'#eab96d':'#72818b';};
  const radiusFor=r=> layer==='orders'?Math.min(26,10+r.orders/100):layer==='expansion'?12:12+Math.min(12,valueFor(r,layer)*30);
  const mapPoints=rows.filter(r=>Number.isFinite(r.lat)&&Number.isFinite(r.lon));
  const center=mapPoints.length?[mapPoints.reduce((a,r)=>a+r.lat,0)/mapPoints.length,mapPoints.reduce((a,r)=>a+r.lon,0)/mapPoints.length]:[10.98,-74.8];
  const chartHistory=historyForLocations(dataView.daily,rows.map(r=>r.id));
  const visibleLocationIds=new Set(rows.map(r=>r.id));
  const mapCoverage=dataView.coverage.filter(f=>visibleLocationIds.has(f.properties.locationId));
  const attentionItems=opportunities.slice(0,3).map(o=>({opportunity:o,row:rows.find(r=>r.name===o.region)})).filter(x=>x.row);
  const dateLabel=dataView.startDate?`${dataView.startDate} a ${dataView.endDate}`:period.toLowerCase();
  const insightText=opportunities[0]?`${opportunities[0].region} apresenta ${opportunities[0].metric.toLowerCase()} acima da referência da cidade. ${opportunities[0].reason}`:`Nenhum local se destaca acima da referência relativa da cidade neste período.`;
  const kpis=[
    {label:'Pedidos',value:fmt(totals.orders),sub:'no período selecionado',icon:ShoppingBagIcon,change:'export Genie',up:null},
    {label:'Taxa de cancelamento',value:pct(totals.cancellationRate),sub:`${fmt(totals.cancels)} de ${fmt(totals.cancelDenominator)} pedidos`,icon:AlertTriangle,change:'sem comparação',up:null},
    {label:'Tempo médio',value:`${Math.round(totals.deliveryMean)} min`,sub:'entregas concluídas',icon:Clock3,change:'sem comparação',up:null},
    {label:'P90 de entrega',value:totals.deliveryP90==null?'—':`${Math.round(totals.deliveryP90)} min`,sub:totals.deliveryP90==null?'indisponível para a cidade':'90% das entregas',icon:Activity,change:totals.deliveryP90==null?'agregado ausente':'sem comparação',up:null},
    {label:'Pedidos atrasados',value:pct(totals.lateRate),sub:`${fmt(totals.late)} de ${fmt(totals.lateDenominator)} pedidos`,icon:Truck,change:'SLA 35 min',up:null},
    {label:'Regiões em atenção',value:String(new Set(opportunities.map(o=>o.region)).size).padStart(2,'0'),sub:'com oportunidade identificada',icon:MapPin,change:'desvio relativo',up:null}
  ];
  function clearFilters(){setSearch('');setCity(colombiaSource?.cities?.[0]||'');setPeriod('Últimos 7 dias');setStatus('Todos os status');setCustomStart('');setCustomEnd('');setRegion(null);}
  function updateData(){setSourceError('');loadColombiaSource().then(setColombiaSource).catch(e=>setSourceError(e.message));}
  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><MapPin size={19}/></span><span className="brand-copy"><b>TaDa<span> / </span>Mapa de Oportunidade</b><small>INTELIGÊNCIA OPERACIONAL</small></span></a>
      <div className="header-context"><div className="context-item"><span className="context-icon"><MapPin size={15}/></span><div><small>OPERAÇÃO</small><b>{country} <i>/</i> {city}</b></div><ChevronDown size={14}/></div><div className="context-divider"/><div className="context-item period-item"><CalendarDays size={16}/><div><small>PERÍODO ANALISADO</small><b>{period}</b></div><ChevronDown size={14}/></div></div>
      <div className="header-right"><span className={isColombia?'demo-pill genie-pill':'demo-pill'}><span/> {isColombia?'GENIE CSV':'DEMONSTRAÇÃO'}</span><button className="icon-button" title="Notificações"><Bell size={17}/><em/></button><div className="avatar">OP</div></div>
    </header>
    <section className="workspace">
      {showFilters&&<aside className="filter-rail"><div className="rail-title"><span>FILTROS</span><button onClick={()=>setShowFilters(false)} aria-label="Fechar filtros"><X size={15}/></button></div>
        <label className="field-label">PAÍS</label><div className="select-field"><span>🇨🇴 Colômbia · Genie CSV</span></div>
        <label className="field-label">CIDADE / OPERAÇÃO</label><select className="select-field native-select" value={city} onChange={e=>{setCity(e.target.value);setRegion(null)}}>{cities.map(c=><option key={c}>{c}</option>)}</select>
        <label className="field-label">REGIÃO OU BAIRRO</label><div className="search-field"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={isColombia?'Buscar local de loja...':'Buscar região...'} aria-label="Buscar região"/><kbd>⌘ K</kbd></div>
        <label className="field-label">PERÍODO</label><div className="period-options">{['Hoje','Últimos 7 dias','Últimos 30 dias','Personalizado'].map(p=><button key={p} className={period===p?'selected':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
        {period==='Personalizado'&&isColombia&&colombiaSource&&<div className="custom-range"><label>DE<input type="date" min={colombiaSource.startDate} max={customEnd||colombiaSource.endDate} value={customStart||dataView.startDate} onChange={e=>setCustomStart(e.target.value)}/></label><label>ATÉ<input type="date" min={customStart||colombiaSource.startDate} max={colombiaSource.endDate} value={customEnd||dataView.endDate} onChange={e=>setCustomEnd(e.target.value)}/></label></div>}
        <label className="field-label">STATUS OPERACIONAL</label><button className="select-field" onClick={()=>setStatus(status==='Todos os status'?'Com alertas':status==='Com alertas'?'Em operação':'Todos os status')}><span>{status}</span><ChevronDown size={14}/></button>
        <div className="rail-separator"/><div className="layer-heading"><span>CAMADA DO MAPA</span><CircleHelp size={14}/></div>
        <div className="layer-options">{layers.map(l=><button key={l.id} onClick={()=>setLayer(l.id)} className={layer===l.id?'layer-active':''}><span className="layer-dot" style={{background:l.color}}/><span>{l.label}</span>{layer===l.id&&<Check size={14}/>}</button>)}</div>
        <button className="clear-button" onClick={clearFilters}><RefreshCw size={14}/> Limpar filtros</button>
        <div className="rail-bottom"><span className="live-dot"/>Fonte de dados ativa <span className="help-link">?</span></div>
      </aside>}
      <section className="main-panel">
        <div className="page-heading"><div><div className="eyebrow">VISÃO GERAL <span>•</span> OPERAÇÃO {isColombia?'COLÔMBIA':'BRASIL'}</div><h1>Mapa de Oportunidade</h1><p>Encontre onde agir. Entenda o que está acontecendo.</p></div><div className="heading-actions"><button className="secondary-button" onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={15}/> Filtros</button><button className="secondary-button" onClick={updateData}><RefreshCw size={15}/> Atualizar</button><div className="last-updated"><span className="live-dot"/><span>{isColombia?'Exportado até':'Atualizado'}<br/><b>{isColombia?(colombiaSource?.endDate||'carregando'):updated}</b></span></div></div></div>
        <div className={isColombia?'demo-notice genie-notice':'demo-notice'}><span className="notice-icon">i</span><span>{isColombia?<><b>{sourceError?'Falha ao carregar export':colombiaSource?'Export do Databricks Genie':'Carregando export local'}</b> — {sourceError|| (colombiaSource?`métricas agregadas de ${colombiaSource.startDate} a ${colombiaSource.endDate}. CSV local; sem conexão ao vivo.`:'aguarde enquanto os dados são lidos.')}</>:<><b>Modo demonstração</b> — dados sintéticos para visualização. A conexão com Databricks Genie ainda não está configurada.</>}</span><button onClick={()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}>Sobre os dados <span>→</span></button></div>
        <div className="kpi-grid">{kpis.map(k=><Kpi key={k.label} {...k}/>)}</div>
        <div className="analysis-grid">
          <section className="map-card"><div className="card-heading"><div><h2>Visão geográfica</h2><p>Distribuição por local de loja · {isColombia?dateLabel:period.toLowerCase()}</p></div><button className="expand-button" title="Expandir mapa"><Maximize2 size={15}/></button></div>
            <div className="map-frame"><MapContainer key={`${country}-${city}`} center={center} zoom={isColombia?11:12} scrollWheelZoom zoomControl={true} className="leaflet-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MapZoom center={center} zoom={isColombia?11:12}/>{isColombia&&layer==='coverage'&&<GeoJSON data={{type:'FeatureCollection',features:mapCoverage}} style={()=>({color:'#61a9e9',weight:1,fillColor:'#61a9e9',fillOpacity:.18})} eventHandlers={{click:e=>{const id=e.layer?.feature?.properties?.locationId;if(id)setRegion(id);}}}/>}{mapPoints.map(r=><CircleMarker key={r.id} center={[r.lat,r.lon]} radius={radiusFor(r)} pathOptions={{color:colorFor(r),fillColor:colorFor(r),fillOpacity:.56,weight:selected?.id===r.id?3:1.4}} eventHandlers={{click:()=>setRegion(r.id)}}><Tooltip direction="top" offset={[0,-8]}><div className="map-tooltip"><b>{r.name}</b><span>{activeLayer.label}: <strong>{layerValue(r,layer,isColombia)}</strong></span><small>{fmt(r.orders)} pedidos válidos no período</small></div></Tooltip></CircleMarker>)}</MapContainer>
              <div className="map-overlay-label"><span className="map-live-dot"/> MAPA DE CALOR <span>·</span> {activeLayer.label.toUpperCase()}</div>
              <div className="map-legend"><b>{activeLayer.label}</b><div className={`legend-gradient ${isColombia&&layer==='coverage'?'coverage-gradient':''}`}/><div className="legend-labels"><span>{isColombia&&layer==='coverage'?'Sem área':layer==='coverage'?'Menor':layer==='orders'?'Menos':'Melhor'}</span><span>{isColombia&&layer==='coverage'?'Área ativa':layer==='coverage'?'Maior':layer==='orders'?'Mais':'Atenção'}</span></div><div className="legend-no-data"><i/> {isColombia&&layer==='expansion'?'Sem evidência':'Sem dados'}</div></div>
              {selected&&<div className="selected-chip"><MapPin size={13}/>{selected.name}<button onClick={()=>setRegion(null)}><X size={13}/></button></div>}
            </div>
            <div className="map-footer"><span><b>{mapPoints.length}</b> locais visíveis</span><span><i className="map-live-dot"/> {isColombia?'Agregação por local de loja':'Dados sintéticos agregados'}</span><span>Fonte cartográfica: OpenStreetMap</span></div>
          </section>
          <section className="side-stack"><div className="chart-card"><div className="card-heading"><div><h2>Ritmo da operação</h2><p>Tempo médio de entrega · minutos</p></div><button className="dots-button">···</button></div><div className="chart-summary"><b>{Math.round(totals.deliveryMean)} <small>min</small></b><span className={isColombia?'trend-neutral':'trend-bad'}>{isColombia?'SLA 35 min':<><ArrowUpRight size={14}/> 2 min <small>vs. anterior</small></>}</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartHistory} margin={{top:12,right:4,left:-28,bottom:0}}><defs><linearGradient id="deliveryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#66d4ae" stopOpacity={.22}/><stop offset="100%" stopColor="#66d4ae" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#263541" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" tick={{fill:'#81919b',fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#81919b',fontSize:10}} axisLine={false} tickLine={false}/><ChartTooltip contentStyle={{background:'#15212c',border:'1px solid #2a3945',borderRadius:8,color:'#fff'}}/><Area type="monotone" dataKey="delivery" stroke="#66d4ae" strokeWidth={2} fill="url(#deliveryFill)"/></AreaChart></ResponsiveContainer></div><div className="chart-foot"><span><i className="chart-key"/> Tempo médio</span><span>{isColombia?'Série diária do export':'Série demonstrativa'}</span></div></div>
            <div className="attention-card"><div className="attention-head"><span className="attention-icon"><AlertTriangle size={15}/></span><div><h3>Precisa de atenção</h3><p>{isColombia?'Acima da referência da cidade':'Regiões com indicadores críticos'}</p></div><span className="attention-count">{new Set(opportunities.map(o=>o.region)).size}</span></div>{attentionItems.map(({opportunity:o,row:r})=><button className="attention-row" key={o.region+o.metric} onClick={()=>setRegion(r.id)}><span className="attention-region"><i/>{r.name}</span><span>{o.metric}</span><b>{o.value}</b><ArrowUpRight size={14}/></button>)}{attentionItems.length===0&&<div className="empty-state">Sem alertas relativos neste período.</div>}<button className="all-opps" onClick={()=>document.getElementById('opportunities')?.scrollIntoView({behavior:'smooth'})}>Ver todas as oportunidades <span>→</span></button></div>
          </section>
        </div>
        <div className="lower-grid" id="opportunities"><section className="opportunities-card"><div className="section-heading"><div><div className="eyebrow">AÇÃO RECOMENDADA</div><h2>Oportunidades prioritárias <span className="count-badge">{opportunities.length}</span></h2><p>{isColombia?'Desvios relativos à média da cidade; sem meta corporativa informada.':'Sinais para ajudar sua equipe a decidir onde agir primeiro.'}</p></div><button className="view-all">Ver todas <span>→</span></button></div><div className="opportunity-table"><div className="table-head"><span>REGIÃO</span><span>OPORTUNIDADE</span><span>INDICADOR</span><span>VALOR / REFERÊNCIA</span><span>PRIORIDADE</span><span/></div>{opportunities.slice(0,5).map((o,i)=><div className="table-row" key={o.region+o.type+i} onClick={()=>setRegion(rows.find(r=>r.name===o.region)?.id)} title={o.reason}><b className="region-name"><span className="table-pin"><MapPin size={13}/></span>{o.region}</b><span><i className={`type-tag ${o.type.toLowerCase()}`}>{o.type}</i></span><span>{o.metric}</span><span><b>{o.value}</b><small> {o.reference}</small></span><span><i className={`priority ${o.priority.toLowerCase()}`}>{o.priority}</i></span><span className="row-arrow">→</span></div>)}{opportunities.length===0&&<div className="empty-state">Nenhuma oportunidade para os filtros selecionados.</div>}</div><div className="opportunity-note"><CircleHelp size={14}/>{isColombia?'Comparação relativa à cidade, com mínimo de 100 pedidos válidos por local. Ação sugerida é investigativa; sem estimativa de impacto.':'Prioridades baseadas em limites demonstrativos. Confira as justificativas antes de agir.'}</div></section>
          <section className="insight-card"><div className="insight-header"><span className="insight-spark"><TrendingUp size={16}/></span><div><span className="eyebrow">{isColombia?'DADO DO PERÍODO':'INSIGHT DA SEMANA'}</span><h3>Onde a operação pode melhorar</h3></div></div><p>{insightText}</p><div className="insight-metric"><span>{isColombia?'Locais acima da referência':'Diferença entre regiões'}</span><b>{isColombia?new Set(opportunities.map(o=>o.region)).size:'16 min'}</b></div><button onClick={()=>setLayer('late')}>Explorar atrasos no mapa <span>→</span></button></section></div>
        <footer className="page-footer"><span>TaDa Delivery <i>·</i> Mapa de Oportunidade</span><span><span className="live-dot"/> {isColombia?'Export Genie · '+(colombiaSource?.endDate||'carregando'):'Dados de demonstração · Última atualização '+updated}</span><a href="./README.md">Documentação</a></footer>
      </section>
      {selected&&<RegionDrawer region={selected} onClose={()=>setRegion(null)} city={city} country={country} cityTotals={baselines} isColombia={isColombia} dateLabel={dateLabel}/>}
    </section>
  </main>;
}
function ShoppingBagIcon(props){return <Store {...props}/>}
function Kpi({label,value,sub,icon:Icon,change,up}){return <article className="kpi-card"><div className="kpi-top"><span>{label}</span><Icon size={16}/></div><div className="kpi-value">{value}</div><div className="kpi-bottom"><span>{sub}</span><i className={up===null?'neutral-change':up?'negative':'positive'}>{up===true?<ArrowUpRight size={12}/>:up===false?<ArrowDownRight size={12}/>:null} {change}</i></div></article>}
function RegionDrawer({region:r,onClose,city,country,cityTotals,isColombia,dateLabel}){
  const cancelDen=r.cancellationDenominator||r.orders, lateDen=r.lateDenominator||r.delivered;
  const cancelRate=cancelDen?r.cancelled/cancelDen:0, lateRate=lateDen?r.late/lateDen:0;
  const trend=isColombia?r.trend:r.trend.map((value,i)=>({day:['16','17','18','19','20','21','22'][i],value}));
  const reasons=isColombia?topReasons(r.cancellationReasons,5):[];
  const coverageText=isColombia?`${r.coverageAreaCount} polígonos · ${r.activeStores} lojas ativas`:`${r.coverage}% · demonstrativo`;
  return <aside className="region-drawer">
    <div className="drawer-head"><div><div className="eyebrow">DETALHE DO LOCAL</div><h2>{r.name}</h2><p><MapPin size={13}/>{city}, {country==='Colombia'?'Colômbia':'Brasil'} <span>·</span> ID {r.id.toUpperCase()}</p></div><button onClick={onClose}><X size={17}/></button></div>
    <div className={isColombia?'drawer-demo genie-drawer':'drawer-demo'}>{isColombia?`EXPORT GENIE · ${dateLabel}`:'DADOS SINTÉTICOS · EXEMPLO'}</div>
    <div className="drawer-stats">
      <div><small>PEDIDOS VÁLIDOS</small><b>{fmt(r.orders)}</b><span>no período</span></div>
      <div><small>CANCELAMENTOS + EXPIRADOS</small><b>{pct(cancelRate)}</b><span>{fmt(r.cancelled)} de {fmt(cancelDen)} pedidos</span></div>
      <div><small>TEMPO MÉDIO</small><b>{Math.round(r.mean)} <em>min</em></b><span>entregas com tempo válido</span></div>
      <div><small>P90</small><b>{r.p90==null?'—':`${r.p90.toFixed(1)} min`}</b><span>{r.p90==null?'indisponível para o período':'métrica da fonte'}</span></div>
      <div><small>ATRASOS · SLA 35 MIN</small><b>{pct(lateRate)}</b><span>{fmt(r.late)} de {fmt(lateDen)} pedidos</span></div>
      <div><small>COBERTURA MAPEADA</small><b>{isColombia?r.coverageAreaCount:`${r.coverage}%`}</b><span>{coverageText}</span></div>
    </div>
    <div className="drawer-section"><div className="drawer-section-title"><h3>Evolução do tempo médio</h3><span>{isColombia?dateLabel:'7 dias'}</span></div><div className="drawer-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="regionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#66d4ae" stopOpacity={.2}/><stop offset="100%" stopColor="#66d4ae" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#263541" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" tick={{fill:'#81919b',fontSize:10}} axisLine={false} tickLine={false}/><YAxis hide domain={['dataMin - 5','dataMax + 5']}/><Area dataKey="value" type="monotone" stroke="#66d4ae" fill="url(#regionFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></div>
    {isColombia&&<div className="drawer-section reasons"><h3>Principais motivos de cancelamento</h3>{reasons.length?reasons.map(x=><div key={x.reason}><span>{x.reason}</span><b>{fmt(x.count)}</b></div>):<p>Sem motivo informado no período selecionado.</p>}</div>}
    <div className="drawer-section comparison"><h3>Comparação com a cidade</h3><div><span>Tempo médio</span><b>{Math.round(r.mean)} min <small>local</small></b><b>{Math.round(cityTotals.deliveryMean)} min <small>cidade</small></b></div><div><span>Taxa de cancelamento</span><b>{pct(cancelRate)} <small>local</small></b><b>{pct(cityTotals.cancellationRate)} <small>cidade</small></b></div><div><span>Taxa de atraso</span><b>{pct(lateRate)} <small>local</small></b><b>{pct(cityTotals.lateRate)} <small>cidade</small></b></div></div>
    <div className="drawer-alert"><AlertTriangle size={15}/><span><b>{isColombia?'Leitura dos dados':'Sinais operacionais'}</b><br/>{isColombia?'P90 consolidado entre vários dias não é calculado; a fonte fornece P90 por dia/local. A cobertura representa polígonos publicados, não demanda atendível.':'Indicadores e referências são demonstrativos.'}</span></div>
    <button className="drawer-action" onClick={onClose}>Voltar ao mapa <span>→</span></button>
  </aside>;
}
export default App;
