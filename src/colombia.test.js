import {describe,it,expect} from 'vitest';
import {getColombiaView,historyForLocations,topReasons} from './colombia.js';
import colombiaSource from './colombiaData.json';
import {summarize,buildColombiaOpportunities} from './metrics.js';

describe('Colombia Genie export',()=>{
  it('loads the dated snapshot and joins every daily location to coordinates',()=>{
    expect(colombiaSource.startDate).toBe('2026-07-24');
    expect(colombiaSource.endDate).toBe('2026-10-21');
    expect(colombiaSource.locations).toHaveLength(28);
    expect(colombiaSource.locations.every(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon))).toBe(true);
  });
  it('filters the most recent seven days and keeps official denominators',()=>{
    const view=getColombiaView(colombiaSource,{city:'Medellin',period:'Últimos 7 dias'});
    expect(view.startDate).toBe('2026-10-15');
    expect(view.endDate).toBe('2026-10-21');
    expect(view.rows).toHaveLength(3);
    const summary=summarize(view.rows);
    expect(summary.orders).toBeGreaterThan(0);
    expect(summary.cancelDenominator).toBeGreaterThanOrEqual(summary.orders);
    expect(summary.lateDenominator).toBe(summary.orders);
    expect(summary.deliveryP90).toBe(null);
    const singleLocationHistory=historyForLocations(view.daily,[view.rows[0].id]);
    expect(singleLocationHistory.length).toBeLessThanOrEqual(7);
    expect(singleLocationHistory.reduce((n,r)=>n+r.orders,0)).toBe(view.rows[0].orders);
  });
  it('does not infer demand expansion from coverage and exposes real cancellation reasons',()=>{
    const view=getColombiaView(colombiaSource,{city:'Bogota',period:'Hoje'});
    expect(view.coverage.length).toBeGreaterThan(0);
    expect(buildColombiaOpportunities(view.rows,view.cityRows).every(x=>x.type==='Operacional')).toBe(true);
    const reasonTotal=colombiaSource.cancellationReasons.reduce((n,r)=>n+r.count,0);
    expect(reasonTotal).toBe(33068);
    expect(topReasons(view.rows.flatMap(r=>r.cancellationReasons)).length).toBeGreaterThan(0);
  });
});
