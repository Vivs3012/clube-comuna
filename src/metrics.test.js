import {describe,it,expect} from 'vitest';
import {buildOpportunities,summarize} from './metrics.js';

describe('summarize',()=>{
  it('preserves explicit denominators and weights delivery metrics by completed deliveries',()=>{
    const result=summarize([
      {orders:100,cancelled:10,delivered:80,late:8,mean:20,p90:30},
      {orders:100,cancelled:20,delivered:20,late:10,mean:50,p90:70}
    ]);
    expect(result.orders).toBe(200); expect(result.cancels).toBe(30);
    expect(result.cancellationRate).toBe(.15); expect(result.lateRate).toBe(.18);
    expect(result.deliveryMean).toBe(26); expect(result.deliveryP90).toBe(null);
  });
  it('returns zero rates for empty input',()=>expect(summarize([]).cancellationRate).toBe(0));
});

describe('buildOpportunities',()=>{
  it('explains threshold hits with denominator, reference, priority and next action',()=>{
    const result=buildOpportunities([{name:'North',orders:500,cancelled:80,delivered:400,late:120,coverage:50}]);
    expect(result.length).toBe(3);
    expect(result[0]).toMatchObject({type:'Operacional',metric:'Cancelamentos',value:'16.0%',priority:'Média'});
    expect(result[0].reason).toContain('80 cancelamentos em 500 pedidos');
    expect(result[1].priority).toBe('Alta');
    expect(result[2].type).toBe('Cobertura');
  });
});
